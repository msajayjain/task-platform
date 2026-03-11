/**
 * File Description:
 * Integration-style controller tests for admin workflow save endpoint behavior.
 *
 * Purpose:
 * Validate payload normalization and validation error reporting for workflow stage definitions.
 */

import { NextRequest } from 'next/server';
import { saveAdminWorkflowController } from '@/presentation/controllers/workflow.controller';
import { workflowService } from '@/application/services/workflow.service';
import { requireAuth } from '@/presentation/middlewares/auth.middleware';
import { requireRole } from '@/presentation/middlewares/rbac.middleware';

jest.mock('@/application/services/workflow.service', () => ({
  workflowService: {
    saveWorkflow: jest.fn()
  }
}));

jest.mock('@/presentation/middlewares/auth.middleware', () => ({
  requireAuth: jest.fn()
}));

jest.mock('@/presentation/middlewares/rbac.middleware', () => ({
  requireRole: jest.fn()
}));

describe('POST /api/admin/workflows controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireAuth as jest.Mock).mockReturnValue({ sub: 'admin-id', role: 'ADMIN', email: 'admin@task.local' });
    (requireRole as jest.Mock).mockReturnValue(undefined);
  });

  it('accepts stageName/stageOrder payload and normalizes to ordered stages', async () => {
    (workflowService.saveWorkflow as jest.Mock).mockResolvedValue({
      id: 'wf-1',
      workflowName: 'Development Workflow',
      isDefault: false,
      teamId: 'team-1',
      teamName: 'Development',
      stages: [
        { id: 's1', label: 'Todo', order: 0, kind: 'TODO' },
        { id: 's2', label: 'In Progress', order: 1, kind: 'IN_PROGRESS' },
        { id: 's3', label: 'Completed', order: 2, kind: 'COMPLETED' }
      ]
    });

    const req = new NextRequest('http://localhost:3001/api/admin/workflows', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer token' },
      body: JSON.stringify({
        teamId: 'cmmft7qts0000tou50eig8px4',
        workflowName: 'Development Workflow',
        stages: [
          { stageName: 'In Progress', stageOrder: 2 },
          { stageName: 'Completed', stageOrder: 3 },
          { stageName: 'Todo', stageOrder: 1 }
        ]
      })
    });

    const response = await saveAdminWorkflowController(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(workflowService.saveWorkflow).toHaveBeenCalledWith({
      teamId: 'cmmft7qts0000tou50eig8px4',
      workflowName: 'Development Workflow',
      stages: [
        { label: 'Todo', kind: 'TODO' },
        { label: 'In Progress', kind: 'IN_PROGRESS' },
        { label: 'Completed', kind: 'COMPLETED' }
      ]
    });
  });

  it('returns clear validation message when stage order duplicates', async () => {
    const req = new NextRequest('http://localhost:3001/api/admin/workflows', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer token' },
      body: JSON.stringify({
        teamId: 'cmmft7qts0000tou50eig8px4',
        workflowName: 'Invalid Workflow',
        stages: [
          { stageName: 'Todo', stageOrder: 1 },
          { stageName: 'In Progress', stageOrder: 1 }
        ]
      })
    });

    const response = await saveAdminWorkflowController(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.message).toBe('Validation failed');
    expect(JSON.stringify(body.error.details)).toContain('Stage order must be unique');
    expect(workflowService.saveWorkflow).not.toHaveBeenCalled();
  });
});
