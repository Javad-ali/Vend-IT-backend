-- ============================================
-- Vend-IT Supabase Database Schema
-- Migration from Laravel to Supabase PostgreSQL
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS for location features
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password VARCHAR(255) NOT NULL,
    user_profile TEXT,
    date_of_birth DATE,
    gender VARCHAR(20),
    is_verified BOOLEAN DEFAULT FALSE,
    otp VARCHAR(6),
    otp_expires_at TIMESTAMP,
    fcm_token TEXT,
    device_type VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 2. ADMINS TABLE
-- ============================================
CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 3. CATEGORIES TABLE
-- ============================================
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_u_id VARCHAR(255) UNIQUE,
    category_name VARCHAR(255) NOT NULL,
    description TEXT,
    icon_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 4. MACHINES TABLE
-- ============================================
CREATE TABLE machines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    u_id VARCHAR(255) UNIQUE,
    machine_tag VARCHAR(255),
    model VARCHAR(255),
    serial_no VARCHAR(255),
    description TEXT,
    manufacturer VARCHAR(255),
    specification TEXT,
    country VARCHAR(100),
    state_province VARCHAR(100),
    location_address TEXT,
    location_latitude DECIMAL(10, 8),
    location_longitude DECIMAL(11, 8),
    location_point GEOGRAPHY(POINT, 4326),
    mac_address VARCHAR(50),
    security_id VARCHAR(255),
    machine_image_url TEXT,
    machine_operation_state VARCHAR(50),
    subscription_expiry DATE,
    last_heartbeat TIMESTAMP,
    last_machine_status VARCHAR(50),
    machine_currency VARCHAR(10),
    machine_pin VARCHAR(20),
    machine_qrcode TEXT,
    machine_socket TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create spatial index for location
CREATE INDEX idx_machines_location ON machines USING GIST (location_point);

-- ============================================
-- 5. PRODUCTS TABLE
-- ============================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    machine_id UUID REFERENCES machines(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    product_u_id VARCHAR(255),
    description TEXT,
    vendor_part_no VARCHAR(255),
    brand_name VARCHAR(255),
    for_sale BOOLEAN DEFAULT TRUE,
    quantity INTEGER DEFAULT 0,
    max_quantity INTEGER,
    health_rating INTEGER,
    unit_price DECIMAL(10, 2),
    cost_price DECIMAL(10, 2),
    product_image_url TEXT,
    product_detail_image_url TEXT,
    product_type VARCHAR(100),
    storage_location_detail JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(machine_id, product_u_id)
);

-- ============================================
-- 6. CARTS TABLE
-- ============================================
CREATE TABLE carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    machine_id UUID REFERENCES machines(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10, 2),
    total_price DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 7. CARDS TABLE
-- ============================================
CREATE TABLE cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    stripe_card_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    card_holder_name VARCHAR(255),
    card_number_last4 VARCHAR(4),
    card_brand VARCHAR(50),
    exp_month VARCHAR(2),
    exp_year VARCHAR(4),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 8. WALLETS TABLE
