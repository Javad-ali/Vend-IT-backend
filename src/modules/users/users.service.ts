import path from 'node:path';
import { nanoid } from 'nanoid';
import {
  createContact,
  deleteUserById,
  getStaticContent,
  getUserById,
  updateUserById,
  clearReferrerFromUsers
} from '../shared/repository.js';
import { apiError } from '../../utils/response.js';
import { supabase } from '../../libs/supabase.js';
import { getConfig } from '../../config/env.js';
const USERS_BUCKET = 'users';
const { supabaseUrl } = getConfig();
const buildStorageUrl = (bucket, key) => {
  if (!key) return null;
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${key}`;
};
export const createProfile = async (userId, payload) => {
  const user = await updateUserById(userId, payload);
  if (!user) {
    throw new apiError(400, 'No user found');
  }
  return mapUserResponse(user);
};
export const getProfile = async (userId) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new apiError(404, 'User not found');
  }
  return mapUserResponse(user);
};
export const deleteAccount = async (userId) => {
  await clearReferrerFromUsers(userId);
  await deleteUserById(userId);
};
export const editProfile = async (userId, payload, file) => {
  let avatarKey;
  if (file) {
    avatarKey = await uploadAvatar(userId, file);
    payload.userProfile = avatarKey;
  }
  const updated = await updateUserById(userId, payload);
  if (!updated) {
    throw new apiError(400, 'User profile not updated');
  }
  return mapUserResponse(updated);
};
export const submitContact = async (userId, input) => {
  await createContact({ ...input, userId });
};
export const fetchStaticContent = async () => {
  const content = await getStaticContent();
  if (!content) {
    throw new apiError(404, 'Content not found');
  }
  return content;
};
const mapUserResponse = (profile) => {
  if (!profile) return null;
  const raw = profile;
  const avatarKey = profile.userProfile ?? raw.user_profile ?? null;
  const userProfileUrl = buildStorageUrl(USERS_BUCKET, avatarKey);
  const firstName = profile.firstName ?? raw.first_name ?? null;
  const lastName = profile.lastName ?? raw.last_name ?? null;
  const email = profile.email ?? raw.email ?? null;
  const phoneNumber = profile.phoneNumber ?? raw.phone_number ?? null;
  const countryCode = profile.countryCode ?? raw.country_code ?? null;
  const country = profile.country ?? raw.country ?? null;
  const deviceToken = profile.deviceToken ?? raw.device_token ?? null;
  const deviceType = profile.deviceType ?? raw.device_type ?? null;
  const latitude = profile.latitude ?? raw.latitude ?? null;
  const longitude = profile.longitude ?? raw.longitude ?? null;
  const address = profile.address ?? raw.address ?? null;
  const userChatToken = raw.user_chat_token ?? null;
  const tapCustomerId = profile.tapCustomerId ?? raw.tap_customer_id ?? null;
  const videoUrl = raw.video_url ?? null;
  const age = raw.age ?? null;
  const otp = profile.otp ?? raw.otp ?? null;
  const referralCode = profile.referralCode ?? raw.referral_code ?? null;
  return {
    id: profile.id,
    firstName,
    lastName,
    email,
    phoneNumber,
    country,
    countryCode,
    created_at: raw.created_at ?? null,
    updated_at: raw.updated_at ?? null,
    video_url: videoUrl,
    videoUrl,
    isNotification: Number(profile.isNotification ?? raw.is_notification ?? 0),
    status: Number(profile.status ?? raw.status ?? 0),
    isOtpVerify: Number(profile.isOtpVerify ?? raw.is_otp_verify ?? 0),
    userProfile: userProfileUrl,
    deviceToken,
    deviceType,
    address,
    latitude,
    longitude,
    age,
    otp,
    isOnline: Number(profile.isOnline ?? raw.is_online ?? 0),
    tapCustomerId,
    tap_customer_id: tapCustomerId,
    userChatToken,
    referralCode
  };
};
const uploadAvatar = async (userId, file) => {
  const ext = path.extname(file.originalname) || '.jpg';
  const objectKey = `${userId}/${nanoid()}${ext}`;
  const { error } = await supabase.storage.from(USERS_BUCKET).upload(objectKey, file.buffer, {
    contentType: file.mimetype,
    upsert: true
  });
  if (error) {
    throw new apiError(400, 'Avatar upload failed', error.message);
  }
  return objectKey;
};
