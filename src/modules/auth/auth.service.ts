import axios from 'axios';
import { redis } from '../../libs/redis.js';
import { logger } from '../../config/logger.js';
import {
  createUser,
  getUserById,
  getUserByPhone,
  partialUpdateUser
} from '../shared/repository.js';
import { apiError, ok } from '../../utils/response.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt.js';
import { ensureReferralCode, processReferralReward } from '../referrals/referrals.service.js';
const OTP_TTL_SECONDS = 5 * 60;
const generateOtp = () => Math.floor(1000 + Math.random() * 9000).toString();
const otpCacheKey = (phone) => `otp:${phone}`;
const sendOtp = async (phone, otp) => {
  const smsDriver = (process.env.SMS_DRIVER ?? '').toLowerCase();
  const shouldMock =
    smsDriver === 'log' || (process.env.NODE_ENV !== 'production' && smsDriver !== 'remote');
  if (shouldMock) {
    logger.info({ phone, otp }, 'Mock OTP dispatched');
    return true;
  }
  try {
    // SMSBox API integration
    const smsApiUrl = process.env.SMS_API_URL ?? 'http://smsbox.com/smsgateway/services/messaging.asmx/Http_SendSMS';
    const params = new URLSearchParams({
      username: process.env.SMS_USERNAME ?? '',
      password: process.env.SMS_PASSWORD ?? '',
      customerid: process.env.SMS_CUSTOMER_ID ?? '',
      sendertext: process.env.SMS_SENDER ?? 'VEND IT',
      messagebody: `Your OTP is: ${otp}`,
      recipientnumbers: phone.replace(/^\+/, ''), // Remove + prefix
      defdate: '', // Send immediately
      isblink: 'false',
      isflash: 'false'
    });
    
    const { status } = await axios.get(`${smsApiUrl}?${params.toString()}`, {
      timeout: 10000 // Increased timeout for SMS gateway
    });
    
    if (status !== 200) {
      throw new apiError(502, 'OTP provider failure');
    }
    return false;
  } catch (error) {
    logger.error({ error }, 'SMS sending failed');
    if (process.env.ALLOW_SMS_FALLBACK === 'true') {
      logger.warn({ phone, otp }, 'Falling back to logged OTP due to provider failure');
      return true;
    }
    throw new apiError(502, 'OTP not sent, try again later');
  }
};
const issueTokens = (userId, email) => {
  const payload = { id: userId, email };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload)
  };
};
const getPhoneNumber = (user) => {
  if (!user) return null;
  const raw = user;
  return user.phoneNumber ?? raw.phone_number ?? null;
};
const getCountryCode = (user) => {
  if (!user) return null;
  const raw = user;
  return user.countryCode ?? user.country_code ?? raw.country_code ?? null;
};
const sanitizePhone = (phone) => phone?.replace(/\D/g, '') || Date.now().toString();
const placeholderEmail = (phone) => `pending-${sanitizePhone(phone)}@vendit.local`;
const normalizeEmailValue = (value) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.toLowerCase().startsWith('pending-') && trimmed.endsWith('@vendit.local')) {
    return null;
  }
  return trimmed;
};
const queueOtpForPhone = async (input) => {
  if (!input.countryCode) {
    throw new apiError(400, 'Country code required');
  }
  const otp = generateOtp();
  await redis.setex(otpCacheKey(input.phoneNumber), OTP_TTL_SECONDS, otp);
  const expose = await sendOtp(`${input.countryCode}${input.phoneNumber}`, otp);
  return { otp, expose };
};
const buildAuthResponse = (user, tokens, otp?) => {
  const raw = user;
  const phoneNumber = user.phoneNumber ?? raw.phone_number ?? null;
  const createdAt = user.createdAt ?? raw.created_at ?? null;
  const updatedAt = user.updatedAt ?? raw.updated_at ?? null;
  const countryCode = user.countryCode ?? user.country_code ?? raw.country_code ?? null;
  const country = user.country ?? raw.country ?? null;
  const avatarKey = user.userProfile ?? user.user_profile ?? raw.user_profile ?? null;
  const userProfile = avatarKey ? `${process.env.CDN_BASE_URL ?? ''}/users/${avatarKey}` : null;
  const deviceToken = user.deviceToken ?? user.device_token ?? raw.device_token ?? null;
  const deviceType = user.deviceType ?? user.device_type ?? raw.device_type ?? null;
  const latitude = user.latitude ?? raw.latitude ?? null;
  const longitude = user.longitude ?? raw.longitude ?? null;
  const dob = user.dob ?? raw.dob ?? null;
  const address = user.address ?? raw.address ?? null;
  const videoUrl = raw.video_url ?? null;
  const isOnline = Number(user.isOnline ?? user.is_online ?? raw.is_online ?? 0);
  const tapCustomerId = user.tapCustomerId ?? user.tap_customer_id ?? raw.tap_customer_id ?? null;
  const referralCode = user.referralCode ?? user.referral_code ?? raw.referral_code ?? null;
  const firstName = user.firstName ?? user.first_name ?? raw.first_name ?? null;
  const lastName = user.lastName ?? user.last_name ?? raw.last_name ?? null;
  const email = normalizeEmailValue(user.email ?? raw.email ?? null);
  const age = raw.age ?? null;
  const isOtpVerify = Number(user.isOtpVerify ?? user.is_otp_verify ?? raw.is_otp_verify ?? 0);
  const userChatToken = user.userChatToken ?? user.user_chat_token ?? raw.user_chat_token ?? null;
  const isNotification = Number(
    user.isNotification ?? user.is_notification ?? raw.is_notification ?? 0
  );
  const status = Number(user.status ?? raw.status ?? 0);
  return {
    id: user.id,
    firstName,
    lastName,
    email,
    phoneNumber,
    country,
    countryCode,
    created_at: createdAt,
    updated_at: updatedAt,
    video_url: videoUrl,
    videoUrl,
    isNotification,
    status,
    isOtpVerify,
    userProfile,
    deviceToken,
    deviceType,
    dob,
    address,
    age,
    latitude,
    longitude,
    isOnline,
    tapCustomerId,
    tap_customer_id: tapCustomerId,
    userChatToken,
    referralCode,
    otp: otp ?? null,
    token: tokens.accessToken,
    refreshToken: tokens.refreshToken
  };
};
const updateUserCommonFields = (user, input, overrides) => {
  const basePhone = user?.phoneNumber ?? ('phoneNumber' in input ? input.phoneNumber : null);
  const phoneNumber = basePhone ?? input.phoneNumber;
  const providedEmail = 'email' in input ? normalizeEmailValue(input.email ?? null) : undefined;
  const currentEmail = normalizeEmailValue(user?.email ?? null);
  const ensuredEmail = providedEmail !== undefined ? providedEmail : currentEmail;
  const storedEmail = ensuredEmail ?? placeholderEmail(phoneNumber);
  return {
    firstName:
      'firstName' in input
        ? (input.firstName ?? user?.firstName ?? null)
        : (user?.firstName ?? null),
    lastName:
      'lastName' in input ? (input.lastName ?? user?.lastName ?? null) : (user?.lastName ?? null),
    email: storedEmail,
    country:
      'country' in input ? (input.country ?? user?.country ?? null) : (user?.country ?? null),
    countryCode: input.countryCode ?? user?.countryCode ?? null,
    phoneNumber,
    deviceType: input.deviceType ?? user?.deviceType ?? null,
    deviceToken: input.deviceToken ?? user?.deviceToken ?? null,
    updatedAt: new Date().toISOString(),
    ...overrides
  };
};
export const registerUser = async (input) => {
  const existing = await getUserByPhone(input.phoneNumber);
  if (existing && existing.isOtpVerify) {
    throw new apiError(409, 'Phone number already registered');
  }
  const { otp, expose } = await queueOtpForPhone(input);
  let user;
  if (existing) {
    user = await partialUpdateUser(existing.id, {
      ...updateUserCommonFields(existing, input, {
        status: 0,
        isOtpVerify: false,
        otp
      })
    });
  } else {
    user = await createUser({
      ...updateUserCommonFields(null, input, {
        status: 0,
        isOtpVerify: false,
        isNotification: true,
        userSocketToken: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        otp
      })
    });
  }
  if (!user) throw new apiError(500, 'Registration failed');
  await ensureReferralCode(user.id, user);
  const tokens = issueTokens(user.id, user.email);
  return ok(buildAuthResponse(user, tokens, expose ? otp : null), 'User registered successfully');
};
export const loginUser = async (input) => {
  const existing = await getUserByPhone(input.phoneNumber);
  if (!existing) {
    throw new apiError(404, 'User not found, please register first');
  }
  const countryCode = input.countryCode ?? existing.countryCode ?? existing.country_code;
  if (!countryCode) {
    throw new apiError(400, 'Country code missing for user');
  }
  const { otp, expose } = await queueOtpForPhone({ ...input, countryCode });
  const updated = await partialUpdateUser(existing.id, {
    ...updateUserCommonFields(
      existing,
      { ...input, countryCode },
      {
        otp,
        status: existing.status ?? 1
      }
    )
  });
  if (!updated) throw new apiError(500, 'Login failed');
  const tokens = issueTokens(updated.id, updated.email);
  return ok(buildAuthResponse(updated, tokens, expose ? otp : null), 'OTP sent');
};
export const verifyOtp = async (userId, input) => {
  const user = await getUserById(userId);
  if (!user) throw new apiError(404, 'User not found');
  const phoneNumber = getPhoneNumber(user);
  if (!phoneNumber) {
    throw new apiError(400, 'Phone number missing for user');
  }
  const cachedOtp = await redis.get(otpCacheKey(phoneNumber));
  if (!cachedOtp || cachedOtp !== input.otp) {
    throw new apiError(400, 'Incorrect OTP');
  }
  const updated = await partialUpdateUser(user.id, {
    isOtpVerify: true,
    status: 1,
    deviceType: input.deviceType ?? user.deviceType ?? null,
    deviceToken: input.deviceToken ?? user.deviceToken ?? null,
    latitude: input.latitude ?? user.latitude ?? null,
    longitude: input.longitude ?? user.longitude ?? null,
    updatedAt: new Date().toISOString()
  });
  await redis.del(otpCacheKey(phoneNumber));
  if (!updated) throw new apiError(400, 'User verification failed');
  await processReferralReward(updated, phoneNumber, {
    referralCode: input.referralCode,
    referrerId: input.referrerId,
    branchIdentity: input.branchIdentity,
    branchInstallId: input.branchInstallId
  });
  const tokens = issueTokens(updated.id, updated.email);
  return ok(buildAuthResponse(updated, tokens), 'OTP verified successfully');
};
export const resendOtp = async (userId, input) => {
  const user = await getUserById(userId);
  if (!user) throw new apiError(404, 'User not found');
  const phoneNumber = getPhoneNumber(user);
  if (!phoneNumber) {
    throw new apiError(400, 'Phone number missing for user');
  }
  const countryCode = getCountryCode(user);
  if (!countryCode) {
    throw new apiError(400, 'Country code missing for user');
  }
  const { otp, expose } = await queueOtpForPhone({
    countryCode,
    phoneNumber,
    deviceType: input.deviceType ?? user.deviceType ?? undefined,
    deviceToken: input.deviceToken ?? user.deviceToken ?? undefined
  });
  await partialUpdateUser(user.id, {
    deviceType: input.deviceType ?? user.deviceType ?? null,
    deviceToken: input.deviceToken ?? user.deviceToken ?? null,
    otp,
    updatedAt: new Date().toISOString()
  });
  return ok(expose ? { otp } : null, 'OTP resent');
};
export const logoutUser = async (userId) => {
  const user = await getUserById(userId);
  if (!user) throw new apiError(404, 'User not found');
  await partialUpdateUser(userId, {
    deviceToken: null,
    deviceType: null,
    updatedAt: new Date().toISOString()
  });
  return ok(null, 'Logout successfully');
};
export const refreshSession = async (token) => {
  let payload = null;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new apiError(401, 'Invalid refresh token');
  }
  if (!payload?.id) {
    throw new apiError(401, 'Invalid refresh token payload');
  }
  const user = await getUserById(payload.id);
  if (!user) throw new apiError(404, 'User not found');
  const raw = user;
  const isVerified = Number(user.isOtpVerify ?? user.is_otp_verify ?? raw.is_otp_verify ?? 0);
  if (!isVerified) {
    throw new apiError(403, 'User not verified');
  }
  const tokens = issueTokens(user.id, user.email);
  return ok(buildAuthResponse(user, tokens), 'Token refreshed');
};
