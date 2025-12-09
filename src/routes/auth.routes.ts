import { Router } from 'express';
import {
  handleLogin,
  handleLogout,
  handleRefreshToken,
  handleRegister,
  handleResendOtp,
  handleVerifyOtp
} from '../modules/auth/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter, otpResendLimiter } from '../middleware/rate-limiters.js';

const router = Router();

// Registration and login - strict rate limiting
router.post('/register', authLimiter, handleRegister);
router.post('/login', authLimiter, handleLogin);

// OTP verification
router.post('/verify', requireAuth, handleVerifyOtp);

// OTP resend - separate stricter limiter
router.post('/resend', requireAuth, otpResendLimiter, handleResendOtp);

// Logout
router.post('/logout', requireAuth, handleLogout);

// Token refresh
router.post('/refresh', handleRefreshToken);

export default router;
