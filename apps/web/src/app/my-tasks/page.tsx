/**
 * File Description:
 * This file implements apps/web/src/app/my-tasks/page.tsx.
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

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Purpose: Execute LegacyMyTasksRedirectPage logic for this module. */
export default function LegacyMyTasksRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/my-created-tasks');
  }, [router]);

  return <main className="p-6 text-sm text-slate-600">Redirecting...</main>;
}
