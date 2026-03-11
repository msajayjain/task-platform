/**
 * File Description:
 * This file implements apps/api/src/services/aiService.ts.
 *
 * Purpose:
 * Implement business/feature orchestration logic.
 *
 * Key Responsibilities:
 * - Execute feature/business rules.
 * - Coordinate dependencies (repositories/AI/cache).
 * - Return normalized results/errors.
 */

import { z } from 'zod';
import { TaskPriority } from '@task-platform/types';
import { AppError } from '@/application/errors/app-error';
import { env } from '@/infrastructure/config/env';
import { getRedis } from '@/infrastructure/cache/redis';
import { logger } from '@/infrastructure/logger/logger';


if (!process.env.FREE_GEMINI_KEY && process.env.OPENAI_API_KEY) {
  logger.warn('Using OPENAI_API_KEY fallback for Gemini key. Please set FREE_GEMINI_KEY explicitly.');
}

if (!process.env.FREE_GEMINI_KEY && process.env.GEMINI_API_KEY) {
  logger.warn('Using GEMINI_API_KEY fallback for FREE_GEMINI_KEY. Please set FREE_GEMINI_KEY explicitly.');
}


const categories = ['Bug', 'Feature Request', 'Performance Issue', 'Security Issue', 'Infrastructure', 'UI Issue', 'General'] as const;


type Category = (typeof categories)[number];


type PrioritySuggestion = TaskPriority | 'UNKNOWN';

type ModelCallOptions = {
  localNumPredict?: number;
  timeoutMs?: number;
};


const parseTaskSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(4000).default(''),
  priority: z.string().default('MEDIUM'),
  dueDate: z.string().nullable().default(null),
  status: z.enum(['TODO', 'IN_PROGRESS']).default('TODO'),
  assignedUserName: z.string().optional(),
  suggestedTeam: z.string().optional()
});


const summarySchema = z.object({
  summary: z.string().min(8).max(500)
});


const prioritySchema = z.object({
  priority: z.string(),
  confidence: z.number().min(0).max(1)
});


const categorizeSchema = z.object({
  category: z.enum(categories)
});


const rootCauseSchema = z.object({
  rootCauseAnalysis: z.string().min(20).max(4000),
  causes: z.array(z.string().min(3).max(240)).min(1).max(8)
});


const resolutionSchema = z.object({
  resolution: z.string().min(20).max(4000),
  suggestions: z.array(z.string().min(3).max(300)).min(1).max(8)
});


const semanticDuplicateSchema = z.object({
  matches: z.array(
    z.object({
      id: z.string(),
      similarity: z.number().min(0).max(1)
    })
  )
});


function normalizeText(value: string) {
  return value.replaceAll(/\s+/g, ' ').trim();
}


function truncateForLog(value: string, max = 800) {
  const normalized = normalizeText(value);
  return normalized.length <= max ? normalized : `${normalized.slice(0, max)}...`;
}


function clampTitle(title: string, max = 120) {
  const clean = normalizeText(title);
  if (clean.length <= max) return clean;


  const bounded = clean.slice(0, max);
  const lastSpace = bounded.lastIndexOf(' ');
  return normalizeText(lastSpace > 30 ? bounded.slice(0, lastSpace) : bounded);
}


function sanitizeSummary(candidate: string, source: string) {
  const clean = normalizeText(candidate.replace(/^summary\s*:\s*/i, ''));
  const words = clean.split(' ').filter(Boolean);
  const compact = words.slice(0, 40).join(' ');
  const similarity = scoreTextSimilarity(compact, source);


  if (!compact || similarity > 0.92) {
    return 'Issue affects core functionality after recent changes and requires configuration and integration validation to restore stable behavior.';
  }


  return compact;
}


function deriveShortTitleFromText(text: string) {
  const normalized = normalizeText(text);
  if (!normalized) return 'Untitled issue';


  const firstSentence = normalized.split(/[.!?]/).find((chunk) => normalizeText(chunk).length > 0) ?? normalized;
  const stripped = firstSentence
    .replace(/^create\s+(a|an)?\s*(low|medium|high|critical)?\s*priority\s*task\s*/i, '')
    .replace(/^create\s+task\s*/i, '')
    .replace(/^for\s+\w+\s+to\s+/i, '')
    .replace(/^to\s+/i, '');


  return clampTitle(stripped || normalized);
}


function normalizeSentenceCase(text: string) {
  return text
    .split(/([.!?])/)
    .reduce((acc, chunk, index, parts) => {
      if (!chunk.trim()) return acc;
      if (['.', '!', '?'].includes(chunk)) return `${acc}${chunk}`;


      const nextPunctuation = parts[index + 1] ?? '';
      const sentence = normalizeText(chunk);
      if (!sentence) return acc;


      const capitalized = `${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}`;
      return `${acc}${acc ? ' ' : ''}${capitalized}${nextPunctuation}`;
    }, '')
    .trim();
}


