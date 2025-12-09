import { z } from 'zod';
export const ratingSchema = z.object({
  orderId: z.string().min(1).optional(),
  rating: z.coerce.number().min(0).max(5),
  emoji: z.string().min(1).max(32).optional(),
  comment: z.string().max(500).optional()
});
