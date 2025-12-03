-- Convert boolean flag columns on users table to integer (0/1) to match mobile API contract

-- Convert is_notification from boolean to integer
ALTER TABLE public.users
  ALTER COLUMN is_notification DROP DEFAULT,
  ALTER COLUMN is_notification TYPE INTEGER USING (
    CASE
      WHEN is_notification IS TRUE THEN 1
      WHEN is_notification IS FALSE THEN 0
      ELSE NULL
    END
  ),
  ALTER COLUMN is_notification SET DEFAULT 0;

-- Convert is_online from boolean to integer (or add if doesn't exist)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'is_online'
  ) THEN
    EXECUTE $stmt$
      ALTER TABLE public.users
        ALTER COLUMN is_online DROP DEFAULT,
        ALTER COLUMN is_online TYPE INTEGER USING (
          CASE
            WHEN is_online IS TRUE THEN 1
            WHEN is_online IS FALSE THEN 0
            ELSE NULL
          END
        ),
        ALTER COLUMN is_online SET DEFAULT 0;
    $stmt$;
  ELSE
    EXECUTE 'ALTER TABLE public.users ADD COLUMN is_online INTEGER DEFAULT 0';
  END IF;
END
$$;

-- Convert is_otp_verify from boolean to integer
ALTER TABLE public.users
  ALTER COLUMN is_otp_verify DROP DEFAULT,
  ALTER COLUMN is_otp_verify TYPE INTEGER USING (
    CASE
      WHEN is_otp_verify IS TRUE THEN 1
      WHEN is_otp_verify IS FALSE THEN 0
      ELSE NULL
    END
  ),
  ALTER COLUMN is_otp_verify SET DEFAULT 0;
