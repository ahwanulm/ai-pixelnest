-- ============================================
-- Check & Create Promo Codes
-- Run this SQL to debug promo code issues
-- ============================================

-- 1. Check if promo_codes table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_name = 'promo_codes'
) as table_exists;

-- 2. Check all promo codes
SELECT 
    id,
    code,
    description,
    discount_type,
    discount_value,
    min_purchase,
    is_active,
    valid_from,
    valid_until,
    CASE 
        WHEN valid_from > NOW() THEN 'Belum dimulai'
        WHEN valid_until < NOW() THEN 'Sudah expired'
        WHEN is_active = false THEN 'Tidak aktif'
        ELSE 'VALID'
    END as status,
    created_at
FROM promo_codes
ORDER BY created_at DESC;

-- 3. Check specific promo code (Replace 'YOUR_CODE' with actual code)
SELECT * FROM promo_codes 
WHERE code = 'WELCOME10';

-- 4. Count promo codes
SELECT 
    COUNT(*) as total_promos,
    COUNT(*) FILTER (WHERE is_active = true) as active_promos,
    COUNT(*) FILTER (WHERE valid_until >= NOW()) as not_expired,
    COUNT(*) FILTER (WHERE is_active = true AND valid_until >= NOW() AND valid_from <= NOW()) as currently_valid
FROM promo_codes;

-- ============================================
-- INSERT SAMPLE PROMO CODES
-- ============================================

-- Delete existing sample promos (optional)
-- DELETE FROM promo_codes WHERE code IN ('WELCOME10', 'SAVE20K', 'MEGA50', 'TEST100');

-- Insert valid promo codes
INSERT INTO promo_codes (
    code, 
    description, 
    discount_type, 
    discount_value, 
    min_purchase,
    single_use,
    usage_limit,
    valid_from, 
    valid_until, 
    is_active
) VALUES 
-- Promo 1: 10% discount, min Rp 50.000
(
    'WELCOME10', 
    'Diskon 10% untuk pengguna baru', 
    'percentage', 
    10.00,
    50000,
    false,
    1000,
    NOW(), 
    NOW() + INTERVAL '30 days', 
    true
),
-- Promo 2: Fixed Rp 20.000 discount, min Rp 100.000
(
    'SAVE20K', 
    'Diskon Rp 20.000 untuk pembelian minimum Rp 100.000', 
    'fixed', 
    20000.00,
    100000,
    false,
    500,
    NOW(), 
    NOW() + INTERVAL '30 days', 
    true
),
-- Promo 3: 50% discount (max Rp 100.000)
(
    'MEGA50', 
    'Diskon 50% untuk semua pembelian', 
    'percentage', 
    50.00,
    0,
    false,
    100,
    NOW(), 
    NOW() + INTERVAL '7 days', 
    true
),
-- Promo 4: Testing promo 100% (untuk testing)
(
    'TEST100', 
    'Test promo 100% discount', 
    'percentage', 
    100.00,
    10000,
    false,
    10,
    NOW(), 
    NOW() + INTERVAL '365 days', 
    true
)
ON CONFLICT (code) DO UPDATE SET
    description = EXCLUDED.description,
    discount_type = EXCLUDED.discount_type,
    discount_value = EXCLUDED.discount_value,
    min_purchase = EXCLUDED.min_purchase,
    valid_from = EXCLUDED.valid_from,
    valid_until = EXCLUDED.valid_until,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Verify inserted promos
SELECT 
    code,
    discount_type,
    discount_value,
    min_purchase,
    is_active,
    valid_from,
    valid_until,
    CASE 
        WHEN valid_until < NOW() THEN '❌ EXPIRED'
        WHEN is_active = false THEN '❌ INACTIVE'
        ELSE '✅ VALID'
    END as status
FROM promo_codes
WHERE code IN ('WELCOME10', 'SAVE20K', 'MEGA50', 'TEST100')
ORDER BY code;

-- ============================================
-- UPDATE EXISTING PROMO CODE
-- ============================================

-- Activate a promo code
-- UPDATE promo_codes 
-- SET is_active = true, 
--     valid_until = NOW() + INTERVAL '30 days',
--     updated_at = NOW()
-- WHERE code = 'WELCOME10';

-- Extend expiry date
-- UPDATE promo_codes 
-- SET valid_until = NOW() + INTERVAL '60 days',
--     updated_at = NOW()
-- WHERE code = 'WELCOME10';

-- ============================================
-- DELETE OLD/EXPIRED PROMOS
-- ============================================

-- Delete expired promos (older than 30 days)
-- DELETE FROM promo_codes 
-- WHERE valid_until < NOW() - INTERVAL '30 days';

-- ============================================
-- PROMO USAGE STATISTICS
-- ============================================

-- Check promo code usage
SELECT 
    pc.code,
    pc.usage_limit,
    COUNT(pt.id) as total_attempts,
    COUNT(pt.id) FILTER (WHERE pt.status = 'PAID') as successful_uses,
    CASE 
        WHEN pc.usage_limit IS NULL THEN 'Unlimited'
        WHEN COUNT(pt.id) FILTER (WHERE pt.status = 'PAID') >= pc.usage_limit THEN '❌ Limit Reached'
        ELSE CONCAT('✅ ', (pc.usage_limit - COUNT(pt.id) FILTER (WHERE pt.status = 'PAID')), ' uses left')
    END as availability
FROM promo_codes pc
LEFT JOIN payment_transactions pt ON pt.promo_code = pc.code
GROUP BY pc.id, pc.code, pc.usage_limit
ORDER BY pc.code;

-- ============================================
-- QUICK FIXES
-- ============================================

-- Fix 1: Activate all promos
-- UPDATE promo_codes SET is_active = true;

-- Fix 2: Extend all promos by 30 days
-- UPDATE promo_codes SET valid_until = NOW() + INTERVAL '30 days' WHERE valid_until < NOW();

-- Fix 3: Reset usage count (DELETE all transactions with promo)
-- DELETE FROM payment_transactions WHERE promo_code IS NOT NULL;

-- ============================================
-- TESTING QUERIES
-- ============================================

-- Test: Simulate validation for code WELCOME10 with amount 100000
SELECT 
    code,
    CASE 
        WHEN is_active = false THEN '❌ Not Active'
        WHEN valid_from > NOW() THEN '❌ Not Started Yet'
        WHEN valid_until < NOW() THEN '❌ Expired'
        WHEN min_purchase > 100000 THEN '❌ Amount too low (min: ' || min_purchase || ')'
        ELSE '✅ VALID'
    END as validation_result,
    discount_type,
    discount_value,
    min_purchase,
    valid_from,
    valid_until
FROM promo_codes
WHERE code = 'WELCOME10';

