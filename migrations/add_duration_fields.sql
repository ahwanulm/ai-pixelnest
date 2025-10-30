/**
 * Migration: Add Duration Fields
 * 
 * Menambahkan:
 * 1. available_durations - Array durasi yang didukung (JSON)
 * 2. price_per_second - Harga per detik untuk video models
 * 
 * Tanggal: 28 Oktober 2025
 */

-- ============================================
-- 1. Tambah kolom available_durations (JSONB)
-- ============================================
ALTER TABLE ai_models 
ADD COLUMN IF NOT EXISTS available_durations JSONB DEFAULT NULL;

COMMENT ON COLUMN ai_models.available_durations IS 'Array of available durations for this model. Examples: ["5", "10"] for Kling, ["4s", "6s", "8s"] for Veo3';

-- ============================================
-- 2. Tambah kolom price_per_second (DECIMAL)
-- ============================================
ALTER TABLE ai_models 
ADD COLUMN IF NOT EXISTS price_per_second NUMERIC(10, 4) DEFAULT NULL;

COMMENT ON COLUMN ai_models.price_per_second IS 'Price per second for video models (in USD)';

-- ============================================
-- 3. Update existing models dengan duration info
-- ============================================

-- Kling Video models: support 5s and 10s
UPDATE ai_models
SET available_durations = '["5", "10"]'::jsonb,
    price_per_second = CASE 
        WHEN fal_price IS NOT NULL THEN fal_price / 5.0  -- Assume base price is for 5s
        ELSE NULL
    END
WHERE model_id LIKE '%kling%' AND type = 'video';

-- Veo 3 models: support 4s, 6s, and 8s  
UPDATE ai_models
SET available_durations = '["4s", "6s", "8s"]'::jsonb,
    price_per_second = CASE
        WHEN fal_price IS NOT NULL THEN fal_price / 6.0  -- Assume base price is for 6s
        ELSE NULL
    END
WHERE model_id LIKE '%veo%' AND type = 'video';

-- Runway Gen-3: support 5s and 10s
UPDATE ai_models
SET available_durations = '["5", "10"]'::jsonb,
    price_per_second = CASE
        WHEN fal_price IS NOT NULL THEN fal_price / 10.0  -- Assume base price is for 10s
        ELSE NULL
    END
WHERE model_id LIKE '%runway%' AND type = 'video';

-- Luma: typically no duration option (fixed)
UPDATE ai_models
SET available_durations = '["5"]'::jsonb
WHERE model_id LIKE '%luma%' AND type = 'video';

-- Minimax/Haiper/Pika: support 5s, 6s, 10s
UPDATE ai_models
SET available_durations = '["5", "6", "10"]'::jsonb,
    price_per_second = CASE
        WHEN fal_price IS NOT NULL THEN fal_price / 10.0  
        ELSE NULL
    END
WHERE (model_id LIKE '%minimax%' OR model_id LIKE '%haiper%' OR model_id LIKE '%pika%') 
  AND type = 'video';

-- ============================================
-- 4. Create index untuk fast querying
-- ============================================
CREATE INDEX IF NOT EXISTS idx_ai_models_available_durations 
ON ai_models USING GIN (available_durations);

CREATE INDEX IF NOT EXISTS idx_ai_models_price_per_second 
ON ai_models (price_per_second) 
WHERE price_per_second IS NOT NULL;

-- ============================================
-- 5. Verification query
-- ============================================
-- Run this to verify:
-- SELECT model_id, name, type, available_durations, price_per_second, fal_price
-- FROM ai_models 
-- WHERE type = 'video' AND available_durations IS NOT NULL
-- ORDER BY name;

