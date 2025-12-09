import './utils/async-wrapper.js';
import express from 'express';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'node:path';
import session from 'express-session';
import { errorHandler } from './middleware/error-handler.js';
import { defaultLimiter } from './middleware/rate-limiters.js';
import { requestLogger } from './middleware/request-logger.js';
import { correlationIdMiddleware } from './middleware/correlation-id.js';
import { performanceMiddleware } from './middleware/performance.js';
import { metricsMiddleware } from './middleware/metrics.js';
import routes from './routes/index.js';
import metricsRoutes from './routes/metrics.routes.js';
import { getConfig } from './config/env.js';
import { flash } from './middleware/flash.js';
import { logger } from './config/logger.js';
import { initSentry, Sentry } from './libs/sentry.js';

const app = express();
const config = getConfig();

// Initialize Sentry (must be first)
initSentry(app);

// Configure allowed CORS origins
const getAllowedOrigins = (): string[] | string => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS;

  // In development, allow all origins if not specified
  if (config.nodeEnv === 'development' && !allowedOrigins) {
    return '*';
  }

  // Parse comma-separated origins
  if (allowedOrigins) {
    return allowedOrigins
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  // Production default: no wildcard, must be explicitly configured
  if (config.nodeEnv === 'production') {
    logger.warn(
      'ALLOWED_ORIGINS not configured in production - CORS will reject all cross-origin requests'
    );
    return [];
  }

  return '*';
};
// Allow Express to honor X-Forwarded-* headers when traffic comes through
// local proxies (ngrok/localhost); still restrict trust to loopback ranges
// so rate limiting cannot be bypassed from arbitrary IPs.
app.set('trust proxy', 'loopback');
// Sentry request handler (must be first middleware)
if (process.env.SENTRY_DSN) {
  app.use(Sentry.expressErrorHandler());
}

// Metrics middleware (early to capture all requests)
app.use(metricsMiddleware);

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: config.nodeEnv === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false
  })
);

// CORS configuration
const allowedOrigins = getAllowedOrigins();
app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
    credentials: true,
    maxAge: 86400 // 24 hours
  })
);

// Default rate limiter
app.use(defaultLimiter);
app.use(compression());
const captureRawBody = (req, _res, buf) => {
  req.rawBody = Buffer.from(buf);
};
app.use(express.json({ limit: '2mb', verify: captureRawBody }));
app.use(express.urlencoded({ extended: true, verify: captureRawBody }));

// Add correlation ID (must be early)
app.use(correlationIdMiddleware);

// Add structured request/response logging
app.use(requestLogger);

// Add performance monitoring (after logger)
app.use(performanceMiddleware);

app.use(morgan('combined'));
app.use('/assets', express.static(path.join(process.cwd(), 'src/public/Assets')));
app.use(
  session({
    secret: config.cookieSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: config.nodeEnv === 'production' ? 'strict' : 'lax',
      secure: config.nodeEnv === 'production'
    }
  })
);
app.use(flash);

// Expose metrics endpoint
app.use('/metrics', metricsRoutes);

app.use('/api', routes);

app.use(errorHandler);
export default app;
