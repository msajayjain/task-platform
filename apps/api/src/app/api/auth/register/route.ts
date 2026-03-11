/**
 * File Description:
 * This file implements apps/api/src/app/api/auth/register/route.ts.
 *
 * Purpose:
 * Define API route entry points for endpoint handling.
 *
 * Key Responsibilities:
 * - Encapsulate focused module behavior.
 * - Expose reusable exports.
 * - Support maintainable project structure.
 */

import { NextRequest } from 'next/server';
import { registerController } from '@/presentation/controllers/auth.controller';

/** Purpose: Execute POST logic for this module. */
export async function POST(req: NextRequest) {
  return registerController(req);
}
