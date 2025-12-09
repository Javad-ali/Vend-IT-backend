import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { httpIntegration, expressIntegration } from '@sentry/node';
import type { Express } from 'express';
import { getConfig } from '../config/env.js';
import { logger } from '../config/logger.js';

const config = getConfig();

/**
 * Initialize Sentry for error tracking and performance monitoring
 */
export const initSentry = (app: Express) => {
  if (!process.env.SENTRY_DSN) {
    logger.warn('SENTRY_DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: config.nodeEnv,
    release: process.env.npm_package_version || '1.0.0',

    // Performance Monitoring
    tracesSampleRate: config.nodeEnv === 'production' ? 0.1 : 1.0,
    profilesSampleRate: config.nodeEnv === 'production' ? 0.1 : 1.0,

    integrations: [
      // HTTP request tracing
      httpIntegration(),

      // Express integration (automatically finds the Express app)
      expressIntegration(),

      // Node profiling
      nodeProfilingIntegration()
    ],

    // Filter out health check and metrics requests
    beforeSend(event) {
      const url = event.request?.url;
      if (url?.includes('/health') || url?.includes('/metrics')) {
        return null;
      }
      return event;
    },

    // Add custom tags
    initialScope: {
      tags: {
        service: 'vend-it-backend',
        region: 'kuwait'
      }
    }
  });

  logger.info({ environment: config.nodeEnv }, 'Sentry initialized');
};

/**
 * Capture exception with context
 */
export const captureException = (error: Error, context?: Record<string, any>) => {
  Sentry.captureException(error, {
    extra: context
  });
};

/**
 * Capture message with severity
 */
export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
  Sentry.captureMessage(message, level);
};

/**
 * Set user context for error tracking
 */
export const setUserContext = (userId: string, email?: string) => {
  Sentry.setUser({
    id: userId,
    email
  });
};

/**
 * Clear user context (on logout)
 */
export const clearUserContext = () => {
  Sentry.setUser(null);
};

// Export Sentry and handlers for middleware usage
export { Sentry };
export { setupExpressErrorHandler } from '@sentry/node';
