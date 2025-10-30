-- ============================================
-- DEBUG PROMO CODE ISSUE
-- ============================================

-- 1. Check if promo_codes table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_name = 'promo_codes'
);

-- 2. Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'promo_codes'
ORDER BY ordinal_position;

-- 3. Check if PIXELNEST20 exists
SELECT * FROM promo_codes WHERE code = 'PIXELNEST20';

-- 4. Check all promo codes
SELECT 
  code,
  is_active,
  valid_from,
  valid_until,
  min_purchase,
  single_use,
  usage_limit,
  uses_count
FROM promo_codes
ORDER BY created_at DESC;

-- 5. If PIXELNEST20 doesn't exist, insert it
INSERT INTO promo_codes 
(code, description, discount_type, discount_value, min_purchase, single_use, usage_limit, is_active, valid_from, valid_until)
VALUES 
('PIXELNEST20', 'PixelNest 20% discount', 'percentage', 20, 0, false, NULL, true, NOW(), NOW() + INTERVAL '30 days')
ON CONFLICT (code) DO UPDATE SET
  is_active = true,
  valid_from = NOW(),
  valid_until = NOW() + INTERVAL '30 days',
  updated_at = NOW();

-- 6. Verify the insert
SELECT * FROM promo_codes WHERE code = 'PIXELNEST20';

-- 7. Test validation queries

-- Check if promo exists and is active
SELECT 
  code,
  is_active,
  CASE 
    WHEN is_active THEN '✓ Active'
    ELSE '✗ Not Active'
  END as status
FROM promo_codes 
WHERE code = 'PIXELNEST20';

-- Check valid date range
SELECT 
  code,
  valid_from,
  valid_until,
  NOW() as current_time,
  CASE 
    WHEN valid_from IS NULL OR valid_from <= NOW() THEN '✓ Valid From OK'
    ELSE '✗ Not Yet Valid'
  END as valid_from_check,
  CASE 
    WHEN valid_until IS NULL OR valid_until >= NOW() THEN '✓ Valid Until OK'
    ELSE '✗ Expired'
  END as valid_until_check
FROM promo_codes 
WHERE code = 'PIXELNEST20';

-- Check minimum purchase (test with 210000)
SELECT 
  code,
  min_purchase,
  210000 as test_amount,
  CASE 
    WHEN min_purchase IS NULL OR 210000 >= min_purchase THEN '✓ Min Purchase OK'
    ELSE '✗ Below Min Purchase'
  END as min_purchase_check
FROM promo_codes 
WHERE code = 'PIXELNEST20';

-- 8. Check if payment_transactions table has promo_code column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'payment_transactions' AND column_name = 'promo_code';

-- 9. Check if there are any existing usages
SELECT 
  user_id,
  promo_code,
  status,
  created_at
FROM payment_transactions
WHERE promo_code = 'PIXELNEST20';

-- 10. Full validation simulation for user_id = 2, amount = 210000
WITH test_data AS (
  SELECT 
    2 as test_user_id,
    210000 as test_amount,
    'PIXELNEST20' as test_code
)
SELECT 
  p.code,
  p.discount_type,
  p.discount_value,
  p.min_purchase,
  p.single_use,
  p.usage_limit,
  p.is_active,
  p.valid_from,
  p.valid_until,
  t.test_amount,
  t.test_user_id,
  -- Validation checks
  CASE WHEN p.is_active THEN '✓' ELSE '✗ NOT ACTIVE' END as active_check,
  CASE WHEN p.valid_from IS NULL OR p.valid_from <= NOW() THEN '✓' ELSE '✗ NOT YET VALID' END as valid_from_check,
  CASE WHEN p.valid_until IS NULL OR p.valid_until >= NOW() THEN '✓' ELSE '✗ EXPIRED' END as valid_until_check,
  CASE WHEN p.min_purchase IS NULL OR t.test_amount >= p.min_purchase THEN '✓' ELSE '✗ BELOW MIN PURCHASE' END as min_purchase_check,
  -- Check user usage
  (SELECT COUNT(*) FROM payment_transactions 
   WHERE user_id = t.test_user_id 
     AND promo_code = t.test_code 
     AND status = 'PAID') as user_usage_count,
  CASE 
    WHEN p.single_use AND EXISTS(
      SELECT 1 FROM payment_transactions 
      WHERE user_id = t.test_user_id 
        AND promo_code = t.test_code 
        AND status = 'PAID'
    ) THEN '✗ ALREADY USED BY USER'
    ELSE '✓'
  END as single_use_check,
  -- Check total usage
  (SELECT COUNT(*) FROM payment_transactions 
   WHERE promo_code = t.test_code 
     AND status = 'PAID') as total_usage_count,
  CASE 
    WHEN p.usage_limit IS NOT NULL AND (
      SELECT COUNT(*) FROM payment_transactions 
      WHERE promo_code = t.test_code 
        AND status = 'PAID'
    ) >= p.usage_limit THEN '✗ LIMIT REACHED'
    ELSE '✓'
  END as usage_limit_check,
  -- Calculate discount
  CASE 
    WHEN p.discount_type = 'percentage' THEN 
      t.test_amount * (p.discount_value / 100.0)
    WHEN p.discount_type = 'fixed' THEN 
      p.discount_value
    ELSE 0
  END as discount_amount,
  CASE 
    WHEN p.discount_type = 'percentage' THEN 
      t.test_amount - (t.test_amount * (p.discount_value / 100.0))
    WHEN p.discount_type = 'fixed' THEN 
      t.test_amount - p.discount_value
    ELSE t.test_amount
  END as final_amount
FROM test_data t
CROSS JOIN promo_codes p
WHERE p.code = t.test_code;

COMMIT;

