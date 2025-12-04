import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock repository functions
const getUserById = vi.fn();
const getUserByReferralCode = vi.fn();
const partialUpdateUser = vi.fn();

vi.mock('../src/modules/shared/repository.js', () => ({
  getUserById,
  getUserByReferralCode,
  partialUpdateUser
}));

const getReferralByInvitedUserId = vi.fn();
const getReferralStatsForInviter = vi.fn();
const createReferralRecord = vi.fn();
const updateReferralRecord = vi.fn();
const markReferralRewarded = vi.fn();

vi.mock('../src/modules/referrals/referrals.repository.js', () => ({
  getReferralByInvitedUserId,
  getReferralStatsForInviter,
  createReferralRecord,
  updateReferralRecord,
  markReferralRewarded
}));

const createLoyaltyEntry = vi.fn();
const incrementLoyaltyBalance = vi.fn();

vi.mock('../src/modules/payments/payments.repository.js', () => ({
  createLoyaltyEntry,
  incrementLoyaltyBalance
}));

// Mock config
vi.mock('../src/config/env.js', () => ({
  getConfig: vi.fn().mockReturnValue({
    referralShareBaseUrl: 'https://vendit.app/r/',
    referralShareMessage: 'Join Vendit with code {code}!',
    referralInviterPoints: 250,
    referralInviteePoints: 250,
    nodeEnv: 'test'
  })
}));

