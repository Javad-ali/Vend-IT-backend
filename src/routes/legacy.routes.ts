import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import {
  handleLogin,
  handleLogout,
  handleRefreshToken,
  handleRegister,
  handleResendOtp,
  handleVerifyOtp
} from '../modules/auth/auth.controller.js';
import {
  handleCreateProfile,
  handleDeleteAccount,
  handleEditProfile,
  handleGetProfile,
  handleReferralInfo,
  uploadAvatar
} from '../modules/users/users.controller.js';
import { handleContact, handleStaticContent } from '../modules/content/content.controller.js';
import { handleCreateRating } from '../modules/feedback/feedback.controller.js';
import { handleListNotifications } from '../modules/notifications/notifications.controller.js';
import {
  handleCategories,
  handleLegacyProductImage,
  handleProducts,
  handleSearchProducts
} from '../modules/products/products.controller.js';
import {
  handleListMachines,
  handleTriggerDispense
} from '../modules/machines/machines.controller.js';
import {
  handleCreateCard,
  handleCardPayment,
  handleChargeWallet,
  handleDeleteCard,
  handleDispenseUpdate,
  handleGPayPayment,
  handleGPayToken,
  handleIosPayment,
  handleListCards,
  handleLoyaltyHistory,
  handleLoyaltyConversion,
  handleOrderHistory,
  handlePaymentHistory,
  handleWalletHistory,
  handleWalletPayment
} from '../modules/payments/payments.controller.js';
import { handleLatestCampaign } from '../modules/campaigns/campaigns.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { getMachineDetail } from '../modules/machines/machines.service.js';
import { ok } from '../utils/response.js';

const router = Router();
const legacyUpload = multer();
// Auth
router.post('/login', handleLogin);
router.post('/register', handleRegister);
router.post('/users/verify', requireAuth, handleVerifyOtp);
router.post('/users/resend', requireAuth, handleResendOtp);
router.post('/users/logout', requireAuth, handleLogout);
// Users / profile / content
router.post('/users/create-profile', requireAuth, handleCreateProfile);
router.get('/users/profile', requireAuth, handleGetProfile);
router.put('/users/edit-profile', requireAuth, uploadAvatar, handleEditProfile);
router.delete('/users/delete', requireAuth, handleDeleteAccount);
router.get('/users/static-content', handleStaticContent);
router.post('/users/contact-us', requireAuth, handleContact);
router.post('/users/add/rating', requireAuth, handleCreateRating);
router.get('/users/notifications', requireAuth, handleListNotifications);
router.post('/users/refresh-token', handleRefreshToken);
router.get('/users/referral/info', requireAuth, handleReferralInfo);
// Campaign
router.get('/users/campagin', requireAuth, handleLatestCampaign);
// Machines & products
const normalizeMachineIdQuery = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.query.machineId && req.query.machine_id) {
    req.query.machineId = String(req.query.machine_id);
  }
  next();
};
router.get('/users/machine/list', requireAuth, handleListMachines);
router.get(
  '/users/machine/details',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as Record<string, string | undefined>;
      const params = req.params as Record<string, string | undefined>;
      const machineId = String(
        query.machineId ?? query.machine_id ?? query.id ?? params.machineId ?? ''
      );
      if (!machineId) {
        res.status(400).json({ status: 400, message: 'machineId query param is required' });
        return;
      }
      const detail = await getMachineDetail(machineId);
      res.json(ok(detail, 'Machine detail'));
    } catch (error) {
      next(error);
    }
  }
);
router.post('/users/machine/dispense', requireAuth, handleTriggerDispense);
router.get('/users/category/list', requireAuth, normalizeMachineIdQuery, (req, res) =>
  handleCategories(req, res)
);
router.get('/users/product/list', requireAuth, normalizeMachineIdQuery, (req, res) =>
  handleProducts(req, res)
);
router.get('/users/search/product', requireAuth, normalizeMachineIdQuery, (req, res) =>
  handleSearchProducts(req, res)
);
router.post('/users/product/image', requireAuth, legacyUpload.none(), handleLegacyProductImage);
// Payments
router.post('/payments/create/cards', requireAuth, handleCreateCard);
router.get('/payments/card/list', requireAuth, handleListCards);
router.post('/payments/card/delete', requireAuth, (req, res) => {
  const body = req.body as any;
  const query = req.query as any;
  const cardId = body.cardId ?? body.id ?? query.cardId ?? query.id;
  if (!cardId) {
    return res.status(400).json({ status: 400, message: 'cardId is required' });
  }
  (req.params as any).cardId = String(cardId);
  return handleDeleteCard(req, res);
});
router.post('/payments/charge/wallet', requireAuth, handleChargeWallet);
router.post('/payments/pay-by-Wallet', requireAuth, handleWalletPayment);
router.post('/payments/makepayment', requireAuth, handleCardPayment);
router.post('/payments/save/paymentinfo/iOS', requireAuth, handleIosPayment);
router.post('/payments/create/gpay-apple/token', requireAuth, handleGPayToken);
router.post('/payments/create/gpay-apple-payment', requireAuth, handleGPayPayment);
router.get('/payments/wallet/history', requireAuth, handleWalletHistory);
router.get('/payments/order/history', requireAuth, handleOrderHistory);
router.get('/payments/loyalty-point/history', requireAuth, handleLoyaltyHistory);
router.get('/payments/loyalty-point/convert', requireAuth, handleLoyaltyConversion);
router.post('/payments/product/update/dispensedQty', requireAuth, handleDispenseUpdate);
router.get('/payments/history', requireAuth, handlePaymentHistory);
export default router;
