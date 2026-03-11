/**
 * File Description:
 * This file implements apps/web/src/app/tasks/[id]/loading.tsx.
 *
 * Purpose:
 * Provide module-specific logic used by the project runtime.
 *
 * Key Responsibilities:
 * - Encapsulate focused module behavior.
 * - Expose reusable exports.
 * - Support maintainable project structure.
 */

export default function TaskDetailLoading() {
  return (
    <main className="mx-auto max-w-4xl space-y-3 p-6">
      <div className="h-8 animate-pulse rounded bg-slate-200" />
      <div className="h-24 animate-pulse rounded bg-slate-200" />
      <div className="h-40 animate-pulse rounded bg-slate-200" />
    </main>
  );
}
