-- ============================================
-- FIX: Rename user_loyality_points to user_loyalty_points
-- Date: 2025-12-15
-- ============================================

-- This migration renames the table with typo to correct spelling
ALTER TABLE IF EXISTS user_loyality_points RENAME TO user_loyalty_points;

-- Verify the rename
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_loyalty_points') THEN
        RAISE NOTICE 'SUCCESS: Table renamed to user_loyalty_points';
    ELSE
        RAISE WARNING 'FAILED: Table user_loyalty_points not found';
    END IF;
END $$;
