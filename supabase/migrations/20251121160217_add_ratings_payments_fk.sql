-- Link ratings.order_id with payments.id so PostgREST can expose the relationship
ALTER TABLE public.ratings
  ADD CONSTRAINT IF NOT EXISTS ratings_order_id_fkey
  FOREIGN KEY (order_id) REFERENCES public.payments(id)
  ON DELETE CASCADE;
