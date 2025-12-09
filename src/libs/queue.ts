import { Queue } from 'bullmq';
import { logger } from '../config/logger.js';
import { getConfig } from '../config/env.js';
const config = getConfig();
// Create connection for BullMQ (it needs ioredis instance)
// Note: BullMQ requires a real Redis connection, not our adapter
const connection = {
  host: config.redisUrl?.replace('redis://', '').split(':')[0] || 'localhost',
  port: parseInt(config.redisUrl?.split(':')[2] || '6379'),
  maxRetriesPerRequest: null as null
};
// Create queues
export const notificationQueue = new Queue('notifications', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: 100,
    removeOnFail: 500
  }
});
export const machineSyncQueue = new Queue('machine-sync', {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: 50,
    removeOnFail: 200
  }
});
export const paymentQueue = new Queue('payments', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    },
    removeOnComplete: 200,
    removeOnFail: 1000
  }
});
// Queue event listeners
notificationQueue.on('error', (error) => {
  logger.error({ error }, 'Notification queue error');
});
machineSyncQueue.on('error', (error) => {
  logger.error({ error }, 'Machine sync queue error');
});
paymentQueue.on('error', (error) => {
  logger.error({ error }, 'Payment queue error');
});
// Helper functions to add jobs
export const queueNotification = async (data: any) => {
  try {
    const job = await notificationQueue.add('send-notification', data);
    logger.info({ jobId: job.id, userId: data.userId }, 'Notification job queued');
    return job;
  } catch (error) {
    logger.error({ error, data }, 'Failed to queue notification');
    throw error;
  }
};
export const queueMachineSync = async (data: any) => {
  try {
    const job = await machineSyncQueue.add('sync-machine', data);
    logger.info({ jobId: job.id, machineId: data.machineId }, 'Machine sync job queued');
    return job;
  } catch (error) {
    logger.error({ error, data }, 'Failed to queue machine sync');
    throw error;
  }
};
export const queuePaymentProcess = async (data: any) => {
  try {
    const job = await paymentQueue.add('process-payment', data);
    logger.info({ jobId: job.id, paymentId: data.paymentId }, 'Payment process job queued');
    return job;
  } catch (error) {
    logger.error({ error, data }, 'Failed to queue payment process');
    throw error;
  }
};
logger.info('Job queues initialized');
