/**
 * API Response Utilities
 *
 * Standardized response formats for the Vend-IT API.
 */
import type { ApiResponse } from '../types/entities.js';

/**
 * Custom API Error class for consistent error handling
 */
export class apiError extends Error {
  statusCode: number;
  details: any;
  constructor(statusCode: number, message: string, details: any = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
  toJSON() {
    return {
      status: this.statusCode,
      message: this.message,
      details: this.details
    };
  }
}

/**
 * Create an error response for JSON APIs
 */
export const errorResponse = (statusCode: number, message: string, details: any = null) => ({
  status: statusCode,
  message,
  details
});

/**
 * Create a generic success response
 */
export const apiSuccess = <T>(data: T | null = null, message = 'Success'): ApiResponse<T> => ({
  status: 200,
  message,
  data: data as T
});

/**
 * Create a success response (200 OK)
 */
export const ok = <T>(data: T, message = 'OK'): ApiResponse<T> => ({
  status: 200,
  message,
  data
});

/**
 * Create a created response (201 Created)
 */
export const created = <T>(data: T, message = 'Created'): ApiResponse<T> => ({
  status: 201,
  message,
  data
});

/**
 * Create a no content response (204)
 */
export const noContent = (): ApiResponse<null> => ({
  status: 204,
  message: 'No Content',
  data: null
});

/**
 * Create a paginated response
 */
export const paginated = <T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
  message = 'OK'
): ApiResponse<T[]> => ({
  status: 200,
  message,
  data,
  meta: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  }
});
