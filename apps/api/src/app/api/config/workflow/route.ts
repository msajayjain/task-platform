/**
 * File Description:
 * This file implements apps/api/src/app/api/config/workflow/route.ts.
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
import { AppError } from '@/application/errors/app-error';
import { workflowService } from '@/application/services/workflow.service';
import { userRepository } from '@/infrastructure/repositories/user.repository';
import { requireAuth } from '@/presentation/middlewares/auth.middleware';
import { fail, ok } from '@/presentation/http/response';

/** Purpose: Execute GET logic for this module. */
export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const requestedTeamId = req.nextUrl.searchParams.get('teamId');

    let teamId: string | null = requestedTeamId;

    if (user.role !== 'ADMIN') {
      const dbUser = await userRepository.findById(user.sub);
      if (!dbUser) {
        throw new AppError('User not found', 404);
      }

      if (!dbUser.teamId) {
        throw new AppError('User team is not configured', 400);
      }

      if (requestedTeamId && requestedTeamId !== dbUser.teamId) {
        throw new AppError('Forbidden', 403);
      }

      teamId = dbUser.teamId;
    }

    const workflow = teamId ? await workflowService.getEffectiveWorkflowByTeam(teamId) : await workflowService.getDefaultWorkflow();
    return ok({
      workflowStages: workflow.stages.map((stage) => ({
        id: stage.id,
        label: stage.label,
        kind: stage.kind
      }))
    });
  } catch (error) {
    return fail(error);
  }
}
