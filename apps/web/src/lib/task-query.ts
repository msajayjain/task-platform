/**
 * File Description:
 * This file implements apps/web/src/lib/task-query.ts.
 *
 * Purpose:
 * Provide shared utility/client infrastructure helpers.
 *
 * Key Responsibilities:
 * - Encapsulate focused module behavior.
 * - Expose reusable exports.
 * - Support maintainable project structure.
 */

export interface TaskQueryState {
  status?: string;
  teamId?: string;
  workflowStageId?: string;
  priority?: string;
  dueDate?: string;
  sortBy?: 'dueDate' | 'priority' | 'createdAt' | 'status' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

/** Purpose: Execute buildTaskQueryString logic for this module. */
export function buildTaskQueryString(query: TaskQueryState): string {
  const params = new URLSearchParams();

  if (query.status) params.set('status', query.status);
  if (query.teamId) params.set('teamId', query.teamId);
  if (query.workflowStageId) params.set('workflowStageId', query.workflowStageId);
  if (query.priority) params.set('priority', query.priority);
  if (query.dueDate) params.set('dueDate', query.dueDate);
  if (query.sortBy) params.set('sortBy', query.sortBy);
  if (query.sortOrder) params.set('sortOrder', query.sortOrder);
  if (query.page) params.set('page', String(query.page));
  if (query.pageSize) params.set('pageSize', String(query.pageSize));

  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}
