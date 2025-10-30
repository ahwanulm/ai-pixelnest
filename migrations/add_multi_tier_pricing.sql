-- Add Multi-Tier Pricing Support
-- Date: 2025-10-27
-- Purpose: Support audio on/off and text-to-video vs image-to-video pricing

-- Add pricing columns for different variants
ALTER TABLE ai_models 
ADD COLUMN IF NOT EXISTS price_text_to_video_no_audio DECIMAL(10, 4) DEFAULT NULL;

ALTER TABLE ai_models 
ADD COLUMN IF NOT EXISTS price_text_to_video_with_audio DECIMAL(10, 4) DEFAULT NULL;

ALTER TABLE ai_models 
ADD COLUMN IF NOT EXISTS price_image_to_video_no_audio DECIMAL(10, 4) DEFAULT NULL;

ALTER TABLE ai_models 
ADD COLUMN IF NOT EXISTS price_image_to_video_with_audio DECIMAL(10, 4) DEFAULT NULL;

-- Add flag to indicate if model has multi-tier pricing
ALTER TABLE ai_models 
ADD COLUMN IF NOT EXISTS has_multi_tier_pricing BOOLEAN DEFAULT false;

-- Comments for documentation
COMMENT ON COLUMN ai_models.price_text_to_video_no_audio IS 'Price per second for text-to-video without audio (USD)';
COMMENT ON COLUMN ai_models.price_text_to_video_with_audio IS 'Price per second for text-to-video with audio (USD)';
COMMENT ON COLUMN ai_models.price_image_to_video_no_audio IS 'Price per second for image-to-video without audio (USD)';
COMMENT ON COLUMN ai_models.price_image_to_video_with_audio IS 'Price per second for image-to-video with audio (USD)';
COMMENT ON COLUMN ai_models.has_multi_tier_pricing IS 'Whether this model has different prices for audio/type variants';

-- Show results
SELECT 
  column_name, 
  data_type, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'ai_models' 
  AND column_name LIKE 'price_%' OR column_name = 'has_multi_tier_pricing'
ORDER BY ordinal_position;

-- Success message
SELECT 'Multi-tier pricing columns added successfully!' as status;

