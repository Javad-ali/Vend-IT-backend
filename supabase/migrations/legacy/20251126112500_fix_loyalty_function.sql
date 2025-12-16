-- Resolve ambiguous column reference in loyalty_increment function

CREATE OR REPLACE FUNCTION loyalty_increment(p_user_id UUID, p_points NUMERIC)
RETURNS TABLE (balance NUMERIC)
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE user_loyality_points
    SET points = COALESCE(user_loyality_points.points, 0) + p_points,
        updated_at = NOW()
    WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO user_loyality_points (user_id, points)
    VALUES (p_user_id, p_points);
  END IF;

  RETURN QUERY SELECT user_loyality_points.points FROM user_loyality_points WHERE user_id = p_user_id;
END;
$$;
