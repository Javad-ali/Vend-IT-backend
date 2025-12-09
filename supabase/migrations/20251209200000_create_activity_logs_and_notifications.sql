-- =====================================================
-- Notifications Table Migration
-- =====================================================
-- Description: Creates notifications table for admin alerts
-- Date: 2024-12-09
-- Note: Activity logs functionality already covered by audit_logs table
-- =====================================================

-- Drop existing table if structure is different
DROP TABLE IF EXISTS notifications CASCADE;

-- Notifications Table
-- Stores admin notifications and alerts
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id BIGINT REFERENCES admins(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  read BOOLEAN DEFAULT FALSE,
  link VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_admin ON notifications(admin_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_admin_unread ON notifications(admin_id, read) WHERE read = false;

-- Comments
COMMENT ON TABLE notifications IS 'Admin notifications and alerts';
COMMENT ON COLUMN notifications.type IS 'Notification type: info, success, warning, error';
COMMENT ON COLUMN notifications.link IS 'Optional link to related resource';
COMMENT ON COLUMN notifications.read IS 'Whether notification has been read by admin';

-- Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can manage all notifications (backend handles auth)
CREATE POLICY "Service role manages notifications"
    ON notifications
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
