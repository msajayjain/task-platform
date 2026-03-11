/**
 * File Description:
 * This file implements apps/api/src/app/api/tasks/[id]/status/route.ts.
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
import { updateTaskStatusController } from '@/presentation/controllers/task.controller';

/** Purpose: Execute PUT logic for this module. */
export async function PUT(req: NextRequest, context: { params: { id: string } }) {
  return updateTaskStatusController(req, context.params.id);
}