-- ============================================
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    balance DECIMAL(10, 2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'USD',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 9. PAYMENTS TABLE
-- ============================================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    machine_id UUID REFERENCES machines(id) ON DELETE SET NULL,
    transaction_id VARCHAR(255) UNIQUE,
    stripe_payment_intent_id VARCHAR(255),
    stripe_charge_id VARCHAR(255),
    payment_type VARCHAR(50),
    payment_method VARCHAR(50),
    amount DECIMAL(10, 2),
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(50),
    payment_date TIMESTAMP DEFAULT NOW(),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 10. PAYMENT_PRODUCTS TABLE
-- ============================================
CREATE TABLE payment_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    quantity INTEGER,
    unit_price DECIMAL(10, 2),
    total_price DECIMAL(10, 2),
    dispensed_quantity INTEGER DEFAULT 0,
    dispense_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 11. LOYALTY_POINTS TABLE
-- ============================================
CREATE TABLE loyalty_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    point_name VARCHAR(255),
    point_value DECIMAL(10, 2),
    minimum_purchase_amount DECIMAL(10, 2),
    points_earned INTEGER,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    valid_from DATE,
    valid_until DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 12. USER_LOYALTY_POINTS TABLE
-- ============================================
CREATE TABLE user_loyalty_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    loyalty_point_id UUID REFERENCES loyalty_points(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    points_earned INTEGER DEFAULT 0,
    points_redeemed INTEGER DEFAULT 0,
    points_balance INTEGER DEFAULT 0,
    transaction_type VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 13. CAMPAIGNS TABLE
-- ============================================
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    video_url TEXT,
    start_date DATE,
    end_date DATE,
    target_audience VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    view_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 14. CAMPAIGN_VIEWS TABLE
-- ============================================
CREATE TABLE campaign_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP DEFAULT NOW(),
    duration_seconds INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 15. RATINGS TABLE
-- ============================================
CREATE TABLE ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    machine_id UUID REFERENCES machines(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    is_approved BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 16. CONTACT_US TABLE
-- ============================================
CREATE TABLE contact_us (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    replied_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 17. STATIC_CONTENT TABLE
-- ============================================
CREATE TABLE static_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255),
    content TEXT,
    type VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 18. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES admins(id) ON DELETE SET NULL,
    receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    message TEXT,
    type VARCHAR(50),
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_is_verified ON users(is_verified);
CREATE INDEX idx_machines_u_id ON machines(u_id);
CREATE INDEX idx_machines_is_active ON machines(is_active);
CREATE INDEX idx_products_machine_id ON products(machine_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_product_u_id ON products(product_u_id);
CREATE INDEX idx_carts_user_id ON carts(user_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_notifications_receiver_id ON notifications(receiver_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_ratings_product_id ON ratings(product_id);
CREATE INDEX idx_ratings_user_id ON ratings(user_id);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_machines_updated_at BEFORE UPDATE ON machines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_carts_updated_at BEFORE UPDATE ON carts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cards_updated_at BEFORE UPDATE ON cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_products_updated_at BEFORE UPDATE ON payment_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_loyalty_points_updated_at BEFORE UPDATE ON loyalty_points FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_loyalty_points_updated_at BEFORE UPDATE ON user_loyalty_points FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ratings_updated_at BEFORE UPDATE ON ratings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contact_us_updated_at BEFORE UPDATE ON contact_us FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_static_content_updated_at BEFORE UPDATE ON static_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TRIGGER FOR LOCATION POINT SYNC
-- ============================================
CREATE OR REPLACE FUNCTION sync_location_point()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.location_latitude IS NOT NULL AND NEW.location_longitude IS NOT NULL THEN
        NEW.location_point := ST_SetSRID(ST_MakePoint(NEW.location_longitude, NEW.location_latitude), 4326);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_machines_location_point 
BEFORE INSERT OR UPDATE ON machines 
FOR EACH ROW EXECUTE FUNCTION sync_location_point();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only read/update their own data
CREATE POLICY users_select_policy ON users FOR SELECT USING (id = auth.uid()::uuid);
CREATE POLICY users_update_policy ON users FOR UPDATE USING (id = auth.uid()::uuid);

-- Users can only access their own wallet
CREATE POLICY wallets_policy ON wallets FOR ALL USING (user_id = auth.uid()::uuid);

-- Users can only access their own cards
CREATE POLICY cards_policy ON cards FOR ALL USING (user_id = auth.uid()::uuid);

-- Users can only access their own payments
CREATE POLICY payments_policy ON payments FOR SELECT USING (user_id = auth.uid()::uuid);

-- Users can only access their own notifications
CREATE POLICY notifications_policy ON notifications FOR SELECT USING (receiver_id = auth.uid()::uuid);

-- ============================================
-- FUNCTIONS FOR BUSINESS LOGIC
-- ============================================

-- Function to calculate distance between two points (Haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 DECIMAL, lon1 DECIMAL, lat2 DECIMAL, lon2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    R DECIMAL := 6371; -- Earth radius in kilometers
    dLat DECIMAL;
    dLon DECIMAL;
    a DECIMAL;
    c DECIMAL;
BEGIN
    dLat := radians(lat2 - lat1);
    dLon := radians(lon2 - lon1);
    
    a := sin(dLat/2) * sin(dLat/2) + 
         cos(radians(lat1)) * cos(radians(lat2)) * 
         sin(dLon/2) * sin(dLon/2);
    
    c := 2 * atan2(sqrt(a), sqrt(1-a));
    
    RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get nearby machines
CREATE OR REPLACE FUNCTION get_nearby_machines(
    user_lat DECIMAL,
    user_lon DECIMAL,
    radius_km DECIMAL DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    machine_tag VARCHAR,
    location_address TEXT,
    distance DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.machine_tag,
        m.location_address,
        calculate_distance(user_lat, user_lon, m.location_latitude, m.location_longitude) as distance
    FROM machines m
    WHERE m.is_active = TRUE
        AND m.location_latitude IS NOT NULL
        AND m.location_longitude IS NOT NULL
        AND calculate_distance(user_lat, user_lon, m.location_latitude, m.location_longitude) <= radius_km
    ORDER BY distance;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INITIAL DATA SEEDS
-- ============================================

-- Insert default static content
INSERT INTO static_content (key, title, content, type) VALUES
('privacy_policy', 'Privacy Policy', 'Your privacy policy content here...', 'legal'),
('terms_conditions', 'Terms and Conditions', 'Your terms and conditions content here...', 'legal'),
('about_us', 'About Us', 'About Vend-IT...', 'info'),
('faq', 'Frequently Asked Questions', '{}', 'info');

-- Insert default loyalty point scheme
INSERT INTO loyalty_points (point_name, point_value, minimum_purchase_amount, points_earned, description, valid_from, valid_until) VALUES
('Welcome Bonus', 10.00, 0.00, 100, 'Welcome bonus for new users', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year'),
('Regular Purchase', 1.00, 10.00, 10, 'Earn 10 points for every $10 spent', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year');

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- View for product inventory with category info
CREATE VIEW product_inventory AS
SELECT 
    p.id,
    p.product_u_id,
    p.description,
    p.brand_name,
    p.quantity,
    p.unit_price,
    p.product_image_url,
    c.category_name,
    m.machine_tag,
    m.location_address
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN machines m ON p.machine_id = m.id
WHERE p.is_active = TRUE;

-- View for user order history
CREATE VIEW user_order_history AS
SELECT 
    p.id as payment_id,
    p.user_id,
    p.transaction_id,
    p.amount,
    p.status,
    p.payment_date,
    pp.product_id,
    pp.quantity,
    pp.unit_price,
    pp.dispense_status,
    pr.description as product_name,
    m.machine_tag
FROM payments p
LEFT JOIN payment_products pp ON p.id = pp.payment_id
LEFT JOIN products pr ON pp.product_id = pr.id
LEFT JOIN machines m ON p.machine_id = m.id
ORDER BY p.payment_date DESC;

-- ============================================
-- STORAGE BUCKETS (Create in Supabase Dashboard or via API)
-- ============================================
-- 1. users - for user profile pictures
-- 2. products - for product images
-- 3. machines - for machine images
-- 4. campaigns - for campaign videos/images
-- 5. qrcodes - for machine QR codes

COMMENT ON DATABASE postgres IS 'Vend-IT Vending Machine Management System';
