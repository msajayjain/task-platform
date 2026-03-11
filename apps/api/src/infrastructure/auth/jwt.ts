/**
 * File Description:
 * This file implements apps/api/src/infrastructure/auth/jwt.ts.
 *
 * Purpose:
 * Provide module-specific logic used by the project runtime.
 *
 * Key Responsibilities:
 * - Encapsulate focused module behavior.
 * - Expose reusable exports.
 * - Support maintainable project structure.
 */

import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '@/infrastructure/config/env';
import { AppError } from '@/application/errors/app-error';

export interface JwtPayload {
  sub: string;
  role: 'ADMIN' | 'USER';
  email: string;
}

/** Purpose: Execute signAccessToken logic for this module. */
export function signAccessToken(payload: JwtPayload): string {
  const options: SignOptions = { expiresIn: env.JWT_ACCESS_TTL as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

/** Purpose: Execute signRefreshToken logic for this module. */
export function signRefreshToken(payload: JwtPayload): string {
  const options: SignOptions = { expiresIn: env.JWT_REFRESH_TTL as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
}

/** Purpose: Execute verifyAccessToken logic for this module. */
export function verifyAccessToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
  } catch {
    throw new AppError('Invalid or expired access token', 401);
  }
}
