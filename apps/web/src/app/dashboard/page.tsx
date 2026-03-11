/**
 * File Description:
 * This file implements apps/web/src/app/dashboard/page.tsx.
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

/** Purpose: Execute LegacyDashboardRedirectPage logic for this module. */
export default function LegacyDashboardRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/my-dashboard');
  }, [router]);

  return <main className="p-6 text-sm text-slate-600">Redirecting...</main>;
}
