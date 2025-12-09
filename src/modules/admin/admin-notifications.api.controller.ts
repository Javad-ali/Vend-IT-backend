import type { Request, Response } from 'express';
import { apiSuccess, errorResponse } from '../../utils/response.js';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from './admin-notifications.service.js';

export const getNotificationsApi = async (req: Request, res: Response) => {
  try {
    const { page, limit, unread_only } = req.query;
    const admin_id = (req as any).admin?.id; // From auth middleware
    
    const notifications = await getNotifications({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      admin_id,
      unread_only: unread_only === 'true'
    });
    return res.json(apiSuccess(notifications));
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res
      .status(statusCode)
      .json(errorResponse(statusCode, error.message || 'Failed to fetch notifications'));
  }
};

export const markAsReadApi = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await markNotificationRead(id);
    return res.json(apiSuccess({ message: 'Notification marked as read' }));
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res
      .status(statusCode)
      .json(errorResponse(statusCode, error.message || 'Failed to mark notification as read'));
  }
};

export const markAllAsReadApi = async (req: Request, res: Response) => {
  try {
    const admin_id = (req as any).admin?.id;
    if (!admin_id) {
      return res.status(401).json(errorResponse(401, 'Unauthorized'));
    }
    await markAllNotificationsRead(admin_id);
    return res.json(apiSuccess({ message: 'All notifications marked as read' }));
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res
      .status(statusCode)
      .json(errorResponse(statusCode, error.message || 'Failed to mark all notifications as read'));
  }
};
