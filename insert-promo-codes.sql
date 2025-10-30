-- ============================================
-- Insert Sample Promo Codes
-- ============================================

-- Delete old test promos (if any)
DELETE FROM promo_codes WHERE code IN ('TEST', 'WELCOME10', 'SAVE20K', 'MEGA50');

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
-- Promo 1: TEST - 50% discount, no minimum
(
    'TEST', 
    'Test Promo 50%', 
    'percentage', 
    50.00,
    0,
    false,
    NULL,
    NOW(), 
    NOW() + INTERVAL '365 days', 
    true
),
-- Promo 2: WELCOME10 - 10% discount, min Rp 50.000
(
    'WELCOME10', 
    'Diskon 10% untuk pengguna baru', 
    'percentage', 
    10.00,
    50000,
    false,
    1000,
    NOW(), 
    NOW() + INTERVAL '90 days', 
    true
),
-- Promo 3: SAVE20K - Fixed Rp 20.000 discount, min Rp 100.000
(
    'SAVE20K', 
    'Diskon Rp 20.000', 
    'fixed', 
    20000.00,
    100000,
    false,
    500,
    NOW(), 
    NOW() + INTERVAL '90 days', 
    true
),
-- Promo 4: MEGA50 - 50% discount (max benefit)
(
    'MEGA50', 
    'Mega Sale 50%', 
    'percentage', 
    50.00,
    0,
    false,
    100,
    NOW(), 
    NOW() + INTERVAL '30 days', 
    true
);

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
ORDER BY code;

-- Show count
SELECT COUNT(*) as total_promos FROM promo_codes WHERE is_active = true;

