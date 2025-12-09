import cron from 'node-cron';
import { logger } from '../../config/logger.js';
import { syncMachines } from './machines.service.js';
export const registerMachineSyncJob = () => {
  cron.schedule('*/30 * * * *', async () => {
    try {
      await syncMachines();
    } catch (error) {
      logger.error({ error }, 'Machine sync failed');
    }
  });
};
