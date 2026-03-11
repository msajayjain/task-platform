/**
 * File Description:
 * This file implements apps/api/src/presentation/controllers/ai.controller.ts.
 *
 * Purpose:
 * Handle HTTP request orchestration and response shaping.
 *
 * Key Responsibilities:
 * - Validate request context and inputs.
 * - Delegate work to services.
 * - Return standardized API responses.
 */

import { NextRequest } from 'next/server';
import { aiService } from '@/services/aiService';
import {
  aiCategorizeSchema,
  aiDuplicateSchema,
  aiPrioritySchema,
  aiResolutionSchema,
  aiRootCauseSchema,
  aiSummarySchema,
  aiTaskSchema
} from '@/application/validators/task.validator';
import { taskRepository } from '@/infrastructure/repositories/task.repository';
import { logger } from '@/infrastructure/logger/logger';
import { parseJson } from '@/presentation/http/request';
import { fail, ok } from '@/presentation/http/response';
import { requireAuth } from '@/presentation/middlewares/auth.middleware';
import { validateCsrf } from '@/presentation/middlewares/csrf.middleware';
import { rateLimit } from '@/presentation/middlewares/rate-limit.middleware';
import { requireRole } from '@/presentation/middlewares/rbac.middleware';
import { prisma } from '@/infrastructure/db/prisma';
import { env } from '@/infrastructure/config/env';

function resolveAiProviderLabel(): 'local-llm' | 'huggingface' | 'gemini' | 'auto' {
  if (env.AI_FALLBACK_PROVIDER === 'local') return 'local-llm';
  if (env.AI_FALLBACK_PROVIDER === 'huggingface') return 'huggingface';
  if (env.AI_FALLBACK_PROVIDER === 'auto') return 'auto';
  return 'gemini';
}

function logAI(userId: string, feature: string, payload: Record<string, unknown>) {
  logger.info(
    {
      userId,
      feature,
      payload
    },
    'AI feature request'
  );
}

/** Purpose: Execute aiSummarizeController logic for this module. */
export async function aiSummarizeController(req: NextRequest) {
  try {
    const user = requireAuth(req);
    validateCsrf(req, user.sub);
    await rateLimit(req, 'ai-summarize', 40, 60);

    const payload = aiSummarySchema.parse(await parseJson(req));
    logAI(user.sub, 'summarize', { titleLength: payload.title.length, descriptionLength: payload.description.length });

    const result = await aiService.generateTaskSummary(payload);
    return ok(result);
  } catch (error) {
    return fail(error);
  }
}

/** Purpose: Execute aiSuggestPriorityController logic for this module. */
export async function aiSuggestPriorityController(req: NextRequest) {
  try {
    const user = requireAuth(req);
    validateCsrf(req, user.sub);
    await rateLimit(req, 'ai-priority', 40, 60);

    const payload = aiPrioritySchema.parse(await parseJson(req));
    logAI(user.sub, 'suggest-priority', { titleLength: payload.title.length, descriptionLength: payload.description.length });

    const suggestion = await aiService.suggestPriority(payload);
    return ok({
      ...suggestion,
      warning:
        suggestion.priority === 'UNKNOWN'
          ? 'AI could not confidently determine priority. Please set manually.'
          : undefined
    });
  } catch (error) {
    return fail(error);
  }
}

/** Purpose: Execute aiParseTaskController logic for this module. */
export async function aiParseTaskController(req: NextRequest) {
  try {
    const user = requireAuth(req);
    validateCsrf(req, user.sub);
    await rateLimit(req, 'ai-parse-task', 30, 60);

    const payload = aiTaskSchema.pick({ text: true }).parse(await parseJson(req));
    logAI(user.sub, 'parse-task', { textLength: payload.text.length });

    const parsed = await aiService.parseNaturalLanguageTask(payload);
    return ok(parsed);
  } catch (error) {
    return fail(error);
  }
}

