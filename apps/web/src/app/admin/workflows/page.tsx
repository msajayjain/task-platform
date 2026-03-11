/**
 * File Description:
 * This file implements apps/web/src/app/admin/workflows/page.tsx.
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

import axios from 'axios';
import useSWR from 'swr';
import { useMemo, useState } from 'react';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TeamDto, TeamWorkflowDto, WorkflowStageKind } from '@task-platform/types';
import { AppNav } from '@/components/app-nav';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { api } from '@/lib/api-client';
import { swrFetcher } from '@/lib/swr-fetcher';
import { useAuthStore } from '@/store/auth.store';

const stageKinds: WorkflowStageKind[] = ['TODO', 'IN_PROGRESS', 'COMPLETED'];

type StageDraft = {
  id: string;
  label: string;
  kind: WorkflowStageKind;
};

function createStage(label: string, kind: WorkflowStageKind): StageDraft {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    label,
    kind
  };
}

function defaultStages(): StageDraft[] {
  return [createStage('Todo', 'TODO'), createStage('In Progress', 'IN_PROGRESS'), createStage('Completed', 'COMPLETED')];
}

function toMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error?.message ?? fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

function toStageDrafts(workflow: TeamWorkflowDto | undefined): StageDraft[] {
  if (!workflow?.stages.length) {
    return defaultStages();
  }

  const sortedStages = workflow.stages.slice().sort((a, b) => a.order - b.order);
  return sortedStages.map((stage) => ({ id: stage.id, label: stage.label, kind: stage.kind }));
}

function getWorkflowScopeLabel(workflow: TeamWorkflowDto): string {
  if (workflow.isDefault) {
    return '(Default)';
  }

  if (workflow.teamName) {
    return `(${workflow.teamName})`;
  }

  return '';
}

function SortableStageRow({
  stage,
  index,
  canDelete,
  onLabelChange,
  onKindChange,
  onDelete
}: Readonly<{
  stage: StageDraft;
  index: number;
  canDelete: boolean;
  onLabelChange: (id: string, value: string) => void;
  onKindChange: (id: string, kind: WorkflowStageKind) => void;
  onDelete: (id: string) => void;
}>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stage.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.75 : 1
      }}
      className="grid grid-cols-[auto_1fr_180px_auto] items-center gap-2"
    >
      <button
        type="button"
        className="rounded border bg-slate-100 px-2 py-2 text-xs font-semibold text-slate-600"
        aria-label={`Drag stage ${index + 1}`}
        {...attributes}
        {...listeners}
      >
        Drag
      </button>
      <input
        value={stage.label}
        onChange={(event) => onLabelChange(stage.id, event.target.value)}
        className="rounded border px-3 py-2 text-sm"
        placeholder="Stage label"
      />
      <select
        className="rounded border px-3 py-2 text-sm"
        value={stage.kind}
        onChange={(event) => onKindChange(stage.id, event.target.value as WorkflowStageKind)}
      >
        {stageKinds.map((kind) => (
          <option key={kind} value={kind}>
            {kind}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={!canDelete}
        className="rounded border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => onDelete(stage.id)}
      >
        Delete
      </button>
    </div>
  );
}

/** Purpose: Execute AdminWorkflowsPage logic for this module. */
export default function AdminWorkflowsPage() {
  const { isReady, isAuthenticated } = useAuthGuard();
  const { user } = useAuthStore();
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [workflowName, setWorkflowName] = useState('');
  const [stages, setStages] = useState<StageDraft[]>(defaultStages);
  const [newTeamName, setNewTeamName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor));

  const canLoad = isReady && isAuthenticated && user?.role === 'ADMIN';
  const { data: teams = [], mutate: mutateTeams } = useSWR<TeamDto[]>(canLoad ? '/teams' : null, swrFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 20000
  });
  const { data: workflows = [], mutate: mutateWorkflows } = useSWR<TeamWorkflowDto[]>(canLoad ? '/admin/workflows' : null, swrFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 10000
  });

  const selectedExistingWorkflow = useMemo(
    () => workflows.find((workflow) => (selectedTeamId ? workflow.teamId === selectedTeamId : workflow.isDefault)),
    [selectedTeamId, workflows]
  );

  function applyWorkflowDraft(workflow: TeamWorkflowDto | undefined) {
    setWorkflowName(workflow?.workflowName ?? '');
    setStages(toStageDrafts(workflow));
  }

  function updateStageLabel(id: string, value: string) {
    setStages((current) => current.map((row) => (row.id === id ? { ...row, label: value } : row)));
  }

  function updateStageKind(id: string, kind: WorkflowStageKind) {
    setStages((current) => current.map((row) => (row.id === id ? { ...row, kind } : row)));
  }

  function removeStage(id: string) {
    setStages((current) => current.filter((row) => row.id !== id));
  }

  async function saveWorkflow() {
    try {
      setSaving(true);
      setErrorMessage(null);

      if (stages.length < 1) {
        setErrorMessage('At least one stage is required.');
        return;
      }

      if (stages.some((stage) => !stage.label.trim())) {
        setErrorMessage('Stage names must not be empty.');
        return;
      }

      await api.post('/admin/workflows', {
        teamId: selectedTeamId || undefined,
        workflowName: workflowName.trim() || (selectedTeamId ? 'Team Workflow' : 'Default Workflow'),
        stages: stages.map((stage, index) => ({
          stageName: stage.label.trim(),
          stageOrder: index + 1,
          kind: stage.kind
        }))
      });
      await mutateWorkflows();
    } catch (error) {
      setErrorMessage(toMessage(error, 'Failed to save workflow'));
    } finally {
      setSaving(false);
    }
  }

  async function createTeam() {
    if (!newTeamName.trim()) return;
    try {
      setErrorMessage(null);
      await api.post('/teams', { name: newTeamName.trim() });
      setNewTeamName('');
      await mutateTeams();
    } catch (error) {
      setErrorMessage(toMessage(error, 'Failed to create team'));
    }
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    setStages((current) => {
      const oldIndex = current.findIndex((stage) => stage.id === active.id);
      const newIndex = current.findIndex((stage) => stage.id === over.id);
      if (oldIndex < 0 || newIndex < 0) {
        return current;
      }

      return arrayMove(current, oldIndex, newIndex);
    });
  }

  if (!isReady) {
    return <main className="min-h-screen bg-slate-50 p-6 text-sm text-slate-600">Loading...</main>;
  }

  if (user?.role !== 'ADMIN') {
    return <main className="min-h-screen bg-slate-50 p-6 text-sm text-red-600">Forbidden: Admin only.</main>;
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <AppNav />
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <header>
          <h1 className="text-2xl font-bold text-slate-900">Workflow Management</h1>
          <p className="text-sm text-slate-600">Admin-only workflow customization per team with default fallback.</p>
        </header>

        {errorMessage ? <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</p> : null}

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-xl border bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-900">Create Team</h2>
            <input
              value={newTeamName}
              onChange={(event) => setNewTeamName(event.target.value)}
              placeholder="Team name"
              className="w-full rounded border px-3 py-2 text-sm"
            />
            <button type="button" className="rounded border px-3 py-2 text-sm" onClick={createTeam}>
              Add Team
            </button>
          </div>

          <div className="space-y-3 rounded-xl border bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-900">Edit Workflow</h2>
            <select
              className="w-full rounded border px-3 py-2 text-sm"
              value={selectedTeamId}
              onChange={(event) => {
                setSelectedTeamId(event.target.value);
                const existing = workflows.find((workflow) => (event.target.value ? workflow.teamId === event.target.value : workflow.isDefault));
                applyWorkflowDraft(existing);
              }}
            >
              <option value="">Default Workflow</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>

            <input
              value={workflowName}
              onChange={(event) => setWorkflowName(event.target.value)}
              placeholder="Workflow name"
              className="w-full rounded border px-3 py-2 text-sm"
            />

            <DndContext sensors={sensors} onDragEnd={onDragEnd}>
              <SortableContext items={stages.map((stage) => stage.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {stages.map((stage, index) => (
                    <SortableStageRow
                      key={stage.id}
                      stage={stage}
                      index={index}
                      canDelete={stages.length > 1}
                      onLabelChange={updateStageLabel}
                      onKindChange={updateStageKind}
                      onDelete={removeStage}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded border px-3 py-2 text-sm"
                onClick={() => setStages((current) => [...current, createStage('New Stage', 'IN_PROGRESS')])}
              >
                Add Stage
              </button>
              <button
                type="button"
                className="rounded border px-3 py-2 text-sm disabled:opacity-50"
                disabled={saving}
                onClick={saveWorkflow}
              >
                {saving ? 'Saving...' : 'Save Workflow'}
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-3 rounded-xl border bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Current Workflows</h2>
          {workflows.length === 0 ? <p className="text-sm text-slate-500">No workflows found.</p> : null}
          {workflows.map((workflow) => (
            <div key={workflow.id} className="rounded border p-3">
              <p className="text-sm font-semibold text-slate-900">
                {workflow.workflowName} {getWorkflowScopeLabel(workflow)}
              </p>
              <p className="mt-1 text-xs text-slate-600">{workflow.stages.map((stage) => `${stage.order + 1}. ${stage.label} (${stage.kind})`).join(' → ')}</p>
            </div>
          ))}
        </section>

        {selectedExistingWorkflow ? (
          <p className="text-xs text-slate-500">Editing existing workflow: {selectedExistingWorkflow.workflowName}</p>
        ) : null}
      </div>
    </main>
  );
}
