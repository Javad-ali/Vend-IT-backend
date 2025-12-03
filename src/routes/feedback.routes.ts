import { Router } from 'express';
import { handleCreateRating, handleListRatings } from '../modules/feedback/feedback.controller.js';
import { requireAuth } from '../middleware/auth.js';
const router = Router();
router.use(requireAuth);
router.get('/ratings', handleListRatings);
router.post('/ratings', handleCreateRating);
export default router;
