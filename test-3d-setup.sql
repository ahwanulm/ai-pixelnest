-- ==========================================
-- Test Script: Verify 3D Models Setup
-- ==========================================
-- Run this after npm run setup-db to verify 3D models are configured correctly

-- 1. Show all 3D models
SELECT 
    '=== ALL 3D MODELS ===' as section;

SELECT 
    model_id,
    name,
    category,
    prompt_required,
    is_active,
    created_at
FROM ai_models
WHERE 
    model_id LIKE '%3d%' 
    OR model_id LIKE '%seed3d%'
    OR name ILIKE '%3D%'
    OR category LIKE '%3D%'
ORDER BY name;

-- 2. Check for miscategorized 3D models (should be 0)
SELECT 
    '=== MISCATEGORIZED 3D MODELS (Should be 0) ===' as section;

SELECT 
    model_id,
    name,
    category,
    prompt_required
FROM ai_models
WHERE 
    (
        model_id LIKE '%3d%' 
        OR model_id LIKE '%seed3d%'
        OR name ILIKE '%3D%'
    )
    AND (
        category != '3D Generation' 
        OR prompt_required = true
    );

-- 3. Show category statistics
SELECT 
    '=== CATEGORY STATISTICS ===' as section;

SELECT 
    category,
    COUNT(*) as total_models,
    SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active_models,
    SUM(CASE WHEN prompt_required THEN 1 ELSE 0 END) as prompt_required_count
FROM ai_models
GROUP BY category
ORDER BY category;

-- 4. Verify all models in "3D Generation" category
SELECT 
    '=== ALL MODELS IN 3D GENERATION CATEGORY ===' as section;

SELECT 
    model_id,
    name,
    provider,
    prompt_required,
    is_active
FROM ai_models
WHERE category = '3D Generation'
ORDER BY name;

-- 5. Final validation
SELECT 
    '=== VALIDATION RESULTS ===' as section;

SELECT 
    CASE 
        WHEN COUNT(*) FILTER (
            WHERE (model_id LIKE '%3d%' OR name ILIKE '%3D%')
            AND category != '3D Generation'
        ) = 0 
        THEN '✅ All 3D models have correct category'
        ELSE '❌ Some 3D models have wrong category'
    END as category_check,
    
    CASE 
        WHEN COUNT(*) FILTER (
            WHERE category = '3D Generation' 
            AND prompt_required = true
        ) = 0 
        THEN '✅ All 3D models have prompt_required = false'
        ELSE '❌ Some 3D models still require prompt'
    END as prompt_check,
    
    COUNT(*) FILTER (WHERE category = '3D Generation') as total_3d_models
FROM ai_models;

