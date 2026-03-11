/**
 * File Description:
 * This file implements apps/web/src/components/task-query-controls.tsx.
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

import { TaskStatus } from '@task-platform/types';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { TaskQueryState } from '@/lib/task-query';

const defaultStatusOptions: Array<{ label: string; value: TaskStatus | '' }> = [
  { label: 'All Status', value: '' },
  { label: 'Todo', value: 'TODO' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Done (Legacy)', value: 'DONE' },
  { label: 'Completed', value: 'COMPLETED_PENDING_APPROVAL' },
  { label: 'Closed', value: 'CLOSED' }
];

const defaultSortOptions = [
  { label: 'Due Date', value: 'dueDate' },
  { label: 'Priority', value: 'priority' },
  { label: 'Created Date', value: 'createdAt' },
  { label: 'Status', value: 'status' }
];

interface TaskQueryControlsProps {
  value: TaskQueryState;
  onChange: (next: TaskQueryState) => void;
  statusOptions?: Array<{ label: string; value: string }>;
  teamOptions?: Array<{ label: string; value: string }>;
}

/** Purpose: Execute TaskQueryControls logic for this module. */
export function TaskQueryControls({ value, onChange, statusOptions = defaultStatusOptions, teamOptions }: Readonly<TaskQueryControlsProps>) {
  return (
    <section className="grid grid-cols-1 gap-3 rounded-xl border bg-white p-4 md:grid-cols-2 lg:grid-cols-6">
      {teamOptions ? (
        <Select
          value={value.teamId ?? ''}
          onChange={(event) => {
            onChange({ ...value, teamId: event.target.value || undefined, workflowStageId: undefined, page: 1 });
          }}
        >
          <option value="">All Teams</option>
          {teamOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      ) : null}

      <Select
        value={value.status ?? ''}
        onChange={(event) => {
          onChange({ ...value, status: event.target.value || undefined, page: 1 });
        }}
      >
        {statusOptions.map((option) => (
          <option key={option.value || 'all'} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>

      <Select
        value={value.priority ?? ''}
        onChange={(event) => {
          onChange({ ...value, priority: event.target.value || undefined, page: 1 });
        }}
      >
        <option value="">All Priority</option>
        <option value="LOW">Low</option>
        <option value="MEDIUM">Medium</option>
        <option value="HIGH">High</option>
      </Select>

      <Input
        type="date"
        value={value.dueDate ?? ''}
        onChange={(event) => {
          onChange({ ...value, dueDate: event.target.value || undefined, page: 1 });
        }}
      />

      <Select
        value={value.sortBy ?? 'createdAt'}
        onChange={(event) => {
          onChange({ ...value, sortBy: event.target.value as TaskQueryState['sortBy'], page: 1 });
        }}
      >
        {defaultSortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            Sort by: {option.label}
          </option>
        ))}
      </Select>

      <Select
        value={value.sortOrder ?? 'desc'}
        onChange={(event) => {
          onChange({ ...value, sortOrder: event.target.value as 'asc' | 'desc', page: 1 });
        }}
      >
        <option value="desc">Descending</option>
        <option value="asc">Ascending</option>
      </Select>
    </section>
  );
}
