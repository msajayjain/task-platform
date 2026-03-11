/**
 * File Description:
 * This file implements apps/web/src/lib/utils.ts.
 *
 * Purpose:
 * Provide shared utility/client infrastructure helpers.
 *
 * Key Responsibilities:
 * - Encapsulate focused module behavior.
 * - Expose reusable exports.
 * - Support maintainable project structure.
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Purpose: Execute cn logic for this module. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
