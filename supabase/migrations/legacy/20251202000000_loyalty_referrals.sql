-- Loyalty + Referral enhancements
-- Adds referral fields on users, referral ledger table, and loyalty metadata

-- Add referral columns to users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referrer_user_id UUID REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS referral_rewarded_at TIMESTAMPTZ;

-- Create referrals tracking table
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  invited_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  invited_phone TEXT NOT NULL,
  referral_code TEXT,
  branch_identity TEXT,
  branch_install_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  rewarded_at TIMESTAMPTZ,
  CONSTRAINT referrals_invited_user_unique UNIQUE (invited_user_id)
);

-- Add indexes for referrals
CREATE INDEX IF NOT EXISTS idx_referrals_inviter ON public.referrals(inviter_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);

-- Add metadata columns to loyalty points
ALTER TABLE public.loyality_points
  ADD COLUMN IF NOT EXISTS reason TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::JSONB;
