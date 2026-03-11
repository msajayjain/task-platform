/**
 * File Description:
 * This file implements apps/api/src/presentation/http/request.ts.
 *
 * Purpose:
 * Provide module-specific logic used by the project runtime.
 *
 * Key Responsibilities:
 * - Encapsulate focused module behavior.
 * - Expose reusable exports.
 * - Support maintainable project structure.
 */

import { NextRequest } from 'next/server';
import { AppError } from '@/application/errors/app-error';

/** Purpose: Execute parseJson logic for this module. */
export async function parseJson<T>(req: NextRequest): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new AppError('Invalid JSON payload', 400);
  }
}
