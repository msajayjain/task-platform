/**
 * File Description:
 * This file implements apps/api/src/presentation/middlewares/auth.middleware.ts.
 *
 * Purpose:
 * Enforce cross-cutting request policies and guards.
 *
 * Key Responsibilities:
 * - Encapsulate focused module behavior.
 * - Expose reusable exports.
 * - Support maintainable project structure.
 */

import { NextRequest } from 'next/server';
import { verifyAccessToken } from '@/infrastructure/auth/jwt';
import { AppError } from '@/application/errors/app-error';

/** Purpose: Execute requireAuth logic for this module. */
export function requireAuth(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) {
    throw new AppError('Missing bearer token', 401);
  }

  const token = auth.replace('Bearer ', '').trim();
  return verifyAccessToken(token);
}
