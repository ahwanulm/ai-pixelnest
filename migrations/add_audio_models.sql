-- Add Audio Generation Models
-- Date: 2025-10-27
-- Purpose: Add popular audio/voice generation models to the system

INSERT INTO ai_models (
  model_id, 
  name, 
  provider, 
  description, 
  category, 
  type, 
  cost, 
  is_active, 
  fal_price, 
  pricing_type, 
  max_duration,
  trending,
  viral
) VALUES 
-- 1. ElevenLabs Text-to-Speech (Most Popular)
('fal-ai/elevenlabs-text-to-speech',
 'ElevenLabs TTS',
 'ElevenLabs',
 'High-quality, natural-sounding voice synthesis with multiple voices and emotions',
 'Text-to-Speech',
 'audio',
 2.0,
 true,
 0.003,
 'per_second',
 120,
 true,
 true),

-- 2. XTTS v2 (Coqui TTS - Open Source)
('fal-ai/xtts',
 'XTTS v2',
 'Coqui AI',
 'Advanced voice cloning and multilingual text-to-speech (100+ languages)',
 'Text-to-Speech',
 'audio',
 1.5,
 true,
 0.002,
 'per_second',
 300,
 true,
 false),

-- 3. Bark (Suno AI - Sound Effects)
('fal-ai/bark',
 'Bark by Suno',
 'Suno AI',
 'Text-to-audio with music, sound effects, and non-verbal communication',
 'Text-to-Audio',
 'audio',
 2.5,
 true,
 0.004,
 'per_second',
 60,
 true,
 true),

-- 4. MusicGen (Meta - Text-to-Music)
('fal-ai/musicgen',
 'MusicGen',
 'Meta AI',
 'Generate high-quality music from text descriptions',
 'Text-to-Music',
 'audio',
 3.0,
 true,
 0.005,
 'per_second',
 30,
 true,
 true),

-- 5. AudioLDM 2 (Text-to-Sound/Music)
('fal-ai/audioldm-2',
 'AudioLDM 2',
 'AudioLDM',
 'Generate sound effects, audio, and music from text prompts',
 'Text-to-Audio',
 'audio',
 2.0,
 true,
 0.003,
 'per_second',
 60,
 false,
 false),

-- 6. Whisper (Speech-to-Text - Transcription)
('fal-ai/whisper',
 'Whisper Large v3',
 'OpenAI',
 'Automatic speech recognition and translation (multilingual)',
 'Speech-to-Text',
 'audio',
 1.0,
 true,
 0.001,
 'per_second',
 3600,
 true,
 false),

-- 7. RVC (Retrieval-based Voice Conversion)
('fal-ai/rvc-v2',
 'RVC v2',
 'RVC',
 'Real-time voice conversion and voice cloning',
 'Voice-Conversion',
 'audio',
 2.5,
 true,
 0.004,
 'per_second',
 180,
 false,
 false),

-- 8. Stable Audio (Stability AI)
('fal-ai/stable-audio',
 'Stable Audio',
 'Stability AI',
 'High-quality audio generation from text descriptions',
 'Text-to-Audio',
 'audio',
 2.8,
 true,
 0.0045,
 'per_second',
 90,
 true,
 true)

ON CONFLICT (model_id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  cost = EXCLUDED.cost,
  fal_price = EXCLUDED.fal_price,
  pricing_type = EXCLUDED.pricing_type,
  trending = EXCLUDED.trending,
  viral = EXCLUDED.viral;

-- Show inserted audio models
SELECT 
  id,
  name,
  provider,
  category,
  type,
  cost,
  fal_price,
  pricing_type,
  max_duration,
  trending,
  viral
FROM ai_models 
WHERE type = 'audio'
ORDER BY viral DESC, trending DESC, name;

-- Success message
SELECT '✅ Audio generation models added successfully!' as status,
       COUNT(*) as total_audio_models
FROM ai_models 
WHERE type = 'audio';

