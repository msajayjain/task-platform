/**
 * File Description:
 * This file implements apps/web/src/components/create-task-form.tsx.
 *
 * Purpose:
 * Render reusable UI building blocks and interaction views.
 *
 * Key Responsibilities:
 * - Render UI states.
 * - Handle user interactions.
 * - Compose reusable presentation blocks.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { DuplicateIssueDto, TaskDetailDto, TeamDto, UserDto } from '@task-platform/types';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RequiredLabel } from '@/components/ui/required-label';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast-provider';
import { useUiConfig } from '@/hooks/use-ui-config';

const schema = z.object({
  title: z.string().min(2),
  description: z.string().min(1, 'Description is required'),
  aiSummary: z.string().max(500).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  dueDate: z.string().optional(),
  teamId: z.string().min(1, 'Please choose a team'),
  assignedUserId: z.string().min(1, 'Please choose an assignee'),
  comment: z.string().max(2000).optional()
});

type FormInput = z.infer<typeof schema>;

type SuggestPriorityResult = { priority: FormInput['priority'] | 'UNKNOWN'; confidence: number; warning?: string };

function matchTeamByName(suggestedTeam: string, teams: { id: string; name: string }[]): { id: string; name: string } | null {
  if (!suggestedTeam || teams.length === 0) return null;
  const needle = suggestedTeam.toLowerCase().trim();
  // 1. Exact match
  const exact = teams.find((t) => t.name.toLowerCase() === needle);
  if (exact) return exact;
  // 2. One contains the other
  const contains = teams.find(
    (t) => t.name.toLowerCase().includes(needle) || needle.includes(t.name.toLowerCase())
  );
  if (contains) return contains;
  // 3. Any word in needle matches any word in team name
  const needleWords = needle.split(/\s+/);
  const wordMatch = teams.find((t) =>
    needleWords.some((w) => w.length >= 2 && t.name.toLowerCase().includes(w))
  );
  return wordMatch ?? null;
}

function buildDuplicateProbeFromPrompt(prompt: string): { title: string; description: string } | null {
  const compact = prompt.replaceAll(/\s+/g, ' ').trim();
  if (compact.length < 10) return null;

  const firstSentence = compact.split(/[.!?]/).find((chunk) => chunk.trim().length >= 2)?.trim() ?? compact;
  const title = firstSentence.slice(0, 160).trim();
  const description = compact.slice(0, 1000).trim();

  if (title.length < 2 || description.length < 2) {
    return null;
  }

  return { title, description };
}

async function handlePopulateFromAI(params: {
  aiPrompt: string;
  onParseNaturalTask: (text: string) => Promise<{ title: string; description: string; priority: FormInput['priority']; dueDate: string | null; suggestedTeam?: string | null; confidence: number }>;
  setValue: (name: keyof FormInput, value: string) => void;
  setParseConfidence: (confidence: number) => void;
  teams: { id: string; name: string }[];
}) {
  const { aiPrompt, onParseNaturalTask, setValue, setParseConfidence, teams } = params;
  const parsed = await onParseNaturalTask(aiPrompt.trim());
  setValue('title', parsed.title);
  setValue('description', parsed.description);
  setValue('priority', parsed.priority);
  setParseConfidence(parsed.confidence);
  if (parsed.dueDate) {
    setValue('dueDate', parsed.dueDate);
  }
  if (parsed.suggestedTeam) {
    const matched = matchTeamByName(parsed.suggestedTeam, teams);
    if (matched) {
      setValue('teamId', matched.id);
    }
  }

  return parsed;
}

async function handleGenerateSummary(params: {
  title: string;
  description: string;
  onSuggestSummary: (payload: { title: string; description: string }) => Promise<{ summary: string; confidence: number }>;
  setValue: (name: keyof FormInput, value: string) => void;
  setSummaryConfidence: (confidence: number) => void;
}) {
  const { title, description, onSuggestSummary, setValue, setSummaryConfidence } = params;
  const summary = await onSuggestSummary({ title, description });
  setValue('aiSummary', summary.summary);
  setSummaryConfidence(summary.confidence);
}

async function handleSuggestPriority(params: {
  title: string;
  description: string;
  onSuggestPriority: (payload: { title: string; description: string }) => Promise<SuggestPriorityResult>;
  setValue: (name: keyof FormInput, value: string) => void;
  setPriorityConfidence: (confidence: number) => void;
  setPriorityWarning: (warning: string | null) => void;
}) {
  const { title, description, onSuggestPriority, setValue, setPriorityConfidence, setPriorityWarning } = params;
  const suggestion = await onSuggestPriority({ title, description });
  if (suggestion.priority !== 'UNKNOWN') {
    setValue('priority', suggestion.priority);
  }
  setPriorityConfidence(suggestion.confidence);
  setPriorityWarning(suggestion.warning ?? null);
}

function AIPromptSection(props: Readonly<{
  aiPrompt: string;
  setAiPrompt: (value: string) => void;
  disabled: boolean;
  isParsingAI: boolean;
  isCheckingDuplicates: boolean;
  duplicateMatches: DuplicateIssueDto[];
  parseConfidence: number | null;
  onPopulate: (allowDuplicateOverride?: boolean) => Promise<void>;
}>) {
  const { aiPrompt, setAiPrompt, disabled, isParsingAI, isCheckingDuplicates, duplicateMatches, parseConfidence, onPopulate } = props;

  return (
    <div className="rounded-lg border border-brand-200 bg-brand-50 p-3">
      <label className="mb-1 block text-xs font-semibold text-brand-700" htmlFor="ai-task-input">
        🧠 Create Task Using AI
      </label>
      <div className="flex flex-col gap-2 md:flex-row">
        <textarea
          id="ai-task-input"
          rows={4}
          placeholder="Create a high priority task for Ajay to fix login bug by tomorrow."
          value={aiPrompt}
          onChange={(event) => setAiPrompt(event.target.value)}
          className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
        />
        <Button type="button" disabled={disabled || isParsingAI} onClick={() => void onPopulate()}>
          {isParsingAI ? 'Generating...' : '🤖 Generate Task from AI'}
        </Button>
      </div>
      <div className="mt-2 min-h-[1rem]">
        {isCheckingDuplicates ? <p className="text-xs text-slate-600">Searching for similar tasks...</p> : null}
      </div>
      <PotentialMatchesNotice matches={duplicateMatches} />
      {parseConfidence === null ? null : <p className="mt-2 text-xs text-brand-700">AI parse confidence: {Math.round(parseConfidence * 100)}%</p>}
    </div>
  );
}

function PotentialMatchesNotice(props: Readonly<{ matches: DuplicateIssueDto[] }>) {
  const { matches } = props;
  const [isTableOpen, setIsTableOpen] = useState(false);
  if (matches.length === 0) return null;

  return (
    <div className="mt-2 rounded border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">
      <p className="font-semibold">Potential duplicate tasks found ({matches.length})</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button type="button" onClick={() => setIsTableOpen(true)}>View Existing Issues</Button>
      </div>

      {isTableOpen ? (
        <dialog open className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" aria-modal="true">
          <div className="w-full max-w-2xl rounded-lg border bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-900">Potential Duplicate Issues ({matches.length})</h4>
              <Button type="button" onClick={() => setIsTableOpen(false)}>Close</Button>
            </div>

            <div className="max-h-72 overflow-auto rounded border">
              <table className="min-w-full text-left text-xs text-slate-700">
                <thead className="sticky top-0 bg-slate-100 text-slate-800">
                  <tr>
                    <th className="px-3 py-2">Task Number</th>
                    <th className="px-3 py-2">Title</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Created By</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map((issue) => (
                    <tr key={issue.id} className="border-t">
                      <td className="px-3 py-2">
                        <a className="underline" href={`/tasks/${issue.id}`} target="_blank" rel="noreferrer">
                          #{issue.id.slice(0, 8)}
                        </a>
                      </td>
                      <td className="px-3 py-2">{issue.title}</td>
                      <td className="px-3 py-2">{issue.status}</td>
                      <td className="px-3 py-2">{issue.createdByName ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </dialog>
      ) : null}
    </div>
  );
}

function PrioritySection(props: Readonly<{
  register: ReturnType<typeof useForm<FormInput>>['register'];
  isSuggestingPriorityAI: boolean;
  priorityConfidence: number | null;
  priorityWarning: string | null;
  onSuggest: () => Promise<void>;
}>) {
  const { register, isSuggestingPriorityAI, priorityConfidence, priorityWarning, onSuggest } = props;
  return (
    <div className="space-y-2">
      <RequiredLabel htmlFor="task-priority">Priority</RequiredLabel>
      <div className="flex flex-wrap items-center gap-2">
        <Select id="task-priority" {...register('priority')}>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </Select>
        <Button type="button" disabled={isSuggestingPriorityAI} onClick={() => void onSuggest()}>
          {isSuggestingPriorityAI ? 'Generating...' : '🤖 Generate Priority'}
        </Button>
      </div>
      {priorityConfidence === null ? null : <p className="text-xs text-slate-600">AI confidence: {Math.round(priorityConfidence * 100)}%</p>}
      {priorityWarning ? <p className="text-xs text-amber-700">⚠ {priorityWarning}</p> : null}
    </div>
  );
}

function DuplicateWarningSection(props: Readonly<{
  duplicateIssues: DuplicateIssueDto[];
  selectedIssue: TaskDetailDto | null;
  loadingIssueId: string | null;
  onViewIssue: (issueId: string) => Promise<void>;
  onContinue: () => Promise<void>;
  onCancel: () => void;
}>) {
  const { duplicateIssues, selectedIssue, loadingIssueId, onViewIssue, onContinue, onCancel } = props;
  if (duplicateIssues.length === 0) return null;

  return (
    <dialog open className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border bg-white p-5 shadow-xl">
        <h4 className="text-base font-semibold text-slate-900">⚠ Possible Duplicate Issues Found</h4>
        <p className="mt-1 text-sm text-slate-600">Review likely duplicates before creating a new issue.</p>

        <div className="mt-3 space-y-2 rounded border bg-slate-50 p-3">
          {duplicateIssues.map((issue) => (
            <div key={issue.id} className="rounded border bg-white p-3">
              <p className="text-xs text-slate-600">
                Task Number:{' '}
                <a className="underline" href={`/tasks/${issue.id}`} target="_blank" rel="noreferrer">
                  #{issue.id.slice(0, 8)}
                </a>
              </p>
              <p className="text-sm font-semibold text-slate-900">
                {issue.title} <span className="text-xs text-slate-500">({Math.round(issue.similarity * 100)}% match)</span>
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Status: {issue.status} · Priority: {issue.priority}
              </p>
              {issue.category ? <p className="text-xs text-slate-600">Category: {issue.category}</p> : null}
              <Button className="mt-2" type="button" disabled={loadingIssueId === issue.id} onClick={() => void onViewIssue(issue.id)}>
                {loadingIssueId === issue.id ? 'Loading details...' : 'View Existing Issue Details'}
              </Button>
            </div>
          ))}
        </div>

        {selectedIssue ? (
          <div className="mt-3 rounded border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-900">
            <p className="font-semibold">Selected Existing Issue</p>
            <p className="mt-1">
              <span className="font-semibold">Task Number:</span>{' '}
              <a className="underline" href={`/tasks/${selectedIssue.id}`} target="_blank" rel="noreferrer">
                #{selectedIssue.id.slice(0, 8)}
              </a>
            </p>
            <p className="mt-1"><span className="font-semibold">Title:</span> {selectedIssue.title}</p>
            <p className="mt-1"><span className="font-semibold">Description:</span> {selectedIssue.description || '-'}</p>
            <p className="mt-1"><span className="font-semibold">Status:</span> {selectedIssue.status} · <span className="font-semibold">Priority:</span> {selectedIssue.priority}</p>
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button type="button" onClick={() => void onContinue()}>
            Continue Creating New Issue
          </Button>
          <Button type="button" onClick={onCancel}>
            Cancel Issue Creation
          </Button>
        </div>
      </div>
    </dialog>
  );
}

function TitleSection(props: Readonly<{
  isVisible: boolean;
  register: ReturnType<typeof useForm<FormInput>>['register'];
  error?: string;
}>) {
  const { isVisible, register, error } = props;
  if (!isVisible) return null;
  return (
    <>
      <RequiredLabel htmlFor="task-title">Title</RequiredLabel>
      <Input id="task-title" placeholder="Title" {...register('title')} />
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </>
  );
}

function DescriptionSection(props: Readonly<{
  isVisible: boolean;
  register: ReturnType<typeof useForm<FormInput>>['register'];
  isSummarizingAI: boolean;
  onGenerateSummary: () => Promise<void>;
  error?: string;
}>) {
  const { isVisible, register, isSummarizingAI, onGenerateSummary, error } = props;
  if (!isVisible) return null;
  return (
    <>
      <RequiredLabel htmlFor="task-description">Description</RequiredLabel>
      <textarea
        id="task-description"
        rows={4}
        placeholder="Description"
        className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
        {...register('description')}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={isSummarizingAI}
          onClick={() => void onGenerateSummary()}
        >
          {isSummarizingAI ? 'Generating...' : '🤖 Generate Summary with AI'}
        </Button>
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </>
  );
}

function AISummarySection(props: Readonly<{
  aiSummary: string;
  summaryConfidence: number | null;
}>) {
  const { aiSummary, summaryConfidence } = props;
  if (!aiSummary) return null;

  return (
    <div className="rounded border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-900">
      <p className="font-semibold">
        AI Summary{' '}
        {summaryConfidence === null ? null : <span className="ml-2 rounded bg-indigo-100 px-2 py-0.5 text-xs">{Math.round(summaryConfidence * 100)}%</span>}
      </p>
      <p className="mt-1">{aiSummary}</p>
    </div>
  );
}

function TeamSection(props: Readonly<{
  isVisible: boolean;
  register: ReturnType<typeof useForm<FormInput>>['register'];
  teams: TeamDto[];
  teamSearch: string;
  setTeamSearch: (value: string) => void;
  filteredTeams: TeamDto[];
  onQuickSelectTeam: () => void;
  error?: string;
}>) {
  const { isVisible, register, teams, teamSearch, setTeamSearch, filteredTeams, onQuickSelectTeam, error } = props;
  if (!isVisible) return null;

  return (
    <>
      <Input
        placeholder="Search teams (e.g., dev, qa)"
        value={teamSearch}
        onChange={(event) => setTeamSearch(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            onQuickSelectTeam();
          }
        }}
      />
      <RequiredLabel htmlFor="task-team">Team</RequiredLabel>
      <Select id="task-team" {...register('teamId')}>
        <option value="">Select team</option>
        {(teamSearch.trim() ? filteredTeams : teams).map((team) => (
          <option key={team.id} value={team.id}>
            {team.name}
          </option>
        ))}
      </Select>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </>
  );
}

function AssigneeSection(props: Readonly<{
  isVisible: boolean;
  register: ReturnType<typeof useForm<FormInput>>['register'];
  selectedTeamId: string;
  assigneeOptions: UserDto[];
  userSearch: string;
  setUserSearch: (value: string) => void;
  filteredAssigneeOptions: UserDto[];
  onQuickSelectUser: () => void;
  teamUsers: UserDto[];
  error?: string;
}>) {
  const { isVisible, register, selectedTeamId, assigneeOptions, userSearch, setUserSearch, filteredAssigneeOptions, onQuickSelectUser, teamUsers, error } = props;
  if (!isVisible) return null;

  return (
    <>
      <Input
        placeholder="Search users (e.g., ajay)"
        value={userSearch}
        onChange={(event) => setUserSearch(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            onQuickSelectUser();
          }
        }}
      />
      <RequiredLabel htmlFor="task-assignee">Assignee</RequiredLabel>
      <Select id="task-assignee" {...register('assignedUserId')} disabled={!selectedTeamId}>
        <option value="">Select user</option>
        {(userSearch.trim() ? filteredAssigneeOptions : assigneeOptions).map((option) => (
          <option key={option.id} value={option.id}>
            {option.name} ({option.email})
          </option>
        ))}
      </Select>
      {teamUsers.length === 0 && selectedTeamId ? <p className="text-xs text-amber-600">No users are mapped to this team yet. You can assign this to yourself.</p> : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </>
  );
}

/** Purpose: Execute CreateTaskForm logic for this module. */
export function CreateTaskForm({
  onSubmit,
  onSuggestSummary,
  onSuggestPriority,
  onParseNaturalTask,
  onDetectDuplicates,
  onFetchTaskDetail,
  defaultAssignedUserId,
  users,
  teams
}: Readonly<{
  onSubmit: (values: FormInput) => Promise<void>;
  onSuggestSummary: (payload: { title: string; description: string }) => Promise<{ summary: string; confidence: number }>;
  onSuggestPriority: (payload: { title: string; description: string }) => Promise<{ priority: FormInput['priority'] | 'UNKNOWN'; confidence: number; warning?: string }>;
  onParseNaturalTask: (text: string) => Promise<{ title: string; description: string; priority: FormInput['priority']; dueDate: string | null; suggestedTeam?: string | null; confidence: number }>;
  onDetectDuplicates: (payload: { title: string; description: string; priority?: FormInput['priority']; category?: string }) => Promise<DuplicateIssueDto[]>;
  onFetchTaskDetail: (taskId: string) => Promise<TaskDetailDto>;
  defaultAssignedUserId?: string;
  users: UserDto[];
  teams: TeamDto[];
}>) {
  const toast = useToast();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [priorityWarning, setPriorityWarning] = useState<string | null>(null);
  const [summaryConfidence, setSummaryConfidence] = useState<number | null>(null);
  const [priorityConfidence, setPriorityConfidence] = useState<number | null>(null);
  const [parseConfidence, setParseConfidence] = useState<number | null>(null);
  const [isParsingAI, setIsParsingAI] = useState(false);
  const [isSummarizingAI, setIsSummarizingAI] = useState(false);
  const [isSuggestingPriorityAI, setIsSuggestingPriorityAI] = useState(false);
  const [duplicateIssues, setDuplicateIssues] = useState<DuplicateIssueDto[]>([]);
  const [isCheckingPromptDuplicates, setIsCheckingPromptDuplicates] = useState(false);
  const [showCheckingPromptDuplicates, setShowCheckingPromptDuplicates] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [teamSearch, setTeamSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [debouncedTeamSearch, setDebouncedTeamSearch] = useState('');
  const [debouncedUserSearch, setDebouncedUserSearch] = useState('');
  const promptDuplicateRequestRef = useRef(0);
  const { isVisible } = useUiConfig('create-task');
  const { register, handleSubmit, formState, setValue, watch, getValues } = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'MEDIUM', assignedUserId: '', teamId: '' }
  });
  const selectedTeamId = watch('teamId');

  const teamUsers = users.filter((user) => user.teamId === selectedTeamId);
  const defaultAssignee = users.find((user) => user.id === defaultAssignedUserId);
  let assigneeOptions = teamUsers;
  if (assigneeOptions.length === 0 && defaultAssignee) {
    assigneeOptions = [defaultAssignee];
  }

  const filteredTeams = useMemo(() => {
    const query = debouncedTeamSearch.trim().toLowerCase();
    if (!query) return teams;
    return teams.filter((team) => team.name.toLowerCase().includes(query));
  }, [debouncedTeamSearch, teams]);

  const filteredAssigneeOptions = useMemo(() => {
    const query = debouncedUserSearch.trim().toLowerCase();
    if (!query) return assigneeOptions;
    return assigneeOptions.filter((user) =>
      `${user.name} ${user.email}`.toLowerCase().includes(query)
    );
  }, [assigneeOptions, debouncedUserSearch]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedTeamSearch(teamSearch), 160);
    return () => clearTimeout(timeout);
  }, [teamSearch]);

  useEffect(() => {
    if (!isCheckingPromptDuplicates) {
      setShowCheckingPromptDuplicates(false);
      return;
    }

    const indicatorDelay = setTimeout(() => {
      setShowCheckingPromptDuplicates(true);
    }, 350);

    return () => clearTimeout(indicatorDelay);
  }, [isCheckingPromptDuplicates]);

  useEffect(() => {
    const probe = buildDuplicateProbeFromPrompt(aiPrompt);
    if (!probe) {
      setDuplicateIssues([]);
      setIsCheckingPromptDuplicates(false);
      return;
    }

    const runPromptDuplicateCheck = async () => {
      const requestId = promptDuplicateRequestRef.current + 1;
      promptDuplicateRequestRef.current = requestId;

      try {
        setIsCheckingPromptDuplicates(true);
        const matches = await onDetectDuplicates({ title: probe.title, description: probe.description });
        const highProbabilityMatches = matches.filter((item) => item.similarity >= 0.62);

        if (requestId !== promptDuplicateRequestRef.current) {
          return;
        }

        setDuplicateIssues(highProbabilityMatches);
      } catch {
        if (requestId === promptDuplicateRequestRef.current) {
          setDuplicateIssues([]);
        }
      } finally {
        if (requestId === promptDuplicateRequestRef.current) {
          setIsCheckingPromptDuplicates(false);
        }
      }
    };

    const timeout = setTimeout(() => {
      void runPromptDuplicateCheck();
    }, 800);

    return () => clearTimeout(timeout);
  }, [aiPrompt, onDetectDuplicates]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedUserSearch(userSearch), 160);
    return () => clearTimeout(timeout);
  }, [userSearch]);

  useEffect(() => {
    setUserSearch('');
    setValue('assignedUserId', '', { shouldValidate: false });
  }, [selectedTeamId, setValue]);

  const onFormSubmit = async (values: FormInput) => {
    setSubmitError(null);
    setPriorityWarning(null);
    try {
      await onSubmit(values);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create task';
      setSubmitError(message);
      toast.error(message);
    }
  };

  const onPopulate = async () => {
    setSubmitError(null);
    setIsParsingAI(true);
    try {
      const parsed = await handlePopulateFromAI({
        aiPrompt,
        onParseNaturalTask,
        setValue: (name, value) => setValue(name, value as never),
        setParseConfidence,
        teams
      });

      const postGenerationMatches = await onDetectDuplicates({
        title: parsed.title,
        description: parsed.description,
        priority: parsed.priority
      });
      const highProbabilityMatches = postGenerationMatches.filter((item) => item.similarity >= 0.62);
      setDuplicateIssues(highProbabilityMatches);
      if (highProbabilityMatches.length > 0) {
        setSubmitError(`Potential duplicate detected after generation. Consider reviewing Task #${highProbabilityMatches[0].id.slice(0, 8)} before creating.`);
      }

      toast.success('AI populated task fields successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to parse AI task';
      setSubmitError(message);
      toast.error(message);
    } finally {
      setIsParsingAI(false);
    }
  };

  const onGenerateSummary = async () => {
    const title = getValues('title');
    const description = getValues('description');
    if (!title?.trim() || !description?.trim()) {
      setSubmitError('Provide both title and description to generate AI summary.');
      toast.info('Add title and description before generating summary');
      return;
    }

    setIsSummarizingAI(true);
    try {
      await handleGenerateSummary({
        title,
        description,
        onSuggestSummary,
        setValue: (name, value) => setValue(name, value as never),
        setSummaryConfidence
      });
      setSubmitError(null);
      toast.success('AI summary generated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate AI summary';
      setSubmitError(message);
      toast.error(message);
    } finally {
      setIsSummarizingAI(false);
    }
  };

  const onSuggest = async () => {
    const title = getValues('title');
    const description = getValues('description');

    setIsSuggestingPriorityAI(true);
    try {
      await handleSuggestPriority({
        title,
        description,
        onSuggestPriority,
        setValue: (name, value) => setValue(name, value as never),
        setPriorityConfidence,
        setPriorityWarning
      });
      setSubmitError(null);
      toast.success('Priority suggestion generated');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to suggest priority';
      setSubmitError(message);
      toast.error(message);
    } finally {
      setIsSuggestingPriorityAI(false);
    }
  };

  return (
    <CreateTaskFormView
      handleSubmit={handleSubmit}
      onFormSubmit={onFormSubmit}
      isVisible={isVisible}
      register={register}
      formState={formState}
      aiPrompt={aiPrompt}
      setAiPrompt={setAiPrompt}
      isParsingAI={isParsingAI}
      isCheckingPromptDuplicates={showCheckingPromptDuplicates}
      duplicateIssues={duplicateIssues}
      parseConfidence={parseConfidence}
      onPopulate={onPopulate}
      summaryConfidence={summaryConfidence}
      isSummarizingAI={isSummarizingAI}
      onGenerateSummary={onGenerateSummary}
      isSuggestingPriorityAI={isSuggestingPriorityAI}
      priorityConfidence={priorityConfidence}
      priorityWarning={priorityWarning}
      onSuggest={onSuggest}
      watch={watch}
      teams={teams}
      teamSearch={teamSearch}
      setTeamSearch={setTeamSearch}
      filteredTeams={filteredTeams}
      onQuickSelectTeam={() => {
        const top = filteredTeams[0];
        if (!top) return;
        setValue('teamId', top.id as never);
      }}
      assigneeOptions={assigneeOptions}
      userSearch={userSearch}
      setUserSearch={setUserSearch}
      filteredAssigneeOptions={filteredAssigneeOptions}
      onQuickSelectUser={() => {
        const top = filteredAssigneeOptions[0];
        if (!top) return;
        setValue('assignedUserId', top.id as never);
      }}
      selectedTeamId={selectedTeamId}
      teamUsers={teamUsers}
      submitError={submitError}
    />
  );
}

function CreateTaskFormView(props: Readonly<{
  handleSubmit: ReturnType<typeof useForm<FormInput>>['handleSubmit'];
  onFormSubmit: (values: FormInput) => Promise<void>;
  isVisible: (fieldName: string) => boolean;
  register: ReturnType<typeof useForm<FormInput>>['register'];
  formState: ReturnType<typeof useForm<FormInput>>['formState'];
  aiPrompt: string;
  setAiPrompt: (value: string) => void;
  isParsingAI: boolean;
  isCheckingPromptDuplicates: boolean;
  duplicateIssues: DuplicateIssueDto[];
  parseConfidence: number | null;
  onPopulate: (allowDuplicateOverride?: boolean) => Promise<void>;
  summaryConfidence: number | null;
  isSummarizingAI: boolean;
  onGenerateSummary: () => Promise<void>;
  isSuggestingPriorityAI: boolean;
  priorityConfidence: number | null;
  priorityWarning: string | null;
  onSuggest: () => Promise<void>;
  watch: ReturnType<typeof useForm<FormInput>>['watch'];
  teams: TeamDto[];
  teamSearch: string;
  setTeamSearch: (value: string) => void;
  filteredTeams: TeamDto[];
  onQuickSelectTeam: () => void;
  assigneeOptions: UserDto[];
  userSearch: string;
  setUserSearch: (value: string) => void;
  filteredAssigneeOptions: UserDto[];
  onQuickSelectUser: () => void;
  selectedTeamId: string;
  teamUsers: UserDto[];
  submitError: string | null;
}>) {
  const {
    handleSubmit,
    onFormSubmit,
    isVisible,
    register,
    formState,
    aiPrompt,
    setAiPrompt,
    isParsingAI,
    isCheckingPromptDuplicates,
    duplicateIssues,
    parseConfidence,
    onPopulate,
    summaryConfidence,
    isSummarizingAI,
    onGenerateSummary,
    isSuggestingPriorityAI,
    priorityConfidence,
    priorityWarning,
    onSuggest,
    watch,
    teams,
    teamSearch,
    setTeamSearch,
    filteredTeams,
    onQuickSelectTeam,
    assigneeOptions,
    userSearch,
    setUserSearch,
    filteredAssigneeOptions,
    onQuickSelectUser,
    selectedTeamId,
    teamUsers,
    submitError
  } = props;
  const aiSummary = watch('aiSummary') ?? '';

  return (
    <form
      className="space-y-3 rounded-xl border bg-white p-4"
      onSubmit={handleSubmit((values) => void onFormSubmit(values))}
    >
      <h3 className="font-semibold">Create Task</h3>

      <AIPromptSection
        aiPrompt={aiPrompt}
        setAiPrompt={setAiPrompt}
        disabled={!aiPrompt.trim() || formState.isSubmitting}
        isParsingAI={isParsingAI}
        isCheckingDuplicates={isCheckingPromptDuplicates}
        duplicateMatches={duplicateIssues}
        parseConfidence={parseConfidence}
        onPopulate={onPopulate}
      />

      <TitleSection isVisible={isVisible('title')} register={register} error={formState.errors.title?.message} />

      <DescriptionSection
        isVisible={isVisible('description')}
        register={register}
        isSummarizingAI={isSummarizingAI}
        onGenerateSummary={onGenerateSummary}
        error={formState.errors.description?.message}
      />

      <AISummarySection aiSummary={aiSummary} summaryConfidence={summaryConfidence} />

      {isVisible('priority') ? (
        <PrioritySection
          register={register}
          isSuggestingPriorityAI={isSuggestingPriorityAI}
          priorityConfidence={priorityConfidence}
          priorityWarning={priorityWarning}
          onSuggest={onSuggest}
        />
      ) : null}

      {isVisible('dueDate') ? <Input type="date" {...register('dueDate')} /> : null}

      <TeamSection
        isVisible={isVisible('assignedTeam')}
        register={register}
        teams={teams}
        teamSearch={teamSearch}
        setTeamSearch={setTeamSearch}
        filteredTeams={filteredTeams}
        onQuickSelectTeam={onQuickSelectTeam}
        error={formState.errors.teamId?.message}
      />


      <AssigneeSection
        isVisible={isVisible('assignedUser')}
        register={register}
        selectedTeamId={selectedTeamId}
        assigneeOptions={assigneeOptions}
        userSearch={userSearch}
        setUserSearch={setUserSearch}
        filteredAssigneeOptions={filteredAssigneeOptions}
        onQuickSelectUser={onQuickSelectUser}
        teamUsers={teamUsers}
        error={formState.errors.assignedUserId?.message}
      />

      {isVisible('comments') ? (
        <textarea
          rows={3}
          placeholder="Add initial comment (optional)"
          className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
          {...register('comment')}
        />
      ) : null}

      {submitError ? <p className="text-xs text-red-600">{submitError}</p> : null}
      <Button disabled={formState.isSubmitting} type="submit">
        Create Issue
      </Button>
    </form>
  );
}
