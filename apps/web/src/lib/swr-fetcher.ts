/**
 * File Description:
 * This file implements apps/web/src/lib/swr-fetcher.ts.
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
import { api } from '@/lib/api-client';
import { ApiError } from '@/lib/api-error';

/**
 * Shared SWR fetcher with normalized API error messages.
 */
export async function swrFetcher<T>(url: string): Promise<T> {
  try {
    const response = await api.get(url);
    return response.data.data as T;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.error?.message ?? error.message;
      throw new ApiError(message, error.response?.status);
    }

    throw error;
  }
}
