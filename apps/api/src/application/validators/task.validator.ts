/**
 * File Description:
 * This file implements apps/api/src/application/validators/task.validator.ts.
 *
 * Purpose:
 * Validate and normalize incoming data contracts.
 *
 * Key Responsibilities:
 * - Encapsulate focused module behavior.
 * - Expose reusable exports.
 * - Support maintainable project structure.
 */

import { z } from 'zod';

const statusEnum = z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'COMPLETED_PENDING_APPROVAL', 'CLOSED']);
const priorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD date format');

export const taskCreateSchema = z.object({
  title: z.string().min(2).max(160),
  description: z.string().max(4000).default(''),
  aiSummary: z.string().max(500).optional().nullable(),
  status: statusEnum.default('TODO'),
  priority: priorityEnum.default('MEDIUM'),
  dueDate: dateOnlySchema.optional().nullable(),
  teamId: z.string().cuid(),
  assignedUserId: z.string().cuid().optional(),
  comment: z.string().trim().max(2000).optional()
});

export const taskUpdateSchema = z
  .object({
    title: z.string().min(2).max(160),
    description: z.string().max(4000),
    aiSummary: z.string().max(500).nullable(),
    category: z.string().max(120).nullable(),
    aiRootCauseAnalysis: z.string().max(4000).nullable(),
    resolutionNotes: z.string().max(4000).nullable(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED_PENDING_APPROVAL']),
    workflowStageId: z.string().min(1),
    priority: priorityEnum,
    dueDate: dateOnlySchema.nullable(),
    teamId: z.string().cuid(),
    assignedUserId: z.string().cuid()
  })
  .partial();

export const taskFilterSchema = z.object({
  status: statusEnum.optional(),
  teamId: z.string().cuid().optional(),
  workflowStageId: z.string().min(1).optional(),
  priority: priorityEnum.optional(),
  dueDate: z.string().date().optional(),
  assignedUserId: z.string().cuid().optional(),
  createdById: z.string().cuid().optional(),
  sortBy: z.enum(['dueDate', 'priority', 'createdAt', 'status', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional()
});

export const aiTaskSchema = z.object({
  text: z.string().min(10).max(1000),
  teamId: z.string().cuid(),
  assignedUserId: z.string().cuid()
});

export const aiSummarySchema = z.object({
  title: z.string().min(2).max(160),
  description: z.string().max(4000)
});

export const aiPrioritySchema = z.object({
  title: z.string().min(2).max(160),
  description: z.string().max(4000)
});

export const aiDuplicateSchema = z.object({
  title: z.string().min(2).max(160),
  description: z.string().max(4000),
  priority: priorityEnum.optional(),
  category: z.string().max(120).optional().nullable()
});

export const aiCategorizeSchema = z.object({
  title: z.string().min(2).max(160),
  description: z.string().max(4000),
  taskId: z.string().cuid().optional()
});

export const aiRootCauseSchema = z.object({
  taskId: z.string().cuid().optional(),
  title: z.string().min(2).max(160),
  description: z.string().max(4000),
  category: z.string().max(120).optional().nullable(),
  comments: z.array(z.string().max(2000)).optional()
});

export const aiResolutionSchema = z.object({
  taskId: z.string().cuid().optional(),
  title: z.string().min(2).max(160),
  description: z.string().max(4000),
  category: z.string().max(120).optional().nullable(),
  rootCauseAnalysis: z.string().max(4000)
});

export const taskCommentSchema = z.object({
  content: z.string().trim().min(1).max(2000)
});

export const myTaskUpdateSchema = z
  .object({
    title: z.string().min(2).max(160),
    description: z.string().max(4000),
    priority: priorityEnum,
    dueDate: dateOnlySchema.nullable(),
    teamId: z.string().cuid(),
    assignedUserId: z.string().cuid()
  })
  .partial();

export const taskStatusUpdateSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED_PENDING_APPROVAL']).optional(),
  workflowStageId: z.string().min(1).optional()
}).refine((payload) => Boolean(payload.status) || Boolean(payload.workflowStageId), {
  message: 'Either status or workflowStageId is required'
});

export const approvalActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('ACCEPT')
  }),
  z.object({
    action: z.literal('DECLINE'),
    reason: z.string().trim().min(1).max(120),
    comment: z.string().trim().max(2000).optional()
  })
]);
