import { Worker } from 'bullmq';
import { logger } from '../config/logger.js';
import { getConfig } from '../config/env.js';
import { sendNotification } from '../modules/notifications/notifications.service.js';
const config = getConfig();
// Create connection for worker
const connection = {
  host: config.redisUrl?.replace('redis://', '').split(':')[0] || 'localhost',
  port: parseInt(config.redisUrl?.split(':')[2] || '6379'),
  maxRetriesPerRequest: null
};
// Notification worker
const notificationWorker = new Worker(
  'notifications',
  async (job) => {
    logger.info({ jobId: job.id, userId: job.data.userId }, 'Processing notification job');
    try {
      await sendNotification({
        receiverId: job.data.userId,
        title: job.data.title,
        body: job.data.body,
        data: job.data.data
      });
      logger.info({ jobId: job.id, userId: job.data.userId }, 'Notification sent successfully');
      return { success: true };
    } catch (error) {
      logger.error(
        { error, jobId: job.id, userId: job.data.userId },
        'Failed to send notification'
      );
      throw error;
    }
  },
  {
    connection,
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 1000
    }
  }
);
// Worker event listeners
notificationWorker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Notification job completed');
});
notificationWorker.on('failed', (job, error) => {
  logger.error({ jobId: job?.id, error }, 'Notification job failed');
});
notificationWorker.on('error', (error) => {
  logger.error({ error }, 'Notification worker error');
});
// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing notification worker');
  await notificationWorker.close();
  process.exit(0);
});
process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing notification worker');
  await notificationWorker.close();
  process.exit(0);
});
logger.info('Notification worker started');
