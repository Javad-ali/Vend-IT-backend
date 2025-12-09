import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
    }
  }
}

/**
 * Correlation ID middleware
 * Adds a unique correlation ID to each request for tracking across logs
 */
export const correlationIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Try to get correlation ID from header, or generate new one
  const correlationId =
    (req.get('x-correlation-id') as string) || (req.get('x-request-id') as string) || randomUUID();

  // Store in request
  req.correlationId = correlationId;

  // Add to response headers for client tracking
  res.setHeader('x-correlation-id', correlationId);

  next();
};

/**
 * Get correlation ID from request
 */
export const getCorrelationId = (req: Request): string => {
  return req.correlationId || 'unknown';
};
