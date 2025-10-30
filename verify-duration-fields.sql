/**
 * Verification Script: Duration Fields Consistency
 * 
 * Run this to verify duration fields are properly set up
 * Usage: psql $DATABASE_URL -f verify-duration-fields.sql
 */

-- ============================================
-- 1. Check if columns exist
-- ============================================
\echo '============================================'
\echo '✅ CHECKING COLUMN EXISTENCE'
\echo '============================================'

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'ai_models'
  AND column_name IN ('available_durations', 'price_per_second')
ORDER BY column_name;

\echo ''
\echo '✅ Expected: 2 rows (available_durations, price_per_second)'
\echo ''

-- ============================================
-- 2. Check indexes
-- ============================================
\echo '============================================'
\echo '✅ CHECKING INDEXES'
\echo '============================================'

SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'ai_models'
  AND (indexname LIKE '%duration%' OR indexname LIKE '%price_per_second%');

\echo ''
\echo '✅ Expected: At least 1 index on available_durations'
\echo ''

-- ============================================
-- 3. Check video models with duration data
-- ============================================
\echo '============================================'
\echo '✅ VIDEO MODELS WITH DURATION DATA'
\echo '============================================'

SELECT 
    model_id,
    name,
    type,
    available_durations,
    price_per_second,
    fal_price,
    max_duration
FROM ai_models
WHERE type = 'video' 
  AND available_durations IS NOT NULL
ORDER BY name
LIMIT 10;

\echo ''
\echo '✅ Expected: Video models with duration info (Kling, Veo, etc.)'
\echo ''

-- ============================================
-- 4. Summary statistics
-- ============================================
\echo '============================================'
\echo '📊 SUMMARY STATISTICS'
\echo '============================================'

SELECT 
    type,
    COUNT(*) as total_models,
    COUNT(available_durations) as models_with_durations,
    COUNT(price_per_second) as models_with_price_per_second,
    ROUND(AVG(price_per_second), 4) as avg_price_per_second
FROM ai_models
WHERE is_active = true
GROUP BY type
ORDER BY type;

\echo ''
\echo '✅ Expected: Video models should have duration data'
\echo ''

-- ============================================
-- 5. Detailed breakdown by model
-- ============================================
\echo '============================================'
\echo '📋 DETAILED BREAKDOWN (Top 20 Models)'
\echo '============================================'

SELECT 
    name,
    type,
    category,
    available_durations,
    price_per_second,
    cost as credits,
    CASE 
        WHEN available_durations IS NOT NULL THEN '✅'
        ELSE '❌'
    END as has_durations,
    CASE 
        WHEN price_per_second IS NOT NULL THEN '✅'
        ELSE '❌'
    END as has_price_ps
FROM ai_models
WHERE is_active = true
ORDER BY type, name
LIMIT 20;

\echo ''
\echo '============================================'
\echo '✅ VERIFICATION COMPLETE!'
\echo '============================================'
\echo ''
\echo 'If you see duration data for video models, setup is CORRECT! ✅'
\echo 'If columns are missing, run: psql $DATABASE_URL -f migrations/add_duration_fields.sql'
\echo ''

-- ============================================
-- 6. Test query: Get durations for specific model
-- ============================================
\echo '============================================'
\echo '🔍 EXAMPLE QUERY: Get Kling model durations'
\echo '============================================'

SELECT 
    model_id,
    name,
    available_durations,
    price_per_second,
    available_durations::jsonb->0 as first_duration,
    available_durations::jsonb->1 as second_duration
FROM ai_models
WHERE model_id LIKE '%kling%'
  AND type = 'video'
LIMIT 1;

\echo ''
\echo '✅ Should show Kling with ["5", "10"] or similar'
\echo ''

