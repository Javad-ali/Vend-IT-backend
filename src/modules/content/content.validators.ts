import { z } from 'zod';
export const contactSchema = z.object({
  email: z.string().email(),
  subject: z.string().min(1),
  message: z.string().min(1)
});
export const staticContentSchema = z.object({
  privacyPolicy: z.string().optional(),
  termsAndConditions: z.string().optional(),
  faq: z.string().optional()
});
