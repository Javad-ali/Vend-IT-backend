import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock repository functions
const getUserById = vi.fn();
const updateUserById = vi.fn();
const deleteUserById = vi.fn();
const getStaticContent = vi.fn();
const createContact = vi.fn();
const clearReferrerFromUsers = vi.fn();

vi.mock('../src/modules/shared/repository.js', () => ({
  getUserById,
  updateUserById,
  deleteUserById,
  getStaticContent,
  createContact,
  clearReferrerFromUsers
}));

// Mock Supabase storage
vi.mock('../src/libs/supabase.js', () => ({
  supabase: {
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null })
      })
    }
  }
}));

// Mock config
vi.mock('../src/config/env.js', () => ({
  getConfig: vi.fn().mockReturnValue({
    supabaseUrl: 'https://test.supabase.co',
    nodeEnv: 'test'
  })
}));

const { createProfile, getProfile, deleteAccount, editProfile, fetchStaticContent, submitContact } = await import(
  '../src/modules/users/users.service.js'
);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('users service', () => {
  describe('createProfile', () => {
    it('updates and returns user profile', async () => {
      updateUserById.mockResolvedValue({
        id: 'user-1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone_number: '50000000'
      });

      const result = await createProfile('user-1', {
        firstName: 'John',
        lastName: 'Doe'
      });

      expect(result.id).toBe('user-1');
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
    });

    it('throws error when user not found', async () => {
      updateUserById.mockResolvedValue(null);

      await expect(
        createProfile('invalid', { firstName: 'Test' })
      ).rejects.toThrow('No user found');
    });
  });

  describe('getProfile', () => {
    it('returns user profile with formatted data', async () => {
      getUserById.mockResolvedValue({
        id: 'user-1',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
        phone_number: '50000001',
        country_code: '+965',
        country: 'Kuwait',
        is_notification: 1,
        status: 1,
        is_otp_verify: 1,
        user_profile: 'avatars/jane.jpg',
        tap_customer_id: 'cus_123',
        referral_code: 'VNDABC123',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z'
      });

      const result = await getProfile('user-1');

      expect(result.id).toBe('user-1');
      expect(result.firstName).toBe('Jane');
      expect(result.lastName).toBe('Smith');
      expect(result.phoneNumber).toBe('50000001');
      expect(result.countryCode).toBe('+965');
      expect(result.isNotification).toBe(1);
      expect(result.status).toBe(1);
      expect(result.isOtpVerify).toBe(1);
      expect(result.userProfile).toContain('avatars/jane.jpg');
      expect(result.tapCustomerId).toBe('cus_123');
      expect(result.referralCode).toBe('VNDABC123');
    });

    it('throws error when user not found', async () => {
      getUserById.mockResolvedValue(null);

      await expect(getProfile('invalid')).rejects.toThrow('User not found');
    });

    it('handles null optional fields', async () => {
      getUserById.mockResolvedValue({
        id: 'user-1',
        first_name: null,
        last_name: null,
        email: null,
        phone_number: '50000000',
        user_profile: null,
        tap_customer_id: null
      });

      const result = await getProfile('user-1');

      expect(result.firstName).toBeNull();
      expect(result.lastName).toBeNull();
      expect(result.email).toBeNull();
      expect(result.userProfile).toBeNull();
    });
  });

  describe('deleteAccount', () => {
    it('clears referrals and deletes user', async () => {
      clearReferrerFromUsers.mockResolvedValue(undefined);
      deleteUserById.mockResolvedValue(undefined);

      await deleteAccount('user-1');

      expect(clearReferrerFromUsers).toHaveBeenCalledWith('user-1');
      expect(deleteUserById).toHaveBeenCalledWith('user-1');
    });
  });

  describe('editProfile', () => {
    it('updates profile without avatar', async () => {
      updateUserById.mockResolvedValue({
        id: 'user-1',
        first_name: 'Updated',
        last_name: 'Name',
        phone_number: '50000000'
      });

      const result = await editProfile('user-1', {
        firstName: 'Updated',
        lastName: 'Name'
      }, undefined);

      expect(result.firstName).toBe('Updated');
      expect(result.lastName).toBe('Name');
    });

    it('uploads avatar when file provided', async () => {
      updateUserById.mockResolvedValue({
        id: 'user-1',
        first_name: 'Test',
        phone_number: '50000000',
        user_profile: 'user-1/avatar.jpg'
      });

      const mockFile = {
        originalname: 'avatar.jpg',
        buffer: Buffer.from('test'),
        mimetype: 'image/jpeg'
      };

      const result = await editProfile('user-1', {}, mockFile as any);

      expect(result.userProfile).toContain('user-1');
    });

    it('throws error when update fails', async () => {
      updateUserById.mockResolvedValue(null);

      await expect(
        editProfile('user-1', { firstName: 'Test' }, undefined)
      ).rejects.toThrow('User profile not updated');
    });
  });

  describe('submitContact', () => {
    it('creates contact message', async () => {
      createContact.mockResolvedValue(undefined);

      await submitContact('user-1', {
        email: 'test@example.com',
        subject: 'Help',
        message: 'Need assistance'
      });

      expect(createContact).toHaveBeenCalledWith({
        userId: 'user-1',
        email: 'test@example.com',
        subject: 'Help',
        message: 'Need assistance'
      });
    });
  });

  describe('fetchStaticContent', () => {
    it('returns static content', async () => {
      getStaticContent.mockResolvedValue({
        about: 'About us text',
        terms: 'Terms of service',
        privacy: 'Privacy policy'
      });

      const result = await fetchStaticContent();

      expect(result.about).toBe('About us text');
      expect(result.terms).toBe('Terms of service');
    });

    it('throws error when content not found', async () => {
      getStaticContent.mockResolvedValue(null);

      await expect(fetchStaticContent()).rejects.toThrow('Content not found');
    });
  });
});

