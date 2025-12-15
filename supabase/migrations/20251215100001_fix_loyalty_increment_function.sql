-- ============================================
-- FIX: Update loyalty_increment function to use correct table name
-- Date: 2025-12-15
-- ============================================

-- Drop existing function (if exists)
DROP FUNCTION IF EXISTS loyalty_increment(uuid, numeric);

-- Recreate with correct table name: user_loyalty_points (not user_loyality_points)
CREATE OR REPLACE FUNCTION loyalty_increment(p_user_id uuid, p_points numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_balance numeric;
BEGIN
    -- Try to update existing record
    UPDATE user_loyalty_points
    SET 
        points_balance = points_balance + p_points,
        total_points_earned = CASE WHEN p_points > 0 THEN total_points_earned + p_points ELSE total_points_earned END,
        total_points_redeemed = CASE WHEN p_points < 0 THEN total_points_redeemed + ABS(p_points) ELSE total_points_redeemed END,
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING points_balance INTO v_balance;
    
    -- If no rows updated, insert new record
    IF NOT FOUND THEN
        INSERT INTO user_loyalty_points (user_id, points_balance, total_points_earned, total_points_redeemed)
        VALUES (
            p_user_id, 
            GREATEST(p_points, 0), 
            GREATEST(p_points, 0), 
            CASE WHEN p_points < 0 THEN ABS(p_points) ELSE 0 END
        )
        RETURNING points_balance INTO v_balance;
    END IF;
    
    RETURN v_balance;
END;
$$;

-- Verify the function was created
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'loyalty_increment') THEN
        RAISE NOTICE 'SUCCESS: loyalty_increment function created/updated with correct table name';
    ELSE
        RAISE WARNING 'FAILED: loyalty_increment function not found';
    END IF;
END $$;
