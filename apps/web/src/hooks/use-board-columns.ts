/**
 * File Description:
 * This file implements apps/web/src/hooks/use-board-columns.ts.
 *
 * Purpose:
 * Encapsulate reusable client-side state/behavior logic.
 *
 * Key Responsibilities:
 * - Encapsulate focused module behavior.
 * - Expose reusable exports.
 * - Support maintainable project structure.
 */

import { useMemo } from 'react';
import { TaskDto } from '@task-platform/types';

/** Purpose: Execute useBoardColumns logic for this module. */
export function useBoardColumns(tasks: TaskDto[]) {
  return useMemo(
    () => ({
      TODO: tasks.filter((task) => task.status === 'TODO'),
      IN_PROGRESS: tasks.filter((task) => task.status === 'IN_PROGRESS'),
      COMPLETED_PENDING_APPROVAL: tasks.filter((task) => task.status === 'COMPLETED_PENDING_APPROVAL')
    }),
    [tasks]
  );
}
