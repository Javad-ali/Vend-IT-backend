import { Router } from 'express';
import { register } from '../libs/metrics.js';

const router = Router();

/**
 * GET /metrics
 * Expose Prometheus metrics for scraping
 */
router.get('/', async (_req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.send(metrics);
  } catch (error) {
    res.status(500).send('Error generating metrics');
  }
});

export default router;
