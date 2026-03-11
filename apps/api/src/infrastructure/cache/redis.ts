/**
 * File Description:
 * This file implements apps/api/src/infrastructure/cache/redis.ts.
 *
 * Purpose:
 * Provide module-specific logic used by the project runtime.
 *
 * Key Responsibilities:
 * - Encapsulate focused module behavior.
 * - Expose reusable exports.
 * - Support maintainable project structure.
 */

import IORedis from 'ioredis';
import { env } from '@/infrastructure/config/env';
import { logger } from '@/infrastructure/logger/logger';

let redisInstance: IORedis | null = null;

/** Purpose: Execute getRedis logic for this module. */
export function getRedis() {
  if (!redisInstance) {
    redisInstance = new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      lazyConnect: true
    });

    redisInstance.on('error', (error) => {
      logger.warn({ err: error, redisUrl: env.REDIS_URL }, 'Redis connection error');
    });
  }

  return redisInstance;
}
