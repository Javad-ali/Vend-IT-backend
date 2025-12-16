-- Create admins table
CREATE TABLE IF NOT EXISTS public.admins (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default admin
INSERT INTO public.admins (name, email, password)
VALUES (
  'Super Admin',
  'admin@vendit.app',
  '$2a$12$wIzYz1fGMnezpvl5JKvmk.gw8aYtz9Bn2CKjhBR0i68M0QOFrFQx2'
)
ON CONFLICT (email) DO NOTHING;
