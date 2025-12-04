import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock repository functions
const getLatestCampaign = vi.fn();
const listCampaigns = vi.fn();
const getCampaignById = vi.fn();
const createCampaign = vi.fn();
const updateCampaign = vi.fn();
const deleteCampaign = vi.fn();
const recordCampaignView = vi.fn();

vi.mock('../src/modules/campaigns/campaigns.repository.js', () => ({
  getLatestCampaign,
  listCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  recordCampaignView
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

const { fetchLatestCampaign, fetchAllCampaigns, createCampaignWithMedia, updateCampaignWithMedia, removeCampaign } = await import(
  '../src/modules/campaigns/campaigns.service.js'
);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('campaigns service', () => {
  describe('fetchLatestCampaign', () => {
    it('returns the latest active campaign', async () => {
      const campaign = {
        id: 'campaign-1',
        title: 'Summer Sale',
        description: 'Get 20% off',
        image_path: 'campaigns/summer.jpg',
        start_at: '2024-01-01',
        end_at: '2024-12-31'
      };
      getLatestCampaign.mockResolvedValue(campaign);
      recordCampaignView.mockResolvedValue(undefined);

      const result = await fetchLatestCampaign('user-1');

      expect(result.status).toBe(200);
      expect(result.data.title).toBe('Summer Sale');
      expect(result.data.image_url).toContain('summer.jpg');
      expect(recordCampaignView).toHaveBeenCalledWith('user-1', 'campaign-1');
    });

    it('throws error when no campaign found', async () => {
      getLatestCampaign.mockResolvedValue(null);

      await expect(fetchLatestCampaign('user-1')).rejects.toThrow('Campaign not found');
    });

    it('handles deleted user gracefully when recording view', async () => {
      const campaign = { id: 'campaign-1', title: 'Test', image_path: null };
      getLatestCampaign.mockResolvedValue(campaign);
      recordCampaignView.mockRejectedValue({ code: '23503' });

      // Should not throw despite foreign key error
      const result = await fetchLatestCampaign('deleted-user');
      expect(result.status).toBe(200);
    });
  });

  describe('fetchAllCampaigns', () => {
    it('returns all campaigns with image URLs', async () => {
      listCampaigns.mockResolvedValue([
        { id: '1', title: 'Campaign 1', image_path: 'path1.jpg' },
        { id: '2', title: 'Campaign 2', image_path: null }
      ]);

      const result = await fetchAllCampaigns();

      expect(result).toHaveLength(2);
      expect(result[0].image_url).toContain('path1.jpg');
      expect(result[1].image_url).toBeNull();
    });

    it('returns empty array when no campaigns', async () => {
      listCampaigns.mockResolvedValue([]);

      const result = await fetchAllCampaigns();

      expect(result).toHaveLength(0);
    });
  });

  describe('createCampaignWithMedia', () => {
    it('creates campaign without image', async () => {
      createCampaign.mockResolvedValue({
        id: 'new-campaign',
        title: 'New Campaign',
        image_path: null
      });

      const result = await createCampaignWithMedia({
        title: 'New Campaign',
        description: 'Description',
        startAt: '2024-01-01',
        endAt: '2024-12-31',
        file: undefined
      });

      expect(result.status).toBe(200);
      expect(result.data.title).toBe('New Campaign');
      expect(createCampaign).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Campaign',
          image_path: null
        })
      );
    });

    it('creates campaign with image upload', async () => {
      createCampaign.mockResolvedValue({
        id: 'new-campaign',
        title: 'New Campaign',
        image_path: 'uploaded.jpg'
      });

      const mockFile = {
        originalname: 'test.jpg',
        buffer: Buffer.from('test'),
        mimetype: 'image/jpeg'
      };

      const result = await createCampaignWithMedia({
        title: 'New Campaign',
        startAt: '2024-01-01',
        endAt: '2024-12-31',
        file: mockFile as any
      });

      expect(result.status).toBe(200);
    });
  });

  describe('updateCampaignWithMedia', () => {
    it('updates existing campaign', async () => {
      getCampaignById.mockResolvedValue({
        id: 'campaign-1',
        title: 'Old Title',
        description: 'Old desc',
        image_path: 'old.jpg'
      });
      updateCampaign.mockResolvedValue({
        id: 'campaign-1',
        title: 'New Title',
        image_path: 'old.jpg'
      });

      const result = await updateCampaignWithMedia('campaign-1', {
        title: 'New Title'
      });

      expect(result.status).toBe(200);
      expect(result.data.title).toBe('New Title');
    });

    it('throws error when campaign not found', async () => {
      getCampaignById.mockResolvedValue(null);

      await expect(
        updateCampaignWithMedia('invalid-id', { title: 'New' })
      ).rejects.toThrow('Campaign not found');
    });
  });

  describe('removeCampaign', () => {
    it('deletes campaign', async () => {
      deleteCampaign.mockResolvedValue(undefined);

      const result = await removeCampaign('campaign-1');

      expect(result.status).toBe(200);
      expect(result.message).toBe('Campaign deleted');
      expect(deleteCampaign).toHaveBeenCalledWith('campaign-1');
    });
  });
});

