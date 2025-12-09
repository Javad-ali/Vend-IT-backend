import { Router } from 'express';
import {
  handleCreateProfile,
  handleDeleteAccount,
  handleEditProfile,
  handleGetProfile,
  handleReferralInfo,
  uploadAvatar
} from '../modules/users/users.controller.js';
import { requireAuth } from '../middleware/auth.js';
const router = Router();
router.use(requireAuth);
router.post('/create-profile', handleCreateProfile);
router.get('/profile', handleGetProfile);
router.delete('/delete', handleDeleteAccount);
router.put('/edit-profile', uploadAvatar, handleEditProfile);
router.get('/referral', handleReferralInfo);
// router.post('/contact-us', handleContact);
// router.get('/static-content', handleStaticContent);
// router.get('/static-content', (_req, res, next) => {
//   _req.url = '/content/static';
//   next();
// });
export default router;
