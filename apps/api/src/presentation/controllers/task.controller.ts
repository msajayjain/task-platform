/**
 * File Description:
 * This file implements apps/api/src/presentation/controllers/task.controller.ts.
 *
 * Purpose:
 * Handle HTTP request orchestration and response shaping.
 *
 * Key Responsibilities:
 * - Validate request context and inputs.
 * - Delegate work to services.
 * - Return standardized API responses.
 */

import { NextRequest } from 'next/server';
import { aiTaskService } from '@/application/services/ai-task.service';
import { taskService } from '@/application/services/task.service';
import { aiTaskSchema, approvalActionSchema, myTaskUpdateSchema, taskCommentSchema, taskCreateSchema, taskFilterSchema, taskStatusUpdateSchema, taskUpdateSchema } from '@/application/validators/task.validator';
import { AppError } from '@/application/errors/app-error';
import { getDropdownConfig } from '@/infrastructure/config/dropdown-config';
import { taskCommentRepository } from '@/infrastructure/repositories/task-comment.repository';
import { parseJson } from '@/presentation/http/request';
import { fail, ok } from '@/presentation/http/response';
import { requireAuth } from '@/presentation/middlewares/auth.middleware';
import { validateCsrf } from '@/presentation/middlewares/csrf.middleware';
import { getReminderQueue, scheduleAICategorization } from '@/infrastructure/queues/task.queue';
import { aiService } from '@/services/aiService';
import { logger } from '@/infrastructure/logger/logger';

/** Purpose: Execute listTasksController logic for this module. */
export async function listTasksController(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const query = Object.fromEntries(req.nextUrl.searchParams.entries());
    const filters = taskFilterSchema.parse(query);

    return ok(
      await taskService.list({
        ...filters,
        visibilityUserId: user.role === 'ADMIN' ? undefined : user.sub
      })
    );
  } catch (error) {
    return fail(error);
  }
}

/** Purpose: Execute getTaskDetailController logic for this module. */
export async function getTaskDetailController(req: NextRequest, taskId: string) {
  try {
    const user = requireAuth(req);
    return ok(await taskService.getTaskDetailForUser(user.sub, user.role, taskId));
  } catch (error) {
    return fail(error);
  }
}

/** Purpose: Execute createTaskController logic for this module. */
export async function createTaskController(req: NextRequest) {
  try {
    const user = requireAuth(req);
    validateCsrf(req, user.sub);

    const payload = taskCreateSchema.parse(await parseJson(req));
    const assignedUserId = payload.assignedUserId ?? user.sub;

    const task = await taskService.create({
      ...payload,
      assignedUserId,
      createdById: user.sub
    });

    void scheduleAICategorization(task.id, payload.title, payload.description).catch((error) => {
      logger.warn({ err: error, taskId: task.id }, 'Failed to schedule AI categorization after task creation');
    });

    if (task.dueDate) {
      void getReminderQueue()
        .add('due-date-alert', { taskId: task.id, dueDate: task.dueDate }, { delay: 5000 })
        .catch((error) => {
        logger.warn({ err: error, taskId: task.id }, 'Failed to enqueue due-date alert after task creation');
        });
    }

    return ok(task, 201);
  } catch (error) {
    return fail(error);
  }
}

/** Purpose: Execute updateTaskController logic for this module. */
export async function updateTaskController(req: NextRequest, taskId: string) {
  try {
    const user = requireAuth(req);
    validateCsrf(req, user.sub);

    const payload = taskUpdateSchema.parse(await parseJson(req));
    const existing = await taskService.getById(taskId);
    const assignedUserId = (existing as { assignedUserId?: string; assigneeId?: string }).assignedUserId ?? (existing as { assigneeId?: string }).assigneeId;
    const createdById = (existing as { createdById?: string | null }).createdById ?? null;
    const isAssignedUser = assignedUserId === user.sub;
    const isCreator = createdById === user.sub;
    const isAdmin = user.role === 'ADMIN';

    const aiEditableFields = new Set(['category', 'resolutionNotes', 'aiRootCauseAnalysis']);
    const payloadKeys = Object.keys(payload);
    const isOnlyAIMetadataUpdate = payloadKeys.length > 0 && payloadKeys.every((key) => aiEditableFields.has(key));

    if (payload.status && !isAssignedUser) {
      throw new AppError('Only assigned user can move workflow status', 403);
    }

    if (isOnlyAIMetadataUpdate && !isAdmin && !isAssignedUser && !isCreator) {
      throw new AppError('Only task creator, assigned user, or admin can update AI notes', 403);
    }

    if (!payload.status && !isOnlyAIMetadataUpdate && !isAdmin && !isAssignedUser) {
      throw new AppError('Only assigned user or admin can update this task', 403);
    }

    return ok(await taskService.update(taskId, payload));
  } catch (error) {
    return fail(error);
  }
}

/** Purpose: Execute deleteTaskController logic for this module. */
export async function deleteTaskController(req: NextRequest, taskId: string) {
  try {
    const user = requireAuth(req);
    validateCsrf(req, user.sub);
    const existing = await taskService.getById(taskId);
    const assignedUserId = (existing as { assignedUserId?: string; assigneeId?: string }).assignedUserId ?? (existing as { assigneeId?: string }).assigneeId;

    if (user.role !== 'ADMIN' && assignedUserId !== user.sub) {
      throw new AppError('Only assigned user or admin can delete this task', 403);
    }

    await taskService.remove(taskId);
    return ok({ deleted: true });
  } catch (error) {
    return fail(error);
  }
}

