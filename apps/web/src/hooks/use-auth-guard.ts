/**
 * File Description:
 * This file implements apps/web/src/hooks/use-auth-guard.ts.
 *
 * Purpose:
 * Encapsulate reusable client-side state/behavior logic.
 *
 * Key Responsibilities:
 * - Encapsulate focused module behavior.
 * - Expose reusable exports.
 * - Support maintainable project structure.
 */

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

/** Purpose: Execute useAuthGuard logic for this module. */
export function useAuthGuard() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setIsAuthenticated(false);
      setIsReady(true);
      router.replace('/login');
      return;
    }

    setIsAuthenticated(true);
    setIsReady(true);
  }, [router]);

  return { isReady, isAuthenticated };
}
