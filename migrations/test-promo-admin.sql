-- ============================================
-- TEST ADMIN PROMO CODE CREATION
-- ============================================

-- 1. Verify table structure has correct columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'promo_codes'
ORDER BY ordinal_position;

-- Expected columns:
-- id, code, description, discount_type, discount_value,
-- min_purchase, single_use, usage_limit,
-- uses_count, is_active, valid_from, valid_until,
-- created_at, updated_at

-- 2. Clear existing test data (optional)
-- DELETE FROM promo_codes WHERE code IN ('WELCOME50', 'SAVE20K', 'NEWUSER');

-- 3. Insert test promo codes
INSERT INTO promo_codes 
(code, description, discount_type, discount_value, min_purchase, single_use, usage_limit, is_active, valid_from, valid_until)
VALUES 
-- Test 1: Percentage discount with min purchase and single use
('WELCOME50', 'Welcome bonus 50% off', 'percentage', 50, 100000, true, 100, true, NOW(), NOW() + INTERVAL '30 days'),

-- Test 2: Fixed discount with no min purchase, multiple use allowed
('SAVE20K', 'Hemat Rp 20.000', 'fixed', 20000, 0, false, NULL, true, NOW(), NOW() + INTERVAL '60 days'),

-- Test 3: Percentage discount with min purchase and limited uses
('NEWUSER', 'New user 30% discount', 'percentage', 30, 50000, true, 50, true, NOW(), NOW() + INTERVAL '90 days'),

-- Test 4: Fixed discount with min purchase
('BIGSPENDER', 'Big spender bonus Rp 100.000', 'fixed', 100000, 500000, false, 20, true, NOW(), NOW() + INTERVAL '60 days'),

-- Test 5: Small discount no restrictions
('SMALL10', 'Small 10% discount', 'percentage', 10, 0, false, NULL, true, NOW(), NOW() + INTERVAL '180 days')

ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  discount_type = EXCLUDED.discount_type,
  discount_value = EXCLUDED.discount_value,
  min_purchase = EXCLUDED.min_purchase,
  single_use = EXCLUDED.single_use,
  usage_limit = EXCLUDED.usage_limit,
  is_active = EXCLUDED.is_active,
  valid_from = EXCLUDED.valid_from,
  valid_until = EXCLUDED.valid_until,
  updated_at = NOW();

-- 4. Verify inserted data
SELECT 
  code,
  description,
  discount_type,
  discount_value,
  min_purchase,
  single_use,
  usage_limit,
  uses_count,
  is_active,
  valid_from::date as valid_from,
  valid_until::date as valid_until
FROM promo_codes
ORDER BY created_at DESC;

-- 5. Test queries that the app will use

-- Check if promo exists and is active
SELECT * FROM promo_codes 
WHERE code = 'WELCOME50' 
  AND is_active = true 
  AND valid_from <= NOW() 
  AND valid_until >= NOW();

-- Check minimum purchase validation (100k purchase, needs 100k min)
SELECT 
  code,
  min_purchase,
  CASE 
    WHEN 100000 >= min_purchase THEN 'VALID'
    ELSE 'MIN PURCHASE NOT MET'
  END as validation
FROM promo_codes 
WHERE code = 'WELCOME50';

-- Check usage limit
SELECT 
  code,
  uses_count,
  usage_limit,
  CASE 
    WHEN usage_limit IS NULL THEN 'UNLIMITED'
    WHEN uses_count < usage_limit THEN 'AVAILABLE'
    ELSE 'LIMIT REACHED'
  END as status
FROM promo_codes 
WHERE code = 'WELCOME50';

-- 6. Expected results for testing:

-- WELCOME50:
-- - 50% discount
-- - Min purchase: Rp 100.000
-- - Single use only
-- - Limit: 100 uses
-- - Should work for: 200 credits (Rp 420.000) -> Final: Rp 210.000
-- - Should fail for: 50 credits (Rp 105.000 but if < 100k)

-- SAVE20K:
-- - Rp 20.000 discount
-- - No min purchase
-- - Multiple use allowed
-- - Unlimited uses
-- - Should work for: any amount

-- NEWUSER:
-- - 30% discount
-- - Min purchase: Rp 50.000
-- - Single use only
-- - Limit: 50 uses

-- BIGSPENDER:
-- - Rp 100.000 discount
-- - Min purchase: Rp 500.000
-- - Multiple use allowed
-- - Limit: 20 uses
-- - Should fail for: < Rp 500.000

-- SMALL10:
-- - 10% discount
-- - No restrictions
-- - Multiple use allowed
-- - Unlimited uses

-- 7. Check if payment_transactions has promo_code column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'payment_transactions' AND column_name = 'promo_code';

-- Should return: promo_code | character varying

-- 8. Test applying discount calculation (PostgreSQL)
WITH test_purchase AS (
  SELECT 
    'WELCOME50' as promo_code,
    420000 as original_amount
)
SELECT 
  p.code,
  p.discount_type,
  p.discount_value,
  t.original_amount,
  CASE 
    WHEN p.discount_type = 'percentage' THEN 
      t.original_amount * (p.discount_value / 100.0)
    WHEN p.discount_type = 'fixed' THEN 
      p.discount_value
    ELSE 0
  END as discount_amount,
  CASE 
    WHEN p.discount_type = 'percentage' THEN 
      t.original_amount - (t.original_amount * (p.discount_value / 100.0))
    WHEN p.discount_type = 'fixed' THEN 
      t.original_amount - p.discount_value
    ELSE t.original_amount
  END as final_amount
FROM test_purchase t
JOIN promo_codes p ON p.code = t.promo_code;

-- Expected for WELCOME50 with 420000:
-- discount_amount: 210000
-- final_amount: 210000

COMMIT;

