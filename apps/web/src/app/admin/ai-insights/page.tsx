/**
 * File Description:
 * This file implements apps/web/src/app/admin/ai-insights/page.tsx.
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
import { AIInsightsDto } from '@task-platform/types';
import { AppNav } from '@/components/app-nav';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { swrFetcher } from '@/lib/swr-fetcher';
import { useAuthStore } from '@/store/auth.store';

function asPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

/** Purpose: Execute AdminAIInsightsPage logic for this module. */
export default function AdminAIInsightsPage() {
  const { isReady, isAuthenticated } = useAuthGuard();
  const { user } = useAuthStore();
  const canLoad = isReady && isAuthenticated && user?.role === 'ADMIN';

  const { data, error, isLoading } = useSWR<AIInsightsDto>(canLoad ? '/admin/ai-insights' : null, swrFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 10000
  });

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
          <h1 className="text-2xl font-bold text-slate-900">AI Insights Dashboard</h1>
          <p className="text-sm text-slate-600">Adoption and effectiveness overview of AI-powered issue intelligence features.</p>
        </header>

        {error ? <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error.message}</p> : null}

        {isLoading || !data ? (
          <div className="space-y-3 rounded-xl border bg-white p-4">
            <div className="h-10 animate-pulse rounded bg-slate-200" />
            <div className="h-10 animate-pulse rounded bg-slate-200" />
            <div className="h-10 animate-pulse rounded bg-slate-200" />
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <article className="rounded-xl border bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Total Tasks</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{data.totalTasks}</p>
              </article>
              <article className="rounded-xl border bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">AI Coverage Rate</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{asPercent(data.aiCoverageRate)}</p>
              </article>
              <article className="rounded-xl border bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Resolution Adoption</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{asPercent(data.resolutionAdoptionRate)}</p>
              </article>
            </section>

            <section className="rounded-xl border bg-white p-4">
              <h2 className="text-sm font-semibold text-slate-800">Feature Usage</h2>
              <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
                {data.featureUsage.map((item) => (
                  <div key={item.key} className="rounded border bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">{item.key}</p>
                    <p className="text-lg font-semibold text-slate-900">{item.value}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl border bg-white p-4">
              <h2 className="text-sm font-semibold text-slate-800">Category Breakdown</h2>
              {data.categoryBreakdown.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">No AI category data yet.</p>
              ) : (
                <ul className="mt-3 space-y-2 text-sm">
                  {data.categoryBreakdown.map((item) => (
                    <li key={item.category} className="flex items-center justify-between rounded border px-3 py-2">
                      <span>{item.category}</span>
                      <span className="font-semibold text-slate-900">{item.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
