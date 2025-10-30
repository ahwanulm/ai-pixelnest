-- ============================================
-- UPDATE PROMO CODES SCHEMA
-- From OLD schema to NEW schema
-- ============================================

BEGIN;

-- 1. Add new columns if they don't exist
ALTER TABLE promo_codes 
ADD COLUMN IF NOT EXISTS min_purchase NUMERIC(10,2) DEFAULT 0;

ALTER TABLE promo_codes 
ADD COLUMN IF NOT EXISTS single_use BOOLEAN DEFAULT false;

ALTER TABLE promo_codes 
ADD COLUMN IF NOT EXISTS usage_limit INTEGER;

-- 2. Migrate data from max_uses to usage_limit
UPDATE promo_codes 
SET usage_limit = max_uses 
WHERE max_uses IS NOT NULL AND usage_limit IS NULL;

-- 3. Drop old columns (optional - comment out if you want to keep them)
-- ALTER TABLE promo_codes DROP COLUMN IF EXISTS credits_bonus;
-- ALTER TABLE promo_codes DROP COLUMN IF EXISTS max_uses;

-- 4. Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_promo_codes_valid_dates ON promo_codes(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_promo_codes_single_use ON promo_codes(single_use);

-- 5. Verify new columns exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'promo_codes'
  AND column_name IN ('min_purchase', 'single_use', 'usage_limit')
ORDER BY column_name;

COMMIT;

-- 6. Show updated table structure
\d promo_codes

-- 7. Update existing promos to have sensible defaults
UPDATE promo_codes 
SET min_purchase = 0 
WHERE min_purchase IS NULL;

UPDATE promo_codes 
SET single_use = false 
WHERE single_use IS NULL;

-- 8. Show all promo codes with new schema
SELECT 
  code,
  discount_type,
  discount_value,
  min_purchase,
  single_use,
  usage_limit,
  uses_count,
  is_active
FROM promo_codes
ORDER BY created_at DESC;

