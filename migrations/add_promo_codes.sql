-- Migration: Add Promo Codes System
-- Date: 2025-10-26
-- Description: Add promo_codes table and promo_code column to payment_transactions

-- Create promo_codes table
CREATE TABLE IF NOT EXISTS promo_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  
  -- Discount configuration
  discount_type VARCHAR(20) NOT NULL, -- 'percentage' or 'fixed'
  discount_value DECIMAL(10,2) NOT NULL,
  
  -- Usage restrictions
  min_purchase INTEGER DEFAULT 0,
  max_discount INTEGER, -- Maximum discount amount (only for percentage type)
  single_use BOOLEAN DEFAULT false, -- If true, can only be used once per user
  usage_limit INTEGER, -- Total usage limit across all users
  
  -- Validity period
  valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  valid_until TIMESTAMP,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id)
);

-- Add promo_code column to payment_transactions
ALTER TABLE payment_transactions 
ADD COLUMN IF NOT EXISTS promo_code VARCHAR(50);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(is_active, valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_promo_code ON payment_transactions(promo_code);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_promo_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER promo_codes_updated_at
BEFORE UPDATE ON promo_codes
FOR EACH ROW
EXECUTE FUNCTION update_promo_codes_updated_at();

-- Insert sample promo codes for testing
INSERT INTO promo_codes (code, description, discount_type, discount_value, min_purchase, valid_from, valid_until, is_active)
VALUES 
  ('WELCOME10', 'Diskon 10% untuk pengguna baru', 'percentage', 10.00, 50000, NOW(), NOW() + INTERVAL '30 days', true),
  ('SAVE20K', 'Diskon Rp 20.000 untuk pembelian minimum Rp 100.000', 'fixed', 20000.00, 100000, NOW(), NOW() + INTERVAL '30 days', true),
  ('MEGA50', 'Diskon 50% untuk semua pembelian (max Rp 100.000)', 'percentage', 50.00, 0, NOW(), NOW() + INTERVAL '7 days', true)
ON CONFLICT (code) DO NOTHING;

-- Add comment
COMMENT ON TABLE promo_codes IS 'Stores promotional discount codes for payment transactions';
COMMENT ON COLUMN promo_codes.discount_type IS 'Type of discount: percentage or fixed amount';
COMMENT ON COLUMN promo_codes.single_use IS 'If true, code can only be used once per user';
COMMENT ON COLUMN promo_codes.usage_limit IS 'Maximum number of times this code can be used across all users';

