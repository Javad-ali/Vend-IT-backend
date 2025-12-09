import { Router } from 'express';
import {
  handleClearNotifications,
  handleListNotifications,
  handleMarkNotificationRead,
  handleSendNotification
} from '../modules/notifications/notifications.controller.js';
import { requireAuth } from '../middleware/auth.js';
const router = Router();
router.use(requireAuth);
router.get('/', handleListNotifications);
router.patch('/:notificationId/read', handleMarkNotificationRead);
router.delete('/', handleClearNotifications);
router.post('/', handleSendNotification); // restrict to admins or internal callers in production
export default router;
