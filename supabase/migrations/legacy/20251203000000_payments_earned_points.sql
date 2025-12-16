-- Ensure payments table tracks earned points

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS earned_points NUMERIC(12,3) DEFAULT 0;
