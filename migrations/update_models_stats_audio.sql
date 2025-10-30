-- ============================================
-- Update models_stats view to include audio models
-- ============================================

-- Drop and recreate the models_stats view with audio support
DROP VIEW IF EXISTS models_stats CASCADE;

CREATE OR REPLACE VIEW models_stats AS
SELECT
  COUNT(*) as total_models,
  COUNT(*) FILTER (WHERE type = 'image') as image_models,
  COUNT(*) FILTER (WHERE type = 'video') as video_models,
  COUNT(*) FILTER (WHERE type = 'audio') as audio_models,
  COUNT(*) FILTER (WHERE trending = true) as trending_models,
  COUNT(*) FILTER (WHERE viral = true) as viral_models,
  COUNT(*) FILTER (WHERE is_custom = true) as custom_models,
  COUNT(*) FILTER (WHERE is_active = true) as active_models
FROM ai_models;

-- Display stats
SELECT * FROM models_stats;

