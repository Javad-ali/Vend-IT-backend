-- Create machine_slots table to link products to machine slots
CREATE TABLE IF NOT EXISTS machine_slots (
    id BIGSERIAL PRIMARY KEY,
    machine_u_id VARCHAR(255) NOT NULL,
    slot_number INTEGER NOT NULL,
    product_u_id VARCHAR(255),
    quantity INTEGER DEFAULT 0,
    max_quantity INTEGER DEFAULT 0,
    price DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(machine_u_id, slot_number)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_machine_slots_machine_u_id ON machine_slots(machine_u_id);
CREATE INDEX IF NOT EXISTS idx_machine_slots_product_u_id ON machine_slots(product_u_id);

-- Migrate existing product data to machine_slots (if product table has data)
INSERT INTO machine_slots (machine_u_id, slot_number, product_u_id, quantity, max_quantity, price)
SELECT 
    m.u_id as machine_u_id,
    ROW_NUMBER() OVER (PARTITION BY p.machine_id ORDER BY p.id) as slot_number,
    p.product_u_id,
    p.quantity,
    p.max_quantity,
    p.unit_price as price
FROM product p
JOIN machine m ON p.machine_id = m.id
WHERE p.product_u_id IS NOT NULL
ON CONFLICT (machine_u_id, slot_number) DO NOTHING;

