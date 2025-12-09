import { listActivityLogs } from './admin-activity.repository.js';

export const getActivityLogs = async (params?: {
  page?: number;
  limit?: number;
  admin_id?: string;
}) => {
  const result = await listActivityLogs(params);
  return {
    logs: result.data,
    meta: result.meta
  };
};
