/**
 * File Description:
 * This file implements apps/web/src/app/tasks/create/loading.tsx.
 *
 * Purpose:
 * Provide module-specific logic used by the project runtime.
 *
 * Key Responsibilities:
 * - Encapsulate focused module behavior.
 * - Expose reusable exports.
 * - Support maintainable project structure.
 */

export default function LoadingCreateTaskPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="h-10 w-64 animate-pulse rounded bg-slate-200" />
        <div className="space-y-3 rounded-xl bg-white p-4">
          <div className="h-10 animate-pulse rounded bg-slate-200" />
          <div className="h-10 animate-pulse rounded bg-slate-200" />
          <div className="h-10 animate-pulse rounded bg-slate-200" />
          <div className="h-24 animate-pulse rounded bg-slate-200" />
        </div>
      </div>
    </main>
  );
}
