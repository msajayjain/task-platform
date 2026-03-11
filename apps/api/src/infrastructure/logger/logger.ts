/**
 * File Description:
 * This file implements apps/api/src/infrastructure/logger/logger.ts.
 *
 * Purpose:
 * Provide module-specific logic used by the project runtime.
 *
 * Key Responsibilities:
 * - Encapsulate focused module behavior.
 * - Expose reusable exports.
 * - Support maintainable project structure.
 */

import pino from 'pino';

export const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  redact: ['req.headers.authorization', 'password', 'token']
});
