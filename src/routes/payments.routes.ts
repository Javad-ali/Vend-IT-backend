import { Router } from 'express';
import {
  handleCardPayment,
  handleChargeWallet,
  handleDeleteCard,
  handleDispenseUpdate,
  handleGPayPayment,
  handleGPayToken,
  handleIosPayment,
  handleListCards,
  handleLoyaltyHistory,
  handleOrderHistory,
  handlePaymentHistory,
  handleWalletHistory,
  handleWalletPayment,
  handleCreateCard
} from '../modules/payments/payments.controller.js';
import { requireAuth } from '../middleware/auth.js';
import {
  paymentLimiter,
  walletLimiter,
  cardLimiter,
  dispenseLimiter
} from '../middleware/rate-limiters.js';

const router = Router();

// All payment routes require authentication
router.use(requireAuth);

// Card management - hourly rate limit
router.post('/cards', cardLimiter, handleCreateCard);
router.get('/cards', handleListCards);
router.delete('/cards/:cardId', cardLimiter, handleDeleteCard);

// Wallet operations - strict rate limit
router.post('/wallet/charge', walletLimiter, handleChargeWallet);
router.post('/wallet/pay', walletLimiter, handleWalletPayment);

// Payment processing - per-minute rate limit
router.post('/card/pay', paymentLimiter, handleCardPayment);
router.post('/ios/pay', paymentLimiter, handleIosPayment);
router.post('/gpay/token', paymentLimiter, handleGPayToken);
router.post('/gpay/pay', paymentLimiter, handleGPayPayment);

// Dispense updates
router.post('/dispense', dispenseLimiter, handleDispenseUpdate);

// History endpoints (read-only, less strict)
router.get('/history', handlePaymentHistory);
router.get('/wallet/history', handleWalletHistory);
router.get('/orders/history', handleOrderHistory);
router.get('/loyalty/history', handleLoyaltyHistory);

export default router;
