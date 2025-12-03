-- Adds the optional distance column used by the API responses

ALTER TABLE public.machine
  ADD COLUMN IF NOT EXISTS distance DOUBLE PRECISION;
