/**
 * File Description:
 * This file implements apps/api/src/application/services/task.service.ts.
 *
 * Purpose:
 * Implement business/feature orchestration logic.
 *
 * Key Responsibilities:
 * - Execute feature/business rules.
 * - Coordinate dependencies (repositories/AI/cache).
 * - Return normalized results/errors.
 */

import type { TaskPriority, TaskStatus, WorkflowStageKind } from '@task-platform/types';
import { AppError } from '@/application/errors/app-error';
import { taskCommentRepository } from '@/infrastructure/repositories/task-comment.repository';
import { scheduleTaskArchive } from '@/infrastructure/queues/task.queue';
import { taskRepository } from '@/infrastructure/repositories/task.repository';
import { userRepository } from '@/infrastructure/repositories/user.repository';

type TaskListSortBy = 'dueDate' | 'priority' | 'createdAt' | 'updatedAt' | 'status';
type AssignableWorkflowStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED_PENDING_APPROVAL';
type TaskListFilters = {
  status?: TaskStatus;
  teamId?: string;
  workflowStageId?: string;
  priority?: TaskPriority;
  dueDate?: string;
  sortBy?: TaskListSortBy;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
};

/** Purpose: Normalize optional date-only input into UTC midnight Date/null/undefined semantics. */
function parseDateOnlyToUtcMidnight(input: string | null | undefined): Date | null | undefined {
  if (input === undefined) return undefined;
  if (input === null || input === '') return null;
  return new Date(`${input}T00:00:00.000Z`);
}

/** Purpose: Map workflow stage kind to the status value assigned-user flows are allowed to persist. */
function mapTaskStatusFromStageKind(kind: WorkflowStageKind): AssignableWorkflowStatus {
  if (kind === 'TODO') return 'TODO';
  if (kind === 'COMPLETED') return 'COMPLETED_PENDING_APPROVAL';
  return 'IN_PROGRESS';
}

/** Purpose: Block disallowed direct status values in assigned-user update requests. */
function validateAssignableStatus(status?: TaskStatus) {
  if (status === 'CLOSED') {
    throw new AppError('Assigned user cannot directly close tasks', 403);
  }

  if (status === 'DONE') {
    throw new AppError('Legacy DONE status is not supported. Use approval workflow.', 400);
  }
}

/** Purpose: Enforce valid direct transitions for approval-aware workflow statuses. */
function validateDirectStatusTransition(currentStatus: TaskStatus, targetStatus: TaskStatus) {
  if (currentStatus === 'COMPLETED_PENDING_APPROVAL' && targetStatus !== 'TODO') {
    throw new AppError('Task pending approval can only move back to TODO when declined', 400);
  }

  if (targetStatus === 'COMPLETED_PENDING_APPROVAL' && currentStatus !== 'IN_PROGRESS') {
    throw new AppError('Only IN_PROGRESS tasks can be submitted for approval', 400);
  }
}

/** Purpose: Convert a task status into the subset allowed for assigned-user operations. */
function toAssignableStatus(status: TaskStatus): AssignableWorkflowStatus {
  if (status === 'TODO' || status === 'IN_PROGRESS' || status === 'COMPLETED_PENDING_APPROVAL') {
    return status;
  }

  throw new AppError('Unsupported workflow status for assigned user update', 400);
}

/** Purpose: Update status for assigned user after transition validation and ownership checks. */
async function updateAssignedUserStatus(
  taskId: string,
  userId: string,
  currentStatus: TaskStatus,
  targetStatus: AssignableWorkflowStatus
) {
  validateDirectStatusTransition(currentStatus, targetStatus);

  const result = await taskRepository.updateStatusByAssignedUser(taskId, userId, targetStatus);
  if (result.count === 0) {
    throw new AppError('Forbidden', 403);
  }

  return { updated: true };
}

/** Purpose: Move task to a specific workflow stage for assigned user and derive matching status. */
async function updateAssignedUserWorkflowStage(taskId: string, userId: string, teamId: string | null | undefined, workflowStageId: string) {
  if (!teamId) {
    throw new AppError('Task team is not configured', 400);
  }

  const stage = await taskRepository.findWorkflowStageById(workflowStageId);
  if (!stage) {
    throw new AppError('Workflow stage not found', 404);
  }

  const isStageAllowedForTaskTeam = stage.workflow.teamId === teamId || (stage.workflow.isDefault && !stage.workflow.teamId);
  if (!isStageAllowedForTaskTeam) {
    throw new AppError('Target stage does not belong to this task team workflow', 400);
  }

  const resolvedStatus = mapTaskStatusFromStageKind(stage.kind);
  const result = await taskRepository.updateWorkflowStageByAssignedUser(taskId, userId, {
    workflowStageId: stage.id,
    status: resolvedStatus
  });

  if (result.count === 0) {
    throw new AppError('Forbidden', 403);
  }

  return { updated: true };
}

