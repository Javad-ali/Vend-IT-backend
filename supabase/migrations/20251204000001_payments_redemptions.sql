-- Track redemption values on payments

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS redeemed_points NUMERIC(12,3) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS redeemed_amount NUMERIC(12,3) DEFAULT 0;