function polishIssueTextHeuristic(text: string) {
  const normalized = normalizeText(text)
    .replaceAll(/\bcan't\b/gi, 'cannot')
    .replaceAll(/\bwon't\b/gi, 'will not')
    .replaceAll(/\bi'm\b/gi, 'I am')
    .replaceAll(/\bit's\b/gi, 'it is')
    .replaceAll(/\blogin\b/gi, 'log in')
    .replaceAll(/\basap\b/gi, 'as soon as possible');


  const sentenceCased = normalizeSentenceCase(normalized);
  if (!sentenceCased) return '';


  if (/[.!?]$/.test(sentenceCased)) {
    return sentenceCased;
  }


  return `${sentenceCased}.`;
}


function priorityRank(priority: PrioritySuggestion) {
  if (priority === 'CRITICAL') return 4;
  if (priority === 'HIGH') return 3;
  if (priority === 'MEDIUM') return 2;
  if (priority === 'LOW') return 1;
  return 0;
}


function enforcePriorityFromText(priority: PrioritySuggestion, title: string, description: string): PrioritySuggestion {
  const inferred = inferPriorityHeuristic(title, description).priority;
  return priorityRank(inferred) > priorityRank(priority) ? inferred : priority;
}


function shouldUseModel() {
  if (env.AI_FALLBACK_PROVIDER === 'local') return true;
  const key = (env.FREE_GEMINI_KEY ?? '').trim();
  const blockedPatterns = ['placeholder', 'replace_with_', 'your_key_here', 'dev_gemini_key'];
  return Boolean(key) && !blockedPatterns.some((pattern) => key.toLowerCase().includes(pattern));
}

function isGoogleGeminiEndpoint(url: string) {
  return /generativelanguage\.googleapis\.com|googleapis\.com\/v1beta\/models/i.test(url);
}

function isGoogleApiKey(key: string) {
  return key.startsWith('AIza');
}


function normalizePriorityValue(value: string): PrioritySuggestion {
  const normalized = normalizeText(value).toUpperCase();
  if (normalized === 'CRITICAL' || normalized === 'P0' || normalized === 'SEV1') return 'CRITICAL';
  if (normalized === 'HIGH') return 'HIGH';
  if (normalized === 'MEDIUM' || normalized === 'MODERATE' || normalized === 'NORMAL') return 'MEDIUM';
  if (normalized === 'LOW' || normalized === 'MINOR') return 'LOW';
  return 'UNKNOWN';
}


function extractJsonObject(raw: string) {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace < 0 || lastBrace <= firstBrace) {
      throw new Error('Model response did not include JSON object');
    }


    const candidate = trimmed.slice(firstBrace, lastBrace + 1);
    return JSON.parse(candidate);
  }
}

function normalizeKey(key: string): string {
  return key.replaceAll('[]', '').trim();
}

function flattenObjectToText(value: unknown): string {
  if (typeof value === 'string') return normalizeText(value);
  if (Array.isArray(value)) {
    return normalizeText(
      value
        .map((item) => flattenObjectToText(item))
        .filter(Boolean)
        .join(' ')
    );
  }
  if (value && typeof value === 'object') {
    return normalizeText(
      Object.values(value as Record<string, unknown>)
        .map((item) => flattenObjectToText(item))
        .filter(Boolean)
        .join(' ')
    );
  }
  return '';
}

function normalizeModelObject(input: unknown): unknown {
  if (Array.isArray(input)) return input.map((item) => normalizeModelObject(item));
  if (!input || typeof input !== 'object') return input;

  const source = input as Record<string, unknown>;
  const normalized: Record<string, unknown> = {};

  for (const [rawKey, rawValue] of Object.entries(source)) {
    const key = normalizeKey(rawKey);
    const value = normalizeModelObject(rawValue);

    if (key === 'rootCauseAnalysis' && typeof value === 'object' && value !== null) {
      normalized[key] = flattenObjectToText(value);
      continue;
    }

    if ((key === 'causes' || key === 'suggestions') && Array.isArray(value)) {
      normalized[key] = value.map((item) => {
        if (typeof item === 'string') return normalizeText(item);
        if (item && typeof item === 'object') {
          const row = item as Record<string, unknown>;
          const preferred =
            (typeof row.cause === 'string' && row.cause) ||
            (typeof row.action === 'string' && row.action) ||
            (typeof row.description === 'string' && row.description) ||
            flattenObjectToText(row);
          return normalizeText(preferred);
        }
        return normalizeText(String(item ?? ''));
      });
      continue;
    }

    normalized[key] = value;
  }

  return normalized;
}


function scoreTextSimilarity(a: string, b: string) {
  const toTokens = (value: string) =>
    new Set(
      normalizeText(value)
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((token) => token.length > 2)
    );


  const tokensA = toTokens(a);
  const tokensB = toTokens(b);
  if (tokensA.size === 0 || tokensB.size === 0) return 0;


  const intersection = [...tokensA].filter((token) => tokensB.has(token)).length;
  const union = new Set([...tokensA, ...tokensB]).size;
  return intersection / union;
}


function scoreCharacterNgramSimilarity(a: string, b: string, n = 3) {
  const toNgrams = (value: string) => {
    const normalized = normalizeText(value).toLowerCase();
    if (normalized.length < n) return new Set([normalized]);


    const grams = new Set<string>();
    for (let index = 0; index <= normalized.length - n; index += 1) {
      grams.add(normalized.slice(index, index + n));
    }
    return grams;
  };


  const gramsA = toNgrams(a);
  const gramsB = toNgrams(b);
  if (gramsA.size === 0 || gramsB.size === 0) return 0;


  const intersection = [...gramsA].filter((gram) => gramsB.has(gram)).length;
  const union = new Set([...gramsA, ...gramsB]).size;
  return intersection / union;
}


// ---------------------------------------------------------------------------
// Redis sliding-window rate limiter — survives hot-reloads and shared across
// all Next.js worker instances. Keeps Gemini calls ≤ 12/min (free tier = 15 RPM).
// ---------------------------------------------------------------------------
const GEMINI_MAX_RPM = 25; // gemini-2.0-flash-lite free tier: 30 RPM actual
// v2 key — bump suffix to automatically abandon any stale data from previous sessions
const GEMINI_RL_KEY = 'gemini:rpm:window:v2';

async function acquireGeminiSlot(): Promise<void> {
  const redis = getRedis();
  const windowMs = 60_000;
  const now = Date.now();
  const cutoff = now - windowMs;

  // Check-before-add: prune expired entries, read count, only add when under limit.
  // Avoids the unreliable "add-then-rollback-by-score" pattern.
  await redis.zremrangebyscore(GEMINI_RL_KEY, '-inf', cutoff);
  const count = await redis.zcard(GEMINI_RL_KEY);

  if (count >= GEMINI_MAX_RPM) {
    const oldest = await redis.zrange(GEMINI_RL_KEY, 0, 0, 'WITHSCORES');
    const oldestMs = oldest.length >= 2 ? Number(oldest[1]) : now - windowMs + 1000;
    const waitMs = Math.max(500, oldestMs + windowMs - now + 200);

    logger.info({ waitMs, count }, 'Gemini rate-limit slot full — queuing request');
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    return acquireGeminiSlot();
  }

  // Reserve the slot only after confirming we're under the limit
  await redis.zadd(GEMINI_RL_KEY, now, `${now}-${Math.random()}`);
  await redis.pexpire(GEMINI_RL_KEY, windowMs + 1000);
}

function classifyGemini429(rawBody: string): AppError {
  logger.warn({ rawGemini429: truncateForLog(rawBody, 500) }, 'Gemini 429 raw response');
  try {
    const parsed = JSON.parse(rawBody) as { error?: { message?: string; status?: string } };
    const msg = (parsed.error?.message ?? '').toLowerCase();
    const status = (parsed.error?.status ?? '').toLowerCase();

    if (status === 'resource_exhausted' || msg.includes('quota') || msg.includes('resource')) {
      if (msg.includes('day') || msg.includes('daily') || msg.includes('per_day')) {
        return new AppError('Daily AI quota exhausted (1,500 req/day free tier). Try again tomorrow.', 429);
      }
      if (msg.includes('minute') || msg.includes('per_minute') || msg.includes('rpm')) {
        return new AppError('Per-minute AI quota reached. Wait ~60 seconds and try again.', 429);
      }
      // Generic exhaustion — could be daily or per-minute; give the user both options
      return new AppError('AI quota exhausted. Wait 60 seconds and retry — if it keeps happening, the daily limit (1,500 req/day) may be reached; try again tomorrow.', 429);
    }
  } catch {
    // unparseable — fall through to generic
  }
  return new AppError('AI service is temporarily unavailable (429). Please try again in a moment.', 429);
}

async function fetchGeminiOnce(key: string, apiUrl: string, systemPrompt: string, userPrompt: string): Promise<Response> {
  if (isGoogleGeminiEndpoint(apiUrl)) {
    const urlWithKey = apiUrl.includes('?') ? `${apiUrl}&key=${encodeURIComponent(key)}` : `${apiUrl}?key=${encodeURIComponent(key)}`;
    return fetch(urlWithKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
        generationConfig: { temperature: 0.1, responseMimeType: 'application/json' }
      })
    });
  }

  if (isGoogleApiKey(key)) {
    throw new Error('Google AI key (AIza...) cannot authenticate OpenRouter-style endpoints. Use provider key for this endpoint or switch FREE_GEMINI_API_URL to Google Gemini API endpoint.');
  }

  return fetch(apiUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: env.FREE_GEMINI_MODEL,
      temperature: 0.1,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    })
  });
}

