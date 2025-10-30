-- Migration: Add prompt_required column to ai_models table
-- This allows admin to configure which models require prompts

-- Add prompt_required column (default TRUE for backward compatibility)
ALTER TABLE ai_models 
ADD COLUMN IF NOT EXISTS prompt_required BOOLEAN DEFAULT TRUE;

-- Add comment for clarity
COMMENT ON COLUMN ai_models.prompt_required IS 'Whether this model requires a text prompt or can work with just image/video upload';

-- Set specific models that DON'T require prompts
UPDATE ai_models 
SET prompt_required = FALSE
WHERE model_id IN (
    'fal-ai/clarity-upscaler',
    'fal-ai/imageutils/rembg',
    'fal-ai/face-to-sticker',
    'fal-ai/face-swap',
    'fal-ai/flux-realism/inpainting',
    'fal-ai/flux-pro/inpainting'
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_models_prompt_required ON ai_models(prompt_required);

-- Verify the change
SELECT 
    model_id, 
    name, 
    prompt_required 
FROM ai_models 
WHERE prompt_required = FALSE
ORDER BY name;

