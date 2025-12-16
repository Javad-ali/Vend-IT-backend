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
