import axios from 'axios';
import jwt from 'jsonwebtoken';
import { getConfig } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import {
  createNotification,
  getUserDeviceToken,
  listNotificationsByUser,
  markNotificationRead,
  clearNotifications
} from './notifications.repository.js';
import { apiError, ok } from '../../utils/response.js';
const config = getConfig();
const { firebaseProjectId, firebaseClientEmail, firebasePrivateKey } = config;
const hasValidFcmCreds =
  Boolean(firebaseProjectId && firebaseClientEmail && firebasePrivateKey) &&
  (firebasePrivateKey?.includes('-----BEGIN') ?? false);
const createAccessToken = () => {
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    {
      iss: firebaseClientEmail,
      sub: firebaseClientEmail,
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
      scope: 'https://www.googleapis.com/auth/firebase.messaging'
    },
    firebasePrivateKey,
    { algorithm: 'RS256' }
  );
};
const exchangeAccessToken = async (jwtToken) => {
  const { data } = await axios.post(
    'https://oauth2.googleapis.com/token',
    new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwtToken
    })
  );
  return data.access_token;
};
export const sendNotification = async (input) => {
  const receiver = await getUserDeviceToken(input.receiverId);
  const record = await createNotification({
    title: input.title,
    body: input.body,
    type: input.type,
    data: input.data ?? null,
    senderId: input.senderId ?? null,
    receiverId: input.receiverId,
    paymentId: input.paymentId ?? null,
    status: input.status ?? '0'
  });
  if (!receiver?.device_token) {
    logger.warn(
      { receiverId: input.receiverId },
      'No device token found, stored notification only'
    );
    return ok(record, 'Notification stored');
  }
  if (config.nodeEnv === 'test') {
    return ok(record, 'Notification stored (test)');
  }
  if (!hasValidFcmCreds) {
    logger.warn({ receiverId: input.receiverId }, 'FCM credentials invalid/missing, skipping push');
    return ok(record, 'Notification stored');
  }
  try {
    const jwtToken = createAccessToken();
    const accessToken = await exchangeAccessToken(jwtToken);
    await axios.post(
      `https://fcm.googleapis.com/v1/projects/${firebaseProjectId}/messages:send`,
      {
        message: {
          token: receiver.device_token,
          notification:
            input.title || input.body ? { title: input.title, body: input.body } : undefined,
          data: {
            type: input.type ?? '',
            ...Object.fromEntries(
              Object.entries(input.data ?? {}).map(([key, value]) => [key, String(value)])
            )
          }
        }
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    const response = axios.isAxiosError(error)
      ? {
          status: error.response?.status,
          data: error.response?.data
        }
      : null;
    logger.warn({ err: error, response }, 'FCM push failed, notification stored without push');
    return ok(record, 'Notification stored (push unavailable)');
  }
  return ok(record, 'Notification sent');
};
export const getNotifications = async (userId) => {
  const notifications = await listNotificationsByUser(userId);
  const formatted = notifications.map((notification) => {
    // Get the first sender if it's an array
    const senderData = Array.isArray(notification.sender)
      ? notification.sender[0]
      : notification.sender;
    return {
      ...notification,
      sender: senderData
        ? {
            id: senderData.id,
            name: `${senderData.first_name ?? ''} ${senderData.last_name ?? ''}`.trim(),
            avatar: senderData.user_profile
              ? `${process.env.CDN_BASE_URL ?? ''}/users/${senderData.user_profile}`
              : null
          }
        : null
    };
  });
  return ok(formatted, 'Notification list found');
};
export const markAsRead = async (userId, notificationId) => {
  const updated = await markNotificationRead(userId, notificationId);
  if (!updated) {
    throw new apiError(404, 'Notification not found');
  }
  return ok(updated, 'Notification marked as read');
};
export const removeAllNotifications = async (userId) => {
  await clearNotifications(userId);
  return ok(null, 'Notifications cleared');
};
