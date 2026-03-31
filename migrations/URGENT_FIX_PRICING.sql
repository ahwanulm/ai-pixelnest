-- ================================================================
-- URGENT FIX: Update Model Pricing (Formula ×10)
-- ================================================================
-- Masalah: Harga 3.0 di admin jadi 21.6 di UI
-- Penyebab: Model masih pakai nilai cost lama (formula ×32)
-- Solusi: Update semua model ke formula ×10
-- ================================================================

-- 1. CEK DULU - Model mana yang salah
SELECT 
  name,
  type,
  pricing_type,
  ROUND(fal_price::numeric, 4) as fal_usd,
  ROUND(cost::numeric, 1) as current_cost,
  ROUND((fal_price * 10)::numeric, 1) as should_be,
  ROUND((cost - (fal_price * 10))::numeric, 1) as over_priced,
  max_duration
FROM ai_models
WHERE type = 'video' 
  AND is_active = true 
  AND fal_price IS NOT NULL
  AND ABS(cost - (fal_price * 10)) > 0.1
ORDER BY (cost - (fal_price * 10)) DESC;

-- 2. FIX SEMUA VIDEO MODELS
UPDATE ai_models
SET 
  cost = GREATEST(0.1, ROUND((fal_price * 10)::numeric, 1)),
  updated_at = CURRENT_TIMESTAMP
WHERE type = 'video'
  AND fal_price IS NOT NULL 
  AND fal_price > 0
  AND pricing_type IN ('flat', 'per_second');

-- 3. FIX SEMUA IMAGE MODELS
UPDATE ai_models
SET 
  cost = GREATEST(0.1, ROUND((fal_price * 10)::numeric, 1)),
  updated_at = CURRENT_TIMESTAMP
WHERE type = 'image'
  AND fal_price IS NOT NULL 
  AND fal_price > 0;

-- 4. FIX SEMUA AUDIO MODELS
UPDATE ai_models
SET 
  cost = GREATEST(0.1, ROUND((fal_price * 10)::numeric, 1)),
  updated_at = CURRENT_TIMESTAMP
WHERE type = 'audio'
  AND fal_price IS NOT NULL 
  AND fal_price > 0;

-- 5. VERIFY - Cek hasilnya
SELECT 
  name,
  type,
  pricing_type,
  ROUND(fal_price::numeric, 4) as fal_usd,
  ROUND(cost::numeric, 1) as new_cost,
  max_duration,
  CASE 
    WHEN pricing_type = 'per_second' AND max_duration IS NOT NULL THEN
      CONCAT(cost, ' cr/s × ', max_duration, 's = ', ROUND((cost * max_duration)::numeric, 1), ' cr total')
    ELSE
      CONCAT(cost, ' cr')
  END as pricing_example
FROM ai_models
WHERE is_active = true 
  AND fal_price IS NOT NULL
ORDER BY type, name
LIMIT 20;

-- DONE! Harga sekarang benar.

