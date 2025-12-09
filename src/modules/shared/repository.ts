import { supabase } from '../../libs/supabase.js';
export const getUserById = async (id) => {
  const { data, error } = await supabase.from('users').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
};
export const updateUserById = async (id, payload) => {
  const normalizedPayload = normalizeUserPayload(payload);
  const { data, error } = await supabase
    .from('users')
    .update(normalizedPayload)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
};
export const deleteUserById = async (id) => {
  const { error } = await supabase.from('users').delete().eq('id', id);
  if (error) throw error;
};
export const createContact = async ({ userId, email, subject, message }) => {
  const { error } = await supabase.from('contact_us').insert({
    user_id: userId,
    email,
    subject,
    message,
    created_at: new Date().toISOString()
  });
  if (error) throw error;
};
export const getStaticContent = async () => {
  const { data, error } = await supabase.from('static_content').select('*').limit(1).maybeSingle();
  if (error) throw error;
  return data;
};
export const getUserByPhone = async (phoneNumber) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('phone_number', phoneNumber)
    .maybeSingle();
  if (error) throw error;
  return data;
};
export const getUserByReferralCode = async (referralCode) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('referral_code', referralCode)
    .maybeSingle();
  if (error) throw error;
  return data;
};
export const createUser = async (payload) => {
  const normalizedPayload = normalizeUserPayload(payload);
  const { data, error } = await supabase
    .from('users')
    .insert(normalizedPayload)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
};
export const partialUpdateUser = async (id, payload) => {
  const normalizedPayload = normalizeUserPayload(payload);
  const { data, error } = await supabase
    .from('users')
    .update(normalizedPayload)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
};
export const clearReferrerFromUsers = async (referrerUserId) => {
  const { error } = await supabase
    .from('users')
    .update({ referrer_user_id: null, referral_rewarded_at: null })
    .eq('referrer_user_id', referrerUserId);
  if (error) throw error;
};
const INT_BOOLEAN_FIELDS = new Set(['is_notification', 'is_online', 'is_otp_verify']);
const normalizeEmailForDb = (value) => {
  if (typeof value !== 'string') return value ?? null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};
const coerceBooleanInt = (value) => {
  if (value === null || value === undefined) return value;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'number') return value ? 1 : 0;
  if (typeof value === 'string') return value === '0' ? 0 : 1;
  return value;
};
const normalizeUserPayload = (payload) => {
  const normalized = {};
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined) return;
    const snakeKey = key.includes('_')
      ? key
      : key
          .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
          .replace(/[\s-]+/g, '_')
          .toLowerCase();
    let normalizedValue = value;
    if (INT_BOOLEAN_FIELDS.has(snakeKey)) {
      normalizedValue = coerceBooleanInt(value);
    } else if (snakeKey === 'email') {
      normalizedValue = normalizeEmailForDb(value);
    } else if (snakeKey === 'latitude' || snakeKey === 'longitude') {
      if (value === null || value === '') {
        normalizedValue = null;
      } else {
        const num = Number(value);
        normalizedValue = Number.isNaN(num) ? null : num;
      }
    }
    normalized[snakeKey] = normalizedValue;
  });
  return normalized;
};