/** Purpose: Execute aiCreateTaskController logic for this module. */
export async function aiCreateTaskController(req: NextRequest) {
  try {
    const user = requireAuth(req);
    validateCsrf(req, user.sub);

    const payload = aiTaskSchema.parse(await parseJson(req));

    const aiParsed = await aiTaskService.parseNaturalLanguageToTask(payload.text);

    const aiSummary = await aiService.generateTaskSummary({
      title: aiParsed.title,
      description: aiParsed.description
    });

    const task = await taskService.create({
      title: aiParsed.title,
      description: aiParsed.description,
      aiSummary: aiSummary.summary,
      status: aiParsed.status,
      priority: aiParsed.priority,
      dueDate: aiParsed.dueDate,
      teamId: payload.teamId,
      assignedUserId: payload.assignedUserId,
      createdById: user.sub
    });

    void scheduleAICategorization(task.id, aiParsed.title, aiParsed.description).catch((error) => {
      logger.warn({ err: error, taskId: task.id }, 'Failed to schedule AI categorization after AI task creation');
    });

    return ok(task, 201);
  } catch (error) {
    return fail(error);
  }
}

/** Purpose: Execute listTaskCommentsController logic for this module. */
export async function listTaskCommentsController(req: NextRequest, taskId: string) {
  try {
    const user = requireAuth(req);
    await taskService.getVisibleById(user.sub, user.role, taskId);
    const comments = await taskCommentRepository.listByTaskId(taskId);

    return ok(
      comments.map((comment) => ({
        id: comment.id,
        taskId: comment.taskId,
        authorId: comment.authorId,
        authorName: comment.author.name,
        content: comment.content,
        createdAt: comment.createdAt
      }))
    );
  } catch (error) {
    return fail(error);
  }
}

/** Purpose: Execute addTaskCommentController logic for this module. */
export async function addTaskCommentController(req: NextRequest, taskId: string) {
  try {
    const user = requireAuth(req);
    validateCsrf(req, user.sub);
    await taskService.getVisibleById(user.sub, user.role, taskId);

    const payload = taskCommentSchema.parse(await parseJson(req));
    const comment = await taskCommentRepository.create({
      taskId,
      authorId: user.sub,
      content: payload.content
    });

    return ok(
      {
        id: comment.id,
        taskId: comment.taskId,
        authorId: comment.authorId,
        authorName: comment.author.name,
        content: comment.content,
        createdAt: comment.createdAt
      },
      201
    );
  } catch (error) {
    return fail(error);
  }
}

/** Purpose: Execute listMyCreatedTasksController logic for this module. */
export async function listMyCreatedTasksController(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const query = Object.fromEntries(req.nextUrl.searchParams.entries());
    const filters = taskFilterSchema.parse(query);
    return ok(await taskService.listMine(user.sub, filters));
  } catch (error) {
    return fail(error);
  }
}

/** Purpose: Execute updateMyTaskController logic for this module. */
export async function updateMyTaskController(req: NextRequest, taskId: string) {
  try {
    const user = requireAuth(req);
    validateCsrf(req, user.sub);
    const payload = myTaskUpdateSchema.parse(await parseJson(req));
    return ok(await taskService.updateMine(user.sub, taskId, payload));
  } catch (error) {
    return fail(error);
  }
}

/** Purpose: Execute deleteMyTaskController logic for this module. */
export async function deleteMyTaskController(req: NextRequest, taskId: string) {
  try {
    const user = requireAuth(req);
    validateCsrf(req, user.sub);
    return ok(await taskService.softDeleteMine(user.sub, taskId));
  } catch (error) {
    return fail(error);
  }
}

/** Purpose: Execute listMyDashboardTasksController logic for this module. */
export async function listMyDashboardTasksController(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const query = Object.fromEntries(req.nextUrl.searchParams.entries());
    const filters = taskFilterSchema.parse(query);
    return ok(await taskService.listAssignedToMe(user.sub, filters));
  } catch (error) {
    return fail(error);
  }
}

/** Purpose: Execute updateTaskStatusController logic for this module. */
export async function updateTaskStatusController(req: NextRequest, taskId: string) {
  try {
    const user = requireAuth(req);
    validateCsrf(req, user.sub);
    const payload = taskStatusUpdateSchema.parse(await parseJson(req));
    return ok(
      await taskService.updateStatusForAssignedUser(user.sub, taskId, {
        status: payload.status,
        workflowStageId: payload.workflowStageId
      })
    );
  } catch (error) {
    return fail(error);
  }
}

/** Purpose: Execute updateMyTaskApprovalController logic for this module. */
export async function updateMyTaskApprovalController(req: NextRequest, taskId: string) {
  try {
    const user = requireAuth(req);
    validateCsrf(req, user.sub);
    const payload = approvalActionSchema.parse(await parseJson(req));

    if (payload.action === 'ACCEPT') {
      return ok(await taskService.approveTaskCompletion(user.sub, taskId));
    }

    const { declineReasons } = getDropdownConfig();
    if (!declineReasons.includes(payload.reason)) {
      throw new AppError('Invalid decline reason', 400);
    }

    return ok(await taskService.declineTaskCompletion(user.sub, taskId, payload.reason, payload.comment));
  } catch (error) {
    return fail(error);
  }
}

// Backward compatibility for existing routes.
/** Purpose: Execute listMyTasksController logic for this module. */
export async function listMyTasksController(req: NextRequest) {
  return listMyCreatedTasksController(req);
}