type GeminiCompletion = {
  choices?: Array<{ message?: { content?: string | Array<{ text?: string }> } }>;
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>;
  promptFeedback?: { blockReason?: string };
};

function assertGeminiSafety(completion: GeminiCompletion, apiUrl: string): void {
  if (!isGoogleGeminiEndpoint(apiUrl)) return;
  const blockReason = completion.promptFeedback?.blockReason;
  if (blockReason) throw new AppError(`AI request blocked by safety filter: ${blockReason}`, 422);
  const candidate = completion.candidates?.[0];
  if (!candidate || candidate.finishReason === 'SAFETY' || candidate.finishReason === 'RECITATION') {
    throw new AppError('AI response was blocked or empty. Try rephrasing your input.', 422);
  }
}

function extractRawText(completion: GeminiCompletion, apiUrl: string): string {
  if (isGoogleGeminiEndpoint(apiUrl)) {
    return completion.candidates?.[0]?.content?.parts?.map((p) => p?.text ?? '').join(' ') ?? '{}';
  }
  const content = completion.choices?.[0]?.message?.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) return content.map((item) => item?.text ?? '').join(' ');
  return '{}';
}

// Fallback models tried in order when the primary model hits its quota.
// Each model has its own independent free-tier quota pool (RPM + RPD).
const GEMINI_FALLBACK_MODELS = ['gemini-1.5-flash-8b', 'gemini-1.5-flash'];

