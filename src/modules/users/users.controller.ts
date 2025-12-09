import multer from 'multer';
import {
  createProfile,
  deleteAccount,
  editProfile,
  fetchStaticContent,
  getProfile,
  submitContact
} from './users.service.js';
import {
  getReferralInfo,
  processManualReferralFromProfile
} from '../referrals/referrals.service.js';
import { contactSchema, profileSchema } from './users.validators.js';
import { ok } from '../../utils/response.js';
const memoryUpload = multer({ storage: multer.memoryStorage() });
export const uploadAvatar = memoryUpload.single('userProfile');
export const handleCreateProfile = async (req, res) => {
  const normalized = {
    ...req.body,
    referralCode: req.body?.referralCode ?? req.body?.referral_code
  };
  const payload = profileSchema.parse(normalized);
  const { referralCode, ...profileInput } = payload;
  const data = await createProfile(req.user.id, profileInput);
  if (referralCode) {
    await processManualReferralFromProfile(req.user.id, referralCode);
  }
  return res.json(ok(data, 'User profile created'));
};
export const handleGetProfile = async (req, res) => {
  const data = await getProfile(req.user.id);
  return res.json(ok(data, 'User profile found'));
};
export const handleDeleteAccount = async (req, res) => {
  await deleteAccount(req.user.id);
  return res.json(ok(null, 'User deleted successfully'));
};
export const handleEditProfile = async (req, res) => {
  const payload = profileSchema.partial().parse(req.body);
  const file = req.file ? { ...req.file, buffer: req.file.buffer } : undefined;
  const data = await editProfile(req.user.id, payload, file);
  return res.json(ok(data, 'User profile updated'));
};
export const handleContact = async (req, res) => {
  const payload = contactSchema.parse(req.body);
  await submitContact(req.user.id, { ...payload, userId: req.user.id });
  return res.json(ok(null, 'Contact form submitted'));
};
export const handleStaticContent = async (_req, res) => {
  const data = await fetchStaticContent();
  return res.json(ok(data, 'Content found'));
};
export const handleReferralInfo = async (req, res) => {
  const data = await getReferralInfo(req.user.id);
  return res.json(ok(data, 'Referral info'));
};
