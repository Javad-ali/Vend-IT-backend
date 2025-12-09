import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getConfig } from '../config/env.js';
import { logger } from '../config/logger.js';
import { apiError, errorResponse } from '../utils/response.js';

const config = getConfig();

/**
 * Middleware to require admin authentication via JWT token
 * For API endpoints that return JSON
 */
export const requireAdminToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void | Response => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(errorResponse(401, 'No authorization token provided'));
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = jwt.verify(token, config.jwtAccessSecret) as {
        adminId: string;
        email: string;
        name: string | null;
      };

      // Attach admin info to request for use in controllers
      (req as any).admin = decoded;

      return next();
    } catch (jwtError: any) {
      logger.warn({ error: jwtError.message }, 'Invalid admin JWT token');
      return res.status(401).json(errorResponse(401, 'Invalid or expired token'));
    }
  } catch (error: any) {
    logger.error({ error }, 'Error in requireAdminToken middleware');
    return res.status(500).json(errorResponse(500, 'Authentication error'));
  }
};

/**
 * Export existing session-based middleware for backward compatibility
 */
export {
  requireAdmin,
  requireAdminRole,
  attachAdmin,
  redirectIfAuthenticated,
  regenerateSession,
  destroySession
} from './admin-auth.js';
