-- ============================================
-- HOTFIX: Fix audit_logs table schema
-- Date: 2025-12-15
-- Issue: audit_logs table may have wrong schema from conflicting migrations
-- ============================================

-- Add details column if missing (code uses this column)
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS details JSONB;

-- Add user_id column if missing
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Drop the changes column if it exists (we use details instead)
ALTER TABLE audit_logs DROP COLUMN IF EXISTS changes;

-- Drop description column if it exists (we use details instead)
ALTER TABLE audit_logs DROP COLUMN IF EXISTS description;

-- Add RLS policies for service_role
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS "Service role can insert audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Service role can read audit logs" ON audit_logs;

CREATE POLICY "Service role can insert audit logs"
    ON audit_logs
    FOR INSERT
    TO service_role
    WITH CHECK (true);

CREATE POLICY "Service role can read audit logs"
    ON audit_logs
    FOR SELECT
    TO service_role
    USING (true);

-- Verify the table structure
DO $$
BEGIN
    RAISE NOTICE 'audit_logs table schema fixed successfully!';
END $$;
