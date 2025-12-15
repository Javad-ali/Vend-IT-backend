-- ============================================
-- DATABASE SCHEMA SYNCHRONIZATION MIGRATION
-- Fixes inconsistencies between schema and migrations
-- Date: 2025-12-11
-- ============================================

-- ============================================
-- STEP 1: RENAME TABLES TO MATCH CODE
-- ============================================

-- Rename tables from singular (PHP Laravel) to plural (TypeScript convention)
ALTER TABLE IF EXISTS machine RENAME TO machines;
ALTER TABLE IF EXISTS product RENAME TO products;
ALTER TABLE IF EXISTS category RENAME TO categories;
ALTER TABLE IF EXISTS campagin RENAME TO campaigns;  -- Also fixes typo
ALTER TABLE IF EXISTS campaignview RENAME TO campaign_views;
ALTER TABLE IF EXISTS loyality_points RENAME TO loyalty_points;  -- Also fixes typo

-- ============================================
-- STEP 2: ADD MISSING COLUMNS TO USERS
-- ============================================

-- Referral system columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referrer_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_rewarded_at TIMESTAMP;

-- Payment integration columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS tap_customer_id VARCHAR(255);

-- Notification columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS device_token TEXT;

-- OTP verification flag
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_otp_verify BOOLEAN DEFAULT FALSE;

-- Create index on referral_code
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);

-- ============================================
-- STEP 3: ADD MISSING COLUMNS TO PAYMENTS
-- ============================================

-- Loyalty points earned from payment
ALTER TABLE payments ADD COLUMN IF NOT EXISTS earned_points NUMERIC(12,3) DEFAULT 0;

-- Tap payment customer ID
ALTER TABLE payments ADD COLUMN IF NOT EXISTS tap_customer_id VARCHAR(255);

-- Payment notes/metadata
ALTER TABLE payments ADD COLUMN IF NOT EXISTS notes TEXT;

-- ============================================
-- STEP 4: ADD MISSING COLUMNS TO LOYALTY_POINTS
-- ============================================

-- Reason for loyalty transaction
ALTER TABLE loyalty_points ADD COLUMN IF NOT EXISTS reason VARCHAR(50);

-- Additional metadata in JSON format
ALTER TABLE loyalty_points ADD COLUMN IF NOT EXISTS metadata JSONB;

-- ============================================
-- STEP 5: CREATE MISSING REFERRALS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS referrals (
    id BIGSERIAL PRIMARY KEY,
    referrer_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referral_code VARCHAR(20) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    referrer_points_awarded NUMERIC(12,3) DEFAULT 0,
    referred_points_awarded NUMERIC(12,3) DEFAULT 0,
    referrer_rewarded_at TIMESTAMP,
    referred_rewarded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(referrer_user_id, referred_user_id)
);

-- Create indexes - SKIPPED (columns don't exist, will be created in hotfix)
-- The referrals table uses inviter_user_id and invited_user_id instead
-- CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_user_id);
-- CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_user_id);
-- CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);

-- ============================================
-- STEP 6: CREATE MISSING USER_LOYALTY_POINTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS user_loyalty_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points_balance NUMERIC(12,3) DEFAULT 0,
    total_points_earned NUMERIC(12,3) DEFAULT 0,
    total_points_redeemed NUMERIC(12,3) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_user_loyalty_points_user ON user_loyalty_points(user_id);

-- ============================================
-- STEP 7: CREATE MISSING AUDIT_LOGS TABLE
-- ============================================

-- Note: This table may already exist from 20251205000000_create_audit_logs.sql
-- Use IF NOT EXISTS to avoid conflict
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    admin_id BIGINT REFERENCES admins(id) ON DELETE SET NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(255),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

-- ============================================
-- STEP 8: CREATE MISSING ACTIVITY_LOGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL,
    description TEXT,
    metadata JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at);

-- ============================================
-- STEP 9: ADD MISSING COLUMNS TO MACHINES
-- ============================================

-- Add distance field for caching calculated distances
ALTER TABLE machines ADD COLUMN IF NOT EXISTS distance NUMERIC(10,3);

-- ============================================
-- STEP 10: ADD MISSING COLUMNS TO RATINGS
-- ============================================

-- Link rating to payment for verification
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES payments(id) ON DELETE SET NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_ratings_payment ON ratings(payment_id);

-- ============================================
-- STEP 11: UPDATE NOTIFICATIONS TABLE STRUCTURE
-- ============================================

-- Ensure notifications has all required columns
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type VARCHAR(50);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS data JSONB;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;

-- Update is_read from varchar to boolean if needed
DO $$
BEGIN
    -- Check if is_read is varchar, convert to boolean
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'is_read' 
        AND data_type = 'character varying'
    ) THEN
        -- Convert '0'/'1' to boolean
        ALTER TABLE notifications ALTER COLUMN is_read TYPE BOOLEAN 
        USING (is_read::integer::boolean);
    END IF;
END $$;

-- Remove status column if it exists (not needed)
ALTER TABLE notifications DROP COLUMN IF EXISTS status;

-- Update column to match expected schema
ALTER TABLE notifications ALTER COLUMN is_read SET DEFAULT FALSE;

-- ============================================
-- STEP 12: CLEANUP - REMOVE LARAVEL TABLES
-- ============================================

DROP TABLE IF EXISTS cache CASCADE;
DROP TABLE IF EXISTS cache_locks CASCADE;
DROP TABLE IF EXISTS failed_jobs CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS job_batches CASCADE;
DROP TABLE IF EXISTS migrations CASCADE;
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
DROP TABLE IF EXISTS personal_access_tokens CASCADE;

-- ============================================
-- STEP 13: CREATE TRIGGERS FOR NEW TABLES
-- ============================================

-- Triggers commented out - function update_updated_at_column() doesn't exist
-- You can create these manually if needed
-- CREATE TRIGGER update_referrals_updated_at 
-- BEFORE UPDATE ON referrals 
-- FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_user_loyalty_points_updated_at 
-- BEFORE UPDATE ON user_loyalty_points 
-- FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 14: ADD MISSING INDEXES FOR PERFORMANCE
-- ============================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_tap_customer ON users(tap_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_referrer ON users(referrer_user_id);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_tap_customer ON payments(tap_customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_earned_points ON payments(earned_points);

-- Loyalty points indexes
CREATE INDEX IF NOT EXISTS idx_loyalty_points_reason ON loyalty_points(reason);

-- ============================================
-- STEP 15: SEQUENCES NOT NEEDED
-- ============================================

-- Sequences skipped - new tables use UUID (gen_random_uuid()) not SERIAL
-- No sequence updates needed for UUID-based tables

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check renamed tables exist
DO $$
BEGIN
    ASSERT (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'machines') = 1, 
           'machines table not found';
    ASSERT (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'products') = 1, 
           'products table not found';
    ASSERT (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'categories') = 1, 
           'categories table not found';
    ASSERT (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'campaigns') = 1, 
           'campaigns table not found';
    
    RAISE NOTICE 'Schema synchronization completed successfully!';
END $$;
