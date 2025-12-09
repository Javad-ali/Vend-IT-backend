import { supabase } from '../../libs/supabase.js';

export const listNotifications = async (params?: {
  page?: number;
  limit?: number;
  admin_id?: string;
  unread_only?: boolean;
}) => {
  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('admin_notifications')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (params?.admin_id) {
    query = query.eq('admin_id', params.admin_id);
  }

  if (params?.unread_only) {
    query = query.eq('read', false);
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  // Get unread count for this admin
  let unreadCount = 0;
  if (params?.admin_id) {
    const { count: uCount } = await supabase
      .from('admin_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('admin_id', params.admin_id)
      .eq('read', false);
    unreadCount = uCount ?? 0;
  }

  return {
    data: data ?? [],
    meta: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit)
    },
    unreadCount
  };
};

export const markAsRead = async (id: string) => {
  const { data, error } = await supabase
    .from('admin_notifications')
    .update({ read: true })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const markAllAsRead = async (admin_id: string) => {
  const { error } = await supabase
    .from('admin_notifications')
    .update({ read: true })
    .eq('admin_id', admin_id)
    .eq('read', false);

  if (error) throw error;
  return { success: true };
};

export const createNotification = async (notification: {
  admin_id: string;
  title: string;
  message: string;
  type?: string;
  link?: string;
}) => {
  const { data, error } = await supabase
    .from('admin_notifications')
    .insert([notification])
    .select()
    .single();

  if (error) throw error;
  return data;
};
