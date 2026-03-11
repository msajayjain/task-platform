/**
 * File Description:
 * This file implements apps/web/src/lib/api-client.ts.
 *
 * Purpose:
 * Provide shared utility/client infrastructure helpers.
 *
 * Key Responsibilities:
 * - Encapsulate focused module behavior.
 * - Expose reusable exports.
 * - Support maintainable project structure.
 */

import axios from 'axios';
import { ApiError } from '@/lib/api-error';

const apiBaseUrl = '/api';

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000
});

function shouldUseLongTimeout(url: string, method: string): boolean {
  const normalizedUrl = url.toLowerCase();
  const normalizedMethod = method.toLowerCase();

  if (normalizedUrl.startsWith('/ai/')) return true;
  if (normalizedUrl.startsWith('/tasks/ai-create')) return true;
  if (normalizedMethod === 'post' && normalizedUrl === '/tasks') return true;

  return false;
}

api.interceptors.request.use((config) => {
  const hasWindow = typeof globalThis.window === 'object';
  const token = hasWindow ? localStorage.getItem('accessToken') : null;
  const csrfToken = hasWindow ? localStorage.getItem('csrfToken') : null;
  const requestUrl = config.url ?? '';
  const requestMethod = config.method ?? 'get';

  if (shouldUseLongTimeout(requestUrl, requestMethod)) {
    // Local LLM and AI endpoints can take significantly longer than default API calls.
    config.timeout = 90000;
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (csrfToken && ['post', 'put', 'delete', 'patch'].includes((config.method ?? 'get').toLowerCase())) {
    config.headers['x-csrf-token'] = csrfToken;
  }

  return config;
});

// Extract the API's own error message rather than the generic axios one
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status: number = error?.response?.status ?? 500;
    const firstIssue = error?.response?.data?.error?.details?.[0];
    const issuePath = Array.isArray(firstIssue?.path) ? firstIssue.path.join('.') : undefined;
    const issueMessage = typeof firstIssue?.message === 'string' ? firstIssue.message : undefined;
    const apiMessage: string =
      (issuePath && issueMessage ? `${issuePath}: ${issueMessage}` : undefined) ??
      error?.response?.data?.error?.message ??
      error?.message ??
      'An unexpected error occurred';
    return Promise.reject(new ApiError(apiMessage, status));
  }
);

export { api };
