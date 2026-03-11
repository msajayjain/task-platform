/**
 * File Description:
 * This file implements apps/api/src/app/api/workflows/team/[teamId]/route.ts.
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
import { getTeamWorkflowController } from '@/presentation/controllers/workflow.controller';

/** Purpose: Execute GET logic for this module. */
export async function GET(req: NextRequest, context: { params: { teamId: string } }) {
  return getTeamWorkflowController(req, context.params.teamId);
}