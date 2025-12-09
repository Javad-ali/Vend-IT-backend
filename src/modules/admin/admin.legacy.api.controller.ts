import type { Request, Response } from 'express';
import { apiSuccess, apiError, errorResponse } from '../../utils/response.js';
import { generateImageFromText } from './admin.legacy.service.js';

/**
 * API: Generate image from text (legacy tool)
 */
export const generateImageApi = async (req: Request, res: Response) => {
  try {
    const { prompt, styleId } = req.body;

    if (!prompt) {
      throw errorResponse(400, 'Prompt is required');
    }

    const result = await generateImageFromText({ prompt, styleId });
    return res.json(result);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res
      .status(statusCode)
      .json(errorResponse(statusCode, error.message || 'Failed to generate image'));
  }
};
