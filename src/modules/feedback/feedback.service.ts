import { apiError, ok } from '../../utils/response.js';
import { createRating, getRatingForOrder, listRatingsByUser } from './feedback.repository.js';
export const submitRating = async (userId, input) => {
  if (input.orderId) {
    const existing = await getRatingForOrder(userId, input.orderId);
    if (existing) {
      throw new apiError(409, 'Rating already submitted for this order');
    }
  }
  const created = await createRating({
    userId,
    orderId: input.orderId,
    rating: input.rating,
    emoji: input.emoji ?? null,
    comment: input.comment ?? null
  });
  return ok(created, 'Rating submitted');
};
export const fetchUserRatings = async (userId) => {
  const ratings = await listRatingsByUser(userId);
  return ok(ratings, 'Ratings found');
};
