-- Create audit_logs table for tracking sensitive operations
-- Migration: 20251205000000_create_audit_logs.sql

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

-- Indexes for common queries
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_audit_logs_admin_id ON audit_logs(admin_id) WHERE admin_id IS NOT NULL;
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Composite index for filtering by user and date range
CREATE INDEX idx_audit_logs_user_date ON audit_logs(user_id, created_at DESC) WHERE user_id IS NOT NULL;

-- Comments
COMMENT ON TABLE audit_logs IS 'Audit trail for sensitive operations and security events';
COMMENT ON COLUMN audit_logs.action IS 'Action identifier (e.g., user.login, payment.created)';
COMMENT ON COLUMN audit_logs.resource_type IS 'Type of resource affected (e.g., user, payment, machine)';
COMMENT ON COLUMN audit_logs.resource_id IS 'ID of the affected resource';
COMMENT ON COLUMN audit_logs.details IS 'Additional context as JSON';
COMMENT ON COLUMN audit_logs.ip_address IS 'Client IP address';
COMMENT ON COLUMN audit_logs.user_agent IS 'Client user agent string';

-- Row Level Security (if using Supabase RLS)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (for idempotency)
DROP POLICY IF EXISTS "Service role can insert audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Service role can read audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Authenticated admins can read audit logs" ON audit_logs;

-- Policy: Service role can insert (from backend)
CREATE POLICY "Service role can insert audit logs"
    ON audit_logs
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Policy: Service role can read all audit logs
CREATE POLICY "Service role can read audit logs"
    ON audit_logs
    FOR SELECT
    TO service_role
    USING (true);

-- Function to auto-cleanup old audit logs (optional, run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM audit_logs
    WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION cleanup_old_audit_logs IS 'Removes audit logs older than specified days (default 90)';

