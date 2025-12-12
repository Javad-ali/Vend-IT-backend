import {
  getNotifications,
  markAsRead,
  removeAllNotifications,
  sendNotification
} from './notifications.service.js';
export const handleListNotifications = async (req, res, next) => {
  try {
    const response = await getNotifications(req.user.id);
    return res.json(response);
  } catch (error) {
    next(error);
  }
};
export const handleMarkNotificationRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    const response = await markAsRead(req.user.id, notificationId);
    return res.json(response);
  } catch (error) {
    next(error);
  }
};
export const handleClearNotifications = async (req, res, next) => {
  try {
    const response = await removeAllNotifications(req.user.id);
    return res.json(response);
  } catch (error) {
    next(error);
  }
};
// Optional endpoint for server-triggered notifications (e.g., admin dashboard)
export const handleSendNotification = async (req, res, next) => {
  try {
    const response = await sendNotification({
      receiverId: req.body.receiverId,
      senderId: req.user?.id,
      title: req.body.title,
      body: req.body.body,
      type: req.body.type,
      data: req.body.data,
      paymentId: req.body.paymentId
    });
    return res.json(response);
  } catch (error) {
    next(error);
  }
};
