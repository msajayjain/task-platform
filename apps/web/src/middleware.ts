/**
 * File Description:
 * This file implements apps/web/src/middleware.ts.
 *
 * Purpose:
 * Apply request pipeline behavior at app boundary.
 *
 * Key Responsibilities:
 * - Encapsulate focused module behavior.
 * - Expose reusable exports.
 * - Support maintainable project structure.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** Purpose: Execute middleware logic for this module. */
export function middleware(_request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return response;
}

/** Purpose: Expose config operations for this module. */
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
