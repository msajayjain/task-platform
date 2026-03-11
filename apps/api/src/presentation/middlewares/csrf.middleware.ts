/**
 * File Description:
 * This file implements apps/api/src/presentation/middlewares/csrf.middleware.ts.
 *
 * Purpose:
 * Enforce cross-cutting request policies and guards.
 *
 * Key Responsibilities:
 * - Encapsulate focused module behavior.
 * - Expose reusable exports.
 * - Support maintainable project structure.
 */

import crypto from 'node:crypto';
import { NextRequest } from 'next/server';
import { AppError } from '@/application/errors/app-error';
import { env } from '@/infrastructure/config/env';

function sign(value: string) {
  return crypto.createHmac('sha256', env.CSRF_SECRET).update(value).digest('hex');
}

/** Purpose: Execute issueCsrfToken logic for this module. */
export function issueCsrfToken(sessionId: string) {
  const token = `${sessionId}.${sign(sessionId)}`;
  return token;
}

/** Purpose: Execute validateCsrf logic for this module. */
export function validateCsrf(req: NextRequest, sessionId: string) {
  const csrf = req.headers.get('x-csrf-token');
  if (!csrf) throw new AppError('Missing CSRF token', 403);

  const [id, hash] = csrf.split('.');
  if (!id || !hash || id !== sessionId || sign(id) !== hash) {
    throw new AppError('Invalid CSRF token', 403);
  }
}
