/**
 * File Description:
 * This file implements apps/web/src/lib/kanban-column-assignment.ts.
 *
 * Purpose:
 * Provide shared utility/client infrastructure helpers.
 *
 * Key Responsibilities:
 * - Encapsulate focused module behavior.
 * - Expose reusable exports.
 * - Support maintainable project structure.
 */

import type { TaskDto, WorkflowStageDto } from '@task-platform/types';

/** Purpose: Execute resolveFallbackStageId logic for this module. */
export function resolveFallbackStageId(task: TaskDto, stages: WorkflowStageDto[]): string | undefined {
  if (task.status === 'TODO') {
    return stages.find((stage) => stage.kind === 'TODO')?.id;
  }

  if (task.status === 'IN_PROGRESS') {
    return stages.find((stage) => stage.kind === 'IN_PROGRESS')?.id;
  }

  if (task.status === 'COMPLETED_PENDING_APPROVAL') {
    return stages.find((stage) => stage.kind === 'COMPLETED')?.id;
  }

  return undefined;
}

/** Purpose: Execute buildKanbanColumns logic for this module. */
export function buildKanbanColumns(tasks: TaskDto[], stages: WorkflowStageDto[]): Record<string, TaskDto[]> {
  const columns = stages.reduce<Record<string, TaskDto[]>>((acc, stage) => {
    acc[stage.id] = [];
    return acc;
  }, {});

  for (const task of tasks) {
    const targetStageId =
      (task.workflowStageId && stages.some((stage) => stage.id === task.workflowStageId)
        ? task.workflowStageId
        : undefined) ?? resolveFallbackStageId(task, stages);

    if (!targetStageId) {
      continue;
    }

    columns[targetStageId] ??= [];
    columns[targetStageId].push(task);
  }

  return columns;
}
