/**
 * File Description:
 * This file implements apps/web/src/components/my-tasks-kanban-board.tsx.
 *
 * Purpose:
 * Render reusable UI building blocks and interaction views.
 *
 * Key Responsibilities:
 * - Render UI states.
 * - Handle user interactions.
 * - Compose reusable presentation blocks.
 */

'use client';

import { memo, ReactNode } from 'react';
import { DndContext, DragEndEvent, PointerSensor, closestCorners, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { TaskDto, WorkflowStageDto } from '@task-platform/types';
import { buildKanbanColumns } from '@/lib/kanban-column-assignment';

const defaultStages: WorkflowStageDto[] = [
  { id: 'todo', label: 'Todo', kind: 'TODO' },
  { id: 'in-progress', label: 'In Progress', kind: 'IN_PROGRESS' },
  { id: 'completed', label: 'Completed', kind: 'COMPLETED' }
];

const TaskCard = memo(function TaskCard({ task, onView }: Readonly<{ task: TaskDto; onView: (taskId: string) => void }>) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });

  return (
    <button
      type="button"
      ref={setNodeRef}
      onClick={() => onView(task.id)}
      className="mb-2 w-full rounded-lg border bg-white p-3 text-left shadow-sm"
      style={{ opacity: isDragging ? 0.65 : 1, cursor: 'pointer' }}
    >
      <div className="mb-1 flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold text-slate-900">{task.title}</h4>
        <button
          type="button"
          aria-label="Drag task"
          onClick={(event) => event.stopPropagation()}
          className="rounded border bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600"
          style={{ cursor: 'grab' }}
          {...attributes}
          {...listeners}
        >
          Drag
        </button>
      </div>
      <p className="mt-1 line-clamp-3 text-xs text-slate-600">{task.description}</p>
      <p className="mt-2 text-[11px] text-slate-500">Created: {new Date(task.createdAt).toLocaleDateString()}</p>
    </button>
  );
});

function Column({ stageId, label, children }: Readonly<{ stageId: string; label: string; children: ReactNode }>) {
  const { setNodeRef, isOver } = useDroppable({ id: stageId });

  return (
    <section ref={setNodeRef} className={`rounded-xl border p-3 ${isOver ? 'bg-brand-50' : 'bg-slate-100'}`}>
      <h3 className="mb-3 text-sm font-semibold text-slate-800">{label}</h3>
      {children}
    </section>
  );
}

interface MyTasksKanbanBoardProps {
  tasks: TaskDto[];
  onMove: (taskId: string, workflowStageId: string) => Promise<void>;
  onTaskClick: (taskId: string) => void;
  stages?: WorkflowStageDto[];
}

/** Purpose: Execute MyTasksKanbanBoard logic for this module. */
export function MyTasksKanbanBoard({ tasks, onMove, onTaskClick, stages = defaultStages }: Readonly<MyTasksKanbanBoardProps>) {
  const sensors = useSensors(useSensor(PointerSensor));

  const columns = buildKanbanColumns(tasks, stages);

  async function handleDragEnd(event: DragEndEvent) {
    const taskId = String(event.active.id);
    const over = event.over;
    if (!over) return;

    const overId = String(over.id);
    const stageById = stages.find((stage) => stage.id === overId);
    if (!stageById) return;

    const sourceTask = tasks.find((task) => task.id === taskId);
    if (!sourceTask || sourceTask.workflowStageId === stageById.id) return;

    await onMove(taskId, stageById.id);
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {stages.map((stage) => (
          <Column key={stage.id} stageId={stage.id} label={stage.label}>
            {columns[stage.id]?.length === 0 ? <p className="text-xs text-slate-500">No tasks</p> : null}
            {(columns[stage.id] ?? []).map((task) => (
              <TaskCard key={task.id} task={task} onView={onTaskClick} />
            ))}
          </Column>
        ))}
      </div>
    </DndContext>
  );
}
