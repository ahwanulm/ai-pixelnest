/**
 * Suno AI Models Data
 * Based on official Suno API documentation: https://docs.sunoapi.org/
 * 
 * Models Available:
 * - v3_5: Better Song Structure (up to 4 minutes)
 * - v4: Improved Vocals (up to 4 minutes)
 * - v4_5: Smart Prompts (up to 8 minutes)
 * - v4_5PLUS: Richer Tones (up to 8 minutes)
 * - v5: Latest Model (cutting-edge quality)
 */

const sunoModels = [
  {
    model_id: 'suno-v5',
    name: 'Suno V5',
    provider: 'SUNO',
    description: 'Latest Suno model with cutting-edge quality and enhanced capabilities. Best choice for highest quality music generation.',
    category: 'Music',
    type: 'audio',
    trending: true,
    viral: false,
    speed: 'medium',
    quality: 'premium',
    max_duration: null, // Varies
    cost: 50, // Credits
    fal_price: null, // Not from fal.ai
    pricing_type: 'fixed',
    is_active: true,
    is_custom: false,
    pricing_structure: {
      type: 'fixed',
      base_price: 50,
      unit: 'per_track',
      currency: 'credits'
    },
    metadata: {
      version: 'v5',
      max_duration_seconds: null,
      supports_instrumental: true,
      supports_vocals: true,
      supports_custom_mode: true,
      supports_lyrics: true,
      supports_extension: true,
      api_endpoint: '/api/generate',
      model_tier: 'premium'
    }
  },
  {
    model_id: 'suno-v4_5PLUS',
    name: 'Suno V4.5 PLUS',
    provider: 'SUNO',
    description: 'Most advanced V4.5 model with enhanced tonal variation and creative approaches. Supports tracks up to 8 minutes with richer sound quality.',
    category: 'Music',
    type: 'audio',
    trending: true,
    viral: false,
    speed: 'medium',
    quality: 'high',
    max_duration: 480, // 8 minutes
    cost: 40,
    fal_price: null,
    pricing_type: 'fixed',
    is_active: true,
    is_custom: false,
    pricing_structure: {
      type: 'fixed',
      base_price: 40,
      unit: 'per_track',
      currency: 'credits'
    },
    metadata: {
      version: 'v4_5PLUS',
      max_duration_seconds: 480,
      supports_instrumental: true,
      supports_vocals: true,
      supports_custom_mode: true,
      supports_lyrics: true,
      supports_extension: true,
      api_endpoint: '/api/generate',
      model_tier: 'advanced'
    }
  },
  {
    model_id: 'suno-v4_5',
    name: 'Suno V4.5',
    provider: 'SUNO',
    description: 'Excellent prompt understanding with faster generation speeds. Supports tracks up to 8 minutes. Great for complex music requests.',
    category: 'Music',
    type: 'audio',
    trending: false,
    viral: false,
    speed: 'fast',
    quality: 'high',
    max_duration: 480, // 8 minutes
    cost: 30,
    fal_price: null,
    pricing_type: 'fixed',
    is_active: true,
    is_custom: false,
    pricing_structure: {
      type: 'fixed',
      base_price: 30,
      unit: 'per_track',
      currency: 'credits'
    },
    metadata: {
      version: 'v4_5',
      max_duration_seconds: 480,
      supports_instrumental: true,
      supports_vocals: true,
      supports_custom_mode: true,
      supports_lyrics: true,
      supports_extension: true,
      api_endpoint: '/api/generate',
      model_tier: 'standard'
    }
  },
  {
    model_id: 'suno-v4',
    name: 'Suno V4',
    provider: 'SUNO',
    description: 'Enhanced vocal quality and refined audio processing. Perfect when vocal clarity is paramount. Supports tracks up to 4 minutes.',
    category: 'Music',
    type: 'audio',
    trending: false,
    viral: false,
    speed: 'medium',
    quality: 'good',
    max_duration: 240, // 4 minutes
    cost: 25,
    fal_price: null,
    pricing_type: 'fixed',
    is_active: true,
    is_custom: false,
    pricing_structure: {
      type: 'fixed',
      base_price: 25,
      unit: 'per_track',
      currency: 'credits'
    },
    metadata: {
      version: 'v4',
      max_duration_seconds: 240,
      supports_instrumental: true,
      supports_vocals: true,
      supports_custom_mode: true,
      supports_lyrics: true,
      supports_extension: true,
      api_endpoint: '/api/generate',
      model_tier: 'standard'
    }
  },
  {
    model_id: 'suno-v3_5',
    name: 'Suno V3.5',
    provider: 'SUNO',
    description: 'Improved song organization with clear verse/chorus patterns. Great for structured musical compositions up to 4 minutes.',
    category: 'Music',
    type: 'audio',
    trending: false,
    viral: false,
    speed: 'fast',
    quality: 'good',
    max_duration: 240, // 4 minutes
    cost: 20,
    fal_price: null,
    pricing_type: 'fixed',
    is_active: true,
    is_custom: false,
    pricing_structure: {
      type: 'fixed',
      base_price: 20,
      unit: 'per_track',
      currency: 'credits'
    },
    metadata: {
      version: 'v3_5',
      max_duration_seconds: 240,
      supports_instrumental: true,
      supports_vocals: true,
      supports_custom_mode: true,
      supports_lyrics: true,
      supports_extension: true,
      api_endpoint: '/api/generate',
      model_tier: 'basic'
    }
  },
  {
    model_id: 'suno-lyrics',
    name: 'Suno Lyrics',
    provider: 'SUNO',
    description: 'AI-powered lyrics generation. Create creative song lyrics with customizable themes and styles. FREE to use!',
    category: 'Lyrics',
    type: 'audio',
    trending: false,
    viral: false,
    speed: 'fast',
    quality: 'high',
    max_duration: null,
    cost: 0, // FREE!
    fal_price: null,
    pricing_type: 'free',
    is_active: true,
    is_custom: false,
    pricing_structure: {
      type: 'free',
      base_price: 0,
      unit: 'per_request',
      currency: 'credits'
    },
    metadata: {
      version: 'latest',
      max_duration_seconds: null,
      supports_instrumental: false,
      supports_vocals: false,
      supports_custom_mode: true,
      supports_lyrics: true,
      supports_extension: false,
      api_endpoint: '/api/generate_lyrics',
      model_tier: 'standard',
      is_free: true
    }
  },
  {
    model_id: 'suno-extend',
    name: 'Suno Extension',
    provider: 'SUNO',
    description: 'Extend existing music tracks with AI-powered continuation. Maintain musical coherence and style while making tracks longer.',
    category: 'Extension',
    type: 'audio',
    trending: false,
    viral: false,
    speed: 'medium',
    quality: 'high',
    max_duration: null,
    cost: 30,
    fal_price: null,
    pricing_type: 'fixed',
    is_active: true,
    is_custom: false,
    pricing_structure: {
      type: 'fixed',
      base_price: 30,
      unit: 'per_extension',
      currency: 'credits'
    },
    metadata: {
      version: 'latest',
      max_duration_seconds: null,
      supports_instrumental: true,
      supports_vocals: true,
      supports_custom_mode: true,
      supports_lyrics: false,
      supports_extension: true,
      api_endpoint: '/api/extend',
      model_tier: 'standard',
      requires_audio_id: true
    }
  }
];

module.exports = sunoModels;

