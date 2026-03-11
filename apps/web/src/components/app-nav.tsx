/**
 * File Description:
 * This file implements apps/web/src/components/app-nav.tsx.
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

import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth.store';

/** Purpose: Execute AppNav logic for this module. */
export function AppNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, user } = useAuthStore();

  const isMyCreatedTasks = pathname === '/my-created-tasks';
  const isMyDashboard = pathname === '/my-dashboard';
  const isCreateTask = pathname === '/tasks/create';
  const isAdminWorkflows = pathname === '/admin/workflows';
  const isAdminUiConfig = pathname === '/admin/ui-config';
  const isAdminAIInsights = pathname === '/admin/ai-insights';

  return (
    <nav className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-3">
        <div className="text-sm font-semibold text-slate-800">Task Platform</div>
        <div className="flex items-center gap-2">
          <Button
            className={isMyCreatedTasks ? 'ring-2 ring-brand-300' : ''}
            onClick={() => {
              router.push('/my-created-tasks');
            }}
            type="button"
          >
            My Created Tasks
          </Button>
          <Button
            className={isMyDashboard ? 'ring-2 ring-brand-300' : ''}
            onClick={() => {
              router.push('/my-dashboard');
            }}
            type="button"
          >
            My Dashboard
          </Button>
          <Button
            className={isCreateTask ? 'ring-2 ring-brand-300' : ''}
            onClick={() => {
              router.push('/tasks/create');
            }}
            type="button"
          >
            Create Task
          </Button>
          {user?.role === 'ADMIN' ? (
            <>
              <Button
                className={isAdminWorkflows ? 'ring-2 ring-brand-300' : ''}
                onClick={() => {
                  router.push('/admin/workflows');
                }}
                type="button"
              >
                Admin Workflows
              </Button>
              <Button
                className={isAdminUiConfig ? 'ring-2 ring-brand-300' : ''}
                onClick={() => {
                  router.push('/admin/ui-config');
                }}
                type="button"
              >
                UI Config
              </Button>
              <Button
                className={isAdminAIInsights ? 'ring-2 ring-brand-300' : ''}
                onClick={() => {
                  router.push('/admin/ai-insights');
                }}
                type="button"
              >
                AI Insights
              </Button>
            </>
          ) : null}
          <Button
            onClick={async () => {
              await logout();
              router.replace('/login');
            }}
            type="button"
          >
            Logout
          </Button>
          <span className="hidden rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 sm:inline">
            {user?.name?.trim() ? `Hi, ${user.name}` : 'Logged in'}
          </span>
        </div>
      </div>
    </nav>
  );
}
