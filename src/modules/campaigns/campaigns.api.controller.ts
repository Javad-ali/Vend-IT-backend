import type { Request, Response } from 'express';
import multer from 'multer';
import { apiSuccess, apiError, errorResponse } from '../../utils/response.js';
import { audit } from '../../utils/audit.js';
import {
  createCampaignWithMedia,
  fetchAllCampaigns,
  fetchCampaignById,
  removeCampaign,
  updateCampaignWithMedia
} from '../campaigns/campaigns.service.js';

const upload = multer({ storage: multer.memoryStorage() });
export const campaignUploadMiddleware = upload.single('image');

/**
 * API: Get all campaigns
 */
export const getCampaignsApi = async (_req: Request, res: Response) => {
  try {
    const campaigns = await fetchAllCampaigns();
    return res.json(apiSuccess({ campaigns }));
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res
      .status(statusCode)
      .json(errorResponse(statusCode, error.message || 'Failed to fetch campaigns'));
  }
};

/**
 * API: Get campaign by ID
 */
export const getCampaignByIdApi = async (req: Request, res: Response) => {
  try {
    const campaign = await fetchCampaignById(req.params.campaignId);
    return res.json(apiSuccess(campaign));
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res
      .status(statusCode)
      .json(errorResponse(statusCode, error.message || 'Failed to fetch campaign'));
  }
};

/**
 * API: Create campaign
 */
export const createCampaignApi = async (req: Request, res: Response) => {
  try {
    const admin = (req as any).admin;
    const campaign = await createCampaignWithMedia({
      title: req.body.title,
      description: req.body.description,
      startAt: req.body.startAt,
      endAt: req.body.endAt,
      file: req.file ?? undefined
    });
    
    // Log campaign creation
    await audit.adminAction(
      admin?.adminId,
      'campaign',
      campaign?.data?.id || 'new',
      { action: 'created', title: req.body.title, adminName: admin?.name },
      req
    );
    
    return res.status(201).json(apiSuccess({ campaign }, 'Campaign created successfully'));
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res
      .status(statusCode)
      .json(errorResponse(statusCode, error.message || 'Failed to create campaign'));
  }
};

/**
 * API: Update campaign
 */
export const updateCampaignApi = async (req: Request, res: Response) => {
  try {
    const admin = (req as any).admin;
    const campaign = await updateCampaignWithMedia(req.params.campaignId, {
      title: req.body.title,
      description: req.body.description,
      startAt: req.body.startAt,
      endAt: req.body.endAt,
      file: req.file ?? undefined
    });
    
    // Log campaign update
    await audit.adminAction(
      admin?.adminId,
      'campaign',
      req.params.campaignId,
      { action: 'updated', title: req.body.title, adminName: admin?.name },
      req
    );
    
    return res.json(apiSuccess({ campaign }, 'Campaign updated successfully'));
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res
      .status(statusCode)
      .json(errorResponse(statusCode, error.message || 'Failed to update campaign'));
  }
};

/**
 * API: Delete campaign
 */
export const deleteCampaignApi = async (req: Request, res: Response) => {
  try {
    const admin = (req as any).admin;
    await removeCampaign(req.params.campaignId);
    
    // Log campaign deletion
    await audit.adminAction(
      admin?.adminId,
      'campaign',
      req.params.campaignId,
      { action: 'deleted', adminName: admin?.name },
      req
    );
    
    return res.json(apiSuccess(null, 'Campaign deleted successfully'));
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res
      .status(statusCode)
      .json(errorResponse(statusCode, error.message || 'Failed to delete campaign'));
  }
};
