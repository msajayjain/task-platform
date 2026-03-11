/**
 * File Description:
 * This file implements apps/api/src/app/api/config/dropdowns/route.ts.
 *
 * Purpose:
 * Define API route entry points for endpoint handling.
 *
 * Key Responsibilities:
 * - Encapsulate focused module behavior.
 * - Expose reusable exports.
 * - Support maintainable project structure.
 */

import { getDropdownConfig } from '@/infrastructure/config/dropdown-config';
import { fail, ok } from '@/presentation/http/response';

/** Purpose: Execute GET logic for this module. */
export async function GET() {
  try {
    return ok(getDropdownConfig());
  } catch (error) {
    return fail(error);
  }
}
