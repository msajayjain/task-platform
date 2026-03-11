/**
 * File Description:
 * This file implements apps/api/src/application/validators/auth.validator.ts.
 *
 * Purpose:
 * Validate and normalize incoming data contracts.
 *
 * Key Responsibilities:
 * - Encapsulate focused module behavior.
 * - Expose reusable exports.
 * - Support maintainable project structure.
 */

import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(255),
  password: z.string().min(10).max(72),
  teamId: z.string().cuid()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(10).max(72)
});
