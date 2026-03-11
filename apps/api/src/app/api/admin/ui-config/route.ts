/**
 * File Description:
 * This file implements apps/api/src/app/api/admin/ui-config/route.ts.
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
import { listAdminUiConfigController, saveAdminUiConfigController } from '@/presentation/controllers/ui-config.controller';

/** Purpose: Execute GET logic for this module. */
export async function GET(req: NextRequest) {
  return listAdminUiConfigController(req);
}

/** Purpose: Execute PUT logic for this module. */
export async function PUT(req: NextRequest) {
  return saveAdminUiConfigController(req);
}
