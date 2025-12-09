import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger.js';
import { apiError } from '../utils/response.js';
import { getConfig } from '../config/env.js';

/**
 * Extract request context for error logging
 */
const getRequestContext = (req: Request) => ({
  method: req.method,
  url: req.originalUrl || req.url,
  path: req.path,
  query: req.query,
  userId: req.user?.id ?? null,
  ip: req.ip ?? req.socket?.remoteAddress ?? null,
  userAgent: req.headers['user-agent'] ?? null,
  contentType: req.headers['content-type'] ?? null,
  referer: req.headers['referer'] ?? null
});

/**
 * Sanitize error details for production
 */
const sanitizeError = (err: Error, isDev: boolean) => {
  if (isDev) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack
    };
  }
  return {
    name: err.name,
    message: err.message
  };
};

/**
 * Global error handler middleware
 */
export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  const config = getConfig();
  const isDev = config.nodeEnv === 'development';
  const requestContext = getRequestContext(req);

  // Log error with full context
  logger.error(
    {
      err: sanitizeError(err, true),
      request: requestContext
    },
    `Error: ${err.message}`
  );

  // Handle known error types
  if (err instanceof apiError) {
    return res.status(err.statusCode).json({
      ...err.toJSON(),
      ...(isDev && { requestId: requestContext.url })
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      status: 400,
      message: 'Validation failed',
      errors: err.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code
      })),
      ...(isDev && { requestId: requestContext.url })
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 401,
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 401,
      message: 'Token expired'
    });
  }

  // Handle syntax errors in JSON body
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      status: 400,
      message: 'Invalid JSON in request body'
    });
  }

  // Generic internal server error
  return res.status(500).json({
    status: 500,
    message: isDev ? err.message : 'Internal server error',
    ...(isDev && {
      error: sanitizeError(err, true),
      requestId: requestContext.url
    })
  });
};
