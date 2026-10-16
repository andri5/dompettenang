/**
 * ============================================
 * Dompet Tenang API - Custom Error Classes
 * ============================================
 * Standardized error handling for the application.
 * These errors are caught by error middleware.
 * ============================================
 */

import { ERROR_CODES, HTTP_STATUS } from '../constants/index.js';
import type { ErrorCode, HttpStatus } from '../constants/index.js';

/**
 * Base application error class.
 * Extends built-in Error with additional context.
 */
export class AppError extends Error {
  public readonly statusCode: HttpStatus;
  public readonly code: ErrorCode;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: HttpStatus = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    code: ErrorCode = ERROR_CODES.INTERNAL_ERROR,
    details?: unknown
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.details = details;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 400 Bad Request Error
 */
export class BadRequestError extends AppError {
  constructor(message: string, code: ErrorCode = ERROR_CODES.VALIDATION_ERROR, details?: unknown) {
    super(message, HTTP_STATUS.BAD_REQUEST, code, details);
  }
}

/**
 * 401 Unauthorized Error
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', code: ErrorCode = ERROR_CODES.AUTH_UNAUTHORIZED) {
    super(message, HTTP_STATUS.UNAUTHORIZED, code);
  }
}

/**
 * 403 Forbidden Error
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTH_UNAUTHORIZED);
  }
}

/**
 * 404 Not Found Error
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', code: ErrorCode = ERROR_CODES.NOT_FOUND) {
    super(message, HTTP_STATUS.NOT_FOUND, code);
  }
}

/**
 * 409 Conflict Error
 */
export class ConflictError extends AppError {
  constructor(message: string, code: ErrorCode) {
    super(message, HTTP_STATUS.CONFLICT, code);
  }
}

/**
 * 422 Validation Error
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, HTTP_STATUS.UNPROCESSABLE_ENTITY, ERROR_CODES.VALIDATION_ERROR, details);
  }
}
