-- Hotfix for referrals table index creation
-- The table already exists with different column names

-- Create indexes using correct column names from existing table
CREATE INDEX IF NOT EXISTS idx_referrals_inviter ON public.referrals(inviter_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_invited ON public.referrals(invited_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON public.referrals(referral_code);

-- Create index for user_loyalty_points if table exists
CREATE INDEX IF NOT EXISTS idx_user_loyalty_points_user ON public.user_loyalty_points(user_id);

-- Create indexes for audit_logs if table exists  
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON public.audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at);

-- Create indexes for activity_logs if table exists
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON public.activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON public.activity_logs(created_at);

-- Create other missing indexes
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON public.users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_tap_customer ON public.users(tap_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_referrer ON public.users(referrer_user_id);

CREATE INDEX IF NOT EXISTS idx_payments_tap_customer ON public.payments(tap_customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_earned_points ON public.payments(earned_points);

CREATE INDEX IF NOT EXISTS idx_loyalty_points_reason ON public.loyalty_points(reason);

CREATE INDEX IF NOT EXISTS idx_ratings_payment ON public.ratings(payment_id);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Hotfix migration completed successfully!';
END $$;
