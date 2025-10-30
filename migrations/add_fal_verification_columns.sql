-- Add FAL.AI Verification Columns to ai_models
-- Date: 2025-10-27
-- Purpose: Track which models are verified with FAL.AI API and pricing type

-- Add fal_verified column (boolean, default false)
ALTER TABLE ai_models 
ADD COLUMN IF NOT EXISTS fal_verified BOOLEAN DEFAULT false;

-- Add fal_price column (real price from FAL.AI API)
ALTER TABLE ai_models 
ADD COLUMN IF NOT EXISTS fal_price DECIMAL(10, 4) DEFAULT NULL;

-- Add pricing_type column (per_second or flat)
ALTER TABLE ai_models 
ADD COLUMN IF NOT EXISTS pricing_type VARCHAR(20) DEFAULT 'flat';

-- Add comments for documentation
COMMENT ON COLUMN ai_models.fal_verified IS 'Whether this model has been verified to exist in FAL.AI API';
COMMENT ON COLUMN ai_models.fal_price IS 'Real price from FAL.AI API (in USD)';
COMMENT ON COLUMN ai_models.pricing_type IS 'Pricing model: per_second (scales with duration) or flat (fixed cost)';

-- Update existing models to check verification status
-- (This will be done on next add/edit action for each model)

-- Show results
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'ai_models' 
  AND column_name IN ('fal_verified', 'fal_price', 'pricing_type')
ORDER BY ordinal_position;

-- Success message
SELECT 'FAL.AI verification and pricing type columns added successfully!' as status;

