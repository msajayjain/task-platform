/**
 * File Description:
 * Unit tests for authentication validators.
 *
 * Purpose:
 * Verify expected accept/reject behavior for login and registration payload schemas.
 */

import { loginSchema, registerSchema } from '@/application/validators/auth.validator';

describe('auth validators', () => {
  it('validates register payload', () => {
    const strongPassword = `StrongPass@${Date.now()}`;
    const parsed = registerSchema.parse({
      name: 'Test User',
      email: 'test@example.com',
      password: strongPassword,
      teamId: 'cmmft7qts0000tou50eig8px4'
    });

    expect(parsed.email).toBe('test@example.com');
  });

  it('rejects weak login payload', () => {
    const weakPassword = String(Date.now() % 1000);
    expect(() =>
      loginSchema.parse({
        email: 'bad',
        password: weakPassword
      })
    ).toThrow();
  });
});
