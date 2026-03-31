-- ═══════════════════════════════════════════════════════
-- Fix Remove Background Category
-- ═══════════════════════════════════════════════════════
-- 
-- Problem: Model "rembg" masih punya kategori "Image Editing"
-- Solution: Update ke "Background Removal"
--
-- Run this SQL in your database to fix existing data
-- ═══════════════════════════════════════════════════════

-- Update rembg model category
UPDATE ai_models 
SET category = 'Background Removal',
    updated_at = CURRENT_TIMESTAMP
WHERE model_id = 'fal-ai/imageutils/rembg'
  AND category = 'Image Editing';

-- Verify the update
SELECT model_id, name, category, type
FROM ai_models
WHERE model_id = 'fal-ai/imageutils/rembg';

-- Optional: Check all Background Removal models
SELECT model_id, name, category, type
FROM ai_models
WHERE category = 'Background Removal'
ORDER BY name;

