/**
 * File Description:
 * This file implements apps/web/src/app/my-dashboard/loading.tsx.
 *
 * Purpose:
 * Provide module-specific logic used by the project runtime.
 *
 * Key Responsibilities:
 * - Encapsulate focused module behavior.
 * - Expose reusable exports.
 * - Support maintainable project structure.
 */

export default function LoadingMyDashboardPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="h-56 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-56 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-56 animate-pulse rounded-xl bg-slate-200" />
      </div>
    </main>
  );
}
