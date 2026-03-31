-- ================================================================
-- FIX PRICING IN DATABASE - Update All Models to Use ×10 Formula
-- ================================================================
-- Date: 2025-10-29
-- Formula: Credits = FAL Price × 10
--
-- BACKUP DATABASE FIRST!
-- ================================================================

-- 1. Check current values before update
SELECT 
  id,
  name,
  type,
  fal_price,
  cost AS old_cost,
  ROUND((fal_price * 10)::numeric, 1) AS new_cost_should_be,
  (cost - ROUND((fal_price * 10)::numeric, 1)) AS difference
FROM ai_models
WHERE fal_price IS NOT NULL 
  AND fal_price > 0
ORDER BY difference DESC;

-- 2. Update all models with ×10 formula
-- For FLAT pricing and PER_SECOND pricing
UPDATE ai_models
SET 
  cost = GREATEST(0.1, ROUND((fal_price * 10)::numeric, 1)),
  updated_at = CURRENT_TIMESTAMP
WHERE fal_price IS NOT NULL 
  AND fal_price > 0
  AND pricing_type IN ('flat', 'per_second');

-- 3. Special handling for MULTI-TIER pricing
-- These models have different prices for different variants
-- We'll use the minimum price as base cost
UPDATE ai_models
SET 
  cost = GREATEST(
    0.1,
    ROUND((
      LEAST(
        COALESCE(price_text_to_video_no_audio, 999),
        COALESCE(price_text_to_video_with_audio, 999),
        COALESCE(price_image_to_video_no_audio, 999),
        COALESCE(price_image_to_video_with_audio, 999)
      ) * 10
    )::numeric, 1)
  ),
  updated_at = CURRENT_TIMESTAMP
WHERE has_multi_tier_pricing = true
  AND (
    price_text_to_video_no_audio IS NOT NULL OR
    price_text_to_video_with_audio IS NOT NULL OR
    price_image_to_video_no_audio IS NOT NULL OR
    price_image_to_video_with_audio IS NOT NULL
  );

-- 4. Verify the update
SELECT 
  id,
  name,
  type,
  pricing_type,
  fal_price,
  cost AS new_cost,
  CASE 
    WHEN pricing_type IN ('flat', 'per_second') THEN
      CONCAT('$', fal_price, ' × 10 = ', cost, ' cr')
    WHEN has_multi_tier_pricing THEN
      CONCAT('Multi-tier: ', cost, ' cr/s')
    ELSE
      CONCAT(cost, ' cr')
  END AS formula_check
FROM ai_models
WHERE fal_price IS NOT NULL 
  AND fal_price > 0
ORDER BY type, name;

-- 5. Summary of changes
SELECT 
  type,
  COUNT(*) as total_models,
  ROUND(AVG(cost)::numeric, 2) as avg_cost,
  ROUND(MIN(cost)::numeric, 2) as min_cost,
  ROUND(MAX(cost)::numeric, 2) as max_cost
FROM ai_models
WHERE fal_price IS NOT NULL 
  AND fal_price > 0
GROUP BY type
ORDER BY type;

-- ================================================================
-- VERIFICATION QUERIES
-- ================================================================

-- Check specific examples
SELECT 
  name,
  type,
  pricing_type,
  fal_price,
  cost,
  max_duration,
  CASE 
    WHEN pricing_type = 'per_second' AND max_duration IS NOT NULL THEN
      CONCAT(cost, ' cr/s × ', max_duration, 's = ', (cost * max_duration), ' cr total')
    ELSE
      CONCAT(cost, ' cr flat')
  END as pricing_example
FROM ai_models
WHERE name ILIKE '%music%' 
   OR name ILIKE '%kling%'
   OR name ILIKE '%veo%'
ORDER BY name;

-- ================================================================
-- EXPECTED RESULTS:
-- ================================================================
-- Music ($0.02/s): 0.2 cr/s → 30s video = 6.0 cr
-- Kling ($0.06/s): 0.6 cr/s → 6s video = 3.6 cr  
-- VEO ($0.30/s): 3.0 cr/s → 6s video = 18.0 cr
-- ================================================================

