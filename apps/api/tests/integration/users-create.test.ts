/**
 * File Description:
 * Integration-style route tests for admin user creation endpoint.
 *
 * Purpose:
 * Verify success, conflict, and invalid-team scenarios for user provisioning API.
 */

import { NextRequest } from 'next/server';
import { POST as createUserRoute } from '@/app/api/users/create/route';
import { requireAuth } from '@/presentation/middlewares/auth.middleware';
import { requireRole } from '@/presentation/middlewares/rbac.middleware';
import { authService } from '@/application/services/auth.service';
import { AppError } from '@/application/errors/app-error';

jest.mock('@/presentation/middlewares/auth.middleware', () => ({
  requireAuth: jest.fn()
}));

jest.mock('@/presentation/middlewares/rbac.middleware', () => ({
  requireRole: jest.fn()
}));

jest.mock('@/application/services/auth.service', () => ({
  authService: {
    createUser: jest.fn()
  }
}));

describe('POST /api/users/create', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireAuth as jest.Mock).mockReturnValue({ sub: 'admin-id', role: 'ADMIN', email: 'admin@task.local' });
    (requireRole as jest.Mock).mockReturnValue(undefined);
  });

  it('creates user successfully for admin', async () => {
    (authService.createUser as jest.Mock).mockResolvedValue({
      user: {
        id: 'user-1',
        name: 'New User',
        email: 'new.user@task.local',
        role: 'USER',
        teamId: 'team-1',
        teamName: 'Development',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });

    const req = new NextRequest('http://localhost:3001/api/users/create', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer token' },
      body: JSON.stringify({
        name: 'New User',
        email: 'new.user@task.local',
        password: 'StrongPass@12345',
        teamId: 'cmmft7qts0000tou50eig8px4',
        role: 'USER'
      })
    });

    const response = await createUserRoute(req);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.message).toBe('User created successfully');
    expect(body.data.userId).toBe('user-1');
    expect(authService.createUser).toHaveBeenCalledWith({
      name: 'New User',
      email: 'new.user@task.local',
      password: 'StrongPass@12345',
      teamId: 'cmmft7qts0000tou50eig8px4',
      role: 'USER'
    });
  });

  it('returns conflict when email already exists', async () => {
    (authService.createUser as jest.Mock).mockRejectedValue(new AppError('User with this email already exists', 409));

    const req = new NextRequest('http://localhost:3001/api/users/create', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer token' },
      body: JSON.stringify({
        name: 'Existing User',
        email: 'existing@task.local',
        password: 'StrongPass@12345',
        teamId: 'cmmft7qts0000tou50eig8px4',
        role: 'USER'
      })
    });

    const response = await createUserRoute(req);
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.success).toBe(false);
    expect(body.error.message).toBe('User with this email already exists');
  });

  it('returns bad request when team does not exist', async () => {
    (authService.createUser as jest.Mock).mockRejectedValue(new AppError('Selected team does not exist', 400));

    const req = new NextRequest('http://localhost:3001/api/users/create', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer token' },
      body: JSON.stringify({
        name: 'Bad Team User',
        email: 'bad.team@task.local',
        password: 'StrongPass@12345',
        teamId: 'cmmbadteam0000000000000000',
        role: 'USER'
      })
    });

    const response = await createUserRoute(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.message).toBe('Selected team does not exist');
  });
});
