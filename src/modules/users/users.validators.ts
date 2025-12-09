import { z } from 'zod';
export const profileSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  email: z.string().email(),
  phoneNumber: z.string().optional(),
  referralCode: z.string().optional()
});
export const contactSchema = z.object({
  subject: z.string().min(1),
  message: z.string().min(1),
  email: z.string().email()
});
