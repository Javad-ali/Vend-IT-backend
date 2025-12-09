import type { Request, Response } from 'express';
import { apiSuccess, apiError, errorResponse } from '../../utils/response.js';
import { fetchStaticContent, updateStaticContent } from '../content/content.service.js';
import { staticContentSchema } from '../content/content.validators.js';

/**
 * API: Get static content
 */
export const getContentApi = async (_req: Request, res: Response) => {
  try {
    const response = await fetchStaticContent();
    return res.json(apiSuccess(response));
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res
      .status(statusCode)
      .json(errorResponse(statusCode, error.message || 'Failed to fetch content'));
  }
};

/**
 * API: Update static content
 */
export const updateContentApi = async (req: Request, res: Response) => {
  try {
    const payload = staticContentSchema.parse(req.body);
    const response = await updateStaticContent(payload);
    return res.json(apiSuccess(response, 'Content updated successfully'));
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res
      .status(statusCode)
      .json(errorResponse(statusCode, error.message || 'Failed to update content'));
  }
};
