import type { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.js';
import { getCorrelationId } from './correlation-id.js';

// Simple request logger using existing pino logger
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  // Skip logging for health checks and static assets
  const excludePaths = ['/api/health', '/assets'];
  if (excludePaths.some((path) => req.path.startsWith(path))) {
    return next();
  }
  // Log request
  logger.info(
    {
      correlationId: getCorrelationId(req),
      request: {
        method: req.method,
        url: req.url,
        userAgent: req.get('user-agent'),
        ip: req.ip
      }
    },
    `${req.method} ${req.url}`
  );
  // Override res.send to log response
  const originalSend = res.send;
  res.send = function (data) {
    const duration = Date.now() - start;
    logger.info(
      {
        correlationId: getCorrelationId(req),
        response: {
          statusCode: res.statusCode,
          duration
        }
      },
      `${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`
    );
    return originalSend.call(this, data);
  };
  next();
};
