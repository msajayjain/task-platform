/**
 * File Description:
 * This file implements apps/web/src/components/task-filter-bar.tsx.
 *
 * Purpose:
 * Render reusable UI building blocks and interaction views.
 *
 * Key Responsibilities:
 * - Render UI states.
 * - Handle user interactions.
 * - Compose reusable presentation blocks.
 */

import { Select } from '@/components/ui/select';

interface Props {
  onChange: (next: Record<string, string>) => void;
}

/** Purpose: Execute TaskFilterBar logic for this module. */
export function TaskFilterBar({ onChange }: Readonly<Props>) {
  return (
    <div className="grid grid-cols-1 gap-3 rounded-xl border bg-white p-4 md:grid-cols-4">
      <Select defaultValue="" onChange={(e) => onChange({ status: e.target.value })}>
        <option value="">All Status</option>
        <option value="TODO">To Do</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="COMPLETED_PENDING_APPROVAL">Completed (Pending Approval)</option>
        <option value="CLOSED">Closed</option>
      </Select>
      <Select defaultValue="" onChange={(e) => onChange({ priority: e.target.value })}>
        <option value="">All Priority</option>
        <option value="LOW">Low</option>
        <option value="MEDIUM">Medium</option>
        <option value="HIGH">High</option>
      </Select>
      <Select defaultValue="createdAt" onChange={(e) => onChange({ sortBy: e.target.value })}>
        <option value="createdAt">Sort: Created</option>
        <option value="dueDate">Sort: Due Date</option>
        <option value="priority">Sort: Priority</option>
      </Select>
      <Select defaultValue="desc" onChange={(e) => onChange({ sortOrder: e.target.value })}>
        <option value="desc">Desc</option>
        <option value="asc">Asc</option>
      </Select>
    </div>
  );
}
