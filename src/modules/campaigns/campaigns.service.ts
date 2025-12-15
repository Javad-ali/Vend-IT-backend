import path from 'node:path';
import { nanoid } from 'nanoid';
import { supabase } from '../../libs/supabase.js';
import { apiError, ok } from '../../utils/response.js';
import { logger } from '../../config/logger.js';
import {
  createCampaign,
  deleteCampaign,
  getCampaignById,
  getLatestCampaign,
  listCampaigns,
  recordCampaignView,
  updateCampaign
} from './campaigns.repository.js';
import { getConfig } from '../../config/env.js';
const CAMPAIGN_BUCKET = 'campaigns';
const { supabaseUrl } = getConfig();
const buildImageUrl = (imagePath) => {
  if (!imagePath) return null;
  return `${supabaseUrl}/storage/v1/object/public/${CAMPAIGN_BUCKET}/${imagePath}`;
};
export const fetchLatestCampaign = async (userId) => {
  const campaign = await getLatestCampaign(new Date());
  if (!campaign) {
    // Return empty response instead of 404 when no campaign exists
    return ok(null, 'No active campaign found');
  }
  try {
    await recordCampaignView(userId, campaign.id);
  } catch (error) {
    const err = error;
    if (err?.code !== '23503') {
      throw error;
    }
    logger.warn(
      { userId, campaignId: campaign.id },
      'Skipping campaign view record for deleted user'
    );
  }
  return ok({ ...campaign, image_url: buildImageUrl(campaign.image_path) }, 'Campaign list found');
};
export const fetchAllCampaigns = async () => {
  const data = await listCampaigns();
  return data.map((c) => ({ ...c, image_url: buildImageUrl(c.image_path) }));
};

export const fetchCampaignById = async (id: string) => {
  const campaign = await getCampaignById(id);
  if (!campaign) throw new apiError(404, 'Campaign not found');
  return { ...campaign, image_url: buildImageUrl(campaign.image_path) };
};
const uploadImage = async (file) => {
  if (!file) return null;
  const ext = path.extname(file.originalname) || '.jpg';
  const objectKey = `${Date.now()}-${nanoid()}${ext}`;
  const { error } = await supabase.storage.from(CAMPAIGN_BUCKET).upload(objectKey, file.buffer, {
    contentType: file.mimetype,
    upsert: true
  });
  if (error) throw new apiError(400, 'Failed to upload campaign image', error.message);
  return objectKey;
};
export const createCampaignWithMedia = async (payload) => {
  const imagePath = await uploadImage(payload.file);
  const campaign = await createCampaign({
    title: payload.title,
    description: payload.description ?? null,
    start_date: payload.startAt,
    end_date: payload.endAt,
    image_path: imagePath,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
  return ok(
    { ...campaign, image_url: buildImageUrl(campaign?.image_path ?? null) },
    'Campaign created'
  );
};
export const updateCampaignWithMedia = async (id, payload) => {
  const existing = await getCampaignById(id);
  if (!existing) throw new apiError(404, 'Campaign not found');
  let imagePath = existing.image_path;
  if (payload.file) {
    imagePath = await uploadImage(payload.file);
  }
  const updated = await updateCampaign(id, {
    title: payload.title ?? existing.title,
    description: payload.description ?? existing.description,
    start_date: payload.startAt ?? existing.start_date,
    end_date: payload.endAt ?? existing.end_date,
    image_path: imagePath ?? existing.image_path,
    updated_at: new Date().toISOString()
  });
  return ok(
    { ...updated, image_url: buildImageUrl(updated?.image_path ?? null) },
    'Campaign updated'
  );
};
export const removeCampaign = async (id) => {
  await deleteCampaign(id);
  return ok(null, 'Campaign deleted');
};
