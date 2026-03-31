-- Cleanup Duplicate Notifications
-- This script removes duplicate notifications from database

-- Step 1: Check current duplicate notifications
SELECT 
  title, 
  message, 
  DATE_TRUNC('second', created_at) as time_group,
  user_id,
  COUNT(*) as count
FROM notifications
GROUP BY title, message, DATE_TRUNC('second', created_at), user_id
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- Step 2: Keep only one notification per user per content
-- Delete duplicates, keeping the oldest ID
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY title, message, DATE_TRUNC('second', created_at), user_id
      ORDER BY id ASC
    ) as row_num
  FROM notifications
)
DELETE FROM notifications
WHERE id IN (
  SELECT id FROM duplicates WHERE row_num > 1
);

-- Step 3: Verify no more duplicates
SELECT 
  title, 
  message, 
  DATE_TRUNC('second', created_at) as time_group,
  user_id,
  COUNT(*) as count
FROM notifications
GROUP BY title, message, DATE_TRUNC('second', created_at), user_id
HAVING COUNT(*) > 1;

-- Step 4: Show remaining notifications count per user
SELECT 
  u.name,
  COUNT(*) as notification_count
FROM notifications n
JOIN users u ON n.user_id = u.id
GROUP BY u.id, u.name
ORDER BY notification_count DESC;

