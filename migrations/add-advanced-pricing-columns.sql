-- ===============================================
-- MIGRATION: Add Advanced Pricing Columns
-- ===============================================
-- Date: October 28, 2025
-- Purpose: Support 6 pricing structures for fal.ai models
-- Pricing Types: Simple, Per-Pixel, Per-Megapixel, Multi-Tier, 3D, Resolution-Based

-- Per-Pixel Pricing (for Upscaling models)
ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS price_per_pixel NUMERIC(10, 7) DEFAULT NULL;
ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS base_resolution VARCHAR(20) DEFAULT NULL; -- e.g., "1920x1080"
ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS max_upscale_factor NUMERIC(4, 1) DEFAULT NULL; -- e.g., 4.0

-- Per-Megapixel Pricing (for FLUX models)
ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS price_per_megapixel NUMERIC(10, 3) DEFAULT NULL;
ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS base_megapixels NUMERIC(4, 1) DEFAULT NULL; -- e.g., 1.0
ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS max_megapixels NUMERIC(4, 1) DEFAULT NULL; -- e.g., 2.0

-- 3D Modeling Pricing
ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS base_3d_price NUMERIC(10, 2) DEFAULT NULL;
ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS quality_multiplier NUMERIC(4, 2) DEFAULT NULL; -- e.g., 1.5

-- Resolution-Based Pricing (different prices per resolution tier)
ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS price_sd NUMERIC(10, 3) DEFAULT NULL; -- 512x512
ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS price_hd NUMERIC(10, 3) DEFAULT NULL; -- 1024x1024
ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS price_2k NUMERIC(10, 3) DEFAULT NULL; -- 2048x2048
ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS price_4k NUMERIC(10, 3) DEFAULT NULL; -- 4096x4096

-- Pricing Structure Metadata
ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS pricing_structure VARCHAR(30) DEFAULT 'simple'; -- simple, per_pixel, per_megapixel, multi_tier, 3d_modeling, resolution_based

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_pricing_structure ON ai_models(pricing_structure);
CREATE INDEX IF NOT EXISTS idx_per_pixel_pricing ON ai_models(price_per_pixel) WHERE price_per_pixel IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_per_megapixel_pricing ON ai_models(price_per_megapixel) WHERE price_per_megapixel IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN ai_models.price_per_pixel IS 'Price per output pixel for upscaling models (e.g., 0.0000023)';
COMMENT ON COLUMN ai_models.base_resolution IS 'Starting resolution for upscaling (e.g., 1920x1080)';
COMMENT ON COLUMN ai_models.max_upscale_factor IS 'Maximum upscale factor (e.g., 4x)';

COMMENT ON COLUMN ai_models.price_per_megapixel IS 'Price per megapixel for FLUX models (e.g., 0.055)';
COMMENT ON COLUMN ai_models.base_megapixels IS 'Base megapixels for generation (e.g., 1.0)';
COMMENT ON COLUMN ai_models.max_megapixels IS 'Maximum megapixels supported (e.g., 2.0)';

COMMENT ON COLUMN ai_models.base_3d_price IS 'Base price for 3D model generation';
COMMENT ON COLUMN ai_models.quality_multiplier IS 'Quality tier multiplier (1.0=standard, 1.5=high, 2.0=ultra)';

COMMENT ON COLUMN ai_models.price_sd IS 'Price for SD resolution (512x512)';
COMMENT ON COLUMN ai_models.price_hd IS 'Price for HD resolution (1024x1024)';
COMMENT ON COLUMN ai_models.price_2k IS 'Price for 2K resolution (2048x2048)';
COMMENT ON COLUMN ai_models.price_4k IS 'Price for 4K resolution (4096x4096)';

COMMENT ON COLUMN ai_models.pricing_structure IS 'Pricing model type: simple, per_pixel, per_megapixel, multi_tier, 3d_modeling, resolution_based';

-- Verification query to check new columns
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'ai_models' 
    AND column_name IN (
        'price_per_pixel', 'base_resolution', 'max_upscale_factor',
        'price_per_megapixel', 'base_megapixels', 'max_megapixels',
        'base_3d_price', 'quality_multiplier',
        'price_sd', 'price_hd', 'price_2k', 'price_4k',
        'pricing_structure'
    )
ORDER BY ordinal_position;

-- Sample data examples
/*
-- Example: FLUX 1.1 Pro (Per-Megapixel)
UPDATE ai_models 
SET 
    pricing_structure = 'per_megapixel',
    price_per_megapixel = 0.04,
    base_megapixels = 1.0,
    max_megapixels = 2.0
WHERE model_id = 'fal-ai/flux-pro/v1.1';

-- Example: Clarity Upscaler (Per-Pixel)
UPDATE ai_models 
SET 
    pricing_structure = 'per_pixel',
    price_per_pixel = 0.0000023,
    base_resolution = '1920x1080',
    max_upscale_factor = 4.0
WHERE model_id = 'fal-ai/clarity-upscaler';

-- Example: 3D Generator (3D Modeling)
UPDATE ai_models 
SET 
    pricing_structure = '3d_modeling',
    base_3d_price = 0.50,
    quality_multiplier = 1.5
WHERE model_id = 'fal-ai/meshy-3d';

-- Example: Multi-Resolution Image Model (Resolution-Based)
UPDATE ai_models 
SET 
    pricing_structure = 'resolution_based',
    price_sd = 0.010,
    price_hd = 0.025,
    price_2k = 0.050,
    price_4k = 0.100
WHERE model_id = 'fal-ai/multi-res-gen';
*/

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Advanced pricing columns added successfully!';
    RAISE NOTICE '📊 Supported pricing structures:';
    RAISE NOTICE '   - Simple (flat/per-second)';
    RAISE NOTICE '   - Per-Pixel (upscaling)';
    RAISE NOTICE '   - Per-Megapixel (FLUX)';
    RAISE NOTICE '   - Multi-Tier (Veo)';
    RAISE NOTICE '   - 3D Modeling';
    RAISE NOTICE '   - Resolution-Based';
END $$;

