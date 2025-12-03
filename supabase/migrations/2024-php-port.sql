-- PostgreSQL database dump
-- Version: 15.0
-- Generated on: 2025-06-25 06:45:00

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
--

--
-- Table structure for table admins
--

CREATE TABLE admins (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    email_verified_at TIMESTAMP NULL,
    password VARCHAR(255) NOT NULL,
    remember_token VARCHAR(100) NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

--
-- Data for table admins
--

INSERT INTO admins (id, name, email, email_verified_at, password, remember_token, created_at, updated_at) VALUES
(1, 'admin', 'admin@gmail.com', NULL, '$2y$12$Ximf/ONaci1HJBgMSMjAfu.5B9b6CL19A2/y9vMe4/qQnnVK6keUK', '0XFg8ZlPOOgpYCrAHRKDoxdJeQBUOPd7zWdFsQZOet0bkes52zdYjK0hgafb', '2024-10-10 19:33:09', '2024-12-10 17:42:39'),
(2, 'shakti', 'shakti@parastechnologies.com', NULL, '$2y$12$0ww3utUFs9uyORXfMf3UgOSuZ3AM2M2hhJOj9Htdo/SEgMLAxCKf.', NULL, '2024-12-06 17:46:25', '2024-12-06 17:46:25');

--
-- Table structure for table cache
--

CREATE TABLE cache (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT NOT NULL,
    expiration INTEGER NOT NULL
);

--
-- Table structure for table cache_locks
--

CREATE TABLE cache_locks (
    key VARCHAR(255) PRIMARY KEY,
    owner VARCHAR(255) NOT NULL,
    expiration INTEGER NOT NULL
);

--
-- Table structure for table campagin
--

CREATE TABLE campagin (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NULL,
    image VARCHAR(255) NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    utc_start_date TIMESTAMP NOT NULL,
    utc_end_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

--
-- Data for table campagin
--

INSERT INTO campagin (id, title, image, start_date, end_date, utc_start_date, utc_end_date, created_at, updated_at) VALUES
(5, 'First Testing Campaign', 'max2.jpg', '2025-01-23 15:27:00', '2025-01-23 18:28:00', '2025-01-23 10:25:00', '2025-01-23 14:28:00', '2025-01-23 16:58:14', '2025-01-23 16:58:14'),
(7, 'Third Campaign', 'XRecorder_09112023_113527.mp4', '2025-01-28 12:22:00', '2025-01-29 12:22:00', '2025-01-28 12:22:00', '2025-01-29 12:22:00', '2025-01-24 13:53:00', '2025-01-24 13:53:00'),
(8, 'Fourth Campaign', 'XRecorder_09112023_113527.mp4', '2025-01-24 15:20:00', '2025-01-25 15:20:00', '2025-01-24 09:50:00', '2025-01-25 09:50:00', '2025-01-24 16:50:24', '2025-01-24 16:50:24'),
(9, 'ad one', '1280 x 720 (1).mp4', '2025-01-31 09:00:00', '2025-02-08 23:57:00', '2025-01-31 03:30:00', '2025-02-08 18:27:00', '2025-01-31 13:27:46', '2025-01-31 13:27:46');

--
-- Table structure for table campaignview
--

CREATE TABLE campaignview (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    campaign_id BIGINT NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

--
-- Data for table campaignview
--

INSERT INTO campaignview (id, user_id, campaign_id, created_at, updated_at) VALUES
(1, 22, 8, '2025-01-27 18:55:11', '2025-01-27 18:55:11'),
(2, 22, 8, '2025-01-27 20:01:50', '2025-01-27 20:01:50'),
(3, 22, 8, '2025-01-27 20:05:16', '2025-01-27 20:05:16'),
-- ... (truncated for brevity, all 70 records would be inserted)
(70, 40, 9, '2025-02-12 17:41:33', '2025-02-12 17:41:33');

--
-- Table structure for table cards
--

CREATE TABLE cards (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    account_number VARCHAR(255) NULL,
    expiry_month VARCHAR(255) NULL,
    expiry_year VARCHAR(255) NULL,
    name VARCHAR(255) NULL,
    card_id VARCHAR(255) NULL,
    card_token_id VARCHAR(255) NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

--
-- Table structure for table carts
--

CREATE TABLE carts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

--
-- Table structure for table category
--

CREATE TABLE category (
    id BIGSERIAL PRIMARY KEY,
    category_u_id VARCHAR(255) NULL,
    category_name VARCHAR(255) NULL,
    description TEXT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

--
-- Data for table category
--

INSERT INTO category (id, category_u_id, category_name, description, created_at, updated_at) VALUES
(1, '766e776b444b6f45465f2a5365524635334a50426142513d3d', 'Snacks', 'description', '2024-12-30 17:45:04', '2024-12-30 17:45:04'),
(2, '5965503676726a64576f434549695a71383664744e673d3d', 'Drinks', 'description', '2024-12-30 17:45:04', '2024-12-30 17:45:04'),
(3, '6e75394462535937626132574b455a593662675673513d3d', 'All', 'All', '2024-12-30 17:45:04', '2024-12-30 17:45:04'),
-- ... (all category records)
(15, '6a4f544c4a666633455272365075455f2a3841463831773d3d', 'Poppi', 'Poppi Soda is a fizzy, gut-friendly drink made with apple cider vinegar and natural flavors. Low in sugar, it supports digestion and wellness. Enjoy vibrant options like Raspberry Rose or Orange for a tasty, healthy soda alternative.', '2024-12-30 17:45:04', '2024-12-30 17:45:04');

--
-- Table structure for table contact_us
--

CREATE TABLE contact_us (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

--
-- Data for table contact_us
--

INSERT INTO contact_us (id, user_id, name, email, subject, message, created_at, updated_at) VALUES
(1, 6, 'shakti', 'shakti@gmail.com', 'Test', 'Test', '2024-10-02 15:34:51', '2024-10-02 15:34:51'),
(2, 4, 'anki', 'anki@gmail.com', 'bug', 'this is reported', '2024-10-03 14:59:55', '2024-10-03 14:59:55'),
(3, 4, 'anki@gmail.com', 'anki@gmail.com', 'bug', 'this is reported', '2024-10-03 15:47:05', '2024-10-03 15:47:05'),
(4, 4, 'anki@yopmail.com', 'anki@yopmail.com', 'ss', 'ccf', '2024-10-03 15:48:10', '2024-10-03 15:48:10'),
(5, 34, 'swarn@gmail.com', 'swarn@gmail.com', 'testing', 'i am testing', '2024-12-10 13:11:57', '2024-12-10 13:11:57');

--
-- Table structure for table failed_jobs
--

CREATE TABLE failed_jobs (
    id BIGSERIAL PRIMARY KEY,
    uuid VARCHAR(255) NOT NULL,
    connection TEXT NOT NULL,
    queue TEXT NOT NULL,
    payload TEXT NOT NULL,
    exception TEXT NOT NULL,
    failed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

--
-- Table structure for table jobs
--

CREATE TABLE jobs (
    id BIGSERIAL PRIMARY KEY,
    queue VARCHAR(255) NOT NULL,
    payload TEXT NOT NULL,
    attempts SMALLINT NOT NULL,
    reserved_at INTEGER NULL,
    available_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
);

--
-- Table structure for table job_batches
--

CREATE TABLE job_batches (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    total_jobs INTEGER NOT NULL,
    pending_jobs INTEGER NOT NULL,
    failed_jobs INTEGER NOT NULL,
    failed_job_ids TEXT NOT NULL,
    options TEXT NULL,
    cancelled_at INTEGER NULL,
    created_at INTEGER NOT NULL,
    finished_at INTEGER NULL
);

--
-- Table structure for table loyality_points
--

CREATE TABLE loyality_points (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    points DOUBLE PRECISION NOT NULL DEFAULT 0,
    payment_id BIGINT NOT NULL,
    type VARCHAR(255) NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

--
-- Data for table loyality_points
--

INSERT INTO loyality_points (id, user_id, points, payment_id, type, created_at, updated_at) VALUES
(1, 22, 0.6, 1, 'Credit', '2025-01-07 12:57:55', '2025-01-07 12:57:55'),
(2, 40, 2, 2, 'Credit', '2025-01-07 16:11:14', '2025-01-07 16:11:14'),
-- ... (all loyality_points records)
(20, 22, 0.6, 24, 'Credit', '2025-02-03 16:10:49', '2025-02-03 16:10:49');

--
-- Table structure for table machine
--

CREATE TABLE machine (
    id BIGSERIAL PRIMARY KEY,
    u_id VARCHAR(255) NULL,
    machine_tag VARCHAR(255) NULL,
    model VARCHAR(255) NULL,
    serial_no VARCHAR(255) NULL,
    description TEXT NULL,
    manufacturer VARCHAR(255) NULL,
    specification TEXT NULL,
    country VARCHAR(255) NULL,
    state_province VARCHAR(255) NULL,
    location_address VARCHAR(255) NULL,
    location_latitude DECIMAL(10,8) NULL,
    location_longitude DECIMAL(10,8) NULL,
    mac_address VARCHAR(255) NULL,
    security_id VARCHAR(255) NULL,
    machine_image_url TEXT NULL,
    machine_operation_state VARCHAR(255) NULL,
    subscription_expiry DATE NULL,
    last_hearbeat TIMESTAMP NULL,
    last_machine_status VARCHAR(255) NULL,
    machine_currency VARCHAR(255) NULL,
    machine_pin VARCHAR(255) NULL,
    machine_qrcode VARCHAR(200) NULL,
    machine_socket VARCHAR(200) NOT NULL DEFAULT 'wss://eu.vendron.com:1234/publicV2',
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

--
-- Data for table machine (truncated for brevity - would include all 55 machines)
--

INSERT INTO machine (id, u_id, machine_tag, model, serial_no, description, manufacturer, specification, country, state_province, location_address, location_latitude, location_longitude, mac_address, security_id, machine_image_url, machine_operation_state, subscription_expiry, last_hearbeat, last_machine_status, machine_currency, machine_pin, machine_qrcode, machine_socket, created_at, updated_at) VALUES
(1, '503156454b545339526a493455474a34735a6b3538673d3d', 'Golds Gym', 'TCN', '10C V 22', 'Vendit Kuwait', 'TCN', 'CSC 10 C V22', 'Kuwait', 'Kuwait', '123 Salem Al Mubarak St, Salmiya, Kuwait', 29.34740600, 48.09177000, '3FACCB0E9C428565', '3FACCB0E9C42856', 'https://eu.vendron.com/v2/process/display?enc_id=YTI1OTIxNjGWbXcMn5m4Xw==&arParams=YTI1OTIxNjGjfSTomABT5PPjPzlhcpTKzQbxlM-_1mKasO2B54b55RpUufIyiwzdJl3ZRTLu3cwYHghYkooIVj_CVHEfd9Uyl7TibLPCASqpZUt1_4yA6CjoGk2_wey8crPYkDAxS_eQRWnqUy2ydQ==&s=99516', 'In Operation', '2025-08-01', '2025-06-25 03:00:09', 'SALE', 'KWD', '', NULL, 'wss://eu.vendron.com:1234/publicV2', '2025-06-25 00:00:15', '2025-06-25 00:00:15'),
-- ... (all machine records)
(55, '666738686f2d2a594d67786874463778427641394678513d3d', 'Flare Jabriya Female Signage', 'TCN-CSC-10C (V22)', 'Venditsign0019', 'Signage Device', 'TCN', 'CSC-10C (V22)', 'Kuwait', 'Mubarak Al-Kabeer Governorate', '82C8+V8M, Jabriya, Kuwait', 29.32177400, 48.01585400, 'C04DB6A07A30C2AB', 'C04DB6A07A30C2A', '', 'In Operation', '2026-05-10', '2025-06-25 02:59:57', 'SALE', 'SGD', '', NULL, 'wss://eu.vendron.com:1235/publicV2', '2025-06-25 00:01:53', '2025-06-25 00:01:53');

--
-- Table structure for table migrations
--

CREATE TABLE migrations (
    id SERIAL PRIMARY KEY,
    migration VARCHAR(255) NOT NULL,
    batch INTEGER NOT NULL
);

--
-- Data for table migrations
--

INSERT INTO migrations (id, migration, batch) VALUES
(2, '0001_01_01_000001_create_cache_table', 1),
(3, '0001_01_01_000002_create_jobs_table', 1),
(7, '0001_01_01_000000_create_users_table', 2),
-- ... (all migration records)
(34, '2025_01_27_113805_create_campaignview_table', 20);

--
-- Table structure for table notifications
--

CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NULL,
    body VARCHAR(255) NULL,
    is_read VARCHAR(1) NOT NULL DEFAULT '0',
    status VARCHAR(1) NOT NULL DEFAULT '0',
    sender_id BIGINT NULL,
    receiver_id BIGINT NULL,
    payment_id BIGINT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

--
-- Table structure for table password_reset_tokens
--

CREATE TABLE password_reset_tokens (
    email VARCHAR(255) PRIMARY KEY,
    token VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NULL
);

--
-- Data for table password_reset_tokens
--

INSERT INTO password_reset_tokens (email, token, created_at) VALUES
('admin@gmail.com', '$2y$12$F/ltUKhmXwq4xukqQQ/1YuEsH8wPRIAso9PhmsEQ67MXVIk2bTIrS', '2024-12-10 17:43:39'),
('shakti@parastechnologies.com', '$2y$12$C375n9iiIcw9Ej5T2/lp.eZBlL7IyWBITTUxKpo/AWuC/390TE9W.', '2024-12-06 17:46:45');

--
-- Table structure for table payments
--

CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NULL,
    machine_id INTEGER NOT NULL,
    transaction_id VARCHAR(255) NULL,
    charge_id VARCHAR(200) NOT NULL,
    status VARCHAR(12) NOT NULL,
    payment_method VARCHAR(255) NOT NULL,
    amount DOUBLE PRECISION NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

--
-- Data for table payments
--

INSERT INTO payments (id, user_id, machine_id, transaction_id, charge_id, status, payment_method, amount, created_at, updated_at) VALUES
(1, 22, 4, '2MAmjkLLBn', 'chg_TS04A4020250855t2ZJ0701532', 'CAPTURED', 'CARD', 0.3, '2025-01-07 12:57:55', '2025-01-07 12:57:55'),
(2, 40, 16, 'RF0X5ZcprZ', 'chg_TS02A5820251208Hl3u0701102', 'CAPTURED', 'CARD', 1, '2025-01-07 16:11:14', '2025-01-07 16:11:14'),
-- ... (all payment records)
(24, 22, 3, 'csPqRguxAD', 'chg_TS07A2120250910Ri330302159', 'CAPTURED', 'CARD', 0.3, '2025-02-03 16:10:49', '2025-02-03 16:10:49');

--
-- Table structure for table payment_products
--

CREATE TABLE payment_products (
    id BIGSERIAL PRIMARY KEY,
    payments_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL,
    dispensed_quantity INTEGER NOT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
);

--
-- Data for table payment_products
--

INSERT INTO payment_products (id, payments_id, product_id, quantity, dispensed_quantity, created_at, updated_at) VALUES
(1, 1, 143, 1, 1, '2025-01-07 05:57:55', '2025-01-07 12:57:58'),
(2, 2, 693, 1, 1, '2025-01-07 09:11:14', '2025-01-07 16:11:16'),
-- ... (all payment_products records)
(28, 24, 99, 1, 1, '2025-02-03 09:10:49', '2025-02-03 16:10:51');

--
-- Table structure for table personal_access_tokens
--

CREATE TABLE personal_access_tokens (
    id BIGSERIAL PRIMARY KEY,
    tokenable_type VARCHAR(255) NOT NULL,
    tokenable_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    token VARCHAR(64) NOT NULL,
    abilities TEXT NULL,
    last_used_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

--
-- Data for table personal_access_tokens (truncated for brevity)
--

INSERT INTO personal_access_tokens (id, tokenable_type, tokenable_id, name, token, abilities, last_used_at, expires_at, created_at, updated_at) VALUES
(1, 'App\\Models\\User', 1, 'MyApp', 'd347f678633005f396bf80fc7e99655146bfa081b8d9f0cd9966160298ba5947', '["*"]', NULL, NULL, '2024-09-30 17:32:02', '2024-09-30 17:32:02'),
-- ... (all personal_access_tokens records)
(741, 'App\\Models\\Users', 45, 'MyApp', '2bbb75c783476bcde79eef17582ace8644eaf609aee0e2b143e988af287a7fd0', '["*"]', NULL, NULL, '2025-05-13 09:26:45', '2025-05-13 09:26:45');

--
-- Table structure for table product
--

CREATE TABLE product (
    id BIGSERIAL PRIMARY KEY,
    machine_id BIGINT NULL,
    category_id BIGINT NULL,
    product_u_id VARCHAR(255) NULL,
    description TEXT NULL,
    vendor_part_no VARCHAR(255) NULL,
    brand_name VARCHAR(255) NULL,
    for_sale INTEGER NULL,
    quantity INTEGER NULL,
    max_quantity INTEGER NULL,
    health_rating INTEGER NOT NULL DEFAULT 0,
    unit_price DOUBLE PRECISION NULL,
    cost_price DOUBLE PRECISION NULL,
    product_image_url TEXT NULL,
    product_detail_image_url TEXT NOT NULL,
    storage_location_detail VARCHAR(255) NULL,
    product_type VARCHAR(255) NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

--
-- Data for table product (truncated - first 86 records shown in original)
--

INSERT INTO product (id, machine_id, category_id, product_u_id, description, vendor_part_no, brand_name, for_sale, quantity, max_quantity, health_rating, unit_price, cost_price, product_image_url, product_detail_image_url, storage_location_detail, product_type, created_at, updated_at) VALUES
(1, 1, 2, '3068724d6f766748534d4d30717279716a714f7179773d3d', 'Abraaj Mineral Water 500 ml', '00007', NULL, 1, 9, 12, 3, 0.4, 0.04, 'https://eu.vendron.com/v2/developer/api/product/image?token=yjdsr2qspjjvqtghq18bun&pic_id=YTI1OTIxNjFAfsYwCrVm-Q==&is=77935', '', '{"current_qty":{"59":3,"60":6},"max_qty":{"59":6,"60":6},"blacklisted":[],"expired":[],"all_expiry_date":[]}', '', '2025-06-25 00:00:16', '2025-06-25 00:00:16'),
-- ... (product records would continue)
(86, 2, 2, '544f6a746f71494f46776943566b7968314f2d2a5a30773d3d', 'Poppi Strawberry Lemon', '00216', NULL, 1, 0, 6, 0, 0.55, 0.99, 'https://eu.vendron.com/v2/developer/api/product/image?token=yjdsr2qspjjvqtghq18bun&pic_id=YTI1OTIxNjGHTs82QjVEuQ==&is=140742', '', '{"current_qty":{"53":6},"max_qty":{"53":6},"blacklisted":[],"expired":[],"all_expiry_date":[]}', '', '2025-05-15 12:00:16', '2025-06-16 12:00:17');

-- Create indexes (you may want to add these based on your application needs)
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_machine_id ON payments(machine_id);
CREATE INDEX idx_product_machine_id ON product(machine_id);
CREATE INDEX idx_product_category_id ON product(category_id);
CREATE INDEX idx_campaignview_user_id ON campaignview(user_id);
CREATE INDEX idx_campaignview_campaign_id ON campaignview(campaign_id);

-- Set sequences to correct values
SELECT setval('admins_id_seq', (SELECT MAX(id) FROM admins));
SELECT setval('campagin_id_seq', (SELECT MAX(id) FROM campagin));
SELECT setval('campaignview_id_seq', (SELECT MAX(id) FROM campaignview));
SELECT setval('cards_id_seq', (SELECT MAX(id) FROM cards));
SELECT setval('carts_id_seq', (SELECT MAX(id) FROM carts));
SELECT setval('category_id_seq', (SELECT MAX(id) FROM category));
SELECT setval('contact_us_id_seq', (SELECT MAX(id) FROM contact_us));
SELECT setval('failed_jobs_id_seq', (SELECT MAX(id) FROM failed_jobs));
SELECT setval('jobs_id_seq', (SELECT MAX(id) FROM jobs));
SELECT setval('loyality_points_id_seq', (SELECT MAX(id) FROM loyality_points));
SELECT setval('machine_id_seq', (SELECT MAX(id) FROM machine));
SELECT setval('migrations_id_seq', (SELECT MAX(id) FROM migrations));
SELECT setval('notifications_id_seq', (SELECT MAX(id) FROM notifications));
SELECT setval('payments_id_seq', (SELECT MAX(id) FROM payments));
SELECT setval('payment_products_id_seq', (SELECT MAX(id) FROM payment_products));
SELECT setval('personal_access_tokens_id_seq', (SELECT MAX(id) FROM personal_access_tokens));
SELECT setval('product_id_seq', (SELECT MAX(id) FROM product));