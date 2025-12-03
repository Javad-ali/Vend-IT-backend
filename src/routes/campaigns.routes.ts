import { Router } from 'express';
import { handleLatestCampaign } from '../modules/campaigns/campaigns.controller.js';
import { requireAuth } from '../middleware/auth.js';
const router = Router();
router.use(requireAuth);
router.get('/latest', handleLatestCampaign);
export default router;
