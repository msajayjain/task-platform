/**
 * File Description:
 * This file implements apps/api/src/middleware.ts.
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
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Helmet-like security headers for OWASP hardening.
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'no-referrer');
  response.headers.set('X-XSS-Protection', '0');
  response.headers.set('Content-Security-Policy', "default-src 'self'; frame-ancestors 'none'; base-uri 'self';");

  if (request.nextUrl.pathname.startsWith('/api')) {
    response.headers.set('Cache-Control', 'no-store');
  }

  return response;
}

/** Purpose: Expose config operations for this module. */
export const config = {
  matcher: ['/api/:path*']
};
