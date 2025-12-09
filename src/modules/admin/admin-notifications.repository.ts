// import { supabase } from '../../libs/supabase.js';

// export const listNotifications = async (params?: {
//   page?: number;
//   limit?: number;
//   admin_id?: string;
//   unread_only?: boolean;
// }) => {
//   const page = params?.page || 1;
//   const limit = params?.limit || 20;
//   const offset = (page - 1) * limit;

//   let query = supabase
//     .from('admin_notifications')
//     .select('*', { count: 'exact' })
//     .order('created_at', { ascending: false });

//   if (params?.admin_id) {
//     query = query.eq('admin_id', params.admin_id);
//   }

//   if (params?.unread_only) {
//     query = query.eq('read', false);
//   }

//   query = query.range(offset, offset + limit - 1);

//   const { data, error, count } = await query;
//   if (error) throw error;

//   // Get unread count for this admin
//   let unreadCount = 0;
//   if (params?.admin_id) {
//     const { count: uCount } = await supabase
//       .from('admin_notifications')
//       .select('*', { count: 'exact', head: true })
//       .eq('admin_id', params.admin_id)
//       .eq('read', false);
//     unreadCount = uCount ?? 0;
//   }

//   return {
//     data: data ?? [],
//     meta: {
//       page,
//       limit,
//       total: count ?? 0,
//       totalPages: Math.ceil((count ?? 0) / limit)
//     },
//     unreadCount
//   };
// };

// export const markAsRead = async (id: string) => {
//   const { data, error } = await supabase
//     .from('admin_notifications')
//     .update({ read: true })
//     .eq('id', id)
//     .select()
//     .single();

//   if (error) throw error;
//   return data;
// };

// export const markAllAsRead = async (admin_id: string) => {
//   const { error } = await supabase
//     .from('admin_notifications')
//     .update({ read: true })
//     .eq('admin_id', admin_id)
//     .eq('read', false);

//   if (error) throw error;
//   return { success: true };
// };

// export const createNotification = async (notification: {
//   admin_id: string;
//   title: string;
//   message: string;
//   type?: string;
//   link?: string;
// }) => {
//   const { data, error } = await supabase
//     .from('admin_notifications')
//     .insert([notification])
//     .select()
//     .single();

//   if (error) throw error;
//   return data;
// };



import { supabase } from '../../libs/supabase.js';

// List USER notifications for admin dashboard viewing
export const listNotifications = async (params?: {
  page?: number;
  limit?: number;
  admin_id?: string;
  unread_only?: boolean;
}) => {
  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const offset = (page - 1) * limit;

  // Read from user notifications table
  let query = supabase
    .from('notifications')
    .select('id, title, body, is_read, status, type, data, payment_id, created_at, receiver_id, sender_id', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (params?.unread_only) {
    query = query.eq('is_read', false);
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  // Get unread count
  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false);

  // Transform to match expected format
  const notifications = (data ?? []).map((n: any) => ({
    id: n.id,
    title: n.title || 'Notification',
    message: n.body || '',
    type: n.type || 'info',
    read: n.is_read || false,
    link: n.payment_id ? `/orders/${n.payment_id}` : undefined,
    created_at: n.created_at
  }));

  return {
    data: notifications,
    meta: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit)
    },
    unreadCount: unreadCount ?? 0
  };
};

// Mark a user notification as read (admin viewing)
export const markAsRead = async (id: string) => {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Mark all user notifications as read (admin action)
export const markAllAsRead = async (_admin_id: string) => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, updated_at: new Date().toISOString() })
    .eq('is_read', false);

  if (error) throw error;
  return { success: true };
};

// Create admin notification (for admin_notifications table)
export const createAdminNotification = async (notification: {
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
