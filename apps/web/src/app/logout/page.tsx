/**
 * File Description:
 * This file implements apps/web/src/app/logout/page.tsx.
 *
 * Purpose:
 * Provide module-specific logic used by the project runtime.
 *
 * Key Responsibilities:
 * - Encapsulate focused module behavior.
 * - Expose reusable exports.
 * - Support maintainable project structure.
 */

import { redirect } from 'next/navigation';

/** Purpose: Execute LogoutPage logic for this module. */
export default function LogoutPage() {
  redirect('/login');
}
