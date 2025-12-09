import {
  loginUser,
  logoutUser,
  refreshSession,
  registerUser,
  resendOtp,
  verifyOtp
} from './auth.service.js';
import {
  loginSchema,
  otpSchema,
  refreshTokenSchema,
  registerSchema,
  resendOtpSchema
} from './auth.validators.js';
import { apiError } from '../../utils/response.js';
import { catchAsync } from '../../utils/catch-async.js';
const normalizePayload = (body) => ({
  ...body,
  countryCode: body.countryCode ?? body.country_code,
  phoneNumber: body.phoneNumber ?? body.phone_number,
  deviceType: body.deviceType ?? body.device_type,
  deviceToken: body.deviceToken ?? body.device_token,
  otp: body.otp ?? body.OTP,
  referralCode: body.referralCode ?? body.referral_code,
  referrerId: body.referrerId ?? body.referrer_id,
  branchIdentity: body.branchIdentity ?? body.branch_identity,
  branchInstallId: body.branchInstallId ?? body.branch_install_id
});
export const handleRegister = catchAsync(async (req, res) => {
  const input = registerSchema.parse(normalizePayload(req.body));
  const response = await registerUser(input);
  return res.json(response);
});
export const handleLogin = catchAsync(async (req, res) => {
  const input = loginSchema.parse(normalizePayload(req.body));
  const response = await loginUser(input);
  return res.json(response);
});
export const handleVerifyOtp = catchAsync(async (req, res) => {
  const input = otpSchema.parse(normalizePayload(req.body));
  if (!req.user?.id) {
    throw new apiError(401, 'Authorization header missing');
  }
  const response = await verifyOtp(req.user.id, input);
  return res.json(response);
});
export const handleResendOtp = catchAsync(async (req, res) => {
  const input = resendOtpSchema.parse(normalizePayload(req.body));
  if (!req.user?.id) {
    throw new apiError(401, 'Authorization header missing');
  }
  const response = await resendOtp(req.user.id, input);
  return res.json(response);
});
export const handleLogout = catchAsync(async (req, res) => {
  const response = await logoutUser(req.user.id);
  return res.json(response);
});
export const handleRefreshToken = catchAsync(async (req, res) => {
  const refreshToken =
    req.body?.refreshToken ??
    req.body?.refresh_token ??
    req.query?.refreshToken ??
    req.query?.refresh_token;
  const input = refreshTokenSchema.parse({ refreshToken });
  const response = await refreshSession(input.refreshToken);
  return res.json(response);
});
