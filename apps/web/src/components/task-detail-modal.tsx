/**
 * File Description:
 * This file implements apps/web/src/components/task-detail-modal.tsx.
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

import useSWR from 'swr';
import { useEffect, useState } from 'react';
import { TaskDetailDto } from '@task-platform/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast-provider';
import { useUiConfig } from '@/hooks/use-ui-config';
import { api } from '@/lib/api-client';
import { swrFetcher } from '@/lib/swr-fetcher';

interface TaskDetailModalProps {
  taskId: string | null;
  open: boolean;
  onClose: () => void;
}

type AIProvider = 'local-llm' | 'huggingface' | 'gemini' | 'auto';
type RootCausePayload = { rootCauseAnalysis: string; causes: string[]; rootCauses?: string[]; confidence: number; aiProvider?: AIProvider };
type ResolutionPayload = { resolution: string; suggestions: string[]; permanentResolution?: string[]; confidence: number; aiProvider?: AIProvider };
type PersistCallbacks = {
  onSaveCategory: () => Promise<void>;
  onAnalyze: () => Promise<void>;
  onSaveResolution: () => Promise<void>;
};

function statusLabel(status: TaskDetailDto['status']) {
  if (status === 'IN_PROGRESS') return 'In Progress';
  if (status === 'COMPLETED_PENDING_APPROVAL') return 'Completed';
  if (status === 'CLOSED') return 'Closed';
  if (status === 'DONE') return 'Done (Legacy)';
  return 'Todo';
}

async function runAIAnalysis(task: TaskDetailDto, unsavedComments: string) {
  const inputText = `${task.description || ''}\nUser Comments: ${unsavedComments}`.trim();
  const comments = [
    ...task.comments.map((comment) => comment.content),
    unsavedComments.trim()
  ].filter(Boolean);

  const rootCauseResponse = await api.post('/ai/root-cause', {
    taskId: task.id,
    title: task.title,
    description: inputText,
    category: task.category,
    comments
  });

  const rootPayload = rootCauseResponse.data.data as RootCausePayload;

  const resolutionResponse = await api.post('/ai/resolution', {
    taskId: task.id,
    title: task.title,
    description: inputText,
    category: task.category,
    rootCauseAnalysis: rootPayload.rootCauseAnalysis
  });

  const resolutionPayload = resolutionResponse.data.data as ResolutionPayload;

  return {
    rootPayload,
    resolutionPayload
  };
}

function buildResolutionNotes(resolutionText: string | null, resolutionSuggestions: string[], userComments: string) {
  const aiResolution = resolutionText?.trim() ?? '';
  const suggestions = resolutionSuggestions.filter(Boolean);
  const suggestionBlock = suggestions.length > 0 ? `Suggested actions:\n- ${suggestions.join('\n- ')}` : '';
  const comments = userComments.trim();

  const aiBlock = [aiResolution, suggestionBlock].filter(Boolean).join('\n\n').trim();

  if (!aiBlock && !comments) return '';
  if (!comments) return aiBlock;
  if (!aiBlock) return `User Comments:\n${comments}`;

  return `${aiBlock}\n\nUser Comments:\n${comments}`;
}

function providerLabel(provider: AIProvider | null): string | null {
  if (!provider) return null;
  if (provider === 'local-llm') return 'Local LLM';
  if (provider === 'huggingface') return 'Hugging Face';
  if (provider === 'gemini') return 'Gemini';
  return 'Auto';
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

function removeBulletsFromNarrative(text: string | null | undefined): string | null {
  if (!text) return null;
  const lines = text.split(/\r?\n/);
  const nonBulletLines = lines.filter((line) => !line.trim().startsWith('- '));
  const cleaned = nonBulletLines.join('\n').replaceAll(/\n{3,}/g, '\n\n').trim();
  return cleaned || null;
}

function TaskMetaSection(props: Readonly<{
  task: TaskDetailDto;
  isVisible: (fieldName: string) => boolean;
  categoryDraft: string;
  setCategoryDraft: (value: string) => void;
  isSavingCategory: boolean;
  onSaveCategory: () => Promise<void>;
}>) {
  const { task, isVisible, categoryDraft, setCategoryDraft, isSavingCategory, onSaveCategory } = props;
  return (
    <section className="rounded-lg border p-4">
      {isVisible('title') ? <h3 className="text-lg font-semibold text-slate-900">{task.title}</h3> : null}
      {isVisible('description') ? <p className="mt-1 text-sm text-slate-700">{task.description || 'No description provided.'}</p> : null}
      {task.aiSummary ? (
        <div className="mt-3 rounded border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-900">
          <p className="font-semibold">AI Summary</p>
          <p className="mt-1">{task.aiSummary}</p>
        </div>
      ) : null}
      <dl className="mt-3 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
        {isVisible('status') ? <div><dt className="font-semibold text-slate-600">Status</dt><dd>{statusLabel(task.status)}</dd></div> : null}
        {isVisible('priority') ? <div><dt className="font-semibold text-slate-600">Priority</dt><dd>{task.priority}</dd></div> : null}
        <div>
          <dt className="font-semibold text-slate-600">Category</dt>
          <dd>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <select className="rounded border px-2 py-1" value={categoryDraft} onChange={(event) => setCategoryDraft(event.target.value)}>
                {['Bug', 'Feature Request', 'Performance Issue', 'Security Issue', 'Infrastructure', 'UI Issue', 'General'].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <Button type="button" disabled={isSavingCategory || !categoryDraft} onClick={() => void onSaveCategory()}>
                {isSavingCategory ? 'Saving...' : 'Save Category'}
              </Button>
            </div>
          </dd>
        </div>
        {isVisible('dueDate') ? <div><dt className="font-semibold text-slate-600">Due Date</dt><dd>{task.dueDate ? new Date(task.dueDate).toLocaleString() : '-'}</dd></div> : null}
        {isVisible('createdBy') ? <div><dt className="font-semibold text-slate-600">Created By</dt><dd>{task.createdByName ?? task.createdById ?? 'Unknown'}</dd></div> : null}
        {isVisible('assignedUser') ? <div><dt className="font-semibold text-slate-600">Assigned User</dt><dd>{task.assignedUserName ?? task.assignedUserId}</dd></div> : null}
        {isVisible('assignedTeam') ? <div><dt className="font-semibold text-slate-600">Assigned Team</dt><dd>{task.assignedTeamName ?? task.teamName ?? '-'}</dd></div> : null}
        {isVisible('createdDate') ? <div><dt className="font-semibold text-slate-600">Created Date</dt><dd>{new Date(task.createdAt).toLocaleString()}</dd></div> : null}
        {isVisible('updatedDate') ? <div><dt className="font-semibold text-slate-600">Last Updated</dt><dd>{new Date(task.updatedAt).toLocaleString()}</dd></div> : null}
      </dl>
    </section>
  );
}

function AIDiagnosticsSection(props: Readonly<{
  isAnalyzing: boolean;
  isSavingResolution: boolean;
  userComments: string;
  setUserComments: (value: string) => void;
  rootCauseAnalysis: string | null;
  rootCauseConfidence: number | null;
  rootCauseItems: string[];
  rootCauseProvider: AIProvider | null;
  resolutionText: string | null;
  resolutionConfidence: number | null;
  resolutionSuggestions: string[];
  resolutionProvider: AIProvider | null;
  aiSuccess: string | null;
  aiError: string | null;
  callbacks: Pick<PersistCallbacks, 'onAnalyze' | 'onSaveResolution'>;
}>) {
  const {
    isAnalyzing,
    isSavingResolution,
    userComments,
    setUserComments,
    rootCauseAnalysis,
    rootCauseConfidence,
    rootCauseItems,
    rootCauseProvider,
    resolutionText,
    resolutionConfidence,
    resolutionSuggestions,
    resolutionProvider,
    aiSuccess,
    aiError,
    callbacks
  } = props;

  const rootCauseList = rootCauseItems.filter(Boolean);
  const resolutionSource = stripUserCommentsSection(resolutionText);
  const resolutionList = (resolutionSuggestions.length > 0 ? resolutionSuggestions : extractBulletItems(resolutionSource)).filter(Boolean);
  const resolutionNarrative = removeBulletsFromNarrative(resolutionSource);
  const resolutionUserComments = extractUserCommentsSection(resolutionText);

  return (
    <div className="mt-4 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-700" htmlFor="ai-user-comments">
          Comments for AI Analysis
        </label>
        <textarea
          id="ai-user-comments"
          rows={3}
          value={userComments}
          onChange={(event) => setUserComments(event.target.value)}
          className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
          placeholder="Add context, observations, logs, or suspected causes before AI analysis"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
          AI Root Cause Analysis
          {rootCauseConfidence === null ? null : <span className="ml-2 rounded bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-700">{Math.round(rootCauseConfidence * 100)}%</span>}
          {providerLabel(rootCauseProvider) ? <span className="ml-2 rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-900">{providerLabel(rootCauseProvider)}</span> : null}
        </h4>
        <Button type="button" disabled={isAnalyzing} onClick={() => void callbacks.onAnalyze()}>
          {isAnalyzing ? 'Analyzing...' : '🤖 Analyze Root Cause with AI'}
        </Button>
      </div>

      {rootCauseAnalysis ? <p className="whitespace-pre-line text-sm text-slate-800">{removeBulletsFromNarrative(rootCauseAnalysis)}</p> : <p className="text-sm text-slate-500">No AI analysis generated yet.</p>}
      {rootCauseList.length > 0 ? (
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
          {rootCauseList.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}

      <div className="rounded border border-emerald-200 bg-emerald-50 p-3">
        <h4 className="text-sm font-semibold text-emerald-900">
          💡 AI Suggested Permanent Resolution
          {resolutionConfidence === null ? null : <span className="ml-2 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-900">{Math.round(resolutionConfidence * 100)}%</span>}
          {providerLabel(resolutionProvider) ? <span className="ml-2 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-900">{providerLabel(resolutionProvider)}</span> : null}
        </h4>
        {resolutionText ? <p className="mt-2 whitespace-pre-line text-sm text-emerald-900">{resolutionNarrative}</p> : <p className="mt-2 text-sm text-emerald-700">Run root cause analysis to generate permanent resolution suggestions.</p>}
        {resolutionList.length > 0 ? (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-emerald-900">
            {resolutionList.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
        {resolutionUserComments ? (
          <div className="mt-3 border-t border-emerald-200 pt-2">
            <div className="rounded border border-emerald-200 bg-white/70 p-2 text-sm text-emerald-900">
            <p className="font-semibold">User Comments:</p>
            <p className="mt-1 whitespace-pre-wrap">{resolutionUserComments}</p>
            </div>
          </div>
        ) : null}

        <div className="mt-3">
          <Button type="button" disabled={!(resolutionText?.trim() || userComments.trim()) || isSavingResolution || isAnalyzing} onClick={() => void callbacks.onSaveResolution()}>
            {isSavingResolution ? 'Saving...' : 'Save Resolution Notes'}
          </Button>
        </div>
      </div>
      {aiSuccess ? <p className="text-xs text-emerald-700">{aiSuccess}</p> : null}
      {aiError ? <p className="text-xs text-red-700">{aiError}</p> : null}
    </div>
  );
}

function DeclineHistorySection({ task }: Readonly<{ task: TaskDetailDto }>) {
  return (
    <section className="rounded-lg border p-4">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Decline History</h4>
      <div className="mt-2 space-y-2">
        {task.declineHistory.length === 0 ? (
          <p className="text-sm text-slate-500">No declines recorded.</p>
        ) : (
          task.declineHistory.map((entry) => (
            <article key={entry.id} className="rounded border bg-slate-50 p-3 text-sm">
              <p><span className="font-semibold">Reason:</span> {entry.reason}</p>
              <p><span className="font-semibold">Comment:</span> {entry.comment ?? '-'}</p>
              <p><span className="font-semibold">Declined By:</span> {entry.declinedByName}</p>
              <p><span className="font-semibold">Declined Date:</span> {new Date(entry.createdAt).toLocaleString()}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

/** Purpose: Execute TaskDetailModal logic for this module. */
export function TaskDetailModal({ taskId, open, onClose }: Readonly<TaskDetailModalProps>) {
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuccess, setAiSuccess] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSavingResolution, setIsSavingResolution] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [rootCauseAnalysis, setRootCauseAnalysis] = useState<string | null>(null);
  const [rootCauseConfidence, setRootCauseConfidence] = useState<number | null>(null);
  const [rootCauseItems, setRootCauseItems] = useState<string[]>([]);
  const [rootCauseProvider, setRootCauseProvider] = useState<AIProvider | null>(null);
  const [resolutionText, setResolutionText] = useState<string | null>(null);
  const [userComments, setUserComments] = useState('');
  const [resolutionConfidence, setResolutionConfidence] = useState<number | null>(null);
  const [resolutionSuggestions, setResolutionSuggestions] = useState<string[]>([]);
  const [resolutionProvider, setResolutionProvider] = useState<AIProvider | null>(null);
  const [categoryDraft, setCategoryDraft] = useState<string>('');
  const toast = useToast();
  const { isVisible } = useUiConfig('task-details');
  const shouldFetch = open && taskId;
  const { data: task, isLoading, error, mutate } = useSWR<TaskDetailDto>(shouldFetch ? `/tasks/${taskId}` : null, swrFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000
  });

  useEffect(() => {
    if (!open) return;
    setAiError(null);
    setAiSuccess(null);
    setRootCauseAnalysis(null);
    setRootCauseConfidence(null);
    setRootCauseItems([]);
    setRootCauseProvider(null);
    setResolutionText(null);
    setResolutionConfidence(null);
    setResolutionSuggestions([]);
    setResolutionProvider(null);
    setUserComments('');
  }, [open, taskId]);

  useEffect(() => {
    if (!task) return;
    setRootCauseAnalysis(task.aiRootCauseAnalysis ?? null);
    setRootCauseItems(extractBulletItems(task.aiRootCauseAnalysis));
    setResolutionText((current) => current ?? task.resolutionNotes ?? null);
    setResolutionSuggestions((current) => (current.length > 0 ? current : extractBulletItems(task.resolutionNotes)));
    setCategoryDraft(task.category ?? 'General');
  }, [task]);

  const callbacks: PersistCallbacks = {
    onSaveCategory: async () => {
      if (!task) return;
      setAiError(null);
      setAiSuccess(null);
      setIsSavingCategory(true);
      try {
        await api.put(`/tasks/${task.id}`, { category: categoryDraft });
        await mutate();
        setAiSuccess('Category updated successfully');
        toast.success('Category updated successfully');
      } catch (requestError) {
        const message = requestError instanceof Error ? requestError.message : 'Failed to save category';
        setAiError(message);
        toast.error(message);
      } finally {
        setIsSavingCategory(false);
      }
    },
    onAnalyze: async () => {
      if (!task) return;
      setAiError(null);
      setAiSuccess(null);
      setIsAnalyzing(true);
      try {
        const { rootPayload, resolutionPayload } = await runAIAnalysis(task, userComments);
        setRootCauseAnalysis(rootPayload.rootCauseAnalysis);
        setRootCauseItems(rootPayload.rootCauses ?? rootPayload.causes ?? []);
        setRootCauseConfidence(rootPayload.confidence ?? null);
        setRootCauseProvider(rootPayload.aiProvider ?? null);
        setResolutionText(resolutionPayload.resolution);
        setResolutionSuggestions(resolutionPayload.permanentResolution ?? resolutionPayload.suggestions ?? []);
        setResolutionConfidence(resolutionPayload.confidence ?? null);
        setResolutionProvider(resolutionPayload.aiProvider ?? null);
        setAiSuccess('AI analysis generated successfully');
        toast.success('AI analysis generated successfully');
      } catch (requestError) {
        const message = requestError instanceof Error ? requestError.message : 'Failed AI analysis';
        setAiError(message);
        toast.error(message);
      } finally {
        setIsAnalyzing(false);
      }
    },
    onSaveResolution: async () => {
      if (!task) return;
      const nextResolutionNotes = buildResolutionNotes(resolutionText, resolutionSuggestions, userComments);
      if (!nextResolutionNotes) return;

      setAiError(null);
      setAiSuccess(null);
      setIsSavingResolution(true);
      try {
        await api.put(`/tasks/${task.id}`, { resolutionNotes: nextResolutionNotes });
        setResolutionText(nextResolutionNotes);
        await mutate();
        setAiSuccess('Resolution notes saved successfully');
        toast.success('Resolution notes saved successfully');
      } catch (requestError) {
        const message = requestError instanceof Error ? requestError.message : 'Failed to save resolution notes';
        setAiError(message);
        toast.error(message);
      } finally {
        setIsSavingResolution(false);
      }
    }
  };

  if (!open) return null;

  return (
    <dialog open className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl border bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Task Details</h2>
          <Button onClick={onClose} type="button">
            Close
          </Button>
        </div>

        {error ? <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error.message}</p> : null}

        {isLoading || !task ? (
          <div className="space-y-3">
            <div className="h-8 animate-pulse rounded bg-slate-200" />
            <div className="h-8 animate-pulse rounded bg-slate-200" />
            <div className="h-24 animate-pulse rounded bg-slate-200" />
          </div>
        ) : (
          <div className="space-y-4">
            <TaskMetaSection
              task={task}
              isVisible={isVisible}
              categoryDraft={categoryDraft}
              setCategoryDraft={setCategoryDraft}
              isSavingCategory={isSavingCategory}
              onSaveCategory={callbacks.onSaveCategory}
            />

            <AIDiagnosticsSection
              isAnalyzing={isAnalyzing}
              isSavingResolution={isSavingResolution}
              userComments={userComments}
              setUserComments={setUserComments}
              rootCauseAnalysis={rootCauseAnalysis}
              rootCauseConfidence={rootCauseConfidence}
              rootCauseItems={rootCauseItems}
              rootCauseProvider={rootCauseProvider}
              resolutionText={resolutionText}
              resolutionConfidence={resolutionConfidence}
              resolutionSuggestions={resolutionSuggestions}
              resolutionProvider={resolutionProvider}
              aiSuccess={aiSuccess}
              aiError={aiError}
              callbacks={{ onAnalyze: callbacks.onAnalyze, onSaveResolution: callbacks.onSaveResolution }}
            />

            {isVisible('declineHistory') ? <DeclineHistorySection task={task} /> : null}
          </div>
        )}
      </div>
    </dialog>
  );
}
