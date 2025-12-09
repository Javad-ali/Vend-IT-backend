/**
 * Redis Client Configuration
 *
 * Provides Redis client with automatic fallback to in-memory store
 * for development and testing environments.
 */
import { Redis as RedisClient } from 'ioredis';
import { getConfig } from '../config/env.js';
import { logger } from '../config/logger.js';
const connectionErrorCodes = new Set(['ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN']);
const createInMemoryRedis = () => {
  const store = new Map<string, { value: string; timeout?: NodeJS.Timeout }>();
  return {
    on(event: string, handler: (...args: any[]) => void) {
      return this;
    },
    async incr(key: string): Promise<number> {
      const current = store.get(key);
      const next = Number(current?.value ?? 0) + 1;
      store.set(key, { value: String(next), timeout: current?.timeout });
      return next;
    },
    async expire(key: string, seconds: number): Promise<number> {
      const record = store.get(key);
      if (!record) return 0;
      if (record.timeout) {
        clearTimeout(record.timeout);
      }
      const timeout = setTimeout(() => store.delete(key), seconds * 1000);
      timeout.unref?.();
      store.set(key, { ...record, timeout });
      return 1;
    },
    async setex(key: string, seconds: number, value: string): Promise<string> {
      const record = store.get(key);
      if (record?.timeout) {
        clearTimeout(record.timeout);
      }
      const timeout = setTimeout(() => store.delete(key), seconds * 1000);
      timeout.unref?.();
      store.set(key, { value, timeout });
      return 'OK';
    },
    async get(key: string): Promise<string | null> {
      return store.get(key)?.value ?? null;
    },
    async del(key: string): Promise<number> {
      const existed = store.delete(key);
      return existed ? 1 : 0;
    },
    async exists(...keys: string[]): Promise<number> {
      return keys.filter((k) => store.has(k)).length;
    },
    async set(key: string, value: string): Promise<string> {
      const record = store.get(key);
      store.set(key, { value, timeout: record?.timeout });
      return 'OK';
    }
  };
};
const config = getConfig();
export let redis: any = createInMemoryRedis();
let warnedFallback = false;
const useFallback = (reason: string, error: any = null) => {
  if (config.nodeEnv === 'production') {
    if (error) {
      logger.error({ err: error }, 'Redis connection failed in production');
    } else if (reason) {
      logger.error({ reason }, 'Redis configuration invalid in production');
    }
    return;
  }
  if (!warnedFallback) {
    const details = error?.code ?? reason ?? 'unknown';
    logger.warn({ details }, 'Redis unavailable; using in-memory fallback');
    warnedFallback = true;
  }
  redis = createInMemoryRedis();
};
if (config.redisUrl?.startsWith('redis://')) {
  const client = new RedisClient(config.redisUrl, {
    lazyConnect: config.nodeEnv !== 'production',
    maxRetriesPerRequest: config.nodeEnv === 'production' ? undefined : 0,
    retryStrategy: config.nodeEnv === 'production' ? undefined : () => null,
    enableReadyCheck: config.nodeEnv === 'production'
  });
  const handleConnectionError = (error: any) => {
    if (connectionErrorCodes.has(error?.code ?? '')) {
      useFallback('connection-error', error);
      client.removeAllListeners();
      void client.disconnect();
    } else {
      logger.error({ err: error }, 'Redis error');
    }
  };
  client.on('ready', () => {
    logger.info('Redis connected');
    redis = client;
  });
  client.on('error', handleConnectionError);
  client.connect().catch(handleConnectionError);
} else if (config.redisUrl?.startsWith('memory://')) {
  useFallback('memory-url');
} else if (config.nodeEnv !== 'production') {
  useFallback('missing-url');
} else {
  logger.error({ redisUrl: config.redisUrl }, 'Redis URL not configured for production');
}
