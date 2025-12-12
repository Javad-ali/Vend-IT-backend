import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock repository functions
const createNotification = vi.fn();
const getUserDeviceToken = vi.fn();
const listNotificationsByUser = vi.fn();
const markNotificationRead = vi.fn();
const clearNotifications = vi.fn();

vi.mock('../src/modules/notifications/notifications.repository.js', () => ({
  createNotification,
  getUserDeviceToken,
  listNotificationsByUser,
  markNotificationRead,
  clearNotifications
}));

// Mock axios
vi.mock('axios', () => ({
  default: {
    post: vi.fn().mockResolvedValue({ data: { access_token: 'test-token' } }),
    isAxiosError: vi.fn().mockReturnValue(false)
  }
}));

// Mock config
vi.mock('../src/config/env.js', () => ({
  getConfig: vi.fn().mockReturnValue({
    nodeEnv: 'test',
    firebaseProjectId: 'test-project',
    firebaseClientEmail: 'test@test.iam.gserviceaccount.com',
    firebasePrivateKey: '-----BEGIN PRIVATE KEY-----\nTEST\n-----END PRIVATE KEY-----\n'
  })
}));

const { sendNotification, getNotifications, markAsRead, removeAllNotifications } = await import(
  '../src/modules/notifications/notifications.service.js'
);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('notifications service', () => {
  describe('sendNotification', () => {
    it('stores notification and returns result in test environment', async () => {
      getUserDeviceToken.mockResolvedValue({ device_token: 'fcm-token' });
      createNotification.mockResolvedValue({
        id: 'notif-1',
        title: 'Test Notification',
        body: 'Test body'
      });

      const result = await sendNotification({
        receiverId: 'user-1',
        title: 'Test Notification',
        body: 'Test body',
        type: 'System'
      });

      expect(result.status).toBe(200);
      expect(result.message).toBe('Notification stored (test)');
      expect(createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Notification',
          body: 'Test body',
          type: 'System',
          receiverId: 'user-1'
        })
      );
    });

    it('stores notification without push when no device token', async () => {
      getUserDeviceToken.mockResolvedValue(null);
      createNotification.mockResolvedValue({
        id: 'notif-1',
        title: 'Test'
      });

      const result = await sendNotification({
        receiverId: 'user-1',
        title: 'Test',
        body: 'Body',
        type: 'System'
      });

      expect(result.status).toBe(200);
      expect(result.message).toBe('Notification stored');
    });

    it('includes custom data in notification', async () => {
      getUserDeviceToken.mockResolvedValue(null);
      createNotification.mockResolvedValue({ id: 'notif-1' });

      await sendNotification({
        receiverId: 'user-1',
        title: 'Payment Success',
        body: 'Your payment was processed',
        type: 'PaymentSuccess',
        data: { paymentId: 'pay-123', amount: 10.5 }
      });

      expect(createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { paymentId: 'pay-123', amount: 10.5 }
        })
      );
    });
  });

  describe('getNotifications', () => {
    it('returns formatted notifications list', async () => {
      listNotificationsByUser.mockResolvedValue([
        {
          id: 'notif-1',
          title: 'Test 1',
          body: 'Body 1',
          type: 'System',
          sender: [{ id: 'sender-1', first_name: 'John', last_name: 'Doe', user_profile: 'avatar.jpg' }]
        },
        {
          id: 'notif-2',
          title: 'Test 2',
          body: 'Body 2',
          type: 'Payment',
          sender: null
        }
      ]);

      const result = await getNotifications('user-1');

      expect(result.status).toBe(200);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].sender.name).toBe('John Doe');
      expect(result.data[1].sender).toBeNull();
    });

    it('returns empty list when no notifications', async () => {
      listNotificationsByUser.mockResolvedValue([]);

      const result = await getNotifications('user-1');

      expect(result.data).toHaveLength(0);
    });
  });

  describe('markAsRead', () => {
    it('marks notification as read', async () => {
      markNotificationRead.mockResolvedValue({
        id: 'notif-1',
        is_read: true
      });

      const result = await markAsRead('user-1', 'notif-1');

      expect(result.status).toBe(200);
      expect(result.message).toBe('Notification marked as read');
      expect(markNotificationRead).toHaveBeenCalledWith('user-1', 'notif-1');
    });

    it('throws error when notification not found', async () => {
      markNotificationRead.mockResolvedValue(null);

      await expect(markAsRead('user-1', 'invalid')).rejects.toThrow('Notification not found');
    });
  });

  describe('removeAllNotifications', () => {
    it('clears all notifications for user', async () => {
      clearNotifications.mockResolvedValue(undefined);

      const result = await removeAllNotifications('user-1');

      expect(result.status).toBe(200);
      expect(result.message).toBe('Notifications cleared');
      expect(clearNotifications).toHaveBeenCalledWith('user-1');
    });
  });
});

