import 'dotenv/config';
import { createServer } from 'http';
import app from './app.js';
import { getConfig } from './config/env.js';
import { logger } from './config/logger.js';
import { registerMachineSyncJob } from './modules/machines/machines.scheduler.js';
process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled promise rejection');
});
let isShuttingDown = false;
let server;
const gracefulShutdown = async (signal) => {
  if (isShuttingDown) {
    logger.warn('Shutdown already in progress, ignoring signal');
    return;
  }
  isShuttingDown = true;
  logger.info({ signal }, 'Received shutdown signal, starting graceful shutdown');
  // Stop accepting new connections
  server.close(async (err) => {
    if (err) {
      logger.error({ err }, 'Error closing HTTP server');
      process.exit(1);
    }
    logger.info('HTTP server closed');
    try {
      // Close Redis connection
      const { redis } = await import('./libs/redis.js');
      if (typeof redis.quit === 'function') {
        await redis.quit();
        logger.info('Redis connection closed');
      }
      // Close Supabase connection (if needed)
      // Supabase client doesn't require explicit closing
      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error({ error }, 'Error during graceful shutdown');
      process.exit(1);
    }
  });
  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Graceful shutdown timeout, forcing exit');
    process.exit(1);
  }, 30000);
};
try {
  const config = getConfig();
  server = createServer(app);
  registerMachineSyncJob();
  server.listen(config.port, config.host, () => {
    logger.info(`API listening on http://${config.host}:${config.port}`);
  });
  server.on('error', (error) => {
    logger.error({ error }, 'HTTP server failed to start');
    process.exitCode = 1;
  });
  // Register graceful shutdown handlers
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
} catch (error) {
  logger.error({ error }, 'Failed to bootstrap server');
  const proto = error ? Object.getPrototypeOf(error) : null;
  console.error('Bootstrap failed', {
    name: error?.name,
    message: error?.message,
    stack: error?.stack,
    keys: error && typeof error === 'object' ? Object.keys(error) : [],
    prototypeName: proto?.constructor?.name
  });
  process.exit(1);
}
