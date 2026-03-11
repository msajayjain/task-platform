/**
 * File Description:
 * This file implements apps/web/src/app/my-created-tasks/loading.tsx.
 *
 * Purpose:
 * Provide module-specific logic used by the project runtime.
 *
 * Key Responsibilities:
 * - Encapsulate focused module behavior.
 * - Expose reusable exports.
 * - Support maintainable project structure.
 */

export default function LoadingMyCreatedTasksPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="h-10 w-80 animate-pulse rounded bg-slate-200" />
        <div className="h-64 animate-pulse rounded-xl bg-slate-200" />
      </div>
    </main>
  );
}
