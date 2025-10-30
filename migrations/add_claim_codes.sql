-- Migration: Add Claim Codes Feature
-- Date: 2025-10-27
-- Description: Add code_type and credit_amount to promo_codes table for claim codes

-- Add code_type column to differentiate between promo and claim codes
ALTER TABLE promo_codes 
ADD COLUMN IF NOT EXISTS code_type VARCHAR(20) DEFAULT 'promo' CHECK (code_type IN ('promo', 'claim'));

-- Add credit_amount for claim codes
ALTER TABLE promo_codes 
ADD COLUMN IF NOT EXISTS credit_amount INTEGER DEFAULT 0;

-- Update existing records to be 'promo' type
UPDATE promo_codes SET code_type = 'promo' WHERE code_type IS NULL;

-- Make discount_type nullable (not required for claim codes)
ALTER TABLE promo_codes 
ALTER COLUMN discount_type DROP NOT NULL;

-- Make discount_value nullable (not required for claim codes)
ALTER TABLE promo_codes 
ALTER COLUMN discount_value DROP NOT NULL;

-- Add index for code_type
CREATE INDEX IF NOT EXISTS idx_promo_codes_type ON promo_codes(code_type);

-- Add comments
COMMENT ON COLUMN promo_codes.code_type IS 'Type of code: promo (discount) or claim (free credits)';
COMMENT ON COLUMN promo_codes.credit_amount IS 'Amount of credits to give for claim codes';

-- Insert sample claim codes for testing
INSERT INTO promo_codes (
  code, 
  description, 
  code_type,
  credit_amount,
  single_use,
  usage_limit,
  valid_from, 
  valid_until, 
  is_active
)
VALUES 
  ('FREECREDIT100', 'Dapatkan 100 credit gratis', 'claim', 100, true, 100, NOW(), NOW() + INTERVAL '30 days', true),
  ('BONUS50', 'Bonus 50 credit untuk user setia', 'claim', 50, false, 500, NOW(), NOW() + INTERVAL '60 days', true)
ON CONFLICT (code) DO NOTHING;


