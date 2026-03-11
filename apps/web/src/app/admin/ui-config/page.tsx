/**
 * File Description:
 * This file implements apps/web/src/app/admin/ui-config/page.tsx.
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
import { closestCenter, DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { UIFieldConfigDto, UIScreenConfigDto, UIScreenName } from '@task-platform/types';
import { AppNav } from '@/components/app-nav';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { api } from '@/lib/api-client';
import { swrFetcher } from '@/lib/swr-fetcher';
import { useAuthStore } from '@/store/auth.store';

function SortableField({ field, onToggle }: Readonly<{ field: UIFieldConfigDto; onToggle: (fieldName: string) => void }>) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: field.fieldName });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center justify-between rounded border bg-white px-3 py-2">
      <button type="button" className="cursor-grab text-left text-sm" {...attributes} {...listeners}>
        {field.fieldName}
      </button>
      <label className="flex items-center gap-2 text-xs text-slate-600">
        <input type="checkbox" checked={field.isVisible} onChange={() => onToggle(field.fieldName)} />
        <span>Visible</span>
      </label>
    </div>
  );
}

/** Purpose: Execute AdminUiConfigPage logic for this module. */
export default function AdminUiConfigPage() {
  const { isReady, isAuthenticated } = useAuthGuard();
  const { user } = useAuthStore();
  const sensors = useSensors(useSensor(PointerSensor));

  const [screenName, setScreenName] = useState<UIScreenName>('create-task');
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const shouldLoad = isReady && isAuthenticated && user?.role === 'ADMIN';
  const { data, mutate } = useSWR<UIScreenConfigDto>(shouldLoad ? `/admin/ui-config?screenName=${screenName}` : null, swrFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000
  });

  const fields = useMemo(
    () =>
      (data?.fields ?? [])
        .slice()
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((field) => ({ ...field })),
    [data]
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !data) return;

    const oldIndex = fields.findIndex((field) => field.fieldName === String(active.id));
    const newIndex = fields.findIndex((field) => field.fieldName === String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(fields, oldIndex, newIndex).map((field, index) => ({
      ...field,
      displayOrder: index
    }));

    void mutate({ screenName, fields: reordered }, false);
  }

  function toggleVisibility(fieldName: string) {
    if (!data) return;

    const next = fields.map((field) => (field.fieldName === fieldName ? { ...field, isVisible: !field.isVisible } : field));
    void mutate({ screenName, fields: next }, false);
  }

  async function saveConfig() {
    if (!data) return;
    try {
      setSaving(true);
      setErrorMessage(null);
      await api.put('/admin/ui-config', {
        screenName,
        fields: data.fields
      });
      await mutate();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save UI configuration');
    } finally {
      setSaving(false);
    }
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
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        <header>
          <h1 className="text-2xl font-bold text-slate-900">UI Configuration</h1>
          <p className="text-sm text-slate-600">Drag-and-drop fields to reorder and toggle visibility per screen.</p>
        </header>

        {errorMessage ? <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</p> : null}

        <section className="rounded-xl border bg-white p-4">
          <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="screenName">
            Screen
          </label>
          <select
            id="screenName"
            className="w-full rounded border px-3 py-2 text-sm"
            value={screenName}
            onChange={(event) => {
              setScreenName(event.target.value as UIScreenName);
            }}
          >
            <option value="create-task">Create Task Screen</option>
            <option value="task-details">Task Details Screen</option>
            <option value="my-created-grid">My Created Tasks Grid</option>
          </select>
        </section>

        <section className="space-y-3 rounded-xl border bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-800">Fields ({fields.length})</h2>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={fields.map((field) => field.fieldName)} strategy={rectSortingStrategy}>
              <div className="space-y-2">
                {fields.map((field) => (
                  <SortableField key={field.fieldName} field={field} onToggle={toggleVisibility} />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <div className="flex justify-end">
            <button
              type="button"
              className="rounded border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => void saveConfig()}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
