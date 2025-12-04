import client from 'prom-client';
import { logger } from '../config/logger.js';

// Create a Registry to register metrics
export const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({
  register,
  prefix: 'vendit_'
});

// HTTP Request Duration Histogram
export const httpRequestDuration = new client.Histogram({
  name: 'vendit_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10]
});

// HTTP Request Counter
export const httpRequestTotal = new client.Counter({
  name: 'vendit_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// Active Connections Gauge
export const activeConnections = new client.Gauge({
  name: 'vendit_active_connections',
  help: 'Number of active HTTP connections'
});

// Database Query Duration
export const dbQueryDuration = new client.Histogram({
  name: 'vendit_db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.001, 0.01, 0.05, 0.1, 0.5, 1, 2]
});

// Cache Operations
export const cacheHits = new client.Counter({
  name: 'vendit_cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['key_prefix']
});

export const cacheMisses = new client.Counter({
  name: 'vendit_cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['key_prefix']
});

// Business Metrics
export const paymentsTotal = new client.Counter({
  name: 'vendit_payments_total',
  help: 'Total number of payment transactions',
  labelNames: ['method', 'status']
});

export const paymentsAmount = new client.Counter({
  name: 'vendit_payments_amount_total',
  help: 'Total payment amount in base currency',
  labelNames: ['method', 'currency']
});

export const dispensesTotal = new client.Counter({
  name: 'vendit_dispenses_total',
  help: 'Total number of product dispenses',
  labelNames: ['machine_id', 'status']
});

export const loyaltyPointsEarned = new client.Counter({
  name: 'vendit_loyalty_points_earned_total',
  help: 'Total loyalty points earned by users'
});

export const loyaltyPointsRedeemed = new client.Counter({
  name: 'vendit_loyalty_points_redeemed_total',
  help: 'Total loyalty points redeemed by users'
});

// Register all metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(activeConnections);
register.registerMetric(dbQueryDuration);
register.registerMetric(cacheHits);
register.registerMetric(cacheMisses);
register.registerMetric(paymentsTotal);
register.registerMetric(paymentsAmount);
register.registerMetric(dispensesTotal);
register.registerMetric(loyaltyPointsEarned);
register.registerMetric(loyaltyPointsRedeemed);

logger.info('Prometheus metrics initialized');

/**
 * Helper to track database query duration
 */
export const trackDbQuery = async <T>(
  operation: string,
  table: string,
  queryFn: () => Promise<T>
): Promise<T> => {
  const end = dbQueryDuration.startTimer({ operation, table });
  try {
    const result = await queryFn();
    end();
    return result;
  } catch (error) {
    end();
    throw error;
  }
};
