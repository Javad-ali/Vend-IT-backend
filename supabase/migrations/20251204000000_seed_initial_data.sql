-- Initial Data Seed for Vend-IT
-- This migration adds essential seed data for the application
-- Run this after the main schema is set up

-- ============================================
-- SEED: Default Admin Account
-- ============================================
INSERT INTO admins (name, email, password, created_at, updated_at) 
VALUES (
  'admin',
  'admin@vendit.com',
  '$2y$12$Ximf/ONaci1HJBgMSMjAfu.5B9b6CL19A2/y9vMe4/qQnnVK6keUK', -- Default password, change in production!
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- ============================================
-- SEED: Static Content (if table has 'key' column)
-- ============================================
-- Skip if table doesn't have key column
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'static_content' AND column_name = 'key') THEN
    INSERT INTO static_content (key, title, content, created_at, updated_at) VALUES
    ('privacy_policy', 'Privacy Policy', 'Your privacy is important to us...', NOW(), NOW()),
    ('terms_conditions', 'Terms and Conditions', 'By using Vend-IT, you agree to...', NOW(), NOW()),
    ('about_us', 'About Vend-IT', 'Vend-IT is a modern vending machine platform...', NOW(), NOW()),
    ('faq', 'FAQ', 'Frequently Asked Questions...', NOW(), NOW())
    ON CONFLICT (key) DO NOTHING;
  END IF;
END $$;

-- ============================================
-- SEED: Default Categories
-- ============================================
INSERT INTO category (category_name, description, created_at, updated_at) VALUES
('All', 'All Products', NOW(), NOW()),
('Snacks', 'Snack items', NOW(), NOW()),
('Drinks', 'Beverages', NOW(), NOW()),
('Healthy', 'Healthy options', NOW(), NOW())
ON CONFLICT (category_name) DO NOTHING;

-- ============================================
-- NOTE: Products and Machines
-- ============================================
-- Products and machine data should be synced from the remote API
-- Run: POST /api/machines/sync
-- This will fetch and populate:
-- - All machines from the remote system
-- - All products with prices and images
-- - Machine slots configuration

-- If you need to manually insert products, use this format:
-- INSERT INTO product (
--   product_u_id, 
--   brand_name, 
--   description, 
--   category_id,
--   unit_price, 
--   for_sale,
--   created_at, 
--   updated_at
-- ) VALUES (
--   'UNIQUE_ID',
--   'Brand Name',
--   'Product Description',
--   (SELECT id FROM category WHERE category_name = 'Drinks'),
--   1.50,
--   true,
--   NOW(),
--   NOW()
-- ) ON CONFLICT (product_u_id) DO NOTHING;
