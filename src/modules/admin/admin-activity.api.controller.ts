import type { Request, Response } from 'express';
import { apiSuccess, errorResponse } from '../../utils/response.js';
import { getActivityLogs } from './admin-activity.service.js';

export const getActivityLogsApi = async (req: Request, res: Response) => {
  try {
    const { page, limit, admin_id } = req.query;
    const logs = await getActivityLogs({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      admin_id: admin_id as string
    });
    return res.json(apiSuccess(logs));
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res
      .status(statusCode)
      .json(errorResponse(statusCode, error.message || 'Failed to fetch activity logs'));
  }
};
