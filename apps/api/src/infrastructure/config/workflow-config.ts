/**
 * File Description:
 * This file implements apps/api/src/infrastructure/config/workflow-config.ts.
 *
 * Purpose:
 * Provide module-specific logic used by the project runtime.
 *
 * Key Responsibilities:
 * - Encapsulate focused module behavior.
 * - Expose reusable exports.
 * - Support maintainable project structure.
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import { AppError } from '@/application/errors/app-error';

const workflowSchema = z.object({
  workflowStages: z.array(z.string().trim().min(1)).min(3)
});

export interface WorkflowStageDto {
  id: string;
  label: string;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED_PENDING_APPROVAL';
}

const candidatePaths = [resolve(process.cwd(), 'config/workflow.json'), resolve(process.cwd(), '../../config/workflow.json')];

/**
 * Maps user-friendly stage labels to persisted workflow statuses.
 * - First stage maps to backlog stage
 * - Last stage maps to completion-pending-approval stage
 * - Intermediate stages map to IN_PROGRESS
 */
export function getWorkflowStages(): WorkflowStageDto[] {
  const configPath = candidatePaths.find((path) => existsSync(path));
  if (!configPath) {
    throw new AppError('Workflow configuration not found', 500);
  }

  const raw = readFileSync(configPath, 'utf8');
  const parsed = workflowSchema.parse(JSON.parse(raw) as unknown);

  const lastIndex = parsed.workflowStages.length - 1;
  return parsed.workflowStages.map((label, index) => {
    let status: WorkflowStageDto['status'] = 'IN_PROGRESS';
    if (index === 0) {
      status = 'TODO';
    } else if (index === lastIndex) {
      status = 'COMPLETED_PENDING_APPROVAL';
    }

    return {
      id: label.toLowerCase().replaceAll(' ', '-'),
      label,
      status
    };
  });
}
