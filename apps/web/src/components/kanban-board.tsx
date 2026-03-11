/**
 * File Description:
 * This file implements apps/web/src/components/kanban-board.tsx.
 *
 * Purpose:
 * Render reusable UI building blocks and interaction views.
 *
 * Key Responsibilities:
 * - Render UI states.
 * - Handle user interactions.
 * - Compose reusable presentation blocks.
 */

import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  closestCorners
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ReactNode } from 'react';
import { TaskDto } from '@task-platform/types';
import { TaskCard } from '@/components/task-card';
import { useBoardColumns } from '@/hooks/use-board-columns';

type Status = 'TODO' | 'IN_PROGRESS' | 'COMPLETED_PENDING_APPROVAL';

const statuses: Status[] = ['TODO', 'IN_PROGRESS', 'COMPLETED_PENDING_APPROVAL'];

function BoardColumn({
  status,
  children
}: Readonly<{
  status: Status;
  children: ReactNode;
}>) {
  const { setNodeRef, isOver } = useDroppable({
    id: status
  });

  return (
    <div ref={setNodeRef} id={status} className={`rounded-xl border p-3 ${isOver ? 'bg-brand-50' : 'bg-slate-100'}`}>
      <h3 className="mb-3 font-semibold">{status === 'COMPLETED_PENDING_APPROVAL' ? 'Pending Approval' : status.replace('_', ' ')}</h3>
      {children}
    </div>
  );
}

function DraggableTask({
  task,
  canDrag
}: Readonly<{
  task: TaskDto;
  canDrag: boolean;
}>) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    disabled: !canDrag
  });

  return (
    <div ref={setNodeRef} style={{ opacity: isDragging ? 0.6 : 1 }} {...attributes} {...listeners}>
      <TaskCard task={task} canDrag={canDrag} />
    </div>
  );
}

/** Purpose: Execute KanbanBoard logic for this module. */
export function KanbanBoard({
  tasks,
  onMove,
  currentUserId
}: Readonly<{
  tasks: TaskDto[];
  onMove: (taskId: string, next: Status) => Promise<void>;
  currentUserId?: string;
}>) {
  const sensors = useSensors(useSensor(PointerSensor));
  const columns = useBoardColumns(tasks);

  async function handleDragEnd(event: DragEndEvent) {
    const taskId = String(event.active.id);
    const over = event.over;

    if (!over) return;
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;

    const canMoveByUser = !currentUserId || task.assignedUserId === currentUserId;
    if (!canMoveByUser) return;

    const overId = String(over.id);
    const targetTask = tasks.find((item) => item.id === overId);
    const nextStatusCandidate = statuses.includes(overId as Status) ? (overId as Status) : targetTask?.status;
    const nextStatus = nextStatusCandidate && statuses.includes(nextStatusCandidate as Status) ? (nextStatusCandidate as Status) : undefined;

    if (!nextStatus || task.status === nextStatus) return;

    await onMove(taskId, nextStatus);
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {statuses.map((status) => (
          <BoardColumn key={status} status={status}>
            <SortableContext items={columns[status].map((t) => t.id)} strategy={verticalListSortingStrategy}>
              {columns[status].map((task) => (
                <DraggableTask key={task.id} task={task} canDrag={!currentUserId || task.assignedUserId === currentUserId} />
              ))}
            </SortableContext>
          </BoardColumn>
        ))}
      </div>
    </DndContext>
  );
}
