/**
 * File Description:
 * This file implements apps/api/src/presentation/middlewares/rate-limit.middleware.ts.
 *
 * Purpose:
 * Enforce cross-cutting request policies and guards.
 *
 * Key Responsibilities:
 * - Encapsulate focused module behavior.
 * - Expose reusable exports.
 * - Support maintainable project structure.
 */

import { NextRequest } from 'next/server';
import { AppError } from '@/application/errors/app-error';
import { getRedis } from '@/infrastructure/cache/redis';
import { logger } from '@/infrastructure/logger/logger';

const RATE_LIMIT_REDIS_TIMEOUT_MS = 800;

/** Purpose: Execute rateLimit logic for this module. */
export async function rateLimit(req: NextRequest, keyPrefix: string, limit = 100, windowSeconds = 60) {
  try {
    const redis = getRedis();
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const key = `rl:${keyPrefix}:${ip}`;

    const tx = redis.multi();
    tx.incr(key);
    tx.expire(key, windowSeconds);
    const result = await Promise.race([
      tx.exec(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Rate limit Redis timeout')), RATE_LIMIT_REDIS_TIMEOUT_MS);
      })
    ]);

    const count = Number(result?.[0]?.[1] ?? 0);
    if (count > limit) {
      throw new AppError('Too many requests', 429);
    }
  } catch (error) {
    logger.warn({ err: error, keyPrefix }, 'Rate limiter unavailable; continuing without Redis enforcement');
  }
}
