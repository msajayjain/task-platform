/**
 * File Description:
 * This file implements apps/web/src/lib/cache.ts.
 *
 * Purpose:
 * Provide shared utility/client infrastructure helpers.
 *
 * Key Responsibilities:
 * - Encapsulate focused module behavior.
 * - Expose reusable exports.
 * - Support maintainable project structure.
 */

import { mutate } from 'swr';

/** Purpose: Execute clearClientCaches logic for this module. */
export async function clearClientCaches() {
  // Clear all SWR caches to prevent cross-user data flashes.
  await mutate(() => true, undefined, { revalidate: false });
}
