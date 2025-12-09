/**
 * CSRF Protection Middleware
 *
 * Implements a double-submit cookie pattern for CSRF protection.
 * This is used for the admin panel which uses session-based authentication.
 */
import type { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'node:crypto';
import { logger } from '../config/logger.js';
import { getConfig } from '../config/env.js';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = '_csrf';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_FORM_FIELD = '_csrf';

/**
 * Generate a cryptographically secure CSRF token
 */
export const generateCsrfToken = (): string => {
  return randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
};

/**
 * Middleware to generate and set CSRF token
 * Should be used on GET requests that render forms
 */
export const setCsrfToken = (req: Request, res: Response, next: NextFunction): void => {
  const config = getConfig();

  // Generate new token if none exists
  if (!req.cookies?.[CSRF_COOKIE_NAME]) {
    const token = generateCsrfToken();

    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false, // Must be readable by JavaScript for AJAX
      secure: config.nodeEnv === 'production',
      sameSite: config.nodeEnv === 'production' ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    // Make token available to templates
    res.locals.csrfToken = token;
  } else {
    res.locals.csrfToken = req.cookies[CSRF_COOKIE_NAME];
  }

  next();
};

/**
 * Middleware to validate CSRF token on state-changing requests
 * Checks both header and form body for the token
 */
export const validateCsrfToken = (req: Request, res: Response, next: NextFunction) => {
  // Skip validation for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next();
    return;
  }

  const config = getConfig();

  // Skip CSRF validation in test environment
  if (config.nodeEnv === 'test') {
    next();
    return;
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME] as string | undefined;
  const bodyToken = req.body?.[CSRF_FORM_FIELD] as string | undefined;

  // Token must be present in cookie
  if (!cookieToken) {
    logger.warn({ path: req.path, method: req.method }, 'CSRF: Missing cookie token');

    // For admin panel, redirect to login
    if (req.path.startsWith('/admin')) {
      req.session?.destroy?.(() => {});
      res.redirect('/admin/login?error=session_expired');
      return;
    }

    res.status(403).json({
      status: 403,
      message: 'CSRF validation failed: missing token'
    });
    return;
  }

  // Token must match in header or body
  const submittedToken = headerToken || bodyToken;

  if (!submittedToken) {
    logger.warn({ path: req.path, method: req.method }, 'CSRF: No token submitted');

    if (req.path.startsWith('/admin')) {
      res.redirect('/admin/login?error=csrf_failed');
      return;
    }

    res.status(403).json({
      status: 403,
      message: 'CSRF validation failed: token not submitted'
    });
    return;
  }

  // Constant-time comparison to prevent timing attacks
  if (!timingSafeEqual(cookieToken, submittedToken)) {
    logger.warn({ path: req.path, method: req.method }, 'CSRF: Token mismatch');

    if (req.path.startsWith('/admin')) {
      res.redirect('/admin/login?error=csrf_failed');
      return;
    }

    res.status(403).json({
      status: 403,
      message: 'CSRF validation failed: token mismatch'
    });
    return;
  }

  next();
};

/**
 * Constant-time string comparison to prevent timing attacks
 */
const timingSafeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
};

/**
 * Combined middleware for admin routes
 * Sets token on GET, validates on other methods
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    setCsrfToken(req, res, next);
    return;
  }
  validateCsrfToken(req, res, next);
};

export default csrfProtection;
