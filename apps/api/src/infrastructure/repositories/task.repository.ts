/**
 * File Description:
 * This file implements apps/api/src/infrastructure/repositories/task.repository.ts.
 *
 * Purpose:
 * Provide persistence access and data retrieval operations.
 *
 * Key Responsibilities:
 * - Query and persist data.
 * - Encapsulate storage-specific logic.
 * - Return typed data objects.
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/infrastructure/db/prisma';

type MappedTask = ReturnType<typeof mapTask>;

function mapTask(task: {
  id: string;
  title: string;
  description: string;
  aiSummary?: string | null;
  category?: string | null;
  aiRootCauseAnalysis?: string | null;
  resolutionNotes?: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  assignedUserId: string;
  createdById: string | null;
  teamId: string | null;
  workflowStageId: string | null;
  closedAt: Date | null;
  isArchived: boolean;
  archivedAt: Date | null;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  assignedUser?: { name: string | null } | null;
  createdBy?: { name: string | null } | null;
  team?: { name: string } | null;
  workflowStage?: { stageName: string; kind: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' } | null;
}) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    aiSummary: task.aiSummary ?? null,
    category: task.category ?? null,
    aiRootCauseAnalysis: task.aiRootCauseAnalysis ?? null,
    resolutionNotes: task.resolutionNotes ?? null,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    assignedUserId: task.assignedUserId,
    assignedUserName: task.assignedUser?.name ?? undefined,
    createdById: task.createdById,
    createdByName: task.createdBy?.name ?? undefined,
    teamId: task.teamId,
    teamName: task.team?.name ?? undefined,
    assignedTeamId: task.teamId,
    assignedTeamName: task.team?.name ?? undefined,
    workflowStageId: task.workflowStageId,
    workflowStageLabel: task.workflowStage?.stageName ?? undefined,
    workflowStageKind: task.workflowStage?.kind ?? undefined,
    closedAt: task.closedAt,
    isArchived: task.isArchived,
    archivedAt: task.archivedAt,
    isDeleted: task.isDeleted,
    deletedAt: task.deletedAt,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt
  };
}

/** Purpose: Expose taskRepository operations for this module. */
export const taskRepository = {
  /** Purpose: Execute create operation for this module. */
  create(data: Prisma.TaskUncheckedCreateInput) {
    return prisma.task.create({
      data,
      include: {
        assignedUser: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        team: { select: { name: true } },
        workflowStage: { select: { stageName: true, kind: true } }
      }
    });
  },

  /** Purpose: Execute findById operation for this module. */
  findById(id: string) {
    return prisma.task.findFirst({
      where: { id, isDeleted: false, isArchived: false },
      include: {
        assignedUser: { select: { id: true, name: true, email: true, role: true } },
        createdBy: { select: { id: true, name: true, email: true, role: true } },
        team: { select: { id: true, name: true } },
        workflowStage: { select: { id: true, stageName: true, stageOrder: true, kind: true, workflowId: true } }
      }
    });
  },

  /** Purpose: Execute findByIdIncludingArchived operation for this module. */
  findByIdIncludingArchived(id: string) {
    return prisma.task.findFirst({
      where: { id, isDeleted: false },
      include: {
        assignedUser: { select: { id: true, name: true, email: true, role: true } },
        createdBy: { select: { id: true, name: true, email: true, role: true } },
        team: { select: { id: true, name: true } },
        workflowStage: { select: { id: true, stageName: true, stageOrder: true, kind: true, workflowId: true } }
      }
    });
  },

  async list(filter: {
    status?: string;
    statusIn?: string[];
    priority?: string;
    dueDate?: string;
    teamId?: string;
    workflowStageId?: string;
    assignedUserId?: string;
    createdById?: string;
    visibilityUserId?: string;
    includeArchived?: boolean;
    sortBy?: 'dueDate' | 'priority' | 'createdAt' | 'updatedAt' | 'status';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    pageSize?: number;
  }): Promise<{ items: MappedTask[]; page: number; pageSize: number; total: number; totalPages: number }> {
    const dueDateRange = filter.dueDate
      ? {
          gte: new Date(`${filter.dueDate}T00:00:00.000Z`),
          lt: new Date(`${filter.dueDate}T23:59:59.999Z`)
        }
      : undefined;

    const where: Prisma.TaskWhereInput = {
      isDeleted: false,
      ...(filter.includeArchived ? {} : { isArchived: false }),
      ...(filter.status ? { status: filter.status as never } : {}),
      ...(filter.statusIn && filter.statusIn.length > 0
        ? {
            status: {
              in: filter.statusIn as never
            }
          }
        : {}),
      ...(filter.priority ? { priority: filter.priority as never } : {}),
      ...(dueDateRange ? { dueDate: dueDateRange } : {}),
      ...(filter.teamId ? { teamId: filter.teamId } : {}),
      ...(filter.workflowStageId ? { workflowStageId: filter.workflowStageId } : {}),
      ...(filter.assignedUserId ? { assignedUserId: filter.assignedUserId } : {}),
      ...(filter.createdById ? { createdById: filter.createdById } : {}),
      ...(filter.visibilityUserId
        ? {
            OR: [{ createdById: filter.visibilityUserId }, { assignedUserId: filter.visibilityUserId }]
          }
        : {})
    };

    const orderBy = filter.sortBy ? { [filter.sortBy]: filter.sortOrder ?? 'asc' } : { createdAt: 'desc' as const };
    const page = Math.max(1, filter.page ?? 1);
    const pageSize = Math.max(1, Math.min(100, filter.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const [tasks, total] = await prisma.$transaction([
      prisma.task.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          assignedUser: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
          team: { select: { name: true } },
          workflowStage: { select: { stageName: true, kind: true } }
        }
      }),
      prisma.task.count({ where })
    ]);

    return {
      items: tasks.map(mapTask),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize))
    };
  },

  async listForDashboard(filter: {
    userId: string;
    status?: string;
    statusIn?: string[];
    priority?: string;
    dueDate?: string;
    teamId?: string;
    workflowStageId?: string;
    sortBy?: 'dueDate' | 'priority' | 'createdAt' | 'updatedAt' | 'status';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    pageSize?: number;
  }): Promise<{ items: MappedTask[]; page: number; pageSize: number; total: number; totalPages: number }> {
    const dueDateRange = filter.dueDate
      ? {
          gte: new Date(`${filter.dueDate}T00:00:00.000Z`),
          lt: new Date(`${filter.dueDate}T23:59:59.999Z`)
        }
      : undefined;

    const where: Prisma.TaskWhereInput = {
      isDeleted: false,
      isArchived: false,
      assignedUserId: filter.userId,
      ...(filter.status ? { status: filter.status as never } : {}),
      ...(filter.statusIn && filter.statusIn.length > 0
        ? {
            status: {
              in: filter.statusIn as never
            }
          }
        : {}),
      ...(filter.priority ? { priority: filter.priority as never } : {}),
      ...(dueDateRange ? { dueDate: dueDateRange } : {}),
      ...(filter.teamId ? { teamId: filter.teamId } : {}),
      ...(filter.workflowStageId ? { workflowStageId: filter.workflowStageId } : {})
    };

    const orderBy = filter.sortBy ? { [filter.sortBy]: filter.sortOrder ?? 'asc' } : { createdAt: 'desc' as const };
    const page = Math.max(1, filter.page ?? 1);
    const pageSize = Math.max(1, Math.min(100, filter.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const [tasks, total] = await prisma.$transaction([
      prisma.task.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          assignedUser: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
          team: { select: { name: true } },
          workflowStage: { select: { stageName: true, kind: true } }
        }
      }),
      prisma.task.count({ where })
    ]);

    return {
      items: tasks.map(mapTask),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize))
    };
  },

  /** Purpose: Execute update operation for this module. */
  async update(id: string, data: Prisma.TaskUncheckedUpdateInput) {
    const task = await prisma.task.update({
      where: { id },
      data,
      include: {
        assignedUser: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        team: { select: { name: true } },
        workflowStage: { select: { stageName: true, kind: true } }
      }
    });

    return mapTask(task);
  },

  /** Purpose: Execute updateByCreator operation for this module. */
  updateByCreator(taskId: string, createdById: string, data: Pick<Prisma.TaskUncheckedUpdateInput, 'title' | 'description' | 'priority' | 'dueDate' | 'teamId' | 'assignedUserId'>) {
    return prisma.task.updateMany({
      where: { id: taskId, createdById, isDeleted: false, isArchived: false },
      data
    });
  },

  /** Purpose: Execute updateStatusByAssignedUser operation for this module. */
  updateStatusByAssignedUser(taskId: string, assignedUserId: string, status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED_PENDING_APPROVAL') {
    return prisma.task.updateMany({
      where: {
        id: taskId,
        assignedUserId,
        isDeleted: false,
        isArchived: false
      },
      data: {
        status
      }
    });
  },

  /** Purpose: Execute updateWorkflowStageByAssignedUser operation for this module. */
  updateWorkflowStageByAssignedUser(taskId: string, assignedUserId: string, input: { workflowStageId: string; status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED_PENDING_APPROVAL' }) {
    return prisma.task.updateMany({
      where: {
        id: taskId,
        assignedUserId,
        isDeleted: false,
        isArchived: false
      },
      data: {
        workflowStageId: input.workflowStageId,
        status: input.status
      }
    });
  },

  /** Purpose: Execute approveCompletionByCreator operation for this module. */
  approveCompletionByCreator(taskId: string, createdById: string, closedAt: Date) {
    return prisma.task.updateMany({
      where: {
        id: taskId,
        createdById,
        isDeleted: false,
        isArchived: false,
        status: 'COMPLETED_PENDING_APPROVAL'
      },
      data: {
        status: 'CLOSED',
        closedAt
      }
    });
  },

  /** Purpose: Execute declineCompletionByCreator operation for this module. */
  declineCompletionByCreator(taskId: string, createdById: string, input?: { workflowStageId?: string }) {
    return prisma.task.updateMany({
      where: {
        id: taskId,
        createdById,
        isDeleted: false,
        isArchived: false,
        status: 'COMPLETED_PENDING_APPROVAL'
      },
      data: {
        status: 'TODO',
        workflowStageId: input?.workflowStageId,
        closedAt: null
      }
    });
  },

  /** Purpose: Execute archiveClosedTasksDue operation for this module. */
  archiveClosedTasksDue(now: Date) {
    const threshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return prisma.task.updateMany({
      where: {
        isDeleted: false,
        isArchived: false,
        status: 'CLOSED',
        closedAt: {
          lte: threshold
        }
      },
      data: {
        isArchived: true,
        archivedAt: now
      }
    });
  },

  /** Purpose: Execute archiveTaskByIdIfDue operation for this module. */
  archiveTaskByIdIfDue(taskId: string) {
    const threshold = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    return prisma.task.updateMany({
      where: {
        id: taskId,
        isDeleted: false,
        isArchived: false,
        status: 'CLOSED',
        closedAt: {
          lte: threshold
        }
      },
      data: {
        isArchived: true,
        archivedAt: new Date()
      }
    });
  },

  /** Purpose: Execute findDetailedById operation for this module. */
  findDetailedById(taskId: string) {
    return prisma.task.findFirst({
      where: {
        id: taskId,
        isDeleted: false
      },
      select: {
        id: true,
        title: true,
        description: true,
        aiSummary: true,
        category: true,
        aiRootCauseAnalysis: true,
        resolutionNotes: true,
        status: true,
        priority: true,
        dueDate: true,
        assignedUserId: true,
        createdById: true,
        teamId: true,
        workflowStageId: true,
        closedAt: true,
        isArchived: true,
        archivedAt: true,
        isDeleted: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
        team: {
          select: {
            id: true,
            name: true
          }
        },
        workflowStage: {
          select: {
            id: true,
            stageName: true,
            kind: true
          }
        },
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        comments: {
          orderBy: {
            createdAt: 'asc'
          },
          select: {
            id: true,
            taskId: true,
            authorId: true,
            content: true,
            createdAt: true,
            author: {
              select: {
                name: true
              }
            }
          }
        },
        declines: {
          orderBy: {
            createdAt: 'desc'
          },
          select: {
            id: true,
            taskId: true,
            reason: true,
            comment: true,
            declinedById: true,
            createdAt: true,
            declinedBy: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });
  },

  /** Purpose: Execute findFirstTodoStageForTeam operation for this module. */
  findFirstTodoStageForTeam(teamId: string) {
    return prisma.workflowStage.findFirst({
      where: {
        kind: 'TODO',
        workflow: {
          OR: [{ teamId }, { isDefault: true }]
        }
      },
      orderBy: [{ workflow: { isDefault: 'asc' } }, { stageOrder: 'asc' }],
      select: {
        id: true,
        kind: true,
        workflowId: true
      }
    });
  },

  /** Purpose: Execute findWorkflowStageById operation for this module. */
  findWorkflowStageById(stageId: string) {
    return prisma.workflowStage.findUnique({
      where: { id: stageId },
      include: {
        workflow: {
          select: {
            id: true,
            teamId: true,
            isDefault: true
          }
        }
      }
    });
  },

  /** Purpose: Execute createDeclineRecord operation for this module. */
  createDeclineRecord(input: { taskId: string; declinedById: string; reason: string; comment?: string }) {
    return prisma.taskDecline.create({
      data: {
        taskId: input.taskId,
        declinedById: input.declinedById,
        reason: input.reason,
        comment: input.comment
      }
    });
  },

  /** Purpose: Execute softDeleteByCreator operation for this module. */
  async softDeleteByCreator(taskId: string, createdById: string) {
    return prisma.task.updateMany({
      where: { id: taskId, createdById, isDeleted: false, isArchived: false },
      data: {
        isDeleted: true,
        deletedAt: new Date()
      }
    });
  },

  /** Purpose: Execute remove operation for this module. */
  remove(id: string) {
    return prisma.task.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date()
      }
    });
  },

  /** Purpose: Execute findDuplicateCandidates operation for this module. */
  findDuplicateCandidates(limit = 200) {
    return prisma.task.findMany({
      where: {
        isDeleted: false
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        status: true,
        priority: true,
        createdBy: {
          select: {
            name: true
          }
        }
      }
    });
  }
};
