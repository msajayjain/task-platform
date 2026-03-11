/**
 * File Description:
 * This file implements apps/api/src/infrastructure/config/env.ts.
 *
 * Purpose:
 * Provide module-specific logic used by the project runtime.
 *
 * Key Responsibilities:
 * - Encapsulate focused module behavior.
 * - Expose reusable exports.
 * - Support maintainable project structure.
 */

import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';

const envCandidates = [resolve(process.cwd(), '.env'), resolve(process.cwd(), '../../.env')];
for (const envPath of envCandidates) {
  if (existsSync(envPath)) {
    loadEnv({ path: envPath });
    break;
  }
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1).default('postgresql://postgres:postgres@localhost:5432/task_platform'),
  JWT_ACCESS_SECRET: z.string().min(32).default('dev_access_secret_please_change_123456'),
  JWT_REFRESH_SECRET: z.string().min(32).default('dev_refresh_secret_please_change_123456'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('7d'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  FREE_GEMINI_KEY: z.string().default(process.env.FREE_GEMINI_KEY ?? process.env.GEMINI_API_KEY ?? process.env.OPENAI_API_KEY ?? 'dev_gemini_key_placeholder'),
  FREE_GEMINI_MODEL: z.string().default('gemini-2.0-flash-lite'),
  FREE_GEMINI_API_URL: z.string().url().default('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent'),
  AI_FALLBACK_PROVIDER: z.enum(['none', 'huggingface', 'local', 'auto']).default('none'),
  HUGGINGFACE_API_KEY: z.string().optional(),
  HUGGINGFACE_MODEL: z.string().default('HuggingFaceH4/zephyr-7b-beta'),
  HUGGINGFACE_API_URL: z.string().url().default('https://api-inference.huggingface.co/models'),
  LOCAL_LLM_MODEL: z.string().default('llama3.2:3b'),
  LOCAL_LLM_API_URL: z.string().url().default('http://127.0.0.1:11434/api/generate'),
  WEB_BASE_URL: z.string().url().optional(),
  CSRF_SECRET: z.string().min(32).default('dev_csrf_secret_please_change_123456789')
});

export const env = envSchema.parse(process.env);
