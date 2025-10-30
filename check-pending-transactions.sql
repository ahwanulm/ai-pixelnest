-- Check Pending Transactions
-- Quick SQL script to debug pending transaction limit

\echo '============================================'
\echo '🔍 CHECKING PENDING TRANSACTIONS'
\echo '============================================'
\echo ''

-- 1. Count all pending transactions
\echo '1. Total Pending Transactions (Active - PENDING & UNPAID):'
SELECT 
  COUNT(*) as total_pending_active,
  COUNT(DISTINCT user_id) as unique_users
FROM payment_transactions 
WHERE status IN ('PENDING', 'UNPAID')
  AND expired_time > NOW();

\echo ''

-- 2. Pending by user
\echo '2. Pending Transactions Per User:'
SELECT 
  u.id,
  u.username,
  u.email,
  COUNT(pt.id) as pending_count,
  MIN(pt.expired_time) as earliest_expiry,
  CASE 
    WHEN COUNT(pt.id) >= 3 THEN '🔴 BLOCKED'
    WHEN COUNT(pt.id) > 0 THEN '🟡 HAS PENDING'
    ELSE '🟢 CLEAR'
  END as status
FROM users u
LEFT JOIN payment_transactions pt ON u.id = pt.user_id 
  AND pt.status IN ('PENDING', 'UNPAID')
  AND pt.expired_time > NOW()
GROUP BY u.id, u.username, u.email
HAVING COUNT(pt.id) > 0
ORDER BY pending_count DESC, earliest_expiry ASC;

\echo ''

-- 3. All pending transactions detail
\echo '3. Pending Transaction Details:'
SELECT 
  pt.id,
  u.username,
  pt.amount,
  pt.credits_amount,
  pt.payment_method,
  pt.status,
  pt.created_at,
  pt.expired_time,
  EXTRACT(EPOCH FROM (pt.expired_time - NOW())) / 3600 as hours_until_expiry,
  CASE 
    WHEN pt.expired_time < NOW() THEN '⏰ EXPIRED (needs update)'
    WHEN EXTRACT(EPOCH FROM (pt.expired_time - NOW())) / 3600 < 1 THEN '⚠️  EXPIRES SOON'
    ELSE '✅ ACTIVE'
  END as expiry_status
FROM payment_transactions pt
JOIN users u ON pt.user_id = u.id
WHERE pt.status IN ('PENDING', 'UNPAID')
ORDER BY pt.expired_time ASC
LIMIT 20;

\echo ''

-- 4. Users who would be blocked
\echo '4. Users at or Above Limit (>= 3 pending):'
SELECT 
  u.username,
  u.email,
  COUNT(pt.id) as pending_count,
  array_agg(pt.payment_method) as payment_methods,
  MIN(pt.expired_time) as earliest_expiry,
  MAX(pt.expired_time) as latest_expiry
FROM users u
JOIN payment_transactions pt ON u.id = pt.user_id 
  AND pt.status IN ('PENDING', 'UNPAID')
  AND pt.expired_time > NOW()
GROUP BY u.id, u.username, u.email
HAVING COUNT(pt.id) >= 3;

\echo ''

-- 5. Clean up expired transactions (run this to fix stale pending)
\echo '5. Would-be Expired Transactions (should be updated):'
SELECT 
  COUNT(*) as expired_pending_count,
  MIN(expired_time) as oldest_expiry
FROM payment_transactions 
WHERE status IN ('PENDING', 'UNPAID')
  AND expired_time < NOW();

\echo ''
\echo '============================================'
\echo '💡 RECOMMENDATIONS:'
\echo '============================================'
\echo ''
\echo 'If you have expired PENDING/UNPAID transactions, run:'
\echo '  UPDATE payment_transactions SET status = ''EXPIRED'' WHERE status IN (''PENDING'', ''UNPAID'') AND expired_time < NOW();'
\echo ''
\echo 'To test the limit, create 3 transactions for a user:'
\echo '  1. Login to dashboard'
\echo '  2. Try to top up 3 times (let them stay pending)'
\echo '  3. Try a 4th time - should be blocked'
\echo ''
\echo 'To manually test with a specific user:'
\echo '  SELECT id, username FROM users LIMIT 5;'
\echo '  -- Then check their pending count'
\echo ''