const { ensureReferralCode, getReferralInfo, processReferralReward } = await import(
  '../src/modules/referrals/referrals.service.js'
);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('referrals service', () => {
  describe('ensureReferralCode', () => {
    it('returns existing referral code', async () => {
      const profile = {
        id: 'user-1',
        referral_code: 'VNDABC123'
      };
      getUserById.mockResolvedValue(profile);

      const code = await ensureReferralCode('user-1', profile);

      expect(code).toBe('VNDABC123');
      expect(partialUpdateUser).not.toHaveBeenCalled();
    });

    it('generates new code when none exists', async () => {
      const profile = {
        id: 'user-1',
        referral_code: null
      };
      getUserById.mockResolvedValue(profile);
      getUserByReferralCode.mockResolvedValue(null);
      partialUpdateUser.mockResolvedValue(undefined);

      const code = await ensureReferralCode('user-1', profile);

      expect(code).toMatch(/^VND[A-Z0-9]{6}$/);
      expect(partialUpdateUser).toHaveBeenCalled();
    });

    it('throws error when user not found', async () => {
      getUserById.mockResolvedValue(null);

      await expect(ensureReferralCode('invalid', null)).rejects.toThrow('User not found');
    });

    it('regenerates code if collision detected', async () => {
      const profile = { id: 'user-1', referral_code: null };
      getUserById.mockResolvedValue(profile);
      getUserByReferralCode
        .mockResolvedValueOnce({ id: 'other-user' }) // First code exists
        .mockResolvedValueOnce(null); // Second code is unique
      partialUpdateUser.mockResolvedValue(undefined);

      const code = await ensureReferralCode('user-1', profile);

      expect(code).toMatch(/^VND[A-Z0-9]{6}$/);
      expect(getUserByReferralCode).toHaveBeenCalledTimes(2);
    });
  });

  describe('getReferralInfo', () => {
    it('returns referral info with stats', async () => {
      getUserById.mockResolvedValue({
        id: 'user-1',
        referral_code: 'VNDTEST01'
      });
      getReferralStatsForInviter.mockResolvedValue({
        total: 5,
        rewarded: 3,
        totalRewardEarned: 750
      });

      const result = await getReferralInfo('user-1');

      expect(result.referralCode).toBe('VNDTEST01');
      expect(result.shareLink).toContain('VNDTEST01');
      expect(result.shareMessage).toContain('VNDTEST01');
      expect(result.inviterRewardPoints).toBe(250);
      expect(result.inviteeRewardPoints).toBe(250);
      expect(result.stats.total).toBe(5);
      expect(result.stats.rewarded).toBe(3);
    });

    it('throws error when user not found', async () => {
      getUserById.mockResolvedValue(null);

      await expect(getReferralInfo('invalid')).rejects.toThrow('User not found');
    });
  });

  describe('processReferralReward', () => {
    it('skips if user already rewarded', async () => {
      const invitedUser = {
        id: 'invited-1',
        referral_rewarded_at: '2024-01-01T00:00:00Z'
      };

      await processReferralReward(invitedUser, '50000000', {});

      expect(createReferralRecord).not.toHaveBeenCalled();
      expect(createLoyaltyEntry).not.toHaveBeenCalled();
    });

    it('skips if no phone number', async () => {
      const invitedUser = { id: 'invited-1' };

      await processReferralReward(invitedUser, '', {});

      expect(createReferralRecord).not.toHaveBeenCalled();
    });

    it('skips self-referral', async () => {
      const invitedUser = { id: 'user-1' };
      getReferralByInvitedUserId.mockResolvedValue(null);
      getUserById.mockResolvedValue({ id: 'user-1' }); // Same user
      getUserByReferralCode.mockResolvedValue({ id: 'user-1' });

      await processReferralReward(invitedUser, '50000000', {
        referralCode: 'VNDTEST'
      });

      expect(createReferralRecord).not.toHaveBeenCalled();
    });

    it('processes new referral with code', async () => {
      const invitedUser = { id: 'invited-1' };
      getReferralByInvitedUserId.mockResolvedValue(null);
      getUserByReferralCode.mockResolvedValue({ id: 'inviter-1' });
      createReferralRecord.mockResolvedValue({ id: 'ref-1', status: 'pending' });
      createLoyaltyEntry.mockResolvedValue(undefined);
      incrementLoyaltyBalance.mockResolvedValue(undefined);
      markReferralRewarded.mockResolvedValue(undefined);
      partialUpdateUser.mockResolvedValue(undefined);

      await processReferralReward(invitedUser, '50000000', {
        referralCode: 'VNDINVITER'
      });

      expect(createReferralRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          inviterUserId: 'inviter-1',
          invitedUserId: 'invited-1'
        })
      );
      expect(createLoyaltyEntry).toHaveBeenCalledTimes(2); // Inviter + Invitee
      expect(incrementLoyaltyBalance).toHaveBeenCalledTimes(2);
      expect(markReferralRewarded).toHaveBeenCalled();
    });

    it('processes referral via referrer ID', async () => {
      const invitedUser = { id: 'invited-1' };
      getReferralByInvitedUserId.mockResolvedValue(null);
      getUserById.mockResolvedValue({ id: 'inviter-1' });
      createReferralRecord.mockResolvedValue({ id: 'ref-1' });
      createLoyaltyEntry.mockResolvedValue(undefined);
      incrementLoyaltyBalance.mockResolvedValue(undefined);
      markReferralRewarded.mockResolvedValue(undefined);
      partialUpdateUser.mockResolvedValue(undefined);

      await processReferralReward(invitedUser, '50000000', {
        referrerId: 'inviter-1'
      });

      expect(createReferralRecord).toHaveBeenCalled();
    });

    it('continues existing referral record', async () => {
      const invitedUser = { id: 'invited-1' };
      getReferralByInvitedUserId.mockResolvedValue({
        id: 'ref-1',
        inviter_user_id: 'inviter-1',
        status: 'pending'
      });
      getUserById.mockResolvedValue({ id: 'inviter-1' });
      createLoyaltyEntry.mockResolvedValue(undefined);
      incrementLoyaltyBalance.mockResolvedValue(undefined);
      markReferralRewarded.mockResolvedValue(undefined);
      partialUpdateUser.mockResolvedValue(undefined);

      await processReferralReward(invitedUser, '50000000', {});

      expect(createReferralRecord).not.toHaveBeenCalled();
      expect(createLoyaltyEntry).toHaveBeenCalled();
    });

    it('skips if referral already rewarded', async () => {
      const invitedUser = { id: 'invited-1' };
      getReferralByInvitedUserId.mockResolvedValue({
        id: 'ref-1',
        inviter_user_id: 'inviter-1',
        status: 'rewarded'
      });
      getUserById.mockResolvedValue({ id: 'inviter-1' });

      await processReferralReward(invitedUser, '50000000', {});

      expect(createLoyaltyEntry).not.toHaveBeenCalled();
    });
  });
});