/** Purpose: Execute aiDetectDuplicatesController logic for this module. */
export async function aiDetectDuplicatesController(req: NextRequest) {
  try {
    const user = requireAuth(req);
    validateCsrf(req, user.sub);
    await rateLimit(req, 'ai-detect-duplicates', 50, 60);

    const payload = aiDuplicateSchema.parse(await parseJson(req));
    logAI(user.sub, 'detect-duplicates', { titleLength: payload.title.length, descriptionLength: payload.description.length });

    const existingIssues = await taskRepository.findDuplicateCandidates();
    const result = await aiService.detectDuplicateIssues({ ...payload, existingIssues });

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}

/** Purpose: Execute aiCategorizeIssueController logic for this module. */
export async function aiCategorizeIssueController(req: NextRequest) {
  try {
    const user = requireAuth(req);
    validateCsrf(req, user.sub);
    await rateLimit(req, 'ai-categorize', 40, 60);

    const payload = aiCategorizeSchema.parse(await parseJson(req));
    logAI(user.sub, 'categorize-issue', { taskId: payload.taskId ?? null });

    const result = await aiService.categorizeIssue(payload);

    if (payload.taskId) {
      await taskRepository.update(payload.taskId, { category: result.category } as never);
    }

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}

/** Purpose: Execute aiRootCauseController logic for this module. */
export async function aiRootCauseController(req: NextRequest) {
  try {
    const user = requireAuth(req);
    validateCsrf(req, user.sub);
    await rateLimit(req, 'ai-root-cause', 25, 60);

    const payload = aiRootCauseSchema.parse(await parseJson(req));
    logAI(user.sub, 'root-cause', { taskId: payload.taskId ?? null, commentsCount: payload.comments?.length ?? 0 });

    const result = await aiService.analyzeRootCause(payload);

    if (payload.taskId) {
      try {
        const persistedRootCause = [
          result.rootCauseAnalysis,
          result.causes.length > 0 ? `\nRoot causes:\n- ${result.causes.join('\n- ')}` : ''
        ]
          .join('\n')
          .trim();

        await taskRepository.update(payload.taskId, {
          aiRootCauseAnalysis: persistedRootCause
        } as never);
      } catch (persistError) {
        logger.warn({ err: persistError, taskId: payload.taskId }, 'Failed to persist AI root cause analysis');
      }
    }

    return ok({
      ...result,
      rootCauses: result.causes,
      aiProvider: resolveAiProviderLabel()
    });
  } catch (error) {
    return fail(error);
  }
}

/** Purpose: Execute aiResolutionController logic for this module. */
export async function aiResolutionController(req: NextRequest) {
  try {
    const user = requireAuth(req);
    validateCsrf(req, user.sub);
    await rateLimit(req, 'ai-resolution', 25, 60);

    const payload = aiResolutionSchema.parse(await parseJson(req));
    logAI(user.sub, 'resolution', { taskId: payload.taskId ?? null });

    const result = await aiService.suggestPermanentResolution(payload);

    if (payload.taskId) {
      try {
        const persistedResolution = [
          result.resolution,
          result.suggestions.length > 0 ? `\nSuggested actions:\n- ${result.suggestions.join('\n- ')}` : ''
        ]
          .join('\n')
          .trim();

        await taskRepository.update(payload.taskId, {
          resolutionNotes: persistedResolution
        } as never);
      } catch (persistError) {
        logger.warn({ err: persistError, taskId: payload.taskId }, 'Failed to persist AI resolution notes');
      }
    }

    return ok({
      ...result,
      permanentResolution: result.suggestions,
      aiProvider: resolveAiProviderLabel()
    });
  } catch (error) {
    return fail(error);
  }
}

/** Purpose: Execute adminAIInsightsController logic for this module. */
export async function adminAIInsightsController(req: NextRequest) {
  try {
    const user = requireAuth(req);
    requireRole(user.role, ['ADMIN']);

    const [
      totalTasks,
      aiSummariesGenerated,
      categorizedIssues,
      rootCauseAnalyses,
      resolutionNotesSaved,
      categoryBreakdownRaw
    ] = await Promise.all([
      prisma.task.count({ where: { isDeleted: false } }),
      prisma.task.count({ where: { isDeleted: false, aiSummary: { not: null } } }),
      prisma.task.count({ where: { isDeleted: false, category: { not: null } } }),
      prisma.task.count({ where: { isDeleted: false, aiRootCauseAnalysis: { not: null } } }),
      prisma.task.count({ where: { isDeleted: false, resolutionNotes: { not: null } } }),
      prisma.task.groupBy({ by: ['category'], _count: { category: true }, where: { isDeleted: false, category: { not: null } } })
    ]);

    const aiCoverageRate = totalTasks === 0 ? 0 : Number((aiSummariesGenerated / totalTasks).toFixed(4));
    const resolutionAdoptionRate = rootCauseAnalyses === 0 ? 0 : Number((resolutionNotesSaved / rootCauseAnalyses).toFixed(4));

    return ok({
      totalTasks,
      aiSummariesGenerated,
      categorizedIssues,
      rootCauseAnalyses,
      resolutionNotesSaved,
      aiCoverageRate,
      resolutionAdoptionRate,
      categoryBreakdown: categoryBreakdownRaw.map((item) => ({
        category: item.category ?? 'Uncategorized',
        count: item._count.category
      })),
      featureUsage: [
        { key: 'summarization', value: aiSummariesGenerated },
        { key: 'categorization', value: categorizedIssues },
        { key: 'root-cause', value: rootCauseAnalyses },
        { key: 'resolution-saved', value: resolutionNotesSaved }
      ]
    });
  } catch (error) {
    return fail(error);
  }
}
