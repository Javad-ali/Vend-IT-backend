-- Fix machine_slots and products relationship for Supabase PostgREST
-- Date: 2025-12-15

-- Add foreign key from machine_slots.product_u_id to products.product_u_id
-- This enables Supabase relationship queries

-- First ensure products has a unique constraint on product_u_id
ALTER TABLE products ADD CONSTRAINT products_product_u_id_key UNIQUE (product_u_id);

-- Add foreign key constraint
ALTER TABLE machine_slots 
  ADD CONSTRAINT machine_slots_product_u_id_fkey 
  FOREIGN KEY (product_u_id) 
  REFERENCES products(product_u_id) 
  ON DELETE SET NULL;

-- Add unique constraint on machines.u_id if not exists
ALTER TABLE machines ADD CONSTRAINT machines_u_id_key UNIQUE (u_id);

-- Add unique constraint on products.product_u_id if not exists (may already exist)
-- This is needed for upsert operations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_product_u_id_key'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_product_u_id_key UNIQUE (product_u_id);
  END IF;
END $$;
