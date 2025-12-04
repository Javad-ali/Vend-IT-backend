import type { Request, Response, NextFunction } from 'express';
import { httpRequestDuration, httpRequestTotal, activeConnections } from '../libs/metrics.js';

/**
 * Middleware to collect HTTP metrics for Prometheus
 */
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Track active connections
  activeConnections.inc();

  // Start timer for request duration
  const end = httpRequestDuration.startTimer();

  // Store original end method
  const originalEnd = res.end;

  // Override end method to capture metrics
  res.end = function (this: Response, chunk?: any, encodingOrCallback?: any, callback?: any) {
    // Get route pattern (or path if no route)
    const route = (req.route?.path as string) || req.path || 'unknown';
    const method = req.method;
    const statusCode = res.statusCode.toString();

    // Record metrics
    end({ method, route, status_code: statusCode });
    httpRequestTotal.inc({ method, route, status_code: statusCode });
    activeConnections.dec();

    // Call original end method with proper arguments
    return originalEnd.call(this, chunk, encodingOrCallback, callback);
  } as any;

  next();
};
