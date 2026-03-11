/**
 * File Description:
 * This file implements apps/api/src/app/api/teams/route.ts.
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
import { createTeamController, listTeamsController } from '@/presentation/controllers/workflow.controller';

/** Purpose: Execute GET logic for this module. */
export async function GET(req: NextRequest) {
  return listTeamsController(req);
}

/** Purpose: Execute POST logic for this module. */
export async function POST(req: NextRequest) {
  return createTeamController(req);
}