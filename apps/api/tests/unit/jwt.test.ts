/**
 * File Description:
 * Unit tests for JWT token signing and verification helpers.
 *
 * Purpose:
 * Ensure round-trip token creation preserves required auth claims.
 */

import { signAccessToken, verifyAccessToken } from '@/infrastructure/auth/jwt';

describe('jwt', () => {
  it('signs and verifies token', () => {
    const token = signAccessToken({
      sub: 'user1',
      role: 'USER',
      email: 'user@example.com'
    });

    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe('user1');
  });
});
