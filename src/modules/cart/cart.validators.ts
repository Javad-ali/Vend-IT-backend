import { z } from 'zod';
export const addCartSchema = z.object({
  machineId: z.string().min(1),
  slotNumber: z.string().min(1),
  productId: z.string().min(1),
  quantity: z.coerce.number().int().positive()
});
export const updateCartSchema = z.object({
  quantity: z.coerce.number().int().positive()
});
