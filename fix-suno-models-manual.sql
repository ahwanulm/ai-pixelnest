-- Manual SQL to insert Suno models
-- Run this if the automatic script has issues with schema

-- Delete existing Suno models (if any)
DELETE FROM ai_models WHERE provider = 'SUNO';

-- Insert Suno V5
INSERT INTO ai_models (
  model_id, name, provider, description, category, type,
  trending, viral, speed, quality, max_duration, cost,
  pricing_type, is_active, is_custom, metadata
) VALUES (
  'suno-v5',
  'Suno V5',
  'SUNO',
  'Latest Suno model with cutting-edge quality and enhanced capabilities. Best choice for highest quality music generation.',
  'Music',
  'audio',
  true,
  false,
  'medium',
  'premium',
  NULL,
  50,
  'fixed',
  true,
  false,
  '{"version":"v5","supports_instrumental":true,"supports_vocals":true,"supports_custom_mode":true,"supports_lyrics":true,"supports_extension":true,"api_endpoint":"/api/generate","model_tier":"premium"}'::jsonb
);

-- Insert Suno V4.5 PLUS
INSERT INTO ai_models (
  model_id, name, provider, description, category, type,
  trending, viral, speed, quality, max_duration, cost,
  pricing_type, is_active, is_custom, metadata
) VALUES (
  'suno-v4_5PLUS',
  'Suno V4.5 PLUS',
  'SUNO',
  'Most advanced V4.5 model with enhanced tonal variation and creative approaches. Supports tracks up to 8 minutes with richer sound quality.',
  'Music',
  'audio',
  true,
  false,
  'medium',
  'high',
  480,
  40,
  'fixed',
  true,
  false,
  '{"version":"v4_5PLUS","max_duration_seconds":480,"supports_instrumental":true,"supports_vocals":true,"supports_custom_mode":true,"supports_lyrics":true,"supports_extension":true,"api_endpoint":"/api/generate","model_tier":"advanced"}'::jsonb
);

-- Insert Suno V4.5
INSERT INTO ai_models (
  model_id, name, provider, description, category, type,
  trending, viral, speed, quality, max_duration, cost,
  pricing_type, is_active, is_custom, metadata
) VALUES (
  'suno-v4_5',
  'Suno V4.5',
  'SUNO',
  'Excellent prompt understanding with faster generation speeds. Supports tracks up to 8 minutes. Great for complex music requests.',
  'Music',
  'audio',
  false,
  false,
  'fast',
  'high',
  480,
  30,
  'fixed',
  true,
  false,
  '{"version":"v4_5","max_duration_seconds":480,"supports_instrumental":true,"supports_vocals":true,"supports_custom_mode":true,"supports_lyrics":true,"supports_extension":true,"api_endpoint":"/api/generate","model_tier":"standard"}'::jsonb
);

-- Insert Suno V4
INSERT INTO ai_models (
  model_id, name, provider, description, category, type,
  trending, viral, speed, quality, max_duration, cost,
  pricing_type, is_active, is_custom, metadata
) VALUES (
  'suno-v4',
  'Suno V4',
  'SUNO',
  'Enhanced vocal quality and refined audio processing. Perfect when vocal clarity is paramount. Supports tracks up to 4 minutes.',
  'Music',
  'audio',
  false,
  false,
  'medium',
  'good',
  240,
  25,
  'fixed',
  true,
  false,
  '{"version":"v4","max_duration_seconds":240,"supports_instrumental":true,"supports_vocals":true,"supports_custom_mode":true,"supports_lyrics":true,"supports_extension":true,"api_endpoint":"/api/generate","model_tier":"standard"}'::jsonb
);

-- Insert Suno V3.5
INSERT INTO ai_models (
  model_id, name, provider, description, category, type,
  trending, viral, speed, quality, max_duration, cost,
  pricing_type, is_active, is_custom, metadata
) VALUES (
  'suno-v3_5',
  'Suno V3.5',
  'SUNO',
  'Improved song organization with clear verse/chorus patterns. Great for structured musical compositions up to 4 minutes.',
  'Music',
  'audio',
  false,
  false,
  'fast',
  'good',
  240,
  20,
  'fixed',
  true,
  false,
  '{"version":"v3_5","max_duration_seconds":240,"supports_instrumental":true,"supports_vocals":true,"supports_custom_mode":true,"supports_lyrics":true,"supports_extension":true,"api_endpoint":"/api/generate","model_tier":"basic"}'::jsonb
);

-- Insert Suno Lyrics
INSERT INTO ai_models (
  model_id, name, provider, description, category, type,
  trending, viral, speed, quality, cost,
  pricing_type, is_active, is_custom, metadata
) VALUES (
  'suno-lyrics',
  'Suno Lyrics',
  'SUNO',
  'AI-powered lyrics generation. Create creative song lyrics with customizable themes and styles. FREE to use!',
  'Lyrics',
  'audio',
  false,
  false,
  'fast',
  'high',
  0,
  'free',
  true,
  false,
  '{"version":"latest","supports_instrumental":false,"supports_vocals":false,"supports_custom_mode":true,"supports_lyrics":true,"supports_extension":false,"api_endpoint":"/api/generate_lyrics","model_tier":"standard","is_free":true}'::jsonb
);

-- Insert Suno Extension
INSERT INTO ai_models (
  model_id, name, provider, description, category, type,
  trending, viral, speed, quality, cost,
  pricing_type, is_active, is_custom, metadata
) VALUES (
  'suno-extend',
  'Suno Extension',
  'SUNO',
  'Extend existing music tracks with AI-powered continuation. Maintain musical coherence and style while making tracks longer.',
  'Extension',
  'audio',
  false,
  false,
  'medium',
  'high',
  30,
  'fixed',
  true,
  false,
  '{"version":"latest","supports_instrumental":true,"supports_vocals":true,"supports_custom_mode":true,"supports_lyrics":false,"supports_extension":true,"api_endpoint":"/api/extend","model_tier":"standard","requires_audio_id":true}'::jsonb
);

-- Verify insertion
SELECT model_id, name, provider, cost FROM ai_models WHERE provider = 'SUNO' ORDER BY cost DESC;

