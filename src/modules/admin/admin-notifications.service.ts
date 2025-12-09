import {
  listNotifications,
  markAsRead,
  markAllAsRead
} from './admin-notifications.repository.js';

export const getNotifications = async (params?: {
  page?: number;
  limit?: number;
  admin_id?: string;
  unread_only?: boolean;
}) => {
  const result = await listNotifications(params);
  return {
    notifications: result.data,
    meta: result.meta,
    unreadCount: result.unreadCount
  };
};

export const markNotificationRead = async (id: string) => {
  return await markAsRead(id);
};

export const markAllNotificationsRead = async (admin_id: string) => {
  return await markAllAsRead(admin_id);
};
