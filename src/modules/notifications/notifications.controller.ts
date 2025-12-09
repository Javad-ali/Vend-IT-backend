import {
  getNotifications,
  markAsRead,
  removeAllNotifications,
  sendNotification
} from './notifications.service.js';
export const handleListNotifications = async (req, res) => {
  const response = await getNotifications(req.user.id);
  return res.json(response);
};
export const handleMarkNotificationRead = async (req, res) => {
  const { notificationId } = req.params;
  const response = await markAsRead(req.user.id, notificationId);
  return res.json(response);
};
export const handleClearNotifications = async (req, res) => {
  const response = await removeAllNotifications(req.user.id);
  return res.json(response);
};
// Optional endpoint for server-triggered notifications (e.g., admin dashboard)
export const handleSendNotification = async (req, res) => {
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
};
