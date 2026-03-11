/**
 * File Description:
 * This file implements apps/api/src/app/api/config/teams/route.ts.
 *
 * Purpose:
 * Define API route entry points for endpoint handling.
 *
 * Key Responsibilities:
 * - Encapsulate focused module behavior.
 * - Expose reusable exports.
 * - Support maintainable project structure.
 */

import { fail, ok } from '@/presentation/http/response';
import { workflowService } from '@/application/services/workflow.service';

/** Purpose: Execute GET logic for this module. */
export async function GET() {
  try {
    return ok(await workflowService.listTeams());
  } catch (error) {
    return fail(error);
  }
}
