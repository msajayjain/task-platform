/**
 * File Description:
 * This file implements apps/api/src/app/api/tasks/[id]/comments/route.ts.
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
import { addTaskCommentController, listTaskCommentsController } from '@/presentation/controllers/task.controller';

/** Purpose: Execute GET logic for this module. */
export async function GET(req: NextRequest, context: { params: { id: string } }) {
  return listTaskCommentsController(req, context.params.id);
}

/** Purpose: Execute POST logic for this module. */
export async function POST(req: NextRequest, context: { params: { id: string } }) {
  return addTaskCommentController(req, context.params.id);
}
