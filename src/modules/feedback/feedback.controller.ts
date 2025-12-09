import { fetchUserRatings, submitRating } from './feedback.service.js';
import { ratingSchema } from './feedback.validators.js';
export const handleCreateRating = async (req, res) => {
  const payload = ratingSchema.parse(req.body);
  const response = await submitRating(req.user.id, payload);
  return res.json(response);
};
export const handleListRatings = async (req, res) => {
  const response = await fetchUserRatings(req.user.id);
  return res.json(response);
};
