import { supabase } from '../../libs/supabase.js';
export const getReferralByInvitedUserId = async (invitedUserId) => {
  const { data, error } = await supabase
    .from('referrals')
    .select('*')
    .eq('invited_user_id', invitedUserId)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
};
export const createReferralRecord = async (payload) => {
  const { data, error } = await supabase
    .from('referrals')
    .insert({
      inviter_user_id: payload.inviterUserId,
      invited_user_id: payload.invitedUserId,
      invited_phone: payload.invitedPhone,
      referral_code: payload.referralCode ?? null,
      branch_identity: payload.branchIdentity ?? null,
      branch_install_id: payload.branchInstallId ?? null,
      metadata: payload.metadata ?? {}
    })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
};
export const updateReferralRecord = async (id, updates) => {
  const payload = { ...updates, updated_at: new Date().toISOString() };
  const { data, error } = await supabase
    .from('referrals')
    .update(payload)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
};
export const markReferralRewarded = async (id) =>
  updateReferralRecord(id, {
    status: 'rewarded',
    rewarded_at: new Date().toISOString()
  });
export const getReferralStatsForInviter = async (inviterUserId) => {
  const { data, error } = await supabase
    .from('referrals')
    .select('status')
    .eq('inviter_user_id', inviterUserId);
  if (error) throw error;
  const rows = data ?? [];
  let total = rows.length;
  let rewarded = rows.filter((row) => row.status === 'rewarded').length;
  const { data: loyaltyRows, error: loyaltyError } = await supabase
    .from('loyality_points')
    .select('points')
    .eq('user_id', inviterUserId)
    .eq('reason', 'referral_inviter');
  if (loyaltyError) throw loyaltyError;
  const totalRewardEarned = (loyaltyRows ?? []).reduce(
    (sum, row) => sum + Number(row.points ?? 0),
    0
  );
  if (total === 0 && (loyaltyRows?.length ?? 0) > 0) {
    total = loyaltyRows.length;
    rewarded = loyaltyRows.length;
  }
  return {
    total,
    rewarded,
    totalRewardEarned
  };
};
