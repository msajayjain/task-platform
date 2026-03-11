/**
 * File Description:
 * This file implements apps/web/src/components/dashboard-task-row.tsx.
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

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MyTaskUpdateDto, TaskDetailDto, TaskDto, TeamDto, UserDto } from '@task-platform/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { api } from '@/lib/api-client';

const statusLabels: Record<TaskDto['status'], string> = {
  TODO: 'Todo',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done (Legacy)',
  COMPLETED_PENDING_APPROVAL: 'Completed (Pending Approval)',
  CLOSED: 'Closed'
};

function resolveCommentRole(comment: TaskDetailDto['comments'][number], detail: TaskDetailDto) {
  if (comment.authorId === detail.createdById) return 'Creator';
  if (comment.authorId === detail.assignedUserId) return 'Assignee / Resolver';
  return 'Contributor';
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
  if (!text) return '-';
  const lines = text.split(/\r?\n/);
  const nonBulletLines = lines.filter((line) => !line.trim().startsWith('- '));
  return nonBulletLines.join('\n').replaceAll(/\n{3,}/g, '\n\n').trim() || '-';
}

function PreventionUserComments({ comments }: Readonly<{ comments: string | null }>) {
  if (!comments) return null;

  return (
    <div className="mt-3 border-t border-slate-200 pt-2">
      <div className="whitespace-pre-wrap rounded border border-slate-200 bg-slate-50 p-2 text-slate-700">
        <p className="font-semibold text-slate-700">User Comments:</p>
        <p className="mt-1">{comments}</p>
      </div>
    </div>
  );
}

function PendingApprovalReviewModal(props: Readonly<{
  task: TaskDto;
  detail: TaskDetailDto | null;
  isLoading: boolean;
  declineReasons: string[];
  declineReason: string;
  setDeclineReason: (value: string) => void;
  declineComment: string;
  setDeclineComment: (value: string) => void;
  isDeclineOpen: boolean;
  setIsDeclineOpen: (open: boolean) => void;
  onClose: () => void;
  onAccept: () => Promise<void>;
  onDecline: () => Promise<void>;
}>) {
  const {
    task,
    detail,
    isLoading,
    declineReasons,
    declineReason,
    setDeclineReason,
    declineComment,
    setDeclineComment,
    isDeclineOpen,
    setIsDeclineOpen,
    onClose,
    onAccept,
    onDecline
  } = props;

  const rootCauseItems = extractBulletItems(detail?.aiRootCauseAnalysis);
  const preventionSource = stripUserCommentsSection(detail?.resolutionNotes);
  const preventionItems = extractBulletItems(preventionSource);
  const preventionComments = extractUserCommentsSection(detail?.resolutionNotes);

  return (
    <dialog open className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" aria-modal="true">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-xl border bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{task.status === 'COMPLETED_PENDING_APPROVAL' ? 'Pending Approval Review' : 'Task Details (Read-only)'}</h3>
          <Button type="button" onClick={onClose}>Close</Button>
        </div>

        {isLoading || !detail ? (
          <div className="space-y-3">
            <div className="h-8 animate-pulse rounded bg-slate-200" />
            <div className="h-8 animate-pulse rounded bg-slate-200" />
            <div className="h-24 animate-pulse rounded bg-slate-200" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded border border-indigo-200 bg-indigo-50 p-3 text-xs text-indigo-900">
              <p className="font-semibold">Review Guidance</p>
              <p className="mt-1">Creator-provided task context is shown with core metadata. Assignee/resolver updates (category, root cause, permanent resolution, and comments) are read-only and intended for approval decision support.</p>
            </div>

            <section className="rounded-lg border p-4">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Creator-Provided Task Context</h4>
              <div className="mt-2 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                <div>
                  <p className="font-semibold text-slate-700">Title</p>
                  <p>{detail.title}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Status</p>
                  <p>{statusLabels[detail.status] ?? detail.status}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="font-semibold text-slate-700">Description</p>
                  <p>{detail.description || '-'}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Due Date</p>
                  <p>{detail.dueDate ? new Date(detail.dueDate).toLocaleString() : '-'}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Priority</p>
                  <p>{detail.priority}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Assigned Team</p>
                  <p>{detail.assignedTeamName ?? detail.teamName ?? '-'}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Assigned User</p>
                  <p>{detail.assignedUserName ?? detail.assignedUserId}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Created By</p>
                  <p>{detail.createdByName ?? detail.createdById ?? '-'}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Created Date</p>
                  <p>{new Date(detail.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Updated</p>
                  <p>{new Date(detail.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </section>

            <section className="rounded-lg border p-4">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Assignee / Resolver Inputs (Read-only)</h4>
              <div className="mt-2 grid grid-cols-1 gap-3 text-sm">
                <div>
                  <p className="font-semibold text-slate-700">Category</p>
                  <p>{detail.category ?? '-'}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">AI Root Cause Analysis</p>
                  <p className="whitespace-pre-wrap">{removeBulletsFromNarrative(detail.aiRootCauseAnalysis)}</p>
                  {rootCauseItems.length > 0 ? (
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
                      {rootCauseItems.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Prevention Plan</p>
                  <p className="whitespace-pre-wrap">{removeBulletsFromNarrative(preventionSource)}</p>
                  {preventionItems.length > 0 ? (
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
                      {preventionItems.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                  <PreventionUserComments comments={preventionComments} />
                </div>
              </div>
            </section>

            <section className="rounded-lg border p-4">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Comments History</h4>
              <div className="mt-2 max-h-72 space-y-2 overflow-y-auto rounded border bg-slate-50 p-3">
                {detail.comments.length === 0 ? (
                  <p className="text-sm text-slate-500">No comments yet.</p>
                ) : (
                  detail.comments.map((comment) => (
                    <article key={comment.id} className="rounded border bg-white p-3">
                      <p className="text-sm text-slate-800">{comment.content}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {comment.authorName} ({resolveCommentRole(comment, detail)}) • {new Date(comment.createdAt).toLocaleString()}
                      </p>
                    </article>
                  ))
                )}
              </div>
            </section>

            {task.status === 'COMPLETED_PENDING_APPROVAL' ? (
              <section className="rounded-lg border border-amber-300 bg-amber-50 p-4">
                <h4 className="text-sm font-semibold text-amber-900">Decision Actions</h4>
                <p className="mt-1 text-xs text-amber-800">After review, accept to close/archive workflow or decline with a reason.</p>

                {isDeclineOpen ? (
                  <div className="mt-3 space-y-2">
                    <Select value={declineReason} onChange={(event) => setDeclineReason(event.target.value)}>
                      <option value="">Select decline reason</option>
                      {declineReasons.map((reason) => (
                        <option key={reason} value={reason}>
                          {reason}
                        </option>
                      ))}
                    </Select>
                    <textarea
                      rows={3}
                      value={declineComment}
                      onChange={(event) => setDeclineComment(event.target.value)}
                      placeholder="Optional decline comment"
                      className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <div className="flex gap-2">
                      <Button type="button" onClick={() => void onDecline()}>
                        Submit Decline
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          setIsDeclineOpen(false);
                          setDeclineReason('');
                          setDeclineComment('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button type="button" onClick={() => void onAccept()}>
                      Accept & Close
                    </Button>
                    <Button type="button" onClick={() => setIsDeclineOpen(true)}>
                      Decline
                    </Button>
                  </div>
                )}
              </section>
            ) : null}
          </div>
        )}
      </div>
    </dialog>
  );
}

interface DashboardTaskRowProps {
  task: TaskDto;
  teams: TeamDto[];
  users: UserDto[];
  gridVisibleFields: string[];
  onSave: (taskId: string, payload: MyTaskUpdateDto) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
  onApprove: (taskId: string) => Promise<void>;
  onDecline: (taskId: string, reason: string, comment?: string) => Promise<void>;
  declineReasons: string[];
  onError: (message: string) => void;
}

/** Purpose: Execute DashboardTaskRow logic for this module. */
export function DashboardTaskRow({ task, teams, users, gridVisibleFields, onSave, onDelete, onApprove, onDecline, declineReasons, onError }: Readonly<DashboardTaskRowProps>) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeclineOpen, setIsDeclineOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [declineComment, setDeclineComment] = useState('');
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [detail, setDetail] = useState<TaskDetailDto | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [priority, setPriority] = useState(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '');
  const [teamId, setTeamId] = useState(task.teamId ?? '');
  const [assignedUserId, setAssignedUserId] = useState(task.assignedUserId);

  const isPendingApproval = task.status === 'COMPLETED_PENDING_APPROVAL';
  const isClosed = task.status === 'CLOSED';
  const teamUsers = users.filter((user) => user.teamId === teamId);

  async function handleSave() {
    if (!title.trim()) {
      onError('Title is required');
      return;
    }

    if (!description.trim()) {
      onError('Description is required');
      return;
    }

    if (!priority) {
      onError('Priority is required');
      return;
    }

    if (!teamId) {
      onError('Team selection is required');
      return;
    }

    if (!assignedUserId) {
      onError('Assignee selection is required');
      return;
    }

    try {
      await onSave(task.id, {
        title: title.trim(),
        description: description.trim(),
        priority,
        dueDate: dueDate || null,
        teamId,
        assignedUserId
      });
      setIsEditing(false);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to update task');
    }
  }

  async function handleDelete() {
    try {
      await onDelete(task.id);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to delete task');
    }
  }

  function handleCancel() {
    setTitle(task.title);
    setDescription(task.description);
    setPriority(task.priority);
    setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '');
    setTeamId(task.teamId ?? '');
    setAssignedUserId(task.assignedUserId);
    setIsEditing(false);
  }

  async function handleApprove() {
    try {
      await onApprove(task.id);
      setIsReviewOpen(false);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to approve task');
    }
  }

  async function handleDecline() {
    if (!declineReason) {
      onError('Please select a decline reason');
      return;
    }

    try {
      await onDecline(task.id, declineReason, declineComment.trim() || undefined);
      setIsDeclineOpen(false);
      setDeclineReason('');
      setDeclineComment('');
      setIsReviewOpen(false);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to decline task completion');
    }
  }

  async function openReviewModal() {
    setIsReviewOpen(true);
    setIsLoadingDetail(true);
    try {
      const response = await api.get<{ success: true; data: TaskDetailDto }>(`/tasks/${task.id}`);
      setDetail(response.data.data);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to load task details');
      setIsReviewOpen(false);
    } finally {
      setIsLoadingDetail(false);
    }
  }

  function renderActions() {
    if (isEditing) {
      return (
        <>
          <Button onClick={() => void handleSave()} type="button">
            Save
          </Button>
          <Button onClick={handleCancel} type="button">
            Cancel
          </Button>
        </>
      );
    }

    if (isPendingApproval) {
      return (
        <Button
          onClick={() => {
            void openReviewModal();
          }}
          type="button"
        >
          Pending Approval – Accept / Decline
        </Button>
      );
    }

    if (isClosed) {
      return (
        <Button
          onClick={() => {
            void openReviewModal();
          }}
          type="button"
        >
          View
        </Button>
      );
    }

    return (
      <>
        <Button
          onClick={() => {
            router.push(`/tasks/${task.id}`);
          }}
          type="button"
        >
          View
        </Button>
        <Button onClick={() => setIsEditing(true)} type="button">
          Edit
        </Button>
        <Button onClick={() => void handleDelete()} type="button">
          Delete
        </Button>
      </>
    );
  }

  function renderCell(field: string) {
    switch (field) {
      case 'title':
        return isEditing ? <Input value={title} onChange={(event) => setTitle(event.target.value)} /> : task.title;
      case 'description':
        return isEditing ? (
          <textarea
            className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        ) : (
          task.description
        );
      case 'status':
        return statusLabels[task.status] ?? task.status;
      case 'priority':
        return isEditing ? (
          <Select value={priority} onChange={(event) => setPriority(event.target.value as TaskDto['priority'])}>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </Select>
        ) : (
          task.priority
        );
      case 'dueDate':
        if (isEditing) {
          return <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />;
        }

        return task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-';
      case 'assignedTeam':
        if (isEditing) {
          return (
            <div className="space-y-2">
              <Select
                value={teamId}
                onChange={(event) => {
                  const nextTeamId = event.target.value;
                  setTeamId(nextTeamId);
                  const firstMatch = users.find((user) => user.teamId === nextTeamId);
                  if (firstMatch) {
                    setAssignedUserId(firstMatch.id);
                  } else {
                    setAssignedUserId('');
                  }
                }}
              >
                <option value="">Select team</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </Select>
              <Select value={assignedUserId} onChange={(event) => setAssignedUserId(event.target.value)}>
                <option value="">Select assignee</option>
                {teamUsers.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name} ({option.email})
                  </option>
                ))}
              </Select>
            </div>
          );
        }

        return task.assignedTeamName ?? task.teamName ?? '-';
      case 'createdDate':
        return new Date(task.createdAt).toLocaleString();
      case 'actions':
        return <div className="flex flex-wrap gap-2">{renderActions()}</div>;
      default:
        return '-';
    }
  }

  return (
    <>
      <tr>
        {gridVisibleFields.map((field) => (
          <td key={`${task.id}-${field}`} className="px-4 py-3 align-top">
            {renderCell(field)}
          </td>
        ))}
      </tr>

      {isReviewOpen ? (
        <PendingApprovalReviewModal
          task={task}
          detail={detail}
          isLoading={isLoadingDetail}
          declineReasons={declineReasons}
          declineReason={declineReason}
          setDeclineReason={setDeclineReason}
          declineComment={declineComment}
          setDeclineComment={setDeclineComment}
          isDeclineOpen={isDeclineOpen}
          setIsDeclineOpen={setIsDeclineOpen}
          onClose={() => {
            setIsReviewOpen(false);
            setIsDeclineOpen(false);
            setDeclineReason('');
            setDeclineComment('');
          }}
          onAccept={handleApprove}
          onDecline={handleDecline}
        />
      ) : null}
    </>
  );
}
