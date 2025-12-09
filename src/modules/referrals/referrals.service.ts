import { nanoid } from 'nanoid';
import { getConfig } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { apiError } from '../../utils/response.js';
import {
  createReferralRecord,
  getReferralByInvitedUserId,
  getReferralStatsForInviter,
  markReferralRewarded,
  updateReferralRecord
} from './referrals.repository.js';
import { createLoyaltyEntry, incrementLoyaltyBalance } from '../payments/payments.repository.js';
import { getUserById, getUserByReferralCode, partialUpdateUser } from '../shared/repository.js';
const config = getConfig();
const REFERRAL_CODE_PREFIX = 'VND';
const REFERRAL_CODE_LENGTH = 6;
const formatShareLink = (code) => {
  const base = config.referralShareBaseUrl;
  if (!base || !base.length) {
    return `https://rv1sb.test-app.link/invite?code=${code}`;
  }
  if (base.includes('{code}')) {
    return base.replace('{code}', code);
  }
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}code=${code}`;
};
const generateReferralCode = () =>
  `${REFERRAL_CODE_PREFIX}${nanoid(REFERRAL_CODE_LENGTH).toUpperCase()}`;
const normalizeCode = (code) => code?.trim().toUpperCase() ?? null;
export const ensureReferralCode = async (userId, profile) => {
  const user = profile ?? (await getUserById(userId));
  if (!user) {
    throw new apiError(404, 'User not found');
  }
  const existing = user.referralCode ?? user.referral_code;
  if (existing) return existing;
  let code = generateReferralCode();
  // Ensure uniqueness
  let attempts = 0;
  while (attempts < 5) {
    const existingUser = await getUserByReferralCode(code);
    if (!existingUser) break;
    code = generateReferralCode();
    attempts += 1;
  }
  await partialUpdateUser(userId, { referralCode: code });
  return code;
};
export const getReferralInfo = async (userId) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new apiError(404, 'User not found');
  }
  const code = await ensureReferralCode(userId, user);
  const stats = await getReferralStatsForInviter(userId);
  const shareTemplate = config.referralShareMessage ?? 'Join Vendit and use my code {code}!';
  return {
    referralCode: code,
    shareLink: formatShareLink(code),
    shareMessage: shareTemplate.replace('{code}', code),
    inviterRewardPoints: config.referralInviterPoints,
    inviteeRewardPoints: config.referralInviteePoints,
    // totalRewardEarned: stats.totalRewardPoints ?? 0,
    stats
  };
};
const resolveReferrer = async (context) => {
  if (context.referrerId) {
    const ref = await getUserById(context.referrerId);
    if (ref) return ref;
  }
  const code = normalizeCode(context.referralCode);
  if (code) {
    const ref = await getUserByReferralCode(code);
    if (ref) return ref;
  }
  return null;
};
const awardReferralPoints = async (userId, points, reason, metadata) => {
  if (!points) return;
  await createLoyaltyEntry({
    userId,
    paymentId: null,
    points,
    type: 'Credit',
    reason,
    metadata: metadata ?? {}
  });
  await incrementLoyaltyBalance(userId, points);
};
export const processReferralReward = async (invitedUser, invitedPhone, context) => {
  if (!invitedPhone) return;
  const alreadyRewarded =
    invitedUser.referralRewardedAt ?? invitedUser.referral_rewarded_at ?? null;
  if (alreadyRewarded) return;
  const existing = await getReferralByInvitedUserId(invitedUser.id);
  let inviter = null;
  if (existing) {
    inviter = await getUserById(existing.inviter_user_id);
  } else {
    inviter = await resolveReferrer(context);
  }
  if (existing && !inviter) {
    return;
  }
  if (!inviter) return;
  if (inviter.id === invitedUser.id) return;
  const inviterPoints = config.referralInviterPoints ?? 0;
  const inviteePoints = config.referralInviteePoints ?? 0;
  if (!inviterPoints && !inviteePoints) return;
  const metadata = {
    ...(context.metadata ?? {}),
    branchIdentity: context.branchIdentity ?? null,
    branchInstallId: context.branchInstallId ?? null
  };
  let referralRecord = existing;
  if (referralRecord?.status === 'rewarded') {
    return;
  }
  if (!referralRecord) {
    referralRecord = await createReferralRecord({
      inviterUserId: inviter.id,
      invitedUserId: invitedUser.id,
      invitedPhone,
      referralCode: normalizeCode(context.referralCode),
      branchIdentity: context.branchIdentity ?? null,
      branchInstallId: context.branchInstallId ?? null,
      metadata
    });
  } else if (
    context.branchIdentity ||
    context.branchInstallId ||
    (context.referralCode && !referralRecord.referral_code)
  ) {
    await updateReferralRecord(referralRecord.id, {
      branch_identity: context.branchIdentity ?? referralRecord.branch_identity ?? null,
      branch_install_id: context.branchInstallId ?? referralRecord.branch_install_id ?? null,
      referral_code: referralRecord.referral_code ?? normalizeCode(context.referralCode),
      metadata: { ...(referralRecord.metadata ?? {}), ...metadata }
    });
  }
  try {
    if (inviterPoints > 0) {
      await awardReferralPoints(inviter.id, inviterPoints, 'referral_inviter', {
        invitedUserId: invitedUser.id
      });
    }
    if (inviteePoints > 0) {
      await awardReferralPoints(invitedUser.id, inviteePoints, 'referral_invited', {
        referrerUserId: inviter.id
      });
    }
    await markReferralRewarded(referralRecord.id);
    await partialUpdateUser(invitedUser.id, {
      referrerUserId: inviter.id,
      referralRewardedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ error }, 'Failed to process referral reward');
    throw error;
  }
};
const extractPhoneNumber = (user) => {
  if (!user) return null;
  const raw = user;
  return user.phoneNumber ?? raw.phone_number ?? null;
};
export const processManualReferralFromProfile = async (userId, referralCode) => {
  const normalized = normalizeCode(referralCode);
  if (!normalized) return;
  const user = await getUserById(userId);
  if (!user) throw new apiError(404, 'User not found');
  const phone = extractPhoneNumber(user);
  if (!phone) {
    logger.warn({ userId }, 'Unable to process referral code: phone missing');
    return;
  }
  await processReferralReward(user, phone, { referralCode: normalized });
};
