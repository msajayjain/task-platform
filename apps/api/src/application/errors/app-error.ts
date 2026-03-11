/**
 * File Description:
 * Defines a reusable application-level error type used across the API service layer.
 *
 * Purpose:
 * Provide a consistent error object that carries an HTTP status code and optional
 * diagnostic details, so error handling and API responses are standardized.
 *
 * Key Responsibilities:
 * - Represent business/application errors with a message.
 * - Attach an HTTP-compatible `statusCode` for response mapping.
 * - Optionally include `details` for validation/debug context.
 */
/**
 * Application-specific error class with status metadata.
 *
 * Purpose:
 * Extend the native `Error` type so services/controllers can throw structured
 * errors that are easy to translate into stable API error responses.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;

  /**
   * Creates an `AppError` instance.
   *
   * Purpose:
   * Capture a user-facing error message plus HTTP status and optional detail payload
   * in a single throwable object.
   *
   * Inputs:
   * - `message`: human-readable error message.
   * - `statusCode`: HTTP status code (default `400`).
   * - `details`: optional structured context for logging/diagnostics.
   */
  constructor(message: string, statusCode = 400, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}
