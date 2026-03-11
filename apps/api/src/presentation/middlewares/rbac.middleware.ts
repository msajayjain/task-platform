/**
 * File Description:
 * This file implements apps/api/src/presentation/middlewares/rbac.middleware.ts.
 *
 * Purpose:
 * Enforce cross-cutting request policies and guards.
 *
 * Key Responsibilities:
 * - Encapsulate focused module behavior.
 * - Expose reusable exports.
 * - Support maintainable project structure.
 */

import { AppError } from '@/application/errors/app-error';

/** Purpose: Execute requireRole logic for this module. */
export function requireRole(currentRole: 'ADMIN' | 'USER', allowed: Array<'ADMIN' | 'USER'>) {
  if (!allowed.includes(currentRole)) {
    throw new AppError('Forbidden', 403);
  }
}
