/**
 * File Description:
 * Unit tests for kanban column assignment logic.
 *
 * Purpose:
 * Ensure task-to-column mapping is deterministic and each task appears once.
 */

import { buildKanbanColumns } from '../../../web/src/lib/kanban-column-assignment';
import type { TaskDto, WorkflowStageDto } from '@task-platform/types';

function makeTask(partial: Partial<TaskDto> & Pick<TaskDto, 'id' | 'status'>): TaskDto {
  return {
    id: partial.id,
    title: 't',
    description: 'd',
    status: partial.status,
    priority: 'LOW',
    dueDate: null,
    assignedUserId: 'user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    workflowStageId: partial.workflowStageId
  };
}

describe('buildKanbanColumns', () => {
  const stages: WorkflowStageDto[] = [
    { id: 'todo-1', label: 'Todo', kind: 'TODO' },
    { id: 'inprog-1', label: 'In Progress', kind: 'IN_PROGRESS' },
    { id: 'review-1', label: 'Code Review', kind: 'IN_PROGRESS' },
    { id: 'qa-1', label: 'QA', kind: 'IN_PROGRESS' },
    { id: 'done-1', label: 'Completed', kind: 'COMPLETED' }
  ];

  it('places each task in exactly one column even with multiple IN_PROGRESS stages', () => {
    const tasks: TaskDto[] = [
      makeTask({ id: 'a', status: 'IN_PROGRESS' }),
      makeTask({ id: 'b', status: 'IN_PROGRESS', workflowStageId: 'review-1' }),
      makeTask({ id: 'c', status: 'TODO' }),
      makeTask({ id: 'd', status: 'COMPLETED_PENDING_APPROVAL' })
    ];

    const columns = buildKanbanColumns(tasks, stages);

    const allIds = Object.values(columns).flat().map((t) => t.id);
    const uniqueIds = new Set(allIds);

    expect(allIds.length).toBe(tasks.length);
    expect(uniqueIds.size).toBe(tasks.length);

    expect(columns['review-1'].map((t) => t.id)).toContain('b');
    expect(columns['inprog-1'].map((t) => t.id)).toContain('a');
    expect(columns['qa-1'].map((t) => t.id)).not.toContain('a');
    expect(columns['qa-1'].map((t) => t.id)).not.toContain('b');
  });
});
