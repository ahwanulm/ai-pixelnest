-- Add promo_code column to payment_transactions
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS promo_code VARCHAR(50);

-- Add index
CREATE INDEX IF NOT EXISTS idx_payment_transactions_promo_code ON payment_transactions(promo_code);

-- Verify
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'payment_transactions' AND column_name = 'promo_code';
