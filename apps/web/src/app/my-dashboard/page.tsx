/**
 * File Description:
 * This file implements apps/web/src/app/my-dashboard/page.tsx.
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
import { useMemo, useState } from 'react';
import { PaginatedResponseDto, TaskDto, TeamDto, WorkflowConfigDto } from '@task-platform/types';
import { AppNav } from '@/components/app-nav';
import { MyTasksKanbanBoard } from '@/components/my-tasks-kanban-board';
import { TaskDetailModal } from '@/components/task-detail-modal';
import { TaskQueryControls } from '@/components/task-query-controls';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { api } from '@/lib/api-client';
import { swrFetcher } from '@/lib/swr-fetcher';
import { buildTaskQueryString, TaskQueryState } from '@/lib/task-query';
import { useAuthStore } from '@/store/auth.store';

function mapWorkflowStageToTaskStatus(stage: WorkflowConfigDto['workflowStages'][number] | undefined): TaskDto['status'] {
  if (stage?.kind === 'TODO') {
    return 'TODO';
  }

  if (stage?.kind === 'COMPLETED') {
    return 'COMPLETED_PENDING_APPROVAL';
  }

  return 'IN_PROGRESS';
}

function buildOptimisticDashboardState(params: {
  current: PaginatedResponseDto<TaskDto> | undefined;
  taskId: string;
  workflowStageId: string;
  workflowConfig: WorkflowConfigDto | undefined;
}): PaginatedResponseDto<TaskDto> {
  const { current, taskId, workflowStageId, workflowConfig } = params;
  const fallback: PaginatedResponseDto<TaskDto> = {
    items: [],
    page: 1,
    pageSize: 30,
    total: 0,
    totalPages: 1
  };

  const nextItems = (current?.items ?? []).map((task) => {
    if (task.id !== taskId) {
      return task;
    }

    const targetStage = workflowConfig?.workflowStages.find((stage) => stage.id === workflowStageId);
    const mappedStatus = mapWorkflowStageToTaskStatus(targetStage);
    return { ...task, workflowStageId, status: mappedStatus };
  });

  return {
    ...(current ?? fallback),
    items: nextItems
  };
}

/** Purpose: Execute MyDashboardPage logic for this module. */
export default function MyDashboardPage() {
  const { isReady, isAuthenticated } = useAuthGuard();
  const { user } = useAuthStore();
  const [query, setQuery] = useState<TaskQueryState>({
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    pageSize: 30
  });
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const statusOptions = useMemo(
    () => [
      { label: 'All Status', value: '' },
      { label: 'Todo', value: 'TODO' },
      { label: 'In Progress', value: 'IN_PROGRESS' },
      { label: 'Completed', value: 'COMPLETED_PENDING_APPROVAL' }
    ],
    []
  );

  const { data: teams = [] } = useSWR<TeamDto[]>(isReady && isAuthenticated ? '/teams' : null, swrFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000
  });

  const effectiveWorkflowTeamId = selectedTeamId ?? user?.teamId ?? teams[0]?.id ?? null;

  const queryString = buildTaskQueryString({
    ...query,
    teamId: selectedTeamId ?? undefined
  });

  const { data: paged, error, isLoading, mutate } = useSWR<PaginatedResponseDto<TaskDto>>(isReady && isAuthenticated ? `/tasks/my-dashboard${queryString}` : null, swrFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000
  });
  const { data: workflowConfig } = useSWR<WorkflowConfigDto>(isReady && isAuthenticated && effectiveWorkflowTeamId ? `/config/workflow?teamId=${effectiveWorkflowTeamId}` : '/config/workflow', swrFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000
  });

  const tasks = paged?.items ?? [];

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

  async function moveTask(taskId: string, workflowStageId: string) {
    await mutate(
      (current) =>
        buildOptimisticDashboardState({
          current,
          taskId,
          workflowStageId,
          workflowConfig
        }),
      false
    );

    try {
      await api.put(`/tasks/${taskId}/status`, { workflowStageId });
      await mutate();
    } catch (error) {
      await mutate();
      throw error;
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <AppNav />
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <header>
          <h1 className="text-2xl font-bold text-slate-900">My Dashboard</h1>
          <p className="text-sm text-slate-600">Kanban board of tasks assigned to you.</p>
        </header>

        {error ? <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error.message}</p> : null}

        <TaskQueryControls
          value={{ ...query, teamId: selectedTeamId ?? undefined }}
          onChange={(next) => {
            setQuery(next);
            setSelectedTeamId(next.teamId ?? null);
          }}
          statusOptions={statusOptions}
          teamOptions={teams.map((team) => ({ label: team.name, value: team.id }))}
        />

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="h-56 animate-pulse rounded-xl bg-slate-200" />
            <div className="h-56 animate-pulse rounded-xl bg-slate-200" />
            <div className="h-56 animate-pulse rounded-xl bg-slate-200" />
          </div>
        ) : (
          <MyTasksKanbanBoard
            tasks={tasks}
            onMove={moveTask}
            stages={workflowConfig?.workflowStages}
            onTaskClick={(taskId) => {
              setSelectedTaskId(taskId);
            }}
          />
        )}

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

        <TaskDetailModal
          taskId={selectedTaskId}
          open={Boolean(selectedTaskId)}
          onClose={() => {
            setSelectedTaskId(null);
          }}
        />
      </div>
    </main>
  );
}
