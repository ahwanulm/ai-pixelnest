-- ====================================
-- Fix 3D Models Categories
-- ====================================
-- Separate Text-to-3D and Image-to-3D into different categories

-- Step 1: Fix categories and prompt_required for all 3D models
UPDATE ai_models
SET
    category = CASE
        WHEN (model_id LIKE '%seed3d%' OR model_id LIKE '%image-to-3d%' OR model_id LIKE '%img2mesh%')
        THEN 'Image-to-3D'
        ELSE 'Text-to-3D'
    END,
    prompt_required = CASE
        WHEN (model_id LIKE '%seed3d%' OR model_id LIKE '%image-to-3d%' OR model_id LIKE '%img2mesh%')
        THEN false
        ELSE true
    END,
    updated_at = CURRENT_TIMESTAMP
WHERE
    (
        model_id LIKE '%3d%'
        OR model_id LIKE '%seed3d%'
        OR name ILIKE '%3D%'
        OR name ILIKE '%seed3d%'
    )
    AND (
        category NOT IN ('Text-to-3D', 'Image-to-3D')
        OR (
            (model_id LIKE '%seed3d%' OR model_id LIKE '%image-to-3d%' OR model_id LIKE '%img2mesh%')
            AND prompt_required = true
        )
        OR (
            (model_id NOT LIKE '%seed3d%' AND model_id NOT LIKE '%image-to-3d%' AND model_id NOT LIKE '%img2mesh%')
            AND model_id LIKE '%3d%'
            AND prompt_required = false
        )
    );

-- Verify the update
SELECT 
    '✅ Updated Models:' as status;

SELECT 
    model_id, 
    name, 
    category, 
    prompt_required,
    updated_at
FROM ai_models 
WHERE 
    model_id LIKE '%3d%' 
    OR category LIKE '%3D%'
    OR name ILIKE '%3D%'
ORDER BY updated_at DESC;

-- Show count
SELECT 
    COUNT(*) as total_3d_models,
    SUM(CASE WHEN prompt_required = false THEN 1 ELSE 0 END) as no_prompt_required_image_to_3d,
    SUM(CASE WHEN prompt_required = true THEN 1 ELSE 0 END) as prompt_required_text_to_3d
FROM ai_models
WHERE 
    model_id LIKE '%3d%' 
    OR category LIKE '%3D%'
    OR name ILIKE '%3D%';

-- Separate counts for clarity
SELECT
    '=== 3D Models Breakdown ===' as info;

SELECT
    category as model_category,
    COUNT(*) as count,
    SUM(CASE WHEN prompt_required THEN 1 ELSE 0 END) as needs_prompt,
    SUM(CASE WHEN NOT prompt_required THEN 1 ELSE 0 END) as no_prompt_needed
FROM ai_models
WHERE category IN ('Text-to-3D', 'Image-to-3D')
GROUP BY category
ORDER BY category;

