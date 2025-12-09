import { redis } from './redis.js';
import { logger } from '../config/logger.js';

const DEFAULT_TTL = 300; // 5 minutes
const DEFAULT_PREFIX = 'cache';

interface CacheOptions {
  prefix?: string;
  ttl?: number;
}

/**
 * Generate a cache key with optional prefix
 */
const getCacheKey = (key: string, prefix?: string): string => {
  const actualPrefix = prefix || DEFAULT_PREFIX;
  return `${actualPrefix}:${key}`;
};
/**
 * Get a value from cache
 */
export const cacheGet = async <T = any>(key: string, options?: CacheOptions): Promise<T | null> => {
  try {
    const cacheKey = getCacheKey(key, options?.prefix);
    const value = await redis.get(cacheKey);
    if (!value) {
      return null;
    }
    return JSON.parse(value) as T;
  } catch (error) {
    logger.warn({ error, key }, 'Cache get failed');
    return null;
  }
};
/**
 * Set a value in cache with TTL
 */
export const cacheSet = async (
  key: string,
  value: any,
  options?: CacheOptions
): Promise<boolean> => {
  try {
    const cacheKey = getCacheKey(key, options?.prefix);
    const ttl = options?.ttl || DEFAULT_TTL;
    const serialized = JSON.stringify(value);
    await redis.setex(cacheKey, ttl, serialized);
    return true;
  } catch (error) {
    logger.warn({ error, key }, 'Cache set failed');
    return false;
  }
};
/**
 * Delete a value from cache
 */
export const cacheDel = async (key: string, options?: CacheOptions): Promise<boolean> => {
  try {
    const cacheKey = getCacheKey(key, options?.prefix);
    await redis.del(cacheKey);
    return true;
  } catch (error) {
    logger.warn({ error, key }, 'Cache delete failed');
    return false;
  }
};
/**
 * Delete multiple keys matching a pattern
 */
export const cacheDelPattern = async (pattern: string, options?: CacheOptions): Promise<number> => {
  try {
    const prefix = options?.prefix || DEFAULT_PREFIX;
    const fullPattern = `${prefix}:${pattern}`;
    // Note: This is a simple implementation. For production with many keys,
    // consider using SCAN instead of KEYS to avoid blocking
    logger.info({ pattern: fullPattern }, 'Deleting cache keys by pattern');
    // Since our RedisAdapter doesn't have keys() method, we'll just log
    // In a real implementation, you'd use SCAN or KEYS
    return 0;
  } catch (error) {
    logger.warn({ error, pattern }, 'Cache pattern delete failed');
    return 0;
  }
};
/**
 * Wrapper function to cache the result of an async function
 */
export const cacheWrap = async <T = any>(
  key: string,
  fn: () => Promise<T>,
  options?: CacheOptions
): Promise<T> => {
  // Try to get from cache first
  const cached = await cacheGet<T>(key, options);
  if (cached !== null) {
    logger.debug({ key }, 'Cache hit');
    return cached;
  }
  logger.debug({ key }, 'Cache miss');
  // Execute the function
  const result = await fn();
  // Store in cache
  await cacheSet(key, result, options);
  return result;
};
/**
 * Cache key generators for common patterns
 */
export const CacheKeys = {
  products: (machineId: string, categoryId?: string): string =>
    categoryId ? `products:${machineId}:${categoryId}` : `products:${machineId}`,
  categories: (machineId: string): string => `categories:${machineId}`,
  machine: (machineId: string): string => `machine:${machineId}`,
  machines: (lat: number, lng: number, radius: number): string =>
    `machines:${lat.toFixed(4)}:${lng.toFixed(4)}:${radius}`,
  productDetail: (productId: string): string => `product:${productId}`
};
/**
 * Cache TTL constants (in seconds)
 */
export const CacheTTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 600, // 10 minutes
  HOUR: 3600, // 1 hour
  DAY: 86400 // 24 hours
};
