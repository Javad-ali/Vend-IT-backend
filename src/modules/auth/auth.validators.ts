import { z } from 'zod';
export const registerSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  country: z.string().optional(),
  countryCode: z.string().min(1),
  phoneNumber: z.string().min(5),
  deviceType: z.string().optional(),
  deviceToken: z.string().optional()
});
export const loginSchema = z.object({
  countryCode: z.string().min(1),
  phoneNumber: z.string().min(5),
  deviceType: z.string().optional(),
  deviceToken: z.string().optional()
});
export const otpSchema = z.object({
  otp: z.string().length(4),
  deviceType: z.string().optional(),
  deviceToken: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  referralCode: z.string().optional(),
  referrerId: z.string().optional(),
  branchIdentity: z.string().optional(),
  branchInstallId: z.string().optional()
});
export const resendOtpSchema = z.object({
  deviceType: z.string().optional(),
  deviceToken: z.string().optional()
});
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(10)
});
