/**
 * File Description:
 * This file implements apps/api/src/presentation/controllers/ui-config.controller.ts.
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
import { z } from 'zod';
import { uiConfigService } from '@/application/services/ui-config.service';
import { parseJson } from '@/presentation/http/request';
import { fail, ok } from '@/presentation/http/response';
import { requireAuth } from '@/presentation/middlewares/auth.middleware';
import { requireRole } from '@/presentation/middlewares/rbac.middleware';

const saveSchema = z.object({
  screenName: z.enum(['create-task', 'task-details', 'my-created-grid']),
  fields: z.array(
    z.object({
      fieldName: z.string().min(1),
      displayOrder: z.number().int().min(0),
      isVisible: z.boolean()
    })
  )
});

/** Purpose: Execute getPublicUiConfigController logic for this module. */
export async function getPublicUiConfigController(req: NextRequest) {
  try {
    requireAuth(req);
    const screenName = req.nextUrl.searchParams.get('screenName');
    if (!screenName) {
      return ok(await uiConfigService.listAllConfigs());
    }

    return ok(await uiConfigService.getScreenConfig(screenName));
  } catch (error) {
    return fail(error);
  }
}

/** Purpose: Execute listAdminUiConfigController logic for this module. */
export async function listAdminUiConfigController(req: NextRequest) {
  try {
    const user = requireAuth(req);
    requireRole(user.role, ['ADMIN']);
    const screenName = req.nextUrl.searchParams.get('screenName');
    if (!screenName) {
      return ok(await uiConfigService.listAllConfigs());
    }

    return ok(await uiConfigService.getScreenConfig(screenName));
  } catch (error) {
    return fail(error);
  }
}

/** Purpose: Execute saveAdminUiConfigController logic for this module. */
export async function saveAdminUiConfigController(req: NextRequest) {
  try {
    const user = requireAuth(req);
    requireRole(user.role, ['ADMIN']);
    const payload = saveSchema.parse(await parseJson(req));
    return ok(await uiConfigService.saveScreenConfig(payload));
  } catch (error) {
    return fail(error);
  }
}
