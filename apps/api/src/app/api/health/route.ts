/**
 * File Description:
 * This file implements apps/api/src/app/api/health/route.ts.
 *
 * Purpose:
 * Define API route entry points for endpoint handling.
 *
 * Key Responsibilities:
 * - Encapsulate focused module behavior.
 * - Expose reusable exports.
 * - Support maintainable project structure.
 */

import { NextResponse } from 'next/server';
import { env } from '@/infrastructure/config/env';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function checkLocalLlmReadiness() {
  const configuredModel = (env.LOCAL_LLM_MODEL ?? '').trim();
  const configuredUrl = (env.LOCAL_LLM_API_URL ?? '').trim();
  const tagsUrl = configuredUrl.replace(/\/api\/generate\/?$/i, '/api/tags');

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const response = await fetch(tagsUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      return {
        reachable: false,
        modelConfigured: configuredModel,
        modelAvailable: false,
        endpoint: tagsUrl
      };
    }

    const payload = (await response.json()) as { models?: Array<{ name?: string }> };
    const names = (payload.models ?? []).map((model) => model.name ?? '').filter(Boolean);
    const modelAvailable = configuredModel ? names.includes(configuredModel) : false;

    return {
      reachable: true,
      modelConfigured: configuredModel,
      modelAvailable,
      endpoint: tagsUrl,
      installedModelsCount: names.length
    };
  } catch {
    return {
      reachable: false,
      modelConfigured: configuredModel,
      modelAvailable: false,
      endpoint: tagsUrl
    };
  }
}

/** Purpose: Execute GET logic for this module. */
export async function GET() {
  const localLlm = await checkLocalLlmReadiness();

  return NextResponse.json({
    success: true,
    status: 'ok',
    ai: {
      mode: env.AI_FALLBACK_PROVIDER,
      defaultCloudModel: env.FREE_GEMINI_MODEL,
      localLlm
    }
  });
}
