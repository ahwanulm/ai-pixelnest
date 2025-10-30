-- ============================================
-- Add promo_code column to payment_transactions
-- Quick fix for promo code feature
-- ============================================

-- Add promo_code column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'payment_transactions' 
        AND column_name = 'promo_code'
    ) THEN
        ALTER TABLE payment_transactions 
        ADD COLUMN promo_code VARCHAR(50);
        
        RAISE NOTICE 'Column promo_code added successfully';
    ELSE
        RAISE NOTICE 'Column promo_code already exists';
    END IF;
END $$;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_payment_transactions_promo_code 
ON payment_transactions(promo_code);

-- Verify the column was added
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'payment_transactions' 
    AND column_name = 'promo_code';

-- Show table structure
\d payment_transactions

