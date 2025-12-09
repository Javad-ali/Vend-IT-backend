import type { Request, Response } from 'express';
import { apiSuccess, errorResponse } from '../../utils/response.js';
import { getAdminChartData } from './admin-chart-data.service.js';

export const getChartDataApi = async (_req: Request, res: Response) => {
  try {
    const chartData = await getAdminChartData();
    return res.json(apiSuccess({ charts: chartData }));
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res
      .status(statusCode)
      .json(errorResponse(statusCode, error.message || 'Failed to fetch chart data'));
  }
};
