/**
 * File Description:
 * This file implements apps/web/src/app/tasks/create/page.tsx.
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
import { AIDuplicateCheckResponseDto, AIParseTaskResponseDto, AIPrioritySuggestionResponseDto, AISummaryResponseDto, TaskDetailDto, TeamDto, UserDto } from '@task-platform/types';
import { useRouter } from 'next/navigation';
import { AppNav } from '@/components/app-nav';
import { CreateTaskForm } from '@/components/create-task-form';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { api } from '@/lib/api-client';
import { swrFetcher } from '@/lib/swr-fetcher';
import { useAuthStore } from '@/store/auth.store';

/** Purpose: Execute CreateTaskPage logic for this module. */
export default function CreateTaskPage() {
  const { isReady, isAuthenticated } = useAuthGuard();

  const router = useRouter();
  const { user } = useAuthStore();
  const { data: users = [], isLoading, error } = useSWR<UserDto[]>(isReady && isAuthenticated ? '/users' : null, swrFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 10000
  });
  const { data: teams = [], isLoading: teamsLoading, error: teamsError } = useSWR<TeamDto[]>(isReady && isAuthenticated ? '/teams' : null, swrFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000
  });

  if (!isReady) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-3xl space-y-3 rounded-xl border bg-white p-4">
          <div className="h-10 animate-pulse rounded bg-slate-200" />
          <div className="h-24 animate-pulse rounded bg-slate-200" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <AppNav />
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <header>
          <h1 className="text-2xl font-bold text-slate-900">Create Task</h1>
          <p className="text-sm text-slate-600">Create a new task and assign it to a team member.</p>
        </header>

        {error ? <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error.message}</p> : null}
        {teamsError ? <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{teamsError.message}</p> : null}

        {isLoading || teamsLoading ? (
          <div className="space-y-3 rounded-xl border bg-white p-4">
            <div className="h-10 animate-pulse rounded bg-slate-200" />
            <div className="h-10 animate-pulse rounded bg-slate-200" />
            <div className="h-10 animate-pulse rounded bg-slate-200" />
            <div className="h-24 animate-pulse rounded bg-slate-200" />
          </div>
        ) : (
          <CreateTaskForm
            defaultAssignedUserId={user?.id}
            users={users}
            teams={teams}
            onSuggestSummary={async (payload) => {
              const response = await api.post<{ success: true; data: AISummaryResponseDto }>('/ai/summarize', {
                title: payload.title.trim().slice(0, 160),
                description: payload.description.trim().slice(0, 4000)
              });
              return response.data.data;
            }}
            onSuggestPriority={async (payload) => {
              const response = await api.post<{ success: true; data: AIPrioritySuggestionResponseDto }>('/ai/suggest-priority', payload);
              return {
                priority: response.data.data.priority,
                confidence: response.data.data.confidence,
                warning: response.data.data.warning
              };
            }}
            onParseNaturalTask={async (text) => {
              const response = await api.post<{ success: true; data: AIParseTaskResponseDto }>('/ai/parse-task', { text });
              return {
                title: response.data.data.title,
                description: response.data.data.description,
                priority: response.data.data.priority,
                dueDate: response.data.data.dueDate,
                suggestedTeam: response.data.data.suggestedTeam ?? null,
                confidence: response.data.data.confidence
              };
            }}
            onDetectDuplicates={async (payload) => {
              const normalizedTitle = payload.title.trim().slice(0, 160);
              const normalizedDescription = payload.description.trim().slice(0, 4000);
              const title = normalizedTitle.length >= 2 ? normalizedTitle : normalizedDescription.slice(0, 160);

              if (title.length < 2 || normalizedDescription.length < 2) {
                return [];
              }

              const response = await api.post<{ success: true; data: AIDuplicateCheckResponseDto }>('/ai/detect-duplicates', {
                title,
                description: normalizedDescription,
                priority: payload.priority,
                category: payload.category
              });
              return response.data.data.duplicates;
            }}
            onFetchTaskDetail={async (taskId) => {
              const response = await api.get<{ success: true; data: TaskDetailDto }>(`/tasks/${taskId}`);
              return response.data.data;
            }}
            onSubmit={async (values) => {
              const normalizedAssignedUserId = (values.assignedUserId ?? '').trim();
              const normalizedComment = (values.comment ?? '').trim();

              await api.post('/tasks', {
                title: values.title.trim().slice(0, 160),
                description: values.description.trim().slice(0, 4000),
                aiSummary: (values.aiSummary ?? '').trim().slice(0, 500) || null,
                priority: values.priority,
                status: 'TODO',
                dueDate: values.dueDate || null,
                teamId: values.teamId,
                assignedUserId: normalizedAssignedUserId || undefined,
                comment: normalizedComment || undefined
              });
              router.push('/my-created-tasks');
            }}
          />
        )}
      </div>
    </main>
  );
}
