import multer from 'multer';
import { createCampaignWithMedia, fetchAllCampaigns, removeCampaign, updateCampaignWithMedia } from './campaigns.service.js';
const upload = multer({ storage: multer.memoryStorage() });
export const campaignUploadMiddleware = upload.single('image');
export const renderCampaignList = async (_req, res) => {
    const campaigns = await fetchAllCampaigns();
    return res.render('admin/campaign-list.njk', {
        title: 'Campaigns',
        campaigns
    });
};
export const renderCampaignForm = async (req, res) => {
    const campaign = req.campaign ?? null;
    return res.render('admin/campaign-form.njk', {
        title: campaign ? 'Edit Campaign' : 'Create Campaign',
        campaign
    });
};
export const handleCreateCampaign = async (req, res) => {
    await createCampaignWithMedia({
        title: req.body.title,
        description: req.body.description,
        startAt: req.body.startAt,
        endAt: req.body.endAt,
        file: req.file ?? undefined
    });
    return res.redirect('/admin/campaigns');
};
export const handleUpdateCampaign = async (req, res) => {
    await updateCampaignWithMedia(req.params.campaignId, {
        title: req.body.title,
        description: req.body.description,
        startAt: req.body.startAt,
        endAt: req.body.endAt,
        file: req.file ?? undefined
    });
    return res.redirect('/admin/campaigns');
};
export const handleDeleteCampaign = async (req, res) => {
    await removeCampaign(req.params.campaignId);
    return res.redirect('/admin/campaigns');
};
