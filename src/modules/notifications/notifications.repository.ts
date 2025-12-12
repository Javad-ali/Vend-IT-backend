import { supabase } from '../../libs/supabase.js';
export const createNotification = async (payload) => {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      title: payload.title ?? null,
      body: payload.body ?? null,
      type: payload.type ?? null,
      data: payload.data ?? null,
      sender_id: payload.senderId ?? null,
      receiver_id: payload.receiverId,
      payment_id: payload.paymentId ?? null
    })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
};
export const listNotificationsByUser = async (userId) => {
  const { data, error } = await supabase
    .from('notifications')
    .select(
      'id, title, body, is_read, status, type, data, payment_id, created_at, sender:sender_id (id, first_name, last_name, user_profile)'
    )
    .eq('receiver_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
};
export const markNotificationRead = async (userId, notificationId) => {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true, updated_at: new Date().toISOString() })
    .eq('receiver_id', userId)
    .eq('id', notificationId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
};
export const clearNotifications = async (userId) => {
  const { error } = await supabase.from('notifications').delete().eq('receiver_id', userId);
  if (error) throw error;
};
export const getUserDeviceToken = async (userId) => {
  const { data, error } = await supabase
    .from('users')
    .select('device_token, device_type, first_name, last_name, user_profile')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
};
