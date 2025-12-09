import { Router } from 'express';
import { getConfig } from '../config/env.js';
const router = Router();
router.get('/', async (_req, res) => {
  const config = getConfig();
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: config.nodeEnv,
    services: {
      database: { status: 'unknown', responseTime: 0 },
      redis: { status: 'unknown', responseTime: 0 }
    },
    system: {
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB'
      },
      cpu: process.cpuUsage()
    }
  };
  // Check database connectivity
  try {
    const dbStart = Date.now();
    const { supabase } = await import('../libs/supabase.js');
    const { error } = await supabase.from('users').select('id').limit(1);
    health.services.database.responseTime = Date.now() - dbStart;
    health.services.database.status = error ? 'error' : 'ok';
  } catch (error) {
    health.services.database.status = 'error';
    health.status = 'degraded';
  }
  // Check Redis connectivity
  try {
    const redisStart = Date.now();
    const { redis } = await import('../libs/redis.js');
    await redis.get('health-check');
    health.services.redis.responseTime = Date.now() - redisStart;
    health.services.redis.status = 'ok';
  } catch (error) {
    health.services.redis.status = 'error';
    health.status = 'degraded';
  }
  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});
export default router;
