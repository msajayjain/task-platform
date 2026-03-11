/**
 * File Description:
 * This file implements apps/api/src/app/api/tasks/my/route.ts.
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
import { listMyCreatedTasksController } from '@/presentation/controllers/task.controller';

/** Purpose: Execute GET logic for this module. */
export async function GET(req: NextRequest) {
  return listMyCreatedTasksController(req);
}
