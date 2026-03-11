/**
 * File Description:
 * This file implements apps/api/src/presentation/controllers/auth.controller.ts.
 *
 * Purpose:
 * Handle HTTP request orchestration and response shaping.
 *
 * Key Responsibilities:
 * - Validate request context and inputs.
 * - Delegate work to services.
 * - Return standardized API responses.
 */

import { NextRequest } from 'next/server';
import { authService } from '@/application/services/auth.service';
import { loginSchema, registerSchema } from '@/application/validators/auth.validator';
import { parseJson } from '@/presentation/http/request';
import { fail, ok } from '@/presentation/http/response';
import { issueCsrfToken } from '@/presentation/middlewares/csrf.middleware';
import { rateLimit } from '@/presentation/middlewares/rate-limit.middleware';

/** Purpose: Execute registerController logic for this module. */
export async function registerController(req: NextRequest) {
  try {
    await rateLimit(req, 'register', 10, 60);
    const payload = registerSchema.parse(await parseJson(req));
    const result = await authService.register(payload);
    return ok({ message: 'User created successfully', ...result }, 201);
  } catch (error) {
    return fail(error);
  }
}

/** Purpose: Execute loginController logic for this module. */
export async function loginController(req: NextRequest) {
  try {
    await rateLimit(req, 'login', 20, 60);
    const payload = loginSchema.parse(await parseJson(req));
    const result = await authService.login(payload);
    const csrfToken = issueCsrfToken(result.user.id);
    return ok({ ...result, csrfToken }, 200);
  } catch (error) {
    return fail(error);
  }
}
