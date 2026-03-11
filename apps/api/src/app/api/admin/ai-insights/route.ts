/**
 * File Description:
 * This file implements apps/api/src/app/api/admin/ai-insights/route.ts.
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
import { adminAIInsightsController } from '@/presentation/controllers/ai.controller';

/** Purpose: Execute GET logic for this module. */
export async function GET(req: NextRequest) {
  return adminAIInsightsController(req);
}
