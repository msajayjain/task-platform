/**
 * File Description:
 * This file implements apps/api/src/app/api/tasks/my/[id]/route.ts.
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
import { deleteMyTaskController, updateMyTaskController } from '@/presentation/controllers/task.controller';

/** Purpose: Execute PUT logic for this module. */
export async function PUT(req: NextRequest, context: { params: { id: string } }) {
  return updateMyTaskController(req, context.params.id);
}

/** Purpose: Execute DELETE logic for this module. */
export async function DELETE(req: NextRequest, context: { params: { id: string } }) {
  return deleteMyTaskController(req, context.params.id);
}
