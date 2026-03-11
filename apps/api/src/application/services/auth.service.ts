/**
 * File Description:
 * This file implements apps/api/src/application/services/auth.service.ts.
 *
 * Purpose:
 * Implement business/feature orchestration logic.
 *
 * Key Responsibilities:
 * - Execute feature/business rules.
 * - Coordinate dependencies (repositories/AI/cache).
 * - Return normalized results/errors.
 */

import { AppError } from '@/application/errors/app-error';
import { hashPassword, verifyPassword } from '@/infrastructure/auth/password';
import { signAccessToken, signRefreshToken } from '@/infrastructure/auth/jwt';
import { userRepository } from '@/infrastructure/repositories/user.repository';
import { workflowRepository } from '@/infrastructure/repositories/workflow.repository';

function toSafeUser(user: {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
  teamId?: string | null;
  teamName?: string | null;
  team?: { name: string | null } | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    teamId: user.teamId ?? null,
    teamName: user.team?.name ?? user.teamName ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

/** Purpose: Expose authService operations for this module. */
export const authService = {
  /** Purpose: Execute register operation for this module. */
  async register(input: { name: string; email: string; password: string; teamId: string }) {
    return this.createUser({
      name: input.name,
      email: input.email,
      password: input.password,
      teamId: input.teamId,
      role: 'USER'
    });
  },

  /** Purpose: Execute createUser operation for this module. */
  async createUser(input: { name: string; email: string; password: string; teamId: string; role?: 'ADMIN' | 'USER' }) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new AppError('User with this email already exists', 409);
    }

    const team = await workflowRepository.findTeamById(input.teamId);
    if (!team) {
      throw new AppError('Selected team does not exist', 400);
    }

    const passwordHash = await hashPassword(input.password);
    const user = await userRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
      teamId: input.teamId,
      teamName: team.name,
      role: input.role ?? 'USER'
    });

    return {
      user: toSafeUser(user)
    };
  },

  /** Purpose: Execute login operation for this module. */
  async login(input: { email: string; password: string }) {
    const user = await userRepository.findByEmail(input.email);
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const isValid = await verifyPassword(input.password, user.passwordHash);
    if (!isValid) {
      throw new AppError('Invalid credentials', 401);
    }

    const payload = { sub: user.id, role: user.role, email: user.email } as const;

    let hydratedUser = user;
    if (!user.teamId || !user.teamName) {
      const withTeam = await userRepository.findById(user.id);
      if (withTeam) {
        hydratedUser = {
          ...user,
          teamId: withTeam.teamId,
          teamName: withTeam.team?.name ?? withTeam.teamName ?? null
        };
      }
    }

    return {
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload),
      user: toSafeUser(hydratedUser)
    };
  }
};