/** Purpose: Expose taskService operations for this module. */
export const taskService = {
  /** Purpose: List tasks with filters/sorting and archive sweep before retrieval. */
  async list(params: {
    status?: TaskStatus;
    teamId?: string;
    workflowStageId?: string;
    priority?: TaskPriority;
    dueDate?: string;
    assignedUserId?: string;
    createdById?: string;
    visibilityUserId?: string;
    includeArchived?: boolean;
    sortBy?: TaskListSortBy | 'updatedAt';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    pageSize?: number;
  }) {
    await this.archiveExpiredTasks();
    return taskRepository.list(params as never);
  },

  /** Purpose: Fetch a task by id or throw a not-found application error. */
  async getById(taskId: string) {
    const task = await taskRepository.findById(taskId);
    if (!task) throw new AppError('Task not found', 404);
    return task;
  },

  /** Purpose: Fetch task visibility-safe detail by id (current implementation returns if exists). */
  async getVisibleById(userId: string, role: 'ADMIN' | 'USER', taskId: string) {
    await this.archiveExpiredTasks();
    const task = await taskRepository.findByIdIncludingArchived(taskId);
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    return task;
  },

  /** Purpose: Return enriched task detail for an authorized viewer (admin/creator/assignee). */
  async getTaskDetailForUser(userId: string, role: 'ADMIN' | 'USER', taskId: string) {
    await this.archiveExpiredTasks();
    const task = await taskRepository.findDetailedById(taskId);
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    const isAdmin = role === 'ADMIN';
    const isCreator = task.createdById === userId;
    const isAssignee = task.assignedUserId === userId;

    if (!isAdmin && !isCreator && !isAssignee) {
      throw new AppError('Forbidden', 403);
    }

    const declines = ((task as { declines?: Array<{ id: string; taskId: string; reason: string; comment: string | null; declinedById: string; createdAt: Date; declinedBy: { name: string } }> }).declines ?? []);
    const comments = task.comments.map((comment) => {
      let commenterRole = 'Contributor';
      if (comment.authorId === task.createdById) {
        commenterRole = 'Creator';
      } else if (comment.authorId === task.assignedUserId) {
        commenterRole = 'Assignee';
      }

      return {
        id: comment.id,
        taskId: comment.taskId,
        authorId: comment.authorId,
        authorName: comment.author.name,
        content: comment.content,
        createdAt: comment.createdAt,
        user: comment.author.name,
        text: comment.content,
        role: commenterRole
      };
    });

    return {
      id: task.id,
      taskId: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      assignedUserId: task.assignedUserId,
      assignedUserName: task.assignedUser?.name ?? undefined,
      assignedUser: task.assignedUser?.name ?? undefined,
      createdById: task.createdById,
      createdByName: task.createdBy?.name ?? undefined,
      teamId: task.teamId,
      teamName: task.team?.name ?? undefined,
      assignedTeamId: task.teamId,
      assignedTeamName: task.team?.name ?? undefined,
      assignedTeam: task.team?.name ?? undefined,
      workflowStageId: task.workflowStageId,
      workflowStageLabel: task.workflowStage?.stageName ?? undefined,
      workflowStageKind: task.workflowStage?.kind,
      closedAt: task.closedAt,
      isArchived: task.isArchived,
      archivedAt: task.archivedAt,
      isDeleted: task.isDeleted,
      deletedAt: task.deletedAt,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      comments,
      declineHistory: declines.map((decline) => ({
        id: decline.id,
        taskId: decline.taskId,
        reason: decline.reason,
        comment: decline.comment ?? undefined,
        declinedById: decline.declinedById,
        declinedByName: decline.declinedBy.name,
        createdAt: decline.createdAt
      })),
      aiSummary: (task as { aiSummary?: string | null }).aiSummary ?? null,
      category: (task as { category?: string | null }).category ?? null,
      aiRootCauseAnalysis: (task as { aiRootCauseAnalysis?: string | null }).aiRootCauseAnalysis ?? null,
      rootCause: (task as { aiRootCauseAnalysis?: string | null }).aiRootCauseAnalysis ?? null,
      resolutionNotes: (task as { resolutionNotes?: string | null }).resolutionNotes ?? null,
      permanentResolution: (task as { resolutionNotes?: string | null }).resolutionNotes ?? null,
    };
  },

  /** Purpose: Create a task with team/workflow validation and optional creator comment. */
  async create(input: {
    title: string;
    description: string;
    aiSummary?: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate?: string | null;
    teamId: string;
    assignedUserId: string;
    createdById: string;
    comment?: string;
  }) {
    const assignee = await userRepository.findById(input.assignedUserId);
    if (!assignee) {
      throw new AppError('Assigned user not found', 404);
    }

    if (assignee.teamId && assignee.teamId !== input.teamId && assignee.id !== input.createdById) {
      throw new AppError('Assigned user must belong to selected team', 400);
    }

    const todoStage = await taskRepository.findFirstTodoStageForTeam(input.teamId);
    if (!todoStage) {
      throw new AppError('No TODO stage configured for selected team workflow', 400);
    }

    const task = await taskRepository.create({
      title: input.title,
      description: input.description,
      aiSummary: input.aiSummary ?? null,
      status: mapTaskStatusFromStageKind(todoStage.kind),
      priority: input.priority as never,
      dueDate: parseDateOnlyToUtcMidnight(input.dueDate) ?? null,
      teamId: input.teamId,
      workflowStageId: todoStage.id,
      assignedUserId: input.assignedUserId,
      createdById: input.createdById
    } as never);

    if (input.comment?.trim()) {
      await taskCommentRepository.create({
        taskId: task.id,
        authorId: input.createdById,
        content: input.comment.trim()
      });
    }

    const taskRecord = task as unknown as {
      id: string;
      title: string;
      description: string;
      status: TaskStatus;
      priority: TaskPriority;
      dueDate: Date | null;
      teamId: string | null;
      workflowStageId: string | null;
      assignedUserId: string;
      createdAt: Date;
      updatedAt: Date;
      createdById?: string;
      team?: { name?: string } | null;
      workflowStage?: { stageName?: string; kind?: WorkflowStageKind } | null;
      assignedUser?: { name?: string | null };
      createdBy?: { name?: string | null };
    };

    return {
      id: taskRecord.id,
      title: taskRecord.title,
      description: taskRecord.description,
      aiSummary: (taskRecord as { aiSummary?: string | null }).aiSummary ?? null,
      category: (taskRecord as { category?: string | null }).category ?? null,
      aiRootCauseAnalysis: (taskRecord as { aiRootCauseAnalysis?: string | null }).aiRootCauseAnalysis ?? null,
      resolutionNotes: (taskRecord as { resolutionNotes?: string | null }).resolutionNotes ?? null,
      status: taskRecord.status,
      priority: taskRecord.priority,
      dueDate: taskRecord.dueDate,
      teamId: taskRecord.teamId,
      teamName: taskRecord.team?.name,
      assignedTeamId: taskRecord.teamId,
      assignedTeamName: taskRecord.team?.name,
      workflowStageId: taskRecord.workflowStageId,
      workflowStageLabel: taskRecord.workflowStage?.stageName,
      workflowStageKind: taskRecord.workflowStage?.kind,
      assignedUserId: taskRecord.assignedUserId,
      assignedUserName: taskRecord.assignedUser?.name ?? undefined,
      createdById: taskRecord.createdById ?? input.createdById,
      createdByName: taskRecord.createdBy?.name ?? undefined,
      createdAt: taskRecord.createdAt,
      updatedAt: taskRecord.updatedAt
    };
  },

  /** Purpose: Update editable task fields after existence check and value normalization. */
  async update(
    taskId: string,
    input: Partial<{
      title: string;
      description: string;
      aiSummary: string | null;
      category: string | null;
      aiRootCauseAnalysis: string | null;
      resolutionNotes: string | null;
      status: TaskStatus;
      priority: TaskPriority;
      dueDate: string | null;
      teamId: string;
      workflowStageId: string;
      assignedUserId: string;
    }>
  ) {
    await this.getById(taskId);
    const updatePayload = {
      ...input,
      priority: input.priority as never,
      status: input.status as never,
      dueDate: parseDateOnlyToUtcMidnight(input.dueDate)
    };

    return taskRepository.update(taskId, {
      ...updatePayload
    });
  },

  /** Purpose: Hard-remove a task after verifying the task exists. */
  async remove(taskId: string) {
    await this.getById(taskId);
    return taskRepository.remove(taskId);
  },

  /** Purpose: List tasks created by the current user with optional filters. */
  async listMine(userId: string, filters: TaskListFilters = {}) {
    await this.archiveExpiredTasks();
    return taskRepository.list({
      ...filters,
      createdById: userId
    });
  },

  /** Purpose: List dashboard tasks assigned to current user with active-status defaults. */
  async listAssignedToMe(userId: string, filters: TaskListFilters = {}) {
    await this.archiveExpiredTasks();

    const activeBoardStatuses: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'COMPLETED_PENDING_APPROVAL'];

    return taskRepository.listForDashboard({
      userId,
      ...filters,
      statusIn: filters.status ? undefined : activeBoardStatuses,
      teamId: filters.teamId
    });
  },

  /** Purpose: Allow creator to update their task while enforcing ownership and state rules. */
  async updateMine(userId: string, taskId: string, input: { title?: string; description?: string; priority?: TaskPriority; dueDate?: string | null; teamId?: string; assignedUserId?: string }) {
    const existing = await this.getById(taskId);
    if (existing.createdById !== userId) {
      throw new AppError('Task not found', 404);
    }

    if (existing.status === 'COMPLETED_PENDING_APPROVAL' || existing.status === 'CLOSED') {
      throw new AppError('Completed or closed tasks are read-only', 400);
    }

    if (input.teamId && input.assignedUserId) {
      const assignee = await userRepository.findById(input.assignedUserId);
      if (!assignee) {
        throw new AppError('Assigned user not found', 404);
      }

      if (assignee.teamId && assignee.teamId !== input.teamId && assignee.id !== userId) {
        throw new AppError('Assigned user must belong to selected team', 400);
      }
    }

    const result = await taskRepository.updateByCreator(taskId, userId, {
      title: input.title,
      description: input.description,
      priority: input.priority as never,
      dueDate: parseDateOnlyToUtcMidnight(input.dueDate),
      teamId: input.teamId,
      assignedUserId: input.assignedUserId
    });

    if (result.count === 0) {
      throw new AppError('Task not found', 404);
    }

    return { updated: true };
  },

  /** Purpose: Soft-delete a creator-owned task from creator-facing dashboards. */
  async softDeleteMine(userId: string, taskId: string) {
    const result = await taskRepository.softDeleteByCreator(taskId, userId);
    if (result.count === 0) {
      throw new AppError('Task not found', 404);
    }

    return { deleted: true };
  },

  /** Purpose: Update assigned-user status or workflow stage with workflow policy enforcement. */
  async updateStatusForAssignedUser(userId: string, taskId: string, input: { status?: TaskStatus; workflowStageId?: string }) {
    validateAssignableStatus(input.status);

    const existing = await this.getById(taskId);
    if ((existing as { assignedUserId: string }).assignedUserId !== userId) {
      throw new AppError('Forbidden', 403);
    }

    const currentStatus = (existing as { status: TaskStatus }).status;
    const teamId = (existing as { teamId?: string | null }).teamId;

    if (!input.workflowStageId && input.status) {
      const targetStatus = toAssignableStatus(input.status);
      return updateAssignedUserStatus(taskId, userId, currentStatus, targetStatus);
    }

    if (!input.workflowStageId) {
      throw new AppError('workflowStageId is required', 400);
    }

    return updateAssignedUserWorkflowStage(taskId, userId, teamId, input.workflowStageId);
  },

  /** Purpose: Approve pending completion, close task, and schedule archive. */
  async approveTaskCompletion(userId: string, taskId: string) {
    const closedAt = new Date();
    const result = await taskRepository.approveCompletionByCreator(taskId, userId, closedAt);
    if (result.count === 0) {
      throw new AppError('Task not found, forbidden, or not pending approval', 404);
    }

    void scheduleTaskArchive(taskId, closedAt).catch(() => {
      // Queue infra can be optional in lower environments; fallback sweep handles expiry.
    });

    return { updated: true, status: 'CLOSED', closedAt };
  },

  /** Purpose: Decline pending completion, return task to initial workflow stage, and record decline history. */
  async declineTaskCompletion(userId: string, taskId: string, reason: string, comment?: string) {
    const existing = await this.getById(taskId);
    const teamId = (existing as { teamId?: string | null }).teamId;

    let fallbackTodoStageId: string | undefined;
    if (teamId) {
      const todoStage = await taskRepository.findFirstTodoStageForTeam(teamId);
      fallbackTodoStageId = todoStage?.id;
    }

    const result = await taskRepository.declineCompletionByCreator(taskId, userId, {
      workflowStageId: fallbackTodoStageId
    });
    if (result.count === 0) {
      throw new AppError('Task not found, forbidden, or not pending approval', 404);
    }

    await taskRepository.createDeclineRecord({
      taskId,
      declinedById: userId,
      reason: reason.trim(),
      comment: comment?.trim() || undefined
    });

    const reasonLine = `Declined completion reason: ${reason.trim()}`;
    const optionalLine = comment?.trim() ? `Additional note: ${comment.trim()}` : '';
    const content = [reasonLine, optionalLine].filter(Boolean).join('\n');

    await taskCommentRepository.create({
      taskId,
      authorId: userId,
      content
    });

    return { updated: true, status: 'TODO' };
  },

  /** Purpose: Archive closed tasks whose retention window has expired. */
  async archiveExpiredTasks() {
    await taskRepository.archiveClosedTasksDue(new Date());
  }
};
