/**
 * File Description:
 * This file implements apps/web/src/lib/api-error.ts.
 *
 * Purpose:
 * Provide shared utility/client infrastructure helpers.
 *
 * Key Responsibilities:
 * - Encapsulate focused module behavior.
 * - Expose reusable exports.
 * - Support maintainable project structure.
 */

export class ApiError extends Error {
  statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}
