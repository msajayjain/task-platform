/**
 * File Description:
 * This file implements apps/api/src/app/api/tasks/[id]/route.ts.
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
import { deleteTaskController, getTaskDetailController, updateTaskController } from '@/presentation/controllers/task.controller';

/** Purpose: Execute GET logic for this module. */
export async function GET(req: NextRequest, context: { params: { id: string } }) {
  return getTaskDetailController(req, context.params.id);
}

/** Purpose: Execute PUT logic for this module. */
export async function PUT(req: NextRequest, context: { params: { id: string } }) {
  return updateTaskController(req, context.params.id);
}

/** Purpose: Execute DELETE logic for this module. */
export async function DELETE(req: NextRequest, context: { params: { id: string } }) {
  return deleteTaskController(req, context.params.id);
}
