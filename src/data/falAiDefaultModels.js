/**
 * =================================================================
 * FAL.AI DEFAULT MODELS - Essential Collection
 * =================================================================
 * 
 * Last Updated: October 28, 2025
 * Source: fal.ai official pricing
 * Purpose: Default models untuk database setup
 * 
 * PRICING VERIFIED FROM FAL.AI:
 * - Image models: Mostly flat rate
 * - Video models: Mix of flat and per-second
 * - FLUX models: Per-megapixel pricing
 * 
 * Credit Calculation:
 * credits = (fal_price in USD × 16,000) ÷ 500
 * 
 * =================================================================
 */

const type = { IMAGE: 'image', VIDEO: 'video', AUDIO: 'audio' };

const FAL_AI_DEFAULT_MODELS = [
  
  // ========================================
  // 🎬 VIDEO MODELS (LATEST & VERIFIED)
  // ========================================
  
  // KLING 2.5 SERIES (Latest 2025/2026)
  {
    id: 'fal-ai/kuaishou/kling-video/v2.5/pro/text-to-video',
    name: 'Kling 2.5 Pro',
    provider: 'Kuaishou',
    description: 'Latest Kling 2.5 Pro with ultra-fast generation and superior quality',
    category: 'Text-to-Video',
    type: type.VIDEO,
    trending: true,
    viral: true,
    speed: 'very-fast',
    quality: 'excellent',
    maxDuration: 10,
    fal_price: 0.30,  // Verified from fal.ai
    pricing_type: 'flat',
    pricing_structure: 'simple'
  },
  {
    id: 'fal-ai/kuaishou/kling-video/v2.5/standard/text-to-video',
    name: 'Kling 2.5 Standard',
    provider: 'Kuaishou',
    description: 'Affordable high-quality video generation',
    category: 'Text-to-Video',
    type: type.VIDEO,
    trending: true,
    speed: 'medium',
    quality: 'excellent',
    maxDuration: 10,
    fal_price: 0.15,  // Verified
    pricing_type: 'flat',
    pricing_structure: 'simple'
  },
  
  // KLING 1.6 SERIES
  {
    id: 'fal-ai/kling-video/v1.6/pro/text-to-video',
    name: 'Kling v1.6 Pro',
    provider: 'Kuaishou',
    description: 'Professional quality text-to-video generation',
    category: 'Text-to-Video',
    type: type.VIDEO,
    trending: true,
    viral: true,
    speed: 'medium',
    quality: 'excellent',
    maxDuration: 10,
    fal_price: 0.15,  // Per-second: $0.15/s
    pricing_type: 'per_second',
    pricing_structure: 'simple'
  },
  
  // GOOGLE VEO SERIES
  {
    id: 'fal-ai/google/veo-3.1',
    name: 'Google Veo 3.1',
    provider: 'Google DeepMind',
    description: "Google's latest video generation with premium quality",
    category: 'Text-to-Video',
    type: type.VIDEO,
    trending: true,
    viral: true,
    speed: 'medium',
    quality: 'excellent',
    maxDuration: 8,
    fal_price: 0.70,  // Flat rate for 8s
    pricing_type: 'flat',
    pricing_structure: 'simple'
  },
  {
    id: 'fal-ai/google/veo-2',
    name: 'Google Veo 2',
    provider: 'Google DeepMind',
    description: 'High-quality video generation from Google',
    category: 'Text-to-Video',
    type: type.VIDEO,
    trending: true,
    speed: 'medium',
    quality: 'excellent',
    maxDuration: 8,
    fal_price: 0.50,  // Flat rate
    pricing_type: 'flat',
    pricing_structure: 'simple'
  },
  
  // SORA & RUNWAY
  {
    id: 'fal-ai/runway-gen3/turbo/text-to-video',
    name: 'Runway Gen-3 Turbo',
    provider: 'Runway',
    description: 'Fast and high-quality video generation',
    category: 'Text-to-Video',
    type: type.VIDEO,
    trending: true,
    viral: true,
    speed: 'very-fast',
    quality: 'excellent',
    maxDuration: 10,
    fal_price: 0.50,  // Flat rate
    pricing_type: 'flat',
    pricing_structure: 'simple'
  },
  
  // OTHER VIDEO MODELS
  {
    id: 'fal-ai/luma-dream-machine',
    name: 'Luma Dream Machine',
    provider: 'Luma AI',
    description: 'Cinematic video generation with realistic motion',
    category: 'Text-to-Video',
    type: type.VIDEO,
    trending: true,
    viral: true,
    speed: 'medium',
    quality: 'excellent',
    maxDuration: 5,
    fal_price: 0.50,  // Flat rate
    pricing_type: 'flat',
    pricing_structure: 'simple'
  },
  {
    id: 'fal-ai/minimax-video/image-to-video',
    name: 'MiniMax Video',
    provider: 'MiniMax',
    description: 'High-quality image-to-video transformation',
    category: 'Image-to-Video',
    type: type.VIDEO,
    trending: true,
    speed: 'fast',
    quality: 'very-good',
    maxDuration: 6,
    fal_price: 0.40,  // Flat rate
    pricing_type: 'flat',
    pricing_structure: 'simple'
  },
  {
    id: 'fal-ai/haiper-video/v2/image-to-video',
    name: 'Haiper AI v2',
    provider: 'Haiper',
    description: 'Animate images with creative video effects',
    category: 'Image-to-Video',
    type: type.VIDEO,
    trending: false,
    speed: 'fast',
    quality: 'very-good',
    maxDuration: 6,
    fal_price: 0.25,  // Flat rate
    pricing_type: 'flat',
    pricing_structure: 'simple'
  },
  {
    id: 'fal-ai/stable-video-diffusion',
    name: 'Stable Video Diffusion',
    provider: 'Stability AI',
    description: 'Open-source video generation model',
    category: 'Image-to-Video',
    type: type.VIDEO,
    trending: false,
    speed: 'medium',
    quality: 'good',
    maxDuration: 4,
    fal_price: 0.20,  // Flat rate
    pricing_type: 'flat',
    pricing_structure: 'simple'
  },
  
  // ========================================
  // 🖼️ IMAGE MODELS (VERIFIED PRICING)
  // ========================================
  
  // FLUX SERIES (Per-Megapixel)
  {
    id: 'fal-ai/flux-pro/v1.1',
    name: 'FLUX Pro v1.1',
    provider: 'Black Forest Labs',
    description: 'Latest FLUX Pro with improved quality and speed',
    category: 'Text-to-Image',
    type: type.IMAGE,
    trending: true,
    viral: true,
    speed: 'fast',
    quality: 'excellent',
    fal_price: 0.04,  // Per megapixel
    pricing_type: 'per_megapixel',
    pricing_structure: 'per_megapixel',
    price_per_megapixel: 0.04,
    base_megapixels: 1.0,
    max_megapixels: 2.0
  },
  {
    id: 'fal-ai/flux-pro/v1.1-ultra',
    name: 'FLUX Pro v1.1 Ultra',
    provider: 'Black Forest Labs',
    description: 'Ultra high-quality FLUX Pro with raw mode',
    category: 'Text-to-Image',
    type: type.IMAGE,
    trending: true,
    viral: true,
    speed: 'medium',
    quality: 'excellent',
    fal_price: 0.06,  // Per megapixel
    pricing_type: 'per_megapixel',
    pricing_structure: 'per_megapixel',
    price_per_megapixel: 0.06,
    base_megapixels: 1.0,
    max_megapixels: 2.0
  },
  {
    id: 'fal-ai/flux-pro',
    name: 'FLUX Pro',
    provider: 'Black Forest Labs',
    description: 'Professional grade image generation with FLUX',
    category: 'Text-to-Image',
    type: type.IMAGE,
    trending: true,
    speed: 'fast',
    quality: 'excellent',
    fal_price: 0.055,  // Per megapixel
    pricing_type: 'per_megapixel',
    pricing_structure: 'per_megapixel',
    price_per_megapixel: 0.055,
    base_megapixels: 1.0,
    max_megapixels: 2.0
  },
  {
    id: 'fal-ai/flux/dev',
    name: 'FLUX Dev',
    provider: 'Black Forest Labs',
    description: 'FLUX development model for testing and experimentation',
    category: 'Text-to-Image',
    type: type.IMAGE,
    trending: true,
    speed: 'fast',
    quality: 'very-good',
    fal_price: 0.025,  // Flat rate
    pricing_type: 'flat',
    pricing_structure: 'simple'
  },
  {
    id: 'fal-ai/flux/schnell',
    name: 'FLUX Schnell',
    provider: 'Black Forest Labs',
    description: 'Ultra-fast FLUX model for rapid iterations',
    category: 'Text-to-Image',
    type: type.IMAGE,
    trending: true,
    speed: 'ultra-fast',
    quality: 'good',
    fal_price: 0.003,  // Flat rate
    pricing_type: 'flat',
    pricing_structure: 'simple'
  },
  {
    id: 'fal-ai/flux-realism',
    name: 'FLUX Realism',
    provider: 'XLabs AI',
    description: 'Photorealistic image generation with FLUX',
    category: 'Text-to-Image',
    type: type.IMAGE,
    trending: true,
    viral: true,
    speed: 'fast',
    quality: 'excellent',
    fal_price: 0.03,  // Flat rate
    pricing_type: 'flat',
    pricing_structure: 'simple'
  },
  
  // IDEOGRAM & IMAGEN
  {
    id: 'fal-ai/ideogram/v2',
    name: 'Ideogram v2',
    provider: 'Ideogram',
    description: 'Advanced text-in-image generation',
    category: 'Text-to-Image',
    type: type.IMAGE,
    trending: true,
    speed: 'fast',
    quality: 'excellent',
    fal_price: 0.08,  // Flat rate
    pricing_type: 'flat',
    pricing_structure: 'simple'
  },
  {
    id: 'fal-ai/ideogram/v2/turbo',
    name: 'Ideogram v2 Turbo',
    provider: 'Ideogram',
    description: 'Fast text-in-image generation',
    category: 'Text-to-Image',
    type: type.IMAGE,
    trending: true,
    speed: 'ultra-fast',
    quality: 'very-good',
    fal_price: 0.035,  // Flat rate
    pricing_type: 'flat',
    pricing_structure: 'simple'
  },
  
  // STABLE DIFFUSION SERIES
  {
    id: 'fal-ai/stable-diffusion-v3-5-large',
    name: 'Stable Diffusion 3.5 Large',
    provider: 'Stability AI',
    description: 'Latest Stable Diffusion with improved quality',
    category: 'Text-to-Image',
    type: type.IMAGE,
    trending: true,
    speed: 'medium',
    quality: 'very-good',
    fal_price: 0.025,  // Flat rate
    pricing_type: 'flat',
    pricing_structure: 'simple'
  },
  {
    id: 'fal-ai/stable-diffusion-xl',
    name: 'SDXL',
    provider: 'Stability AI',
    description: 'Stable Diffusion XL for high-resolution images',
    category: 'Text-to-Image',
    type: type.IMAGE,
    trending: false,
    speed: 'medium',
    quality: 'very-good',
    fal_price: 0.015,  // Flat rate
    pricing_type: 'flat',
    pricing_structure: 'simple'
  },
  {
    id: 'fal-ai/stable-diffusion-v3-medium',
    name: 'Stable Diffusion 3 Medium',
    provider: 'Stability AI',
    description: 'Balanced performance and quality',
    category: 'Text-to-Image',
    type: type.IMAGE,
    trending: false,
    speed: 'fast',
    quality: 'good',
    fal_price: 0.0035,  // Flat rate
    pricing_type: 'flat',
    pricing_structure: 'simple'
  },
  
  // RECRAFT & SPECIALTY
  {
    id: 'fal-ai/recraft-v3',
    name: 'Recraft V3',
    provider: 'Recraft AI',
    description: 'Professional design and illustration generation',
    category: 'Text-to-Image',
    type: type.IMAGE,
    trending: true,
    speed: 'fast',
    quality: 'excellent',
    fal_price: 0.04,  // Flat rate
    pricing_type: 'flat',
    pricing_structure: 'simple'
  },
  {
    id: 'fal-ai/aura-flow',
    name: 'AuraFlow',
    provider: 'Fal.ai',
    description: 'Open-source high-quality image generation',
    category: 'Text-to-Image',
    type: type.IMAGE,
    trending: false,
    speed: 'fast',
    quality: 'very-good',
    fal_price: 0.015,  // Flat rate
    pricing_type: 'flat',
    pricing_structure: 'simple'
  },
  
  // ========================================
  // 🎨 IMAGE EDITING & UPSCALING
  // ========================================
  
  {
    id: 'fal-ai/clarity-upscaler',
    name: 'Clarity Upscaler',
    provider: 'Philz',
    description: 'AI-powered image upscaling with enhanced details',
    category: 'Upscaling',
    type: type.IMAGE,
    trending: true,
    speed: 'medium',
    quality: 'excellent',
    fal_price: 0.05,  // Estimate for 4x upscale
    pricing_type: 'flat',
    pricing_structure: 'simple'
  },
  {
    id: 'fal-ai/ccsr',
    name: 'CCSR Upscaler',
    provider: 'Community',
    description: 'Controlled image super-resolution',
    category: 'Upscaling',
    type: type.IMAGE,
    trending: false,
    speed: 'medium',
    quality: 'very-good',
    fal_price: 0.04,
    pricing_type: 'flat',
    pricing_structure: 'simple'
  },

  // ========================================
  // 🎲 3D MODELS (VERIFIED PRICING)
  // ========================================

  {
    id: 'fal-ai/bytedance/seed3d',
    name: 'Bytedance Seed3D',
    provider: 'ByteDance',
    description: 'Convert images to high-quality 3D models with photorealistic neural radiance fields',
    category: 'Image-to-3D', // ✅ Specific category for image-to-3d
    type: type.IMAGE,
    trending: true,
    viral: false,
    speed: 'medium',
    quality: 'excellent',
    fal_price: 0.08,  // Verified from fal.ai
    pricing_type: 'flat',
    pricing_structure: 'simple'
  },

  // ========================================
  // 🎵 AUDIO MODELS
  // ========================================
  
  {
    id: 'fal-ai/stable-audio',
    name: 'Stable Audio',
    provider: 'Stability AI',
    description: 'High-quality audio and music generation',
    category: 'Audio Generation',
    type: type.AUDIO,
    trending: true,
    speed: 'medium',
    quality: 'excellent',
    fal_price: 0.03,
    pricing_type: 'flat',
    pricing_structure: 'simple'
  }
];

module.exports = FAL_AI_DEFAULT_MODELS;

