/**
 * File Description:
 * This file implements apps/web/src/app/my-created-tasks/page.tsx.
 *
 * Purpose:
 * Provide module-specific logic used by the project runtime.
 *
 * Key Responsibilities:
 * - Encapsulate focused module behavior.
 * - Expose reusable exports.
 * - Support maintainable project structure.
 */

'use client';

import useSWR from 'swr';
import { useState } from 'react';
import { DropdownConfigDto, MyTaskUpdateDto, PaginatedResponseDto, TaskDto, TeamDto, UserDto } from '@task-platform/types';
import { AppNav } from '@/components/app-nav';
import { DashboardTaskRow } from '@/components/dashboard-task-row';
import { TaskQueryControls } from '@/components/task-query-controls';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { api } from '@/lib/api-client';
import { swrFetcher } from '@/lib/swr-fetcher';
import { buildTaskQueryString, TaskQueryState } from '@/lib/task-query';
import { useUiConfig } from '@/hooks/use-ui-config';

/** Purpose: Execute MyCreatedTasksPage logic for this module. */
export default function MyCreatedTasksPage() {
  const { isReady, isAuthenticated } = useAuthGuard();
  const [actionError, setActionError] = useState<string | null>(null);
  const [query, setQuery] = useState<TaskQueryState>({
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    pageSize: 15
  });
  const queryString = buildTaskQueryString(query);

  const { data: paged, error, isLoading, mutate } = useSWR<PaginatedResponseDto<TaskDto>>(isReady && isAuthenticated ? `/tasks/my-created${queryString}` : null, swrFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000
  });
  const { data: teams = [] } = useSWR<TeamDto[]>(isReady && isAuthenticated ? '/teams' : null, swrFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000
  });
  const { data: users = [] } = useSWR<UserDto[]>(isReady && isAuthenticated ? '/users' : null, swrFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 15000
  });
  const { data: dropdownConfig, error: dropdownError } = useSWR<DropdownConfigDto>('/config/dropdowns', swrFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000
  });

  const declineReasons = dropdownConfig?.declineReasons ?? [];
  const tasks = paged?.items ?? [];
  const { orderedVisibleFields } = useUiConfig('my-created-grid');

  const fieldLabel: Record<string, string> = {
    title: 'Title',
    description: 'Description',
    status: 'Current Status',
    priority: 'Priority',
    dueDate: 'Due Date',
    assignedTeam: 'Assigned Team',
    createdDate: 'Created Date',
    actions: 'Actions'
  };

  function toggleSort(sortBy: 'dueDate' | 'priority' | 'createdAt' | 'status') {
    setQuery((current) => {
      if (current.sortBy === sortBy) {
        return { ...current, sortOrder: current.sortOrder === 'asc' ? 'desc' : 'asc' };
      }
      return { ...current, sortBy, sortOrder: 'asc' };
    });
  }

  function sortIndicator(sortBy: 'dueDate' | 'priority' | 'createdAt' | 'status') {
    if (query.sortBy !== sortBy) return '';
    return query.sortOrder === 'asc' ? '↑' : '↓';
  }

  if (!isReady) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl space-y-3 rounded-xl border bg-white p-4">
          <div className="h-10 animate-pulse rounded bg-slate-200" />
          <div className="h-56 animate-pulse rounded bg-slate-200" />
        </div>
      </main>
    );
  }

  async function saveTask(taskId: string, payload: MyTaskUpdateDto) {
    setActionError(null);
    await api.put(`/tasks/my-created/${taskId}`, payload);
    await mutate();
  }

  async function softDeleteTask(taskId: string) {
    setActionError(null);
    await api.delete(`/tasks/my-created/${taskId}`);
    await mutate();
  }

  async function approveTask(taskId: string) {
    setActionError(null);
    await api.put(`/tasks/my-created/${taskId}/approval`, { action: 'ACCEPT' });
    await mutate();
  }

  async function declineTask(taskId: string, reason: string, comment?: string) {
    setActionError(null);
    await api.put(`/tasks/my-created/${taskId}/approval`, {
      action: 'DECLINE',
      reason,
      comment
    });
    await mutate();
  }

  const isLoaded = !isLoading;

  return (
    <main className="min-h-screen bg-slate-50">
      <AppNav />
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <header>
          <h1 className="text-2xl font-bold text-slate-900">My Created Tasks</h1>
          <p className="text-sm text-slate-600">Only tasks created by you and not soft-deleted are shown.</p>
        </header>

        {error ? <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error.message}</p> : null}
        {dropdownError ? <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{dropdownError.message}</p> : null}
        {actionError ? <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{actionError}</p> : null}

        <TaskQueryControls
          value={query}
          onChange={setQuery}
          teamOptions={teams.map((team) => ({ label: team.name, value: team.id }))}
        />

        <section className="overflow-x-auto rounded-xl border bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                {orderedVisibleFields.map((field) => {
                  if (field === 'status') {
                    return (
                      <th key={field} className="px-4 py-3 text-left font-semibold">
                        <button className="underline-offset-2 hover:underline" onClick={() => toggleSort('status')} type="button">
                          {fieldLabel[field]} {sortIndicator('status')}
                        </button>
                      </th>
                    );
                  }

                  if (field === 'priority') {
                    return (
                      <th key={field} className="px-4 py-3 text-left font-semibold">
                        <button className="underline-offset-2 hover:underline" onClick={() => toggleSort('priority')} type="button">
                          {fieldLabel[field]} {sortIndicator('priority')}
                        </button>
                      </th>
                    );
                  }

                  if (field === 'dueDate') {
                    return (
                      <th key={field} className="px-4 py-3 text-left font-semibold">
                        <button className="underline-offset-2 hover:underline" onClick={() => toggleSort('dueDate')} type="button">
                          {fieldLabel[field]} {sortIndicator('dueDate')}
                        </button>
                      </th>
                    );
                  }

                  if (field === 'createdDate') {
                    return (
                      <th key={field} className="px-4 py-3 text-left font-semibold">
                        <button className="underline-offset-2 hover:underline" onClick={() => toggleSort('createdAt')} type="button">
                          {fieldLabel[field]} {sortIndicator('createdAt')}
                        </button>
                      </th>
                    );
                  }

                  return (
                    <th key={field} className="px-4 py-3 text-left font-semibold">
                      {fieldLabel[field] ?? field}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={Math.max(orderedVisibleFields.length + 1, 8)}>
                    Loading tasks...
                  </td>
                </tr>
              ) : null}
              {isLoaded && tasks.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={Math.max(orderedVisibleFields.length + 1, 8)}>
                    No active tasks found.
                  </td>
                </tr>
              ) : null}
              {isLoaded
                ? tasks.map((task) => (
                    <DashboardTaskRow
                      key={task.id}
                      task={task}
                      teams={teams}
                      users={users}
                      gridVisibleFields={orderedVisibleFields}
                      onSave={saveTask}
                      onDelete={softDeleteTask}
                      onApprove={approveTask}
                      onDecline={declineTask}
                      declineReasons={declineReasons}
                      onError={setActionError}
                    />
                  ))
                : null}
            </tbody>
          </table>
        </section>

        <div className="flex items-center justify-between rounded-xl border bg-white px-4 py-3 text-sm">
          <p className="text-slate-600">
            Page {paged?.page ?? 1} of {paged?.totalPages ?? 1} · {paged?.total ?? 0} task(s)
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded border px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={(paged?.page ?? 1) <= 1}
              onClick={() => {
                setQuery((current) => ({ ...current, page: Math.max(1, (current.page ?? 1) - 1) }));
              }}
            >
              Previous
            </button>
            <button
              type="button"
              className="rounded border px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={(paged?.page ?? 1) >= (paged?.totalPages ?? 1)}
              onClick={() => {
                setQuery((current) => ({ ...current, page: (current.page ?? 1) + 1 }));
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
