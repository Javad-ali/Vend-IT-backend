import type { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.js';

// Performance thresholds in milliseconds
const SLOW_REQUEST_THRESHOLD = 1000; // 1 second
const VERY_SLOW_REQUEST_THRESHOLD = 3000; // 3 seconds

/**
 * Performance monitoring middleware
 * Logs request timing and warns about slow requests
 */
export const performanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const startHrTime = process.hrtime.bigint();

  // Store original end method
  const originalEnd = res.end;

  // Override end method to log performance
  res.end = function (this: Response, chunk?: any, encodingOrCallback?: any, callback?: any) {
    const duration = Date.now() - startTime;
    const durationNs = Number(process.hrtime.bigint() - startHrTime);
    const durationMs = durationNs / 1_000_000;

    const logData = {
      method: req.method,
      url: req.url,
      route: (req.route?.path as string) || req.path,
      statusCode: res.statusCode,
      duration: Math.round(durationMs * 100) / 100, // Round to 2 decimal places
      userAgent: req.get('user-agent'),
      ip: req.ip
    };

    // Log based on duration and status
    if (res.statusCode >= 500) {
      logger.error(logData, 'Request failed with server error');
    } else if (duration >= VERY_SLOW_REQUEST_THRESHOLD) {
      logger.warn({ ...logData, threshold: 'very_slow' }, 'Very slow request detected');
    } else if (duration >= SLOW_REQUEST_THRESHOLD) {
      logger.warn({ ...logData, threshold: 'slow' }, 'Slow request detected');
    } else if (res.statusCode >= 400) {
      logger.warn(logData, 'Request failed with client error');
    } else {
      logger.debug(logData, 'Request completed');
    }

    // Call original end method
    return originalEnd.call(this, chunk, encodingOrCallback, callback);
  } as any;

  next();
};

/**
 * Slow query logger utility
 * Use this to wrap database queries and log slow ones
 */
export const logSlowQuery = async <T>(
  queryName: string,
  threshold: number,
  queryFn: () => Promise<T>
): Promise<T> => {
  const startTime = Date.now();

  try {
    const result = await queryFn();
    const duration = Date.now() - startTime;

    if (duration >= threshold) {
      logger.warn({ queryName, duration, threshold }, 'Slow database query detected');
    } else {
      logger.debug({ queryName, duration }, 'Query completed');
    }

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error({ queryName, duration, error }, 'Query failed');
    throw error;
  }
};

/**
 * Performance budget checker
 * Use this to ensure operations complete within a budget
 */
export const withPerformanceBudget = async <T>(
  operationName: string,
  budgetMs: number,
  operation: () => Promise<T>
): Promise<T> => {
  const startTime = Date.now();

  try {
    const result = await operation();
    const duration = Date.now() - startTime;

    if (duration > budgetMs) {
      logger.warn(
        { operationName, duration, budget: budgetMs, exceeded: duration - budgetMs },
        'Performance budget exceeded'
      );
    }

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error({ operationName, duration, budget: budgetMs, error }, 'Operation failed');
    throw error;
  }
};
