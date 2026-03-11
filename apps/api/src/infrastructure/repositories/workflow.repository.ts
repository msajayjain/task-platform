/**
 * File Description:
 * This file implements apps/api/src/infrastructure/repositories/workflow.repository.ts.
 *
 * Purpose:
 * Provide persistence access and data retrieval operations.
 *
 * Key Responsibilities:
 * - Query and persist data.
 * - Encapsulate storage-specific logic.
 * - Return typed data objects.
 */

import { WorkflowStageKind } from '@prisma/client';
import { prisma } from '@/infrastructure/db/prisma';

/** Purpose: Expose workflowRepository operations for this module. */
export const workflowRepository = {
  /** Purpose: Execute listTeams operation for this module. */
  async listTeams() {
    return prisma.team.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true
      }
    });
  },

  /** Purpose: Execute createTeam operation for this module. */
  async createTeam(input: { name: string; description?: string }) {
    return prisma.team.create({
      data: {
        name: input.name,
        description: input.description
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true
      }
    });
  },

  /** Purpose: Execute findTeamById operation for this module. */
  async findTeamById(teamId: string) {
    return prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, name: true, description: true }
    });
  },

  /** Purpose: Execute findDefaultWorkflow operation for this module. */
  async findDefaultWorkflow() {
    return prisma.workflow.findFirst({
      where: { isDefault: true },
      orderBy: { createdAt: 'asc' },
      include: {
        stages: {
          orderBy: { stageOrder: 'asc' }
        }
      }
    });
  },

  /** Purpose: Execute findWorkflowByTeam operation for this module. */
  async findWorkflowByTeam(teamId: string) {
    return prisma.workflow.findFirst({
      where: { teamId },
      orderBy: { updatedAt: 'desc' },
      include: {
        stages: {
          orderBy: { stageOrder: 'asc' }
        }
      }
    });
  },

  /** Purpose: Execute listWorkflows operation for this module. */
  async listWorkflows() {
    return prisma.workflow.findMany({
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
      include: {
        team: {
          select: { id: true, name: true }
        },
        stages: {
          orderBy: { stageOrder: 'asc' }
        }
      }
    });
  },

  /** Purpose: Execute upsertDefaultWorkflow operation for this module. */
  async upsertDefaultWorkflow(input: { workflowName: string; stages: Array<{ stageName: string; kind: WorkflowStageKind }> }) {
    const existing = await this.findDefaultWorkflow();
    if (existing) {
      return prisma.workflow.update({
        where: { id: existing.id },
        data: {
          workflowName: input.workflowName,
          stages: {
            deleteMany: {},
            create: input.stages.map((stage, index) => ({
              stageName: stage.stageName,
              stageOrder: index,
              kind: stage.kind
            }))
          }
        },
        include: {
          team: {
            select: { id: true, name: true }
          },
          stages: { orderBy: { stageOrder: 'asc' } }
        }
      });
    }

    return prisma.workflow.create({
      data: {
        workflowName: input.workflowName,
        isDefault: true,
        stages: {
          create: input.stages.map((stage, index) => ({
            stageName: stage.stageName,
            stageOrder: index,
            kind: stage.kind
          }))
        }
      },
      include: {
        team: {
          select: { id: true, name: true }
        },
        stages: { orderBy: { stageOrder: 'asc' } }
      }
    });
  },

  /** Purpose: Execute upsertTeamWorkflow operation for this module. */
  async upsertTeamWorkflow(input: { teamId: string; workflowName: string; stages: Array<{ stageName: string; kind: WorkflowStageKind }> }) {
    const existing = await this.findWorkflowByTeam(input.teamId);
    if (existing) {
      return prisma.workflow.update({
        where: { id: existing.id },
        data: {
          workflowName: input.workflowName,
          stages: {
            deleteMany: {},
            create: input.stages.map((stage, index) => ({
              stageName: stage.stageName,
              stageOrder: index,
              kind: stage.kind
            }))
          }
        },
        include: {
          team: {
            select: { id: true, name: true }
          },
          stages: { orderBy: { stageOrder: 'asc' } }
        }
      });
    }

    return prisma.workflow.create({
      data: {
        workflowName: input.workflowName,
        teamId: input.teamId,
        isDefault: false,
        stages: {
          create: input.stages.map((stage, index) => ({
            stageName: stage.stageName,
            stageOrder: index,
            kind: stage.kind
          }))
        }
      },
      include: {
        team: {
          select: { id: true, name: true }
        },
        stages: { orderBy: { stageOrder: 'asc' } }
      }
    });
  }
};