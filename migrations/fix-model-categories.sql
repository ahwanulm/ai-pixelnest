-- Fix Model Categories Bug
-- Date: 2025-10-27
-- Issue: Models added from "Browse FAL.AI" have invalid categories
--        ('video-generation', 'image-generation') instead of proper categories
--        ('Text-to-Video', 'Text-to-Image', etc.)

-- ============================================
-- 1. Show current invalid categories
-- ============================================
SELECT 
  id,
  name,
  type,
  category,
  is_active,
  created_at
FROM ai_models
WHERE category IN ('video-generation', 'image-generation')
ORDER BY created_at DESC;

-- ============================================
-- 2. Fix invalid video categories
-- ============================================
UPDATE ai_models 
SET 
  category = 'Text-to-Video',
  updated_at = CURRENT_TIMESTAMP
WHERE 
  type = 'video' 
  AND category = 'video-generation';

-- ============================================
-- 3. Fix invalid image categories
-- ============================================
UPDATE ai_models 
SET 
  category = 'Text-to-Image',
  updated_at = CURRENT_TIMESTAMP
WHERE 
  type = 'image' 
  AND category = 'image-generation';

-- ============================================
-- 4. Verify the fix
-- ============================================
SELECT 
  category,
  type,
  COUNT(*) as count
FROM ai_models
WHERE is_active = true
GROUP BY category, type
ORDER BY type, category;

-- ============================================
-- 5. Show updated models
-- ============================================
SELECT 
  id,
  name,
  type,
  category,
  is_active,
  updated_at
FROM ai_models
WHERE category IN ('Text-to-Video', 'Text-to-Image', 'Image Editing', 'Upscaling', 'Image-to-Video')
ORDER BY updated_at DESC
LIMIT 10;

