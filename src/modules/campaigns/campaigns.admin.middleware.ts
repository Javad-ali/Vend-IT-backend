import { getCampaignById } from './campaigns.repository.js';
export const loadCampaign = async (req, res, next) => {
  const campaign = await getCampaignById(req.params.campaignId);
  if (!campaign) return res.status(404).render('errors/404.njk');
  req.campaign = campaign;
  return next();
};
