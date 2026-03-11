/**
 * File Description:
 * This file implements apps/api/src/infrastructure/repositories/user.repository.ts.
 *
 * Purpose:
 * Provide persistence access and data retrieval operations.
 *
 * Key Responsibilities:
 * - Query and persist data.
 * - Encapsulate storage-specific logic.
 * - Return typed data objects.
 */

import { prisma } from '@/infrastructure/db/prisma';

/** Purpose: Expose userRepository operations for this module. */
export const userRepository = {
  /** Purpose: Execute create operation for this module. */
  create(input: { name: string; email: string; passwordHash: string; teamId?: string; teamName?: string; role?: 'ADMIN' | 'USER' }) {
    return prisma.user.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash: input.passwordHash,
        teamId: input.teamId,
        teamName: input.teamName,
        role: input.role ?? 'USER'
      },
      include: {
        team: {
          select: {
            name: true
          }
        }
      }
    });
  },

  /** Purpose: Execute findByEmail operation for this module. */
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  },

  /** Purpose: Execute findById operation for this module. */
  findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        team: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
  },

  /** Purpose: Execute listByTeam operation for this module. */
  listByTeam(teamId: string) {
    return prisma.user.findMany({
      where: { teamId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        teamId: true,
        teamName: true,
        createdAt: true,
        updatedAt: true
      }
    });
  },

  /** Purpose: Execute assignMissingTeam operation for this module. */
  async assignMissingTeam(defaultTeamId: string, defaultTeamName: string) {
    await prisma.user.updateMany({
      where: {
        OR: [{ teamId: null }, { teamName: null }]
      },
      data: {
        teamId: defaultTeamId,
        teamName: defaultTeamName
      }
    });
  },

  /** Purpose: Execute list operation for this module. */
  list() {
    return prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        teamId: true,
        teamName: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }
};
