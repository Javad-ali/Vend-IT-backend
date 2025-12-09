import { Router } from 'express';
import {
  handleGenerateQr,
  handleSilkronWebhook,
  handleTapWebhook
} from '../modules/machines/machines.qr.controller.js';
import { requireAdmin } from '../middleware/admin-auth.js'; // if QR generation should be admin-only
const router = Router();
// protect as needed: if admin only, use requireAdmin; else reuse requireAuth.
router.post('/:machineId/qr', requireAdmin, handleGenerateQr);
// webhooks usually unauthenticated but check signatures inside controller if needed
router.post('/webhooks/silkron', handleSilkronWebhook);
router.post('/webhooks/tap', handleTapWebhook);
export default router;
