/**
 * File Description:
 * This file implements apps/api/src/application/services/workflow.service.ts.
 *
 * Purpose:
 * Implement business/feature orchestration logic.
 *
 * Key Responsibilities:
 * - Execute feature/business rules.
 * - Coordinate dependencies (repositories/AI/cache).
 * - Return normalized results/errors.
 */

import { WorkflowStageKind } from '@prisma/client';
import { AppError } from '@/application/errors/app-error';
import { workflowRepository } from '@/infrastructure/repositories/workflow.repository';

const defaultStageBlueprint: Array<{ stageName: string; kind: WorkflowStageKind }> = [
  { stageName: 'Todo', kind: 'TODO' },
  { stageName: 'In Progress', kind: 'IN_PROGRESS' },
  { stageName: 'Completed', kind: 'COMPLETED' }
];

function normalizeWorkflow(workflow: {
  id: string;
  workflowName: string;
  isDefault: boolean;
  team?: { id: string; name: string } | null;
  stages: Array<{ id: string; stageName: string; stageOrder: number; kind: WorkflowStageKind }>;
}) {
  return {
    id: workflow.id,
    workflowName: workflow.workflowName,
    isDefault: workflow.isDefault,
    teamId: workflow.team?.id ?? null,
    teamName: workflow.team?.name ?? null,
    stages: workflow.stages.map((stage) => ({
      id: stage.id,
      label: stage.stageName,
      order: stage.stageOrder,
      kind: stage.kind
    }))
  };
}

/** Purpose: Expose workflowService operations for this module. */
export const workflowService = {
  /** Purpose: Execute ensureDefaultWorkflow operation for this module. */
  async ensureDefaultWorkflow() {
    const existing = await workflowRepository.findDefaultWorkflow();
    if (existing) {
      return existing;
    }

    return workflowRepository.upsertDefaultWorkflow({
      workflowName: 'Default Workflow',
      stages: defaultStageBlueprint
    });
  },

  /** Purpose: Execute listTeams operation for this module. */
  async listTeams() {
    return workflowRepository.listTeams();
  },

  /** Purpose: Execute createTeam operation for this module. */
  async createTeam(input: { name: string; description?: string }) {
    return workflowRepository.createTeam(input);
  },

  /** Purpose: Execute listWorkflows operation for this module. */
  async listWorkflows() {
    await this.ensureDefaultWorkflow();
    const workflows = await workflowRepository.listWorkflows();
    return workflows.map(normalizeWorkflow);
  },

  /** Purpose: Execute getDefaultWorkflow operation for this module. */
  async getDefaultWorkflow() {
    await this.ensureDefaultWorkflow();
    const fallback = await workflowRepository.findDefaultWorkflow();
    if (!fallback) {
      throw new AppError('Default workflow not found', 500);
    }

    return normalizeWorkflow(fallback);
  },

  /** Purpose: Execute getEffectiveWorkflowByTeam operation for this module. */
  async getEffectiveWorkflowByTeam(teamId: string) {
    await this.ensureDefaultWorkflow();
    const team = await workflowRepository.findTeamById(teamId);
    if (!team) {
      throw new AppError('Team not found', 404);
    }

    const teamWorkflow = await workflowRepository.findWorkflowByTeam(teamId);
    if (teamWorkflow) {
      return normalizeWorkflow({
        ...teamWorkflow,
        team: {
          id: team.id,
          name: team.name
        }
      });
    }

    const fallback = await workflowRepository.findDefaultWorkflow();
    if (!fallback) {
      throw new AppError('Default workflow not found', 500);
    }

    return normalizeWorkflow(fallback);
  },

  async saveWorkflow(input: {
    teamId?: string;
    workflowName: string;
    stages: Array<{ label: string; kind: WorkflowStageKind }>;
  }) {
    if (input.stages.length < 1) {
      throw new AppError('Workflow must have at least one stage', 400);
    }

    if (input.teamId) {
      const team = await workflowRepository.findTeamById(input.teamId);
      if (!team) {
        throw new AppError('Selected team does not exist', 400);
      }
    }

    const normalizedStages = input.stages.map((stage) => ({
      stageName: stage.label.trim(),
      kind: stage.kind
    }));

    if (normalizedStages.some((stage) => !stage.stageName)) {
      throw new AppError('Workflow stage labels cannot be empty', 400);
    }

    const saved = input.teamId
      ? await workflowRepository.upsertTeamWorkflow({
          teamId: input.teamId,
          workflowName: input.workflowName.trim(),
          stages: normalizedStages
        })
      : await workflowRepository.upsertDefaultWorkflow({
          workflowName: input.workflowName.trim(),
          stages: normalizedStages
        });

    return normalizeWorkflow(saved);
  }
};