function buildGeminiUrlForModel(model: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

async function fetchHuggingFaceRaw(systemPrompt: string, userPrompt: string, options?: ModelCallOptions): Promise<string> {
  const key = (env.HUGGINGFACE_API_KEY ?? '').trim();
  if (!key) {
    throw new AppError('Gemini quota exhausted and Hugging Face fallback is not configured (missing HUGGINGFACE_API_KEY).', 429);
  }

  const baseUrl = env.HUGGINGFACE_API_URL.replace(/\/+$/, '');
  const model = (env.HUGGINGFACE_MODEL ?? 'HuggingFaceH4/zephyr-7b-beta').trim();
  const url = `${baseUrl}/${model}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      inputs: `${systemPrompt}\n\n${userPrompt}`,
      parameters: {
        temperature: 0.1,
        max_new_tokens: options?.localNumPredict ?? 280,
        return_full_text: false
      }
    })
  });

  if (!response.ok) {
    const rawError = await response.text();
    throw new Error(`Hugging Face request failed (${response.status}): ${truncateForLog(rawError, 400)}`);
  }

  const payload = (await response.json()) as
    | Array<{ generated_text?: string }>
    | { generated_text?: string; error?: string; estimated_time?: number };

  if (Array.isArray(payload)) {
    return payload[0]?.generated_text ?? '{}';
  }

  if (typeof payload.generated_text === 'string') {
    return payload.generated_text;
  }

  if (typeof payload.error === 'string') {
    throw new TypeError(`Hugging Face model error: ${payload.error}`);
  }

  return '{}';
}

async function fetchLocalLlmRaw(systemPrompt: string, userPrompt: string, options?: ModelCallOptions): Promise<string> {
  const baseUrl = (env.LOCAL_LLM_API_URL ?? 'http://127.0.0.1:11434/api/generate').trim();
  const model = (env.LOCAL_LLM_MODEL ?? 'llama3.2:3b').trim();
  const controller = new AbortController();
  const timeoutMs = options?.timeoutMs ?? 12_000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        prompt: `${systemPrompt}\n\n${userPrompt}`,
        format: 'json',
        stream: false,
        keep_alive: '15m',
        options: {
          temperature: 0.1,
          num_predict: options?.localNumPredict ?? 180
        }
      })
    });

    if (!response.ok) {
      const rawError = await response.text();
      throw new Error(`Local LLM request failed (${response.status}): ${truncateForLog(rawError, 400)}`);
    }

    const payload = (await response.json()) as { response?: string; error?: string };
    if (typeof payload.response === 'string') {
      return payload.response;
    }
    if (typeof payload.error === 'string') {
      throw new TypeError(`Local LLM error: ${payload.error}`);
    }
    return '{}';
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Local LLM request timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function parseProviderResult<T>(raw: string, provider: string, schema: z.ZodSchema<T>): T {
  logger.info({ aiEvent: 'response', provider, raw: truncateForLog(raw, 2000) }, 'AI Response');
  const parsed = schema.parse(normalizeModelObject(extractJsonObject(raw)));
  logger.info({ aiEvent: 'parsed-result', provider, parsed }, 'Parsed Result');
  return parsed;
}

async function tryFallbackProviders<T>(
  fallbackProvider: 'none' | 'huggingface' | 'local' | 'auto',
  systemPrompt: string,
  userPrompt: string,
  schema: z.ZodSchema<T>,
  options?: ModelCallOptions
): Promise<T | null> {
  const canUseHf = fallbackProvider === 'huggingface' || fallbackProvider === 'auto';
  const canUseLocal = fallbackProvider === 'local' || fallbackProvider === 'auto';

  if (canUseHf) {
    try {
      logger.warn('Gemini quota exhausted. Falling back to Hugging Face provider.');
      const hfRaw = await fetchHuggingFaceRaw(systemPrompt, userPrompt, options);
      return parseProviderResult(hfRaw, 'huggingface', schema);
    } catch (fallbackError) {
      logger.warn({ err: fallbackError }, 'Hugging Face fallback failed');
    }
  }

  if (canUseLocal) {
    try {
      logger.warn('Gemini/Hugging Face unavailable. Falling back to local LLM provider.');
      const localRaw = await fetchLocalLlmRaw(systemPrompt, userPrompt, options);
      return parseProviderResult(localRaw, 'local-llm', schema);
    } catch (fallbackError) {
      logger.warn({ err: fallbackError }, 'Local LLM fallback failed');
    }
  }

  return null;
}

async function fetchViaGeminiCascade(
  key: string,
  systemPrompt: string,
  userPrompt: string
): Promise<{ response: Response | null; usedUrl: string; last429Body: string }> {
  const primaryUrl = env.FREE_GEMINI_API_URL;
  const urls = isGoogleGeminiEndpoint(primaryUrl)
    ? [primaryUrl, ...GEMINI_FALLBACK_MODELS.map(buildGeminiUrlForModel)]
    : [primaryUrl];

  let response: Response | null = null;
  let usedUrl = primaryUrl;
  let last429Body = '';

  for (const url of urls) {
    const modelName = /\/models\/([^:]+):/.exec(url)?.[1] ?? url;
    await acquireGeminiSlot();
    try {
      response = await fetchGeminiOnce(key, url, systemPrompt, userPrompt);
    } catch (error) {
      logger.warn({ err: error, model: modelName }, 'Gemini transport failure — trying fallback');
      response = null;
      continue;
    }

    if (response.status !== 429) {
      usedUrl = url;
      break;
    }

    last429Body = await response.text();
    logger.warn({ model: modelName }, 'Gemini 429 — trying next fallback model');
    response = null;
  }

  return { response, usedUrl, last429Body };
}

async function callJsonModel<T>(systemPrompt: string, userPrompt: string, schema: z.ZodSchema<T>, options?: ModelCallOptions): Promise<T> {
  logger.info(
    { aiEvent: 'request', model: env.FREE_GEMINI_MODEL, systemPrompt: truncateForLog(systemPrompt), userPrompt: truncateForLog(userPrompt) },
    'AI Request Payload'
  );

  if (env.AI_FALLBACK_PROVIDER === 'local') {
    const localRaw = await fetchLocalLlmRaw(systemPrompt, userPrompt, options);
    return parseProviderResult(localRaw, 'local-llm', schema);
  }

  const key = (env.FREE_GEMINI_KEY ?? '').trim();
  if (!key) {
    const fallbackResult = await tryFallbackProviders(env.AI_FALLBACK_PROVIDER, systemPrompt, userPrompt, schema, options);
    if (fallbackResult) return fallbackResult;
    throw new Error('FREE_GEMINI_KEY is missing. Set FREE_GEMINI_KEY or use AI_FALLBACK_PROVIDER=local.');
  }

  const { response, usedUrl, last429Body } = await fetchViaGeminiCascade(key, systemPrompt, userPrompt);

  if (!response) {
    // All Gemini models quota-exhausted. Optionally fallback to Hugging Face and/or local LLM.
    const fallbackResult = await tryFallbackProviders(env.AI_FALLBACK_PROVIDER, systemPrompt, userPrompt, schema, options);
    if (fallbackResult) return fallbackResult;

    throw classifyGemini429(last429Body);
  }

  if (!response.ok) {
    const rawError = await response.text();
    if (response.status === 429) throw classifyGemini429(rawError);
    throw new Error(`Gemini API request failed (${response.status}): ${truncateForLog(rawError, 400)}`);
  }

  const completion = (await response.json()) as GeminiCompletion;
  assertGeminiSafety(completion, usedUrl);

  const raw = extractRawText(completion, usedUrl);
  logger.info({ aiEvent: 'response', raw: truncateForLog(raw, 2000) }, 'AI Response');

  const parsed = schema.parse(normalizeModelObject(extractJsonObject(raw)));
  logger.info({ aiEvent: 'parsed-result', parsed }, 'Parsed Result');
  return parsed;
}


function inferPriorityHeuristic(title: string, description: string): { priority: PrioritySuggestion; confidence: number } {
  const text = `${title} ${description}`.toLowerCase();


  const criticalSignals = ['production down', 'outage', 'all customers', 'payment failure', 'security vulnerability', 'data breach', 'critical priority', 'p0'];
  if (criticalSignals.some((signal) => text.includes(signal))) {
    return { priority: 'CRITICAL', confidence: 0.92 };
  }


  const highSignals = ['high priority', 'urgent', 'asap', 'cannot move forward', 'blocked', '500', 'error rate spike', 'cannot login', 'oauth failure', 'failed checkout', 'incident'];
  if (highSignals.some((signal) => text.includes(signal))) {
    return { priority: 'HIGH', confidence: 0.88 };
  }


  const mediumSignals = ['slow', 'latency', 'ui glitch', 'intermittent'];
  if (mediumSignals.some((signal) => text.includes(signal))) {
    return { priority: 'MEDIUM', confidence: 0.7 };
  }


  if (text.length < 20 || text.split(' ').length < 4) {
    return { priority: 'UNKNOWN', confidence: 0.2 };
  }


  return { priority: 'LOW', confidence: 0.55 };
}


function inferCategoryHeuristic(title: string, description: string): Category {
  const text = `${title} ${description}`.toLowerCase();

  if (/xss|csrf|sql injection|security|vulnerability|auth bypass/.test(text)) return 'Security Issue';
  if (/slow|latency|performance|timeout|memory|cpu/.test(text)) return 'Performance Issue';
  if (/infra|deployment|kubernetes|docker|redis|database connection|postgres/.test(text)) return 'Infrastructure';
  if (/button|layout|css|ui|ux|screen|modal/.test(text)) return 'UI Issue';
  if (/feature|enhancement|new capability|support for/.test(text)) return 'Feature Request';
  if (/bug|error|exception|fails|failure|broken|500|404/.test(text)) return 'Bug';
  return 'General';
}

/** Re-throw errors that should never be silently swallowed (rate limits, safety blocks, etc.) */
function rethrowIfHardError(error: unknown): void {
  if (error instanceof AppError) throw error;
}

function extractTeamHeuristic(text: string): string | null {
  const normalized = text.toLowerCase();
  // Match patterns like "assign to QA team", "backend team", etc.
  const patterns = [
    /assign(?:ed)?\s+to\s+(?:the\s+)?([\w\s]+?)\s+team/i,
    /(\w+(?:\s+\w+)?)\s+team/i,
    /team[:\s]+(\w+)/i
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match?.[1]) {
      const candidate = match[1].trim();
      if (candidate.length >= 2 && candidate.length <= 60) {
        return candidate;
      }
    }
  }
  // Keyword hints without explicit "team" suffix
  const keywords: [RegExp, string][] = [
    [/\bdevops\b/i, 'DevOps'],
    [/\binfra(?:structure)?\b/i, 'Infrastructure'],
    [/\bbackend\b/i, 'Backend'],
    [/\bfrontend\b/i, 'Frontend'],
    [/\bfull.?stack\b/i, 'Full Stack'],
    [/\bqa\b|quality assurance/i, 'QA'],
    [/\bsecurity\b/i, 'Security'],
    [/\bplatform\b/i, 'Platform'],
    [/\bdata\b/i, 'Data'],
    [/\bmobile\b/i, 'Mobile']
  ];
  for (const [pattern, label] of keywords) {
    if (pattern.test(normalized)) return label;
  }
  return null;
}

/** Purpose: Expose aiService operations for this module. */
export const aiService = {
  /** Purpose: Execute generateTaskSummary operation for this module. */
  async generateTaskSummary(input: { title: string; description: string }) {
    const title = normalizeText(input.title);
    const description = normalizeText(input.description);


    if (!shouldUseModel()) {
      const polished = polishIssueTextHeuristic(`${title}. ${description}`);
      const summary = normalizeText(polished).slice(0, 220);
      return { summary: sanitizeSummary(summary, `${title} ${description}`), confidence: 0.62 };
    }


    try {
      const result = await callJsonModel(
        [
          'Summarize the following issue in 1–2 clear sentences.',
          'Rewrite to professional, grammatically correct language while preserving meaning.',
          'Do not repeat the original text.',
          'Return a concise technical summary under 40 words.',
          'Return JSON only with: {"summary":"..."}.'
        ].join(' '),
        `Title: ${title}\nDescription: ${description}`,
        summarySchema,
        { localNumPredict: 90, timeoutMs: 9000 }
      );
      return { summary: sanitizeSummary(result.summary, `${title} ${description}`), confidence: 0.86 };
    } catch (error) {
      rethrowIfHardError(error);
      logger.warn({ err: error }, 'AI summary generation fallback triggered');
      return { summary: sanitizeSummary(`${title}: ${description}`.slice(0, 180), `${title} ${description}`), confidence: 0.58 };
    }
  },


  /** Purpose: Execute suggestPriority operation for this module. */
  async suggestPriority(input: { title: string; description: string }) {
    const title = normalizeText(input.title);
    const description = normalizeText(input.description);


    if (!shouldUseModel()) {
      return inferPriorityHeuristic(title, description);
    }


    try {
      const modelSuggestion = await callJsonModel(
        'You assign incident priority. Return JSON: priority (LOW|MEDIUM|HIGH|CRITICAL|UNKNOWN) and confidence [0..1].',
        `Title: ${title}\nDescription: ${description}`,
        prioritySchema,
        { localNumPredict: 80, timeoutMs: 8000 }
      );


      const normalizedPriority = normalizePriorityValue(modelSuggestion.priority);
      return {
        ...modelSuggestion,
        priority: enforcePriorityFromText(normalizedPriority, title, description)
      };
    } catch (error) {
      rethrowIfHardError(error);
      logger.warn({ err: error }, 'AI priority fallback triggered');
      return inferPriorityHeuristic(title, description);
    }
  },


  /** Purpose: Execute parseNaturalLanguageTask operation for this module. */
  async parseNaturalLanguageTask(input: { text: string }) {
    const text = normalizeText(input.text);


    if (!shouldUseModel()) {
      const polished = polishIssueTextHeuristic(text);
      const inferred = inferPriorityHeuristic(text, text);
      return {
        title: deriveShortTitleFromText(polished || text),
        description: polished || normalizeText(text),
        priority: inferred.priority === 'UNKNOWN' ? 'MEDIUM' : inferred.priority,
        dueDate: null,
        status: 'TODO' as const,
        suggestedTeam: extractTeamHeuristic(text),
        confidence: 0.55
      };
    }


    try {
      const parsed = await callJsonModel(
        [
          'You are a strict enterprise task parser for issue management.',
          'Rewrite user-provided text into professional, grammatically correct language while preserving facts.',
          'Do not truncate any meaningful detail from the described issue.',
          'The description must be complete, coherent, and production-ready.',
          'If the text mentions a team (e.g. "QA team", "assign to backend", "frontend team", "DevOps", "platform team"), extract just the team name into suggestedTeam.',
          'Return structured JSON only with fields:',
          '{"title":"short clear issue title under 120 characters","description":"full detailed issue description","priority":"LOW|MEDIUM|HIGH|CRITICAL","dueDate":"YYYY-MM-DD or null","status":"TODO|IN_PROGRESS","suggestedTeam":"team name or null"}.',
          'Title must be clean, technical, and not truncated.',
          'Description must be at least 2 full sentences when enough context is provided.'
        ].join(' '),
        text,
        parseTaskSchema,
        { localNumPredict: 220, timeoutMs: 12000 }
      );
      return {
        ...parsed,
        title: clampTitle(parsed.title),
        description: polishIssueTextHeuristic(parsed.description ?? ''),
        priority: (() => {
          const normalized = normalizePriorityValue(parsed.priority ?? 'MEDIUM');
          const fallbackPriority: PrioritySuggestion = normalized === 'UNKNOWN' ? 'MEDIUM' : normalized;
          return enforcePriorityFromText(fallbackPriority, text, parsed.description ?? '');
        })(),
        suggestedTeam: parsed.suggestedTeam ?? extractTeamHeuristic(text),
        confidence: 0.84
      };
    } catch (error) {
      rethrowIfHardError(error);
      logger.warn({ err: error }, 'AI parse task fallback triggered');
      const polished = polishIssueTextHeuristic(text);
      const inferred = inferPriorityHeuristic(text, text);
      return {
        title: deriveShortTitleFromText(polished || text),
        description: polished || normalizeText(text),
        priority: inferred.priority === 'UNKNOWN' ? 'MEDIUM' : inferred.priority,
        dueDate: null,
        status: 'TODO' as const,
        suggestedTeam: extractTeamHeuristic(text),
        confidence: 0.5
      };
    }
  },


  async detectDuplicateIssues(input: {
    title: string;
    description: string;
    priority?: TaskPriority;
    category?: string | null;
    existingIssues: Array<{ id: string; title: string; description: string; category?: string | null; status: string; priority: string; createdBy?: { name: string | null } | null }>;
  }) {
    const probe = `${input.title} ${input.description}`;
    const baseMatches = input.existingIssues.map((issue) => {
      const candidateText = `${issue.title} ${issue.description}`;
      const tokenSimilarity = scoreTextSimilarity(probe, candidateText);
      const ngramSimilarity = scoreCharacterNgramSimilarity(probe, candidateText);
      const priorityBoost = input.priority && input.priority === issue.priority ? 0.08 : 0;
      const categoryBoost = input.category && issue.category && normalizeText(input.category).toLowerCase() === normalizeText(issue.category).toLowerCase() ? 0.08 : 0;
      const baseScore = Math.min(1, tokenSimilarity * 0.55 + ngramSimilarity * 0.37 + priorityBoost + categoryBoost);


      return {
        id: issue.id,
        title: issue.title,
        description: issue.description,
        category: issue.category ?? null,
        status: issue.status,
        priority: issue.priority,
        createdByName: issue.createdBy?.name ?? undefined,
        baseScore,
        similarity: baseScore
      };
    });



    if (baseMatches.length === 0) {
      return {
        hasDuplicates: false,
        duplicates: []
      };
    }

    const rankedByBaseScore = baseMatches.toSorted((a, b) => b.baseScore - a.baseScore);
    const strongestBaseScore = rankedByBaseScore[0]?.baseScore ?? 0;
    let rescored = baseMatches;


    // Fast path: if lexical similarity is weak, skip slower semantic AI pass.
    // This keeps create-click latency low in the common non-duplicate case.
    if (shouldUseModel() && strongestBaseScore >= 0.22) {
      try {
        const topCandidates = rankedByBaseScore
          .slice(0, 10)
          .map((item) => ({
            id: item.id,
            title: item.title,
            description: truncateForLog(item.description, 500),
            priority: item.priority,
            category: item.category
          }));


        const semantic = await callJsonModel(
          [
            'You are an issue deduplication scorer.',
            'Evaluate semantic duplicate likelihood between the probe issue and candidate issues.',
            'Use title, description, priority and category as signals.',
            'Return JSON only: {"matches":[{"id":"candidate-id","similarity":0..1}]}.',
            'Assign higher scores only for true duplicate intent and same failure pattern.'
          ].join(' '),
          JSON.stringify({
            probe: {
              title: input.title,
              description: input.description,
              priority: input.priority,
              category: input.category
            },
            candidates: topCandidates
          }),
          semanticDuplicateSchema,
          { localNumPredict: 150, timeoutMs: 10000 }
        );


        const semanticMap = new Map(semantic.matches.map((match) => [match.id, match.similarity]));
        rescored = baseMatches.map((item) => {
          const semanticScore = semanticMap.get(item.id);
          if (typeof semanticScore !== 'number') return item;
          return {
            ...item,
            similarity: Math.min(1, item.baseScore * 0.6 + semanticScore * 0.4)
          };
        });
      } catch (error) {
        rethrowIfHardError(error);
        logger.warn({ err: error }, 'AI semantic duplicate scoring fallback triggered');
      }
    } else if (shouldUseModel()) {
      logger.info({ strongestBaseScore }, 'Skipping semantic duplicate AI pass due to low lexical similarity');
    }


    const duplicates = rescored
      .filter((issue) => issue.similarity >= 0.48)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5)
      .map((issue) => ({
        id: issue.id,
        title: issue.title,
        description: issue.description,
        category: issue.category,
        status: issue.status,
        priority: issue.priority,
        createdByName: issue.createdByName,
        similarity: issue.similarity
      }));


    return {
      hasDuplicates: duplicates.length > 0,
      duplicates
    };
  },


  /** Purpose: Execute categorizeIssue operation for this module. */
  async categorizeIssue(input: { title: string; description: string }) {
    const title = normalizeText(input.title);
    const description = normalizeText(input.description);


    if (!shouldUseModel()) {
      return { category: inferCategoryHeuristic(title, description) };
    }


    try {
      return await callJsonModel(
        'Classify software issue category. Return JSON: category with one of Bug|Feature Request|Performance Issue|Security Issue|Infrastructure|UI Issue|General.',
        `Title: ${title}\nDescription: ${description}`,
        categorizeSchema,
        { localNumPredict: 70, timeoutMs: 8000 }
      );
    } catch (error) {
      rethrowIfHardError(error);
      logger.warn({ err: error }, 'AI categorize fallback triggered');
      return { category: inferCategoryHeuristic(title, description) };
    }
  },


  /** Purpose: Execute analyzeRootCause operation for this module. */
  async analyzeRootCause(input: { title: string; description: string; category?: string | null; comments?: string[] }) {
    const comments = input.comments?.slice(0, 20).join('\n- ') ?? '';


    if (!shouldUseModel()) {
      const causes = [
        'Recent deployment or configuration mismatch',
        'Dependency integration or API contract mismatch',
        'Timeout/retry policy and transient network failures',
        'Edge-case validation not covered by tests'
      ];
      return {
        rootCauseAnalysis: `Likely causes include environment/configuration drift, integration contract mismatches, and insufficient resilience for transient failures. Category context: ${input.category ?? 'General'}.`,
        causes,
        confidence: 0.6
      };
    }


    try {
      const result = await callJsonModel(
        [
          'Analyze the following software issue and identify 3–5 likely root causes.',
          'Return concise technical bullet points.',
          'Return JSON only with fields: rootCauseAnalysis, causes[].',
          'Do not include markdown wrappers.'
        ].join(' '),
        `Title: ${input.title}\nDescription: ${input.description}\nCategory: ${input.category ?? 'General'}\nComments:\n- ${comments}`,
        rootCauseSchema,
        { localNumPredict: 260, timeoutMs: 14000 }
      );
      return {
        ...result,
        confidence: 0.82
      };
    } catch (error) {
      rethrowIfHardError(error);
      logger.warn({ err: error }, 'AI root cause fallback triggered');
      return {
        rootCauseAnalysis: 'Likely root causes include release configuration drift, third-party dependency instability, and missing guard rails around authentication and retry logic.',
        causes: ['Release config drift', 'Dependency instability', 'Missing validation or retry guard rails'],
        confidence: 0.57
      };
    }
  },


  /** Purpose: Execute suggestPermanentResolution operation for this module. */
  async suggestPermanentResolution(input: { title: string; description: string; category?: string | null; rootCauseAnalysis: string }) {
    if (!shouldUseModel()) {
      const suggestions = [
        'Add automated regression tests for the failing path and edge cases',
        'Implement alerting dashboards with SLO-based thresholds',
        'Introduce resilient retry/backoff and circuit-breaker patterns',
        'Document runbook and add release verification checklist'
      ];
      return {
        resolution: `To prevent recurrence, combine code hardening, observability, and release controls. Address root causes explicitly: ${input.rootCauseAnalysis.slice(0, 240)}...`,
        suggestions,
        confidence: 0.63
      };
    }


    try {
      const result = await callJsonModel(
        [
          'Based on the root causes, suggest permanent engineering fixes that prevent recurrence.',
          'Return 3–5 actionable improvements.',
          'Return JSON only with fields: resolution, suggestions[].',
          'Do not include markdown wrappers.'
        ].join(' '),
        `Title: ${input.title}\nDescription: ${input.description}\nCategory: ${input.category ?? 'General'}\nRoot cause analysis: ${input.rootCauseAnalysis}`,
        resolutionSchema,
        { localNumPredict: 260, timeoutMs: 14000 }
      );
      return {
        ...result,
        confidence: 0.81
      };
    } catch (error) {
      rethrowIfHardError(error);
      logger.warn({ err: error }, 'AI resolution fallback triggered');
      return {
        resolution: 'Implement durable prevention controls through stronger validation, resilience patterns, and observability tied to deployment quality gates.',
        suggestions: [
          'Automate failure-path tests in CI/CD',
          'Add canary rollout and rollback guardrails',
          'Track leading indicators with actionable alerts'
        ],
        confidence: 0.56
      };
    }
  }
};



