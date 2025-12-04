import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock repository functions
const createRating = vi.fn();
const getRatingForOrder = vi.fn();
const listRatingsByUser = vi.fn();

vi.mock('../src/modules/feedback/feedback.repository.js', () => ({
  createRating,
  getRatingForOrder,
  listRatingsByUser
}));

const { submitRating, fetchUserRatings } = await import(
  '../src/modules/feedback/feedback.service.js'
);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('feedback service', () => {
  describe('submitRating', () => {
    it('creates rating successfully', async () => {
      createRating.mockResolvedValue({
        id: 'rating-1',
        user_id: 'user-1',
        rating: 5,
        comment: 'Great!'
      });

      const result = await submitRating('user-1', {
        rating: 5,
        comment: 'Great!'
      });

      expect(result.status).toBe(200);
      expect(result.message).toBe('Rating submitted');
      expect(createRating).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          rating: 5,
          comment: 'Great!'
        })
      );
    });

    it('creates rating with emoji', async () => {
      createRating.mockResolvedValue({
        id: 'rating-1',
        rating: 4,
        emoji: '😊'
      });

      await submitRating('user-1', {
        rating: 4,
        emoji: '😊'
      });

      expect(createRating).toHaveBeenCalledWith(
        expect.objectContaining({
          emoji: '😊'
        })
      );
    });

    it('creates rating with order ID', async () => {
      getRatingForOrder.mockResolvedValue(null);
      createRating.mockResolvedValue({
        id: 'rating-1',
        rating: 5,
        order_id: 'order-123'
      });

      await submitRating('user-1', {
        rating: 5,
        orderId: 'order-123'
      });

      expect(getRatingForOrder).toHaveBeenCalledWith('user-1', 'order-123');
      expect(createRating).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: 'order-123'
        })
      );
    });

    it('throws error when rating already exists for order', async () => {
      getRatingForOrder.mockResolvedValue({ id: 'existing-rating' });

      await expect(
        submitRating('user-1', {
          rating: 5,
          orderId: 'order-123'
        })
      ).rejects.toThrow('Rating already submitted for this order');
    });

    it('handles rating without comment', async () => {
      createRating.mockResolvedValue({
        id: 'rating-1',
        rating: 3,
        comment: null
      });

      const result = await submitRating('user-1', {
        rating: 3
      });

      expect(result.status).toBe(200);
      expect(createRating).toHaveBeenCalledWith(
        expect.objectContaining({
          comment: null
        })
      );
    });
  });

  describe('fetchUserRatings', () => {
    it('returns list of user ratings', async () => {
      listRatingsByUser.mockResolvedValue([
        { id: 'rating-1', rating: 5, comment: 'Great!' },
        { id: 'rating-2', rating: 4, comment: 'Good' }
      ]);

      const result = await fetchUserRatings('user-1');

      expect(result.status).toBe(200);
      expect(result.message).toBe('Ratings found');
      expect(result.data).toHaveLength(2);
    });

    it('returns empty list when no ratings', async () => {
      listRatingsByUser.mockResolvedValue([]);

      const result = await fetchUserRatings('user-1');

      expect(result.data).toHaveLength(0);
    });
  });
});

