/**
 * File Description:
 * This file implements apps/web/src/components/task-card.tsx.
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

import { useEffect, useMemo, useState } from 'react';
import { TaskDto } from '@task-platform/types';
import { Card, Pill } from '@task-platform/ui';
import { useTaskStore } from '@/store/task.store';

/** Purpose: Execute TaskCard logic for this module. */
export function TaskCard({ task, canDrag }: Readonly<{ task: TaskDto; canDrag: boolean }>) {
  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState<string | null>(null);
  const { commentsByTaskId, fetchComments, addComment } = useTaskStore();
  const comments = useMemo(() => commentsByTaskId[task.id] ?? [], [commentsByTaskId, task.id]);

  useEffect(() => {
    fetchComments(task.id).catch(() => {
      // Optional future enhancement: toast notification.
    });
  }, [fetchComments, task.id]);

  let tone: 'neutral' | 'success' | 'warning' = 'neutral';
  if (task.priority === 'HIGH') tone = 'warning';
  else if (task.status === 'CLOSED') tone = 'success';
  else if (task.status === 'COMPLETED_PENDING_APPROVAL') tone = 'warning';

  return (
    <Card className={`mb-3 ${canDrag ? 'cursor-grab' : 'cursor-not-allowed opacity-80'}`}>
      <div className="mb-2 flex items-center justify-between">
        <h4 className="font-medium">{task.title}</h4>
        <Pill text={task.priority} tone={tone} />
      </div>
      <p className="mb-2 text-sm text-slate-600">{task.description}</p>
      <p className="text-xs text-slate-500">Assignee: {task.assignedUserName ?? task.assignedUserId}</p>
      <p className="text-xs text-slate-500">Requested by: {task.createdByName ?? task.createdById ?? 'Unknown'}</p>
      {canDrag ? null : <p className="mt-1 text-[11px] text-amber-700">Only assignee can move this task.</p>}

      <div className="mt-3 rounded-md border bg-slate-50 p-2">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">Comments history</p>
        <div className="max-h-28 space-y-1 overflow-y-auto pr-1">
          {comments.length === 0 ? (
            <p className="text-xs text-slate-500">No comments yet.</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="rounded border bg-white p-1.5">
                <p className="text-xs text-slate-700">{comment.content}</p>
                <p className="text-[11px] text-slate-500">
                  {comment.authorName} • {new Date(comment.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
        <form
          className="mt-2 space-y-1"
          onSubmit={async (event) => {
            event.preventDefault();
            const content = commentText.trim();
            if (!content) {
              return;
            }

            setCommentError(null);
            try {
              await addComment(task.id, content);
              setCommentText('');
            } catch (error) {
              setCommentError(error instanceof Error ? error.message : 'Failed to add comment');
            }
          }}
        >
          <textarea
            value={commentText}
            onChange={(event) => setCommentText(event.target.value)}
            rows={2}
            placeholder="Add a comment"
            className="w-full rounded border bg-white px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-brand-500"
          />
          {commentError ? <p className="text-[11px] text-red-600">{commentError}</p> : null}
          <button
            type="submit"
            className="rounded border bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            Add Comment
          </button>
        </form>
      </div>
    </Card>
  );
}
