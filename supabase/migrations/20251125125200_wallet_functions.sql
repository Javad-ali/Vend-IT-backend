-- Wallet increment/decrement functions (fixed ambiguous column references)

CREATE OR REPLACE FUNCTION wallet_increment(p_user_id UUID, p_amount NUMERIC)
RETURNS TABLE (balance NUMERIC)
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE wallet
    SET balance = COALESCE(wallet.balance, 0) + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO wallet (user_id, balance) VALUES (p_user_id, p_amount);
  END IF;

  RETURN QUERY SELECT wallet.balance FROM wallet WHERE user_id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION wallet_decrement(p_user_id UUID, p_amount NUMERIC)
RETURNS TABLE (balance NUMERIC)
LANGUAGE plpgsql
AS $$
DECLARE
  current_balance NUMERIC;
BEGIN
  SELECT wallet.balance INTO current_balance FROM wallet WHERE user_id = p_user_id FOR UPDATE;

  IF current_balance IS NULL OR current_balance < p_amount THEN
    RAISE EXCEPTION 'insufficient_wallet_balance';
  END IF;

  UPDATE wallet
    SET balance = wallet.balance - p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;

  RETURN QUERY SELECT wallet.balance FROM wallet WHERE user_id = p_user_id;
END;
$$;
