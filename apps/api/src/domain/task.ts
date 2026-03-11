/**
 * File Description:
 * This file implements apps/api/src/domain/task.ts.
 *
 * Purpose:
 * Provide module-specific logic used by the project runtime.
 *
 * Key Responsibilities:
 * - Encapsulate focused module behavior.
 * - Expose reusable exports.
 * - Support maintainable project structure.
 */

import { TaskPriority, TaskStatus } from '@task-platform/types';

export interface TaskEntity {
  id: string;
  title: string;
  description: string;
  aiSummary: string | null;
  category: string | null;
  aiRootCauseAnalysis: string | null;
  resolutionNotes: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  assignedUserId: string;
  createdById: string | null;
  closedAt: Date | null;
  isArchived: boolean;
  archivedAt: Date | null;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
