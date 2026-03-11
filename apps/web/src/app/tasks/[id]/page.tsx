/**
 * File Description:
 * This file implements apps/web/src/app/tasks/[id]/page.tsx.
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
import { FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TaskDetailDto } from '@task-platform/types';
import { AppNav } from '@/components/app-nav';
import { Button } from '@/components/ui/button';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { api } from '@/lib/api-client';
import { ApiError } from '@/lib/api-error';
import { swrFetcher } from '@/lib/swr-fetcher';
import { useUiConfig } from '@/hooks/use-ui-config';

interface TaskDetailPageProps {
  params: {
    id: string;
  };
}

function statusLabel(status: TaskDetailDto['status']) {
  switch (status) {
    case 'IN_PROGRESS':
      return 'In Progress';
    case 'DONE':
      return 'Done (Legacy)';
    case 'COMPLETED_PENDING_APPROVAL':
      return 'Completed (Pending Approval)';
    case 'CLOSED':
      return 'Closed';
    default:
      return 'Todo';
  }
}

function LoadingShell() {
  return (
    <div className="space-y-3 rounded-xl border bg-white p-4">
      <div className="h-8 animate-pulse rounded bg-slate-200" />
      <div className="h-6 animate-pulse rounded bg-slate-200" />
      <div className="h-24 animate-pulse rounded bg-slate-200" />
    </div>
  );
}

function extractBulletItems(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => line.slice(2).trim())
    .filter(Boolean);
}

function stripUserCommentsSection(text: string | null | undefined): string {
  if (!text) return '';
  const marker = /\n\s*User Comments:\s*\n?/i;
  const match = marker.exec(text);
  if (!match || match.index < 0) return text;
  return text.slice(0, match.index).trimEnd();
}

function extractUserCommentsSection(text: string | null | undefined): string | null {
  if (!text) return null;
  const marker = /(?:^|\n)\s*User Comments:\s*\n?/i;
  const match = marker.exec(text);
  if (!match || typeof match.index !== 'number') return null;
  const value = text.slice(match.index + match[0].length).trim();
  return value || null;
}

function removeBulletsFromNarrative(text: string | null | undefined): string {
  if (!text) return '';
  const lines = text.split(/\r?\n/);
  const nonBulletLines = lines.filter((line) => !line.trim().startsWith('- '));
  return nonBulletLines.join('\n').replaceAll(/\n{3,}/g, '\n\n').trim();
}

function ResolutionNotesSection({ resolutionNotes }: Readonly<{ resolutionNotes: string | null | undefined }>) {
  if (!resolutionNotes) return null;

  const resolutionSource = stripUserCommentsSection(resolutionNotes);
  const resolutionNarrative = removeBulletsFromNarrative(resolutionSource);
  const resolutionItems = extractBulletItems(resolutionSource);
  const resolutionUserComments = extractUserCommentsSection(resolutionNotes);

  return (
    <div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
      <p className="font-semibold">💡 AI Suggested Permanent Resolution</p>
      {resolutionNarrative ? <p className="mt-1 whitespace-pre-line">{resolutionNarrative}</p> : null}
      {resolutionItems.length > 0 ? (
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {resolutionItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
          {resolutionUserComments ? (
            <div className="mt-3 border-t border-emerald-200 pt-2">
              <div className="rounded border border-emerald-200 bg-white/70 p-2 text-emerald-900">
                <p className="font-semibold">User Comments:</p>
                <p className="mt-1 whitespace-pre-wrap">{resolutionUserComments}</p>
              </div>
        </div>
      ) : null}
    </div>
  );
}

function TaskInfoSection(props: Readonly<{
  task: TaskDetailDto;
  isVisible: (fieldName: string) => boolean;
}>) {
  const { task, isVisible } = props;
  return (
    <section className="space-y-4 rounded-xl border bg-white p-5">
      {isVisible('title') ? <h2 className="text-xl font-semibold text-slate-900">{task.title}</h2> : null}
      {isVisible('description') ? <p className="text-sm text-slate-700">{task.description || 'No description'}</p> : null}
      {task.aiSummary ? (
        <div className="rounded border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-900">
          <p className="font-semibold">AI Summary</p>
          <p className="mt-1">{task.aiSummary}</p>
        </div>
      ) : null}

      <dl className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
        {isVisible('status') ? <div>
          <dt className="font-semibold text-slate-600">Status</dt>
          <dd>{statusLabel(task.status)}</dd>
        </div> : null}
        {isVisible('createdBy') ? <div>
          <dt className="font-semibold text-slate-600">Created By</dt>
          <dd>{task.createdByName ?? task.createdById ?? 'Unknown'}</dd>
        </div> : null}
        {isVisible('assignedUser') ? <div>
          <dt className="font-semibold text-slate-600">Assigned User</dt>
          <dd>{task.assignedUserName ?? task.assignedUserId}</dd>
        </div> : null}
        {isVisible('assignedTeam') ? <div>
          <dt className="font-semibold text-slate-600">Assigned Team</dt>
          <dd>{task.assignedTeamName ?? task.teamName ?? '-'}</dd>
        </div> : null}
        {isVisible('createdDate') ? <div>
          <dt className="font-semibold text-slate-600">Created Date</dt>
          <dd>{new Date(task.createdAt).toLocaleString()}</dd>
        </div> : null}
        {isVisible('updatedDate') ? <div>
          <dt className="font-semibold text-slate-600">Updated Date</dt>
          <dd>{new Date(task.updatedAt).toLocaleString()}</dd>
        </div> : null}
        <div>
          <dt className="font-semibold text-slate-600">Closed At</dt>
          <dd>{task.closedAt ? new Date(task.closedAt).toLocaleString() : '-'}</dd>
        </div>
      </dl>

      {task.aiRootCauseAnalysis ? (
        <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800">
          <p className="font-semibold uppercase tracking-wide text-slate-700">AI Root Cause Analysis</p>
          <p className="mt-1">{task.aiRootCauseAnalysis}</p>
        </div>
      ) : null}

      <ResolutionNotesSection resolutionNotes={task.resolutionNotes} />
    </section>
  );
}

function DeclineHistorySection(props: Readonly<{
  task: TaskDetailDto;
  isVisible: (fieldName: string) => boolean;
}>) {
  const { task, isVisible } = props;
  if (!isVisible('declineHistory')) return null;

  return (
    <section className="space-y-3 rounded-xl border bg-white p-5">
      <h3 className="text-lg font-semibold text-slate-900">Decline history</h3>

      <div className="max-h-72 space-y-2 overflow-y-auto rounded border bg-slate-50 p-3">
        {task.declineHistory.length === 0 ? (
          <p className="text-sm text-slate-500">No decline entries.</p>
        ) : (
          task.declineHistory.map((entry) => (
            <article key={entry.id} className="rounded border bg-white p-3">
              <p className="text-sm text-slate-700">
                <span className="font-semibold">Reason:</span> {entry.reason}
              </p>
              <p className="text-sm text-slate-700">
                <span className="font-semibold">Comment:</span> {entry.comment ?? '-'}
              </p>
              <p className="text-xs text-slate-500">
                {entry.declinedByName} • {new Date(entry.createdAt).toLocaleString()}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function CommentsSection(props: Readonly<{
  task: TaskDetailDto;
  isVisible: (fieldName: string) => boolean;
  onAddComment: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}>) {
  const { task, isVisible, onAddComment } = props;
  if (!isVisible('comments')) return null;

  return (
    <section className="space-y-3 rounded-xl border bg-white p-5">
      <h3 className="text-lg font-semibold text-slate-900">Comments history</h3>

      <div className="max-h-96 space-y-2 overflow-y-auto rounded border bg-slate-50 p-3">
        {task.comments.length === 0 ? (
          <p className="text-sm text-slate-500">No comments yet.</p>
        ) : (
          task.comments.map((comment) => (
            <article key={comment.id} className="rounded border bg-white p-3">
              <p className="text-sm text-slate-700">{comment.content}</p>
              <p className="mt-1 text-xs text-slate-500">
                {comment.authorName} • {new Date(comment.createdAt).toLocaleString()}
              </p>
            </article>
          ))
        )}
      </div>

      <form onSubmit={(event) => void onAddComment(event)} className="space-y-2">
        <textarea
          name="comment"
          rows={3}
          className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
          placeholder="Add a comment"
        />
        <Button type="submit">Add Comment</Button>
      </form>
    </section>
  );
}

function TaskDetailBody(props: Readonly<{
  isLoading: boolean;
  task?: TaskDetailDto;
  isVisible: (fieldName: string) => boolean;
  onAddComment: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}>) {
  const { isLoading, task, isVisible, onAddComment } = props;
  if (isLoading || !task) {
    return <LoadingShell />;
  }

  return (
    <>
      <TaskInfoSection task={task} isVisible={isVisible} />
      <DeclineHistorySection task={task} isVisible={isVisible} />
      <CommentsSection task={task} isVisible={isVisible} onAddComment={onAddComment} />
    </>
  );
}

/** Purpose: Execute TaskDetailPage logic for this module. */
export default function TaskDetailPage({ params }: Readonly<TaskDetailPageProps>) {
  const { isReady, isAuthenticated } = useAuthGuard();
  const { isVisible } = useUiConfig('task-details');
  const router = useRouter();

  const {
    data: task,
    error,
    isLoading,
    mutate
  } = useSWR<TaskDetailDto>(isReady && isAuthenticated ? `/tasks/${params.id}` : null, swrFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000
  });

  useEffect(() => {
    if (!error) return;
    if (!(error instanceof ApiError)) return;
    if (error.statusCode !== 403) return;

    router.replace('/my-dashboard');
  }, [error, router]);

  if (!isReady) {
    return (
      <main className="mx-auto max-w-4xl space-y-3 p-6">
        <div className="h-8 animate-pulse rounded bg-slate-200" />
        <div className="h-24 animate-pulse rounded bg-slate-200" />
      </main>
    );
  }

  async function addComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const rawComment = formData.get('comment');
    const content = typeof rawComment === 'string' ? rawComment.trim() : '';
    if (!content) {
      return;
    }

    await api.post(`/tasks/${params.id}/comments`, { content });
    form.reset();
    await mutate();
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <AppNav />
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Task Details</h1>
          <Button
            onClick={() => {
              router.push('/my-created-tasks');
            }}
            type="button"
          >
            Back to My Created Tasks
          </Button>
        </div>

        {error ? <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error.message}</p> : null}

        <TaskDetailBody
          isLoading={isLoading}
          task={task}
          isVisible={isVisible}
          onAddComment={addComment}
        />
      </div>
    </main>
  );
}
