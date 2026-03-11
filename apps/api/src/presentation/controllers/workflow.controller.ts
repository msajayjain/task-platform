/**
 * File Description:
 * This file implements apps/api/src/presentation/controllers/workflow.controller.ts.
 *
 * Purpose:
 * Handle HTTP request orchestration and response shaping.
 *
 * Key Responsibilities:
 * - Validate request context and inputs.
 * - Delegate work to services.
 * - Return standardized API responses.
 */

import { NextRequest } from 'next/server';
import { WorkflowStageKind } from '@prisma/client';
import { z } from 'zod';
import { workflowService } from '@/application/services/workflow.service';
import { parseJson } from '@/presentation/http/request';
import { fail, ok } from '@/presentation/http/response';
import { requireAuth } from '@/presentation/middlewares/auth.middleware';
import { requireRole } from '@/presentation/middlewares/rbac.middleware';

const teamCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional()
});

const adminWorkflowSchema = z.object({
  teamId: z.string().cuid().optional(),
  workflowName: z.string().trim().min(2).max(120),
  stages: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(120).optional(),
        stageName: z.string().trim().min(1).max(120).optional(),
        stageOrder: z.number().int().min(1).optional(),
        order: z.number().int().min(1).optional(),
        kind: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED']).optional()
      })
    )
    .min(1)
});

/** Purpose: Execute listTeamsController logic for this module. */
export async function listTeamsController(req: NextRequest) {
  try {
    requireAuth(req);
    return ok(await workflowService.listTeams());
  } catch (error) {
    return fail(error);
  }
}

/** Purpose: Execute createTeamController logic for this module. */
export async function createTeamController(req: NextRequest) {
  try {
    const user = requireAuth(req);
    requireRole(user.role, ['ADMIN']);
    const payload = teamCreateSchema.parse(await parseJson(req));
    return ok(await workflowService.createTeam(payload), 201);
  } catch (error) {
    return fail(error);
  }
}

/** Purpose: Execute getTeamWorkflowController logic for this module. */
export async function getTeamWorkflowController(req: NextRequest, teamId: string) {
  try {
    requireAuth(req);
    return ok(await workflowService.getEffectiveWorkflowByTeam(teamId));
  } catch (error) {
    return fail(error);
  }
}

/** Purpose: Execute listAdminWorkflowsController logic for this module. */
export async function listAdminWorkflowsController(req: NextRequest) {
  try {
    const user = requireAuth(req);
    requireRole(user.role, ['ADMIN']);
    return ok(await workflowService.listWorkflows());
  } catch (error) {
    return fail(error);
  }
}

/** Purpose: Execute saveAdminWorkflowController logic for this module. */
export async function saveAdminWorkflowController(req: NextRequest) {
  try {
    const user = requireAuth(req);
    requireRole(user.role, ['ADMIN']);
    const payload = adminWorkflowSchema.parse(await parseJson(req));

    const normalizedStages = payload.stages.map((stage, index) => {
      const label = (stage.label ?? stage.stageName ?? '').trim();
      const stageOrder = stage.stageOrder ?? stage.order ?? index + 1;
      return {
        label,
        stageOrder,
        kind: stage.kind
      };
    });

    if (normalizedStages.some((stage) => !stage.label)) {
      throw new z.ZodError([
        {
          code: 'custom',
          path: ['stages'],
          message: 'Stage names must not be empty'
        }
      ]);
    }

    const uniqueOrders = new Set(normalizedStages.map((stage) => stage.stageOrder));
    if (uniqueOrders.size !== normalizedStages.length) {
      throw new z.ZodError([
        {
          code: 'custom',
          path: ['stages'],
          message: 'Stage order must be unique'
        }
      ]);
    }

    const orderedStages = [...normalizedStages].sort((a, b) => a.stageOrder - b.stageOrder);

    return ok(
      await workflowService.saveWorkflow({
        teamId: payload.teamId,
        workflowName: payload.workflowName,
        stages: orderedStages.map((stage, index) => {
          let fallbackKind: WorkflowStageKind = 'IN_PROGRESS';
          if (index === 0) {
            fallbackKind = 'TODO';
          } else if (index === orderedStages.length - 1) {
            fallbackKind = 'COMPLETED';
          }

          return {
            label: stage.label,
            kind: (stage.kind as WorkflowStageKind | undefined) ?? fallbackKind
          };
        })
      })
    );
  } catch (error) {
    return fail(error);
  }
}