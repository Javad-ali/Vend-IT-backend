-- =====================================================
-- FIX: Restore Original Notifications + Create Admin Notifications
-- =====================================================
-- Date: 2024-12-09
-- This migration:
-- 1. Drops the broken notifications table
-- 2. Recreates original user notifications table
-- 3. Creates separate admin_notifications table
-- =====================================================

-- Drop the broken notifications table
DROP TABLE IF EXISTS notifications CASCADE;

-- =====================================================
-- User Notifications Table (Original Structure)
-- =====================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255),
  body TEXT,
  status VARCHAR(10) DEFAULT '0',
  type VARCHAR(50),
  data JSONB,
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  payment_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for user notifications
CREATE INDEX IF NOT EXISTS idx_notifications_receiver ON notifications(receiver_id);
CREATE INDEX IF NOT EXISTS idx_notifications_sender ON notifications(sender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- RLS for user notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages user notifications"
    ON notifications
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- Admin Notifications Table (New - Separate)
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id BIGINT REFERENCES admins(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  read BOOLEAN DEFAULT FALSE,
  link VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for admin notifications
CREATE INDEX IF NOT EXISTS idx_admin_notifications_admin ON admin_notifications(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_read ON admin_notifications(read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created ON admin_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_unread ON admin_notifications(admin_id, read) WHERE read = false;

-- Comments
COMMENT ON TABLE admin_notifications IS 'Admin dashboard notifications and alerts';
COMMENT ON COLUMN admin_notifications.type IS 'Notification type: info, success, warning, error';
COMMENT ON COLUMN admin_notifications.link IS 'Optional link to related resource';

-- RLS for admin notifications
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages admin notifications"
    ON admin_notifications
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
