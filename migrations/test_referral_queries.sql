-- ============================================
-- SQL Queries untuk Testing Referral System
-- ============================================

-- 1. Lihat semua user dengan referral code mereka
SELECT 
  id,
  email,
  name,
  referral_code,
  referred_by,
  is_active,
  created_at
FROM users
ORDER BY created_at DESC
LIMIT 20;

-- 2. Cek user yang mendaftar menggunakan referral code
SELECT 
  u.id,
  u.email,
  u.name,
  u.google_id IS NOT NULL as is_google_oauth,
  u.referred_by,
  referrer.email as referrer_email,
  referrer.referral_code as used_referral_code,
  u.is_active,
  u.created_at
FROM users u
LEFT JOIN users referrer ON u.referred_by = referrer.id
WHERE u.referred_by IS NOT NULL
ORDER BY u.created_at DESC;

-- 3. Statistik referral per user
SELECT 
  u.id,
  u.email,
  u.name,
  u.referral_code,
  COUNT(referred.id) as total_referrals,
  u.referral_earnings,
  COUNT(CASE WHEN referred.google_id IS NOT NULL THEN 1 END) as google_oauth_referrals,
  COUNT(CASE WHEN referred.password_hash IS NOT NULL THEN 1 END) as email_password_referrals
FROM users u
LEFT JOIN users referred ON referred.referred_by = u.id
WHERE u.referral_code IS NOT NULL
GROUP BY u.id, u.email, u.name, u.referral_code, u.referral_earnings
ORDER BY total_referrals DESC;

-- 4. Cek user tertentu dengan email
SELECT 
  u.id,
  u.email,
  u.name,
  u.referral_code as my_referral_code,
  u.referred_by,
  referrer.email as referred_by_email,
  referrer.referral_code as used_code,
  u.google_id IS NOT NULL as registered_via_google,
  u.is_active,
  u.referral_earnings,
  u.created_at
FROM users u
LEFT JOIN users referrer ON u.referred_by = referrer.id
WHERE u.email = 'YOUR_EMAIL@gmail.com'; -- Ganti dengan email yang ingin dicek

-- 5. Lihat transaksi referral untuk user tertentu
SELECT 
  rt.id,
  rt.transaction_type,
  rt.amount,
  rt.description,
  referred_user.email as referred_user_email,
  rt.created_at
FROM referral_transactions rt
JOIN users u ON u.id = rt.referrer_id
JOIN users referred_user ON referred_user.id = rt.referred_user_id
WHERE u.email = 'YOUR_EMAIL@gmail.com' -- Ganti dengan email referrer
ORDER BY rt.created_at DESC;

-- 6. Top 10 referrers (user dengan referral terbanyak)
SELECT 
  u.email,
  u.name,
  u.referral_code,
  COUNT(referred.id) as total_referrals,
  u.referral_earnings,
  COALESCE(SUM(rt.amount), 0) as total_commission_earned
FROM users u
LEFT JOIN users referred ON referred.referred_by = u.id
LEFT JOIN referral_transactions rt ON rt.referrer_id = u.id
GROUP BY u.id, u.email, u.name, u.referral_code, u.referral_earnings
HAVING COUNT(referred.id) > 0
ORDER BY total_referrals DESC, total_commission_earned DESC
LIMIT 10;

-- 7. Cek apakah referral code valid (untuk testing)
SELECT 
  id,
  email,
  name,
  referral_code,
  (referral_code = 'EY6QZOEO') as is_match -- Ganti dengan code yang ingin dicek
FROM users
WHERE referral_code = 'EY6QZOEO'; -- Ganti dengan code yang ingin dicek

-- 8. Generate referral code untuk user yang belum punya (jika perlu)
UPDATE users 
SET referral_code = UPPER(
  SUBSTRING(MD5(RANDOM()::TEXT || id::TEXT || email), 1, 8)
)
WHERE referral_code IS NULL;

-- 9. Cek user yang baru register hari ini dengan referral
SELECT 
  u.email,
  u.name,
  u.google_id IS NOT NULL as via_google,
  referrer.email as referrer_email,
  referrer.referral_code as used_code,
  u.created_at
FROM users u
JOIN users referrer ON u.referred_by = referrer.id
WHERE u.created_at >= CURRENT_DATE
ORDER BY u.created_at DESC;

-- 10. Summary total referrals di sistem
SELECT 
  COUNT(DISTINCT u.id) FILTER (WHERE u.referred_by IS NOT NULL) as total_users_with_referrer,
  COUNT(DISTINCT u.referred_by) as total_unique_referrers,
  COUNT(DISTINCT u.id) FILTER (WHERE u.referred_by IS NOT NULL AND u.google_id IS NOT NULL) as google_oauth_referrals,
  COUNT(DISTINCT u.id) FILTER (WHERE u.referred_by IS NOT NULL AND u.password_hash IS NOT NULL) as email_password_referrals,
  COALESCE(SUM(u.referral_earnings), 0) as total_referral_earnings_in_system
FROM users u;

-- 11. Cek payout requests untuk referral earnings
SELECT 
  pr.id,
  u.email,
  u.name,
  pr.amount,
  pr.payment_method,
  pr.status,
  pr.created_at,
  pr.processed_at,
  admin.name as processed_by_admin
FROM payout_requests pr
JOIN users u ON u.id = pr.user_id
LEFT JOIN users admin ON admin.id = pr.processed_by
ORDER BY pr.created_at DESC
LIMIT 20;

-- 12. Manual testing: Set referral untuk user tertentu
-- HATI-HATI: Hanya untuk testing!
-- UPDATE users 
-- SET referred_by = (SELECT id FROM users WHERE referral_code = 'EY6QZOEO')
-- WHERE email = 'test@gmail.com';

-- 13. Clear referral untuk testing ulang
-- HATI-HATI: Hanya untuk testing!
-- UPDATE users 
-- SET referred_by = NULL
-- WHERE email = 'test@gmail.com';

-- 14. Cek payout settings
SELECT * FROM payout_settings;

-- 15. Cek recent registrations (last 24 hours)
SELECT 
  email,
  name,
  google_id IS NOT NULL as via_google,
  password_hash IS NOT NULL as via_email,
  referred_by IS NOT NULL as has_referrer,
  is_active,
  created_at
FROM users
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

