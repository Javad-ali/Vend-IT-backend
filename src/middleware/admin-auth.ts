import type { Request, Response, NextFunction } from 'express';
import 'express-session';
import { logger } from '../config/logger.js';

/**
 * Middleware to require admin authentication
 * Redirects to login page if not authenticated
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void | Response => {
  if (req.session?.admin) {
    // Refresh session expiry on activity (if method exists)
    if (typeof req.session.touch === 'function') {
      req.session.touch();
    }
    return next();
  }

  logger.info({ path: req.path }, 'Unauthenticated admin access attempt');

  // Store intended destination for redirect after login
  if (req.method === 'GET' && !req.path.includes('/login')) {
    req.session.returnTo = req.originalUrl;
  }

  return res.redirect('/admin/login');
};

/**
 * Middleware to require specific admin role
 */
export const requireAdminRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void | Response => {
    if (!req.session?.admin) {
      return res.redirect('/admin/login');
    }

    const adminRole = req.session.admin.role;

    if (!allowedRoles.includes(adminRole)) {
      logger.warn(
        { adminId: req.session.admin.id, role: adminRole, requiredRoles: allowedRoles },
        'Admin role access denied'
      );

      return res.status(403).render('admin/error', {
        title: 'Access Denied',
        message: 'You do not have permission to access this resource.'
      });
    }

    return next();
  };
};

/**
 * Middleware to attach admin info to response locals
 * Makes admin data available in templates
 */
export const attachAdmin = (req: Request, res: Response, next: NextFunction): void => {
  res.locals.admin = req.session?.admin ?? null;
  res.locals.isAuthenticated = !!req.session?.admin;
  next();
};

/**
 * Middleware to check if already logged in
 * Redirects to dashboard if already authenticated
 */
export const redirectIfAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction
): void | Response => {
  if (req.session?.admin) {
    return res.redirect('/admin/dashboard');
  }
  return next();
};

/**
 * Middleware to regenerate session after login
 * Prevents session fixation attacks
 */
export const regenerateSession = (
  req: Request,
  adminData: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  }
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const returnTo = req.session.returnTo;

    req.session.regenerate((err) => {
      if (err) {
        logger.error({ err }, 'Failed to regenerate session');
        return reject(err);
      }

      req.session.admin = adminData;
      if (returnTo) {
        req.session.returnTo = returnTo;
      }

      req.session.save((saveErr) => {
        if (saveErr) {
          logger.error({ err: saveErr }, 'Failed to save session');
          return reject(saveErr);
        }
        resolve();
      });
    });
  });
};

/**
 * Middleware to destroy session on logout
 */
export const destroySession = (req: Request): Promise<void> => {
  return new Promise((resolve, reject) => {
    req.session.destroy((err) => {
      if (err) {
        logger.error({ err }, 'Failed to destroy session');
        return reject(err);
      }
      resolve();
    });
  });
};
