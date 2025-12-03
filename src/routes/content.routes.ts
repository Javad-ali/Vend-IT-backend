import { Router } from 'express';
import { handleContact, handleStaticContent } from '../modules/content/content.controller.js';
import { requireAuth } from '../middleware/auth.js';
const router = Router();
router.get('/static', handleStaticContent);
router.post('/contact', requireAuth, handleContact);
export default router;
