/**
 * File Description:
 * This file implements apps/api/src/presentation/http/response.ts.
 *
 * Purpose:
 * Provide module-specific logic used by the project runtime.
 *
 * Key Responsibilities:
 * - Encapsulate focused module behavior.
 * - Expose reusable exports.
 * - Support maintainable project structure.
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from '@/application/errors/app-error';
import { logger } from '@/infrastructure/logger/logger';

/** Purpose: Execute ok logic for this module. */
export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

/** Purpose: Execute fail logic for this module. */
export function fail(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: { message: error.message, details: error.details }
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Validation failed',
          details: error.issues
        }
      },
      { status: 400 }
    );
  }

  logger.error({ err: error }, 'Unhandled error');
  return NextResponse.json(
    {
      success: false,
      error: { message: 'Internal server error' }
    },
    { status: 500 }
  );
}
