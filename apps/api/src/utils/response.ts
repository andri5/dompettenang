/**
 * ============================================
 * Dompet Tenang API - Response Utilities
 * ============================================
 * Standardized API response helpers.
 * Ensures consistent response format across all endpoints.
 * 
 * @example
 * // Success response
 * sendSuccess(res, data, 'Data retrieved successfully');
 * 
 * // Error response
 * sendError(res, 'Something went wrong', 400, 'BAD_REQUEST');
 * ============================================
 */

import { Response } from 'express';

/**
 * Standard success response structure
 */
interface SuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Standard error response structure
 */
interface ErrorResponse {
  success: false;
  message: string;
  error?: {
    code: string;
    details?: unknown;
  };
}

/**
 * Send a success response
 * @param res - Express response object
 * @param data - Response data
 * @param message - Success message
 * @param statusCode - HTTP status code (default: 200)
 * @param meta - Pagination metadata (optional)
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  message: string = 'Success',
  statusCode: number = 200,
  meta?: SuccessResponse<T>['meta']
): Response => {
  const response: SuccessResponse<T> = {
    success: true,
    message,
    data,
    ...(meta && { meta }),
  };
  return res.status(statusCode).json(response);
};

/**
 * Send an error response
 * @param res - Express response object
 * @param message - Error message
 * @param statusCode - HTTP status code (default: 400)
 * @param errorCode - Error code for client handling (optional)
 * @param details - Additional error details (optional)
 */
export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 400,
  errorCode?: string,
  details?: unknown
): Response => {
  const response: ErrorResponse = {
    success: false,
    message,
  };
  if (errorCode) {
    response.error = {
      code: errorCode,
      details: details !== undefined ? details : undefined,
    };
  }
  return res.status(statusCode).json(response);
};

/**
 * Send a 201 Created response
 */
export const sendCreated = <T>(
  res: Response,
  data: T,
  message: string = 'Created successfully'
): Response => {
  return sendSuccess(res, data, message, 201);
};

/**
 * Send a 404 Not Found response
 */
export const sendNotFound = (
  res: Response,
  message: string = 'Resource not found'
): Response => {
  return sendError(res, message, 404, 'NOT_FOUND');
};

/**
 * Send a 401 Unauthorized response
 */
export const sendUnauthorized = (
  res: Response,
  message: string = 'Unauthorized'
): Response => {
  return sendError(res, message, 401, 'UNAUTHORIZED');
};

/**
 * Send a 403 Forbidden response
 */
export const sendForbidden = (
  res: Response,
  message: string = 'Forbidden'
): Response => {
  return sendError(res, message, 403, 'FORBIDDEN');
};

/**
 * Send a 422 Validation Error response
 */
export const sendValidationError = (
  res: Response,
  details: unknown
): Response => {
  return sendError(res, 'Validation failed', 422, 'VALIDATION_ERROR', details);
};

/**
 * Send a 500 Internal Server Error response
 */
export const sendServerError = (
  res: Response,
  message: string = 'Internal server error'
): Response => {
  return sendError(res, message, 500, 'INTERNAL_SERVER_ERROR');
};
