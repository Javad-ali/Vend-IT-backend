import { supabase } from '../../libs/supabase.js';
export const createRating = async ({ userId, orderId, rating, emoji, comment }) => {
  const { data, error } = await supabase
    .from('ratings')
    .insert({
      user_id: userId,
      order_id: orderId ?? null,
      rating,
      emoji: emoji ?? null,
      comment: comment ?? null
    })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
};
export const listRatingsByUser = async (userId) => {
  const { data, error } = await supabase
    .from('ratings')
    .select('id, order_id, rating, emoji, comment, created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
};
export const getRatingForOrder = async (userId, orderId) => {
  const { data, error } = await supabase
    .from('ratings')
    .select('*')
    .eq('user_id', userId)
    .eq('order_id', orderId)
    .maybeSingle();
  if (error) throw error;
  return data;
};
