import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock repository functions
const getStaticContent = vi.fn();
const upsertStaticContent = vi.fn();
const createContactMessage = vi.fn();
const listContactMessages = vi.fn();

vi.mock('../src/modules/content/content.repository.js', () => ({
  getStaticContent,
  upsertStaticContent,
  createContactMessage,
  listContactMessages
}));

const { submitContact, fetchStaticContent, updateStaticContent, fetchContactMessages } = await import(
  '../src/modules/content/content.service.js'
);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('content service', () => {
  describe('submitContact', () => {
    it('creates contact message successfully', async () => {
      createContactMessage.mockResolvedValue(undefined);

      const result = await submitContact('user-1', {
        email: 'user@example.com',
        subject: 'Support Request',
        message: 'I need help with my order'
      });

      expect(result.status).toBe(200);
      expect(result.message).toBe('Contact form submitted');
      expect(createContactMessage).toHaveBeenCalledWith({
        userId: 'user-1',
        email: 'user@example.com',
        subject: 'Support Request',
        message: 'I need help with my order'
      });
    });
  });

  describe('fetchStaticContent', () => {
    it('returns static content when found', async () => {
      getStaticContent.mockResolvedValue({
        id: 'content-1',
        about_us: 'About Vend-IT',
        terms_conditions: 'Terms and conditions text',
        privacy_policy: 'Privacy policy text',
        support_email: 'support@vendit.com',
        support_phone: '+965 12345678'
      });

      const result = await fetchStaticContent();

      expect(result.status).toBe(200);
      expect(result.message).toBe('Static content found');
      expect(result.data.about_us).toBe('About Vend-IT');
      expect(result.data.support_email).toBe('support@vendit.com');
    });

    it('throws error when content not found', async () => {
      getStaticContent.mockResolvedValue(null);

      await expect(fetchStaticContent()).rejects.toThrow('Content not found');
    });
  });

  describe('updateStaticContent', () => {
    it('updates static content successfully', async () => {
      upsertStaticContent.mockResolvedValue({
        id: 'content-1',
        about_us: 'Updated about text',
        terms_conditions: 'Updated terms',
        updated_at: '2024-01-15T00:00:00Z'
      });

      const result = await updateStaticContent({
        about_us: 'Updated about text',
        terms_conditions: 'Updated terms'
      });

      expect(result.status).toBe(200);
      expect(result.message).toBe('Static content updated');
      expect(result.data.about_us).toBe('Updated about text');
    });

    it('handles partial updates', async () => {
      upsertStaticContent.mockResolvedValue({
        id: 'content-1',
        privacy_policy: 'New privacy policy'
      });

      const result = await updateStaticContent({
        privacy_policy: 'New privacy policy'
      });

      expect(result.status).toBe(200);
      expect(upsertStaticContent).toHaveBeenCalledWith({
        privacy_policy: 'New privacy policy'
      });
    });
  });

  describe('fetchContactMessages', () => {
    it('returns list of contact messages', async () => {
      listContactMessages.mockResolvedValue([
        {
          id: 'msg-1',
          user_id: 'user-1',
          email: 'user1@example.com',
          subject: 'Question',
          message: 'How do I use the app?',
          created_at: '2024-01-10T00:00:00Z'
        },
        {
          id: 'msg-2',
          user_id: 'user-2',
          email: 'user2@example.com',
          subject: 'Bug Report',
          message: 'Found a bug',
          created_at: '2024-01-11T00:00:00Z'
        }
      ]);

      const result = await fetchContactMessages();

      expect(result).toHaveLength(2);
      expect(result[0].subject).toBe('Question');
      expect(result[1].subject).toBe('Bug Report');
    });

    it('returns empty array when no messages', async () => {
      listContactMessages.mockResolvedValue([]);

      const result = await fetchContactMessages();

      expect(result).toHaveLength(0);
    });
  });
});

