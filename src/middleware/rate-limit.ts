import rateLimit from 'express-rate-limit';
export const rateLimiter = rateLimit({
  windowMs: 60000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false
});
