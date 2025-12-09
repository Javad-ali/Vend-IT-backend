/**
 * Granular rate limiters for different API endpoints
 */
import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';
import { logger } from '../config/logger.js';

// Custom key generator that uses user ID when available
const keyGenerator = (req: Request): string => {
  // Use authenticated user ID if available
  if (req.user?.id) {
    return `user:${req.user.id}`;
  }
  // Fall back to IP address
  const forwarded = req.headers['x-forwarded-for'];
  const ip = Array.isArray(forwarded)
    ? forwarded[0]
    : typeof forwarded === 'string'
      ? forwarded.split(',')[0].trim()
      : req.ip;
  return `ip:${ip}`;
};

// Custom handler for when rate limit is exceeded
const rateLimitHandler = (req: Request, res: Response) => {
  logger.warn(
    {
      path: req.path,
      method: req.method,
      key: keyGenerator(req)
    },
    'Rate limit exceeded'
  );
  res.status(429).json({
    status: 429,
    message: 'Too many requests, please try again later'
  });
};

/**
 * Default API rate limiter
 * 120 requests per minute per user/IP
 */
export const defaultLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: rateLimitHandler
});

/**
 * Authentication rate limiter
 * 5 requests per 15 minutes per IP (stricter for auth endpoints)
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'Too many authentication attempts, please try again later'
  },
  skipSuccessfulRequests: false
});

/**
 * OTP resend rate limiter
 * 3 requests per 5 minutes per user
 */
export const otpResendLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  message: {
    status: 429,
    message: 'Too many OTP requests, please wait before requesting again'
  }
});

/**
 * Payment rate limiter
 * 10 payment attempts per minute per user
 */
export const paymentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  message: {
    status: 429,
    message: 'Too many payment attempts, please try again later'
  }
});

/**
 * Strict payment rate limiter for wallet operations
 * 5 wallet operations per minute per user
 */
export const walletLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  message: {
    status: 429,
    message: 'Too many wallet operations, please try again later'
  }
});

/**
 * Card management rate limiter
 * 10 card operations per hour per user
 */
export const cardLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  message: {
    status: 429,
    message: 'Too many card operations, please try again later'
  }
});

/**
 * Dispense rate limiter
 * 20 dispense commands per minute per user
 */
export const dispenseLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  message: {
    status: 429,
    message: 'Too many dispense requests, please try again later'
  }
});

/**
 * Contact form rate limiter
 * 3 submissions per hour per user
 */
export const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  message: {
    status: 429,
    message: 'Too many contact submissions, please try again later'
  }
});

/**
 * Feedback/Rating rate limiter
 * 10 ratings per hour per user
 */
export const feedbackLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  message: {
    status: 429,
    message: 'Too many feedback submissions, please try again later'
  }
});

/**
 * Search rate limiter
 * 30 searches per minute per user
 */
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator
});

/**
 * Admin panel rate limiter
 * More lenient for admin operations
 * 200 requests per minute per admin
 */
export const adminLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const adminId = req.session?.admin?.id;
    return adminId ? `admin:${adminId}` : keyGenerator(req);
  }
});

/**
 * Admin login rate limiter
 * 5 login attempts per 15 minutes per IP
 */
export const adminAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'Too many login attempts, please try again later'
  }
});

/**
 * Webhook rate limiter (very permissive)
 * 1000 requests per minute per IP
 */
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false
});

// Re-export default limiter for backwards compatibility
export { defaultLimiter as rateLimiter };
