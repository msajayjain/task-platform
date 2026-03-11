/**
 * File Description:
 * This file implements apps/api/src/app/api/users/route.ts.
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
import { z } from 'zod';
import { fail, ok } from '@/presentation/http/response';
import { requireAuth } from '@/presentation/middlewares/auth.middleware';
import { requireRole } from '@/presentation/middlewares/rbac.middleware';
import { userRepository } from '@/infrastructure/repositories/user.repository';
import { authService } from '@/application/services/auth.service';
import { parseJson } from '@/presentation/http/request';

const createUserSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().email().max(255),
  password: z.string().min(10).max(72),
  teamId: z.string().cuid(),
  role: z.enum(['ADMIN', 'USER']).optional()
});

/** Purpose: Execute GET logic for this module. */
export async function GET(req: NextRequest) {
  try {
    requireAuth(req);
    const teamId = req.nextUrl.searchParams.get('teamId');
    if (teamId) {
      return ok(await userRepository.listByTeam(teamId));
    }

    return ok(await userRepository.list());
  } catch (error) {
    return fail(error);
  }
}

/** Purpose: Execute POST logic for this module. */
export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    requireRole(user.role, ['ADMIN']);

    const payload = createUserSchema.parse(await parseJson(req));
    const result = await authService.createUser(payload);

    return ok({
      success: true,
      message: 'User created successfully',
      userId: result.user.id,
      user: result.user
    }, 201);
  } catch (error) {
    return fail(error);
  }
}
