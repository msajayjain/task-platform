/**
 * File Description:
 * This file implements apps/api/src/infrastructure/auth/password.ts.
 *
 * Purpose:
 * Provide module-specific logic used by the project runtime.
 *
 * Key Responsibilities:
 * - Encapsulate focused module behavior.
 * - Expose reusable exports.
 * - Support maintainable project structure.
 */

import bcrypt from 'bcrypt';
import { env } from '@/infrastructure/config/env';

/** Purpose: Execute hashPassword logic for this module. */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);
}

/** Purpose: Execute verifyPassword logic for this module. */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
