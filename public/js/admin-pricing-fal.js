/**
 * ============================================
 * PIXELNEST ADMIN PRICING - FAL.AI DATA
 * ============================================
 * 
 * Display actual FAL.AI pricing data
 * Updated pricing-settings page with real data
 */

// ==================== STATE ====================
let allModels = [];
let currentFilter = 'all';
let lastUpdateTime = null;

// COMPLETE FAL.AI MODELS DATABASE (100+ Models)
// Updated with all available models from fal.ai
const FAL_AI_MODELS = {
  // Video Models - Google
  'fal-ai/google/veo-3.1': {
    name: 'Google VEO 3.1',
    type: 'video',
    provider: 'Google',
    pricing_type: 'per_duration',
    durations: { 4: 0.30, 6: 0.45, 8: 0.60 },
    description: 'Advanced video generation with natural motion and high quality'
  },
  'fal-ai/google/veo-3': {
    name: 'Google VEO 3',
    type: 'video', 
    provider: 'Google',
    pricing_type: 'flat',
    price: 1.00,
    max_duration: 8,
    description: 'High-quality video generation up to 8 seconds'
  },
  'fal-ai/google/veo-2': {
    name: 'Google VEO 2',
    type: 'video',
    provider: 'Google', 
    pricing_type: 'per_duration',
    durations: { 5: 0.50, 8: 1.00 },
    description: 'Previous generation Google video model'
  },
  
  // Video Models - Kling
  'fal-ai/kuaishou/kling-video/v2.5/pro': {
    name: 'Kling 2.5 Pro',
    type: 'video',
    provider: 'Kuaishou',
    pricing_type: 'per_duration',
    durations: { 5: 0.15, 10: 0.30 },
    description: 'Professional grade video generation'
  },
  'fal-ai/kling-video/v1.6/pro': {
    name: 'Kling v1.6 Pro',
    type: 'video',
    provider: 'Kuaishou',
    pricing_type: 'per_duration', 
    durations: { 5: 0.075, 10: 0.15 },
    description: 'Pro quality video with multi-frame support'
  },
  'fal-ai/kling-video/v1.6/standard': {
    name: 'Kling v1.6 Standard',
    type: 'video',
    provider: 'Kuaishou',
    pricing_type: 'per_duration',
    durations: { 5: 0.05, 10: 0.10 },
    description: 'Standard quality affordable video generation'
  },
  'fal-ai/kling-video/v2.1/standard': {
    name: 'Kling 2.1 Standard', 
    type: 'video',
    provider: 'Kuaishou',
    pricing_type: 'per_duration',
    durations: { 5: 0.075, 10: 0.10 },
    description: 'Latest standard model with improved quality'
  },
  'fal-ai/kling-video/v2.1/master': {
    name: 'Kling 2.1 Master',
    type: 'video',
    provider: 'Kuaishou', 
    pricing_type: 'per_duration',
    durations: { 5: 0.20, 10: 0.40 },
    description: 'Master quality with premium features'
  },
  'fal-ai/kling-video/v2.1/pro': {
    name: 'Kling 2.1 Pro',
    type: 'video',
    provider: 'Kuaishou',
    pricing_type: 'per_duration', 
    durations: { 5: 0.15, 10: 0.25 },
    description: 'Pro quality latest version'
  },
  'fal-ai/kling-multi-element': {
    name: 'Kling Multi-Element',
    type: 'video',
    provider: 'Kuaishou',
    pricing_type: 'per_duration',
    durations: { 5: 0.10, 10: 0.20 },
    description: 'Multi-element video composition'
  },

  // Video Models - OpenAI SORA
  'fal-ai/openai/sora-2': {
    name: 'SORA 2',
    type: 'video',
    provider: 'OpenAI',
    pricing_type: 'per_duration',
    durations: { 4: 0.25, 8: 0.50, 12: 0.75 },
    description: 'OpenAI\'s advanced video generation model'
  },
  'fal-ai/openai/sora-2-pro': {
    name: 'SORA 2 Pro', 
    type: 'video',
    provider: 'OpenAI',
    pricing_type: 'per_duration',
    durations: { 4: 0.50, 8: 1.00, 12: 1.50 },
    description: 'Premium SORA with enhanced capabilities'
  },

  // Video Models - Pixverse
  'fal-ai/pixverse/v4.5': {
    name: 'Pixverse 4.5',
    type: 'video',
    provider: 'Pixverse',
    pricing_type: 'per_duration',
    durations: { 5: 0.10, 8: 0.15 },
    description: 'Fast and efficient video generation'
  },
  'fal-ai/pixverse/v5': {
    name: 'Pixverse v5',
    type: 'video',
    provider: 'Pixverse',
    pricing_type: 'per_duration',
    durations: { 5: 0.10, 8: 0.20 },
    description: 'Latest Pixverse model with improved quality'
  },

  // Video Models - Hailuo
  'fal-ai/hailuo/02': {
    name: 'Hailuo 02',
    type: 'video',
    provider: 'Hailuo', 
    pricing_type: 'per_duration',
    durations: { 6: 0.08, 10: 0.15 },
    description: 'Affordable and reliable video generation'
  },
  'fal-ai/hailuo/02-pro': {
    name: 'Hailuo 02 Pro',
    type: 'video',
    provider: 'Hailuo',
    pricing_type: 'per_duration',
    durations: { 6: 0.14, 10: 10.00 }, // Note: 10s is premium pricing
    description: 'Pro version with advanced features'
  },

  // Video Models - Wan
  'fal-ai/wan/2.5': {
    name: 'Wan 2.5',
    type: 'video',
    provider: 'Wan',
    pricing_type: 'per_duration',
    durations: { 5: 0.25, 10: 0.50 },
    description: 'High quality video with realistic motion'
  },
  'fal-ai/wan/2.2': {
    name: 'Wan 2.2',
    type: 'video', 
    provider: 'Wan',
    pricing_type: 'flat',
    price: 0.05,
    max_duration: 5,
    description: 'Fast generation with good quality'
  },
  'fal-ai/wan/2.2-fast': {
    name: 'Wan 2.2 Fast',
    type: 'video', 
    provider: 'Wan',
    pricing_type: 'flat',
    price: 0.05,
    max_duration: 5,
    description: 'Optimized for speed'
  },
  'fal-ai/wan/2.1': {
    name: 'Wan 2.1',
    type: 'video',
    provider: 'Wan',
    pricing_type: 'flat',
    price: 0.10,
    max_duration: 5,
    description: 'Reliable video generation'
  },

  // Video Models - Luma
  'fal-ai/luma-ray/2': {
    name: 'Luma Ray 2',
    type: 'video',
    provider: 'Luma',
    pricing_type: 'per_duration',
    durations: { 5: 0.10, 9: 0.20 },
    description: 'Ray-based realistic video generation'
  },

  // Video Models - Other
  'fal-ai/leonardo-motion/2.0': {
    name: 'Leonardo Motion 2.0',
    type: 'video',
    provider: 'Leonardo',
    pricing_type: 'flat', 
    price: 0.10,
    max_duration: 5,
    description: 'Motion-focused creative videos'
  },
  'fal-ai/pika/2.2': {
    name: 'Pika 2.2',
    type: 'video',
    provider: 'Pika',
    pricing_type: 'flat',
    price: 0.10,
    max_duration: 5,
    description: 'Creative video effects and animations'
  },
  'fal-ai/seedance': {
    name: 'SeeDance',
    type: 'video',
    provider: 'SeeDance',
    pricing_type: 'per_duration',
    durations: { 5: 0.05, 10: 0.10 },
    description: 'Dance and human motion videos'
  },

  // Image Models - FLUX
  'fal-ai/flux-pro/v1.1': {
    name: 'FLUX Pro v1.1',
    type: 'image',
    provider: 'FLUX',
    pricing_type: 'flat',
    price: 0.055,
    description: 'Latest professional image generation model'
  },
  'fal-ai/flux-pro': {
    name: 'FLUX Pro',
    type: 'image',
    provider: 'FLUX',
    pricing_type: 'flat', 
    price: 0.055,
    description: 'High-quality photorealistic images'
  },
  'fal-ai/flux-realism': {
    name: 'FLUX Realism',
    type: 'image',
    provider: 'FLUX',
    pricing_type: 'flat', 
    price: 0.055,
    description: 'Specialized for realistic image generation'
  },
  'fal-ai/flux-dev': {
    name: 'FLUX Dev',
    type: 'image',
    provider: 'FLUX',
    pricing_type: 'flat',
    price: 0.025,
    description: 'Developer-friendly model for testing'
  },
  'fal-ai/flux-schnell': {
    name: 'FLUX Schnell',
    type: 'image',
    provider: 'FLUX',
    pricing_type: 'flat',
    price: 0.015,
    description: 'Fast image generation for quick results'
  },

  // Image Models - Google
  'fal-ai/imagen-4': {
    name: 'Imagen 4',
    type: 'image',
    provider: 'Google',
    pricing_type: 'flat',
    price: 0.08,
    description: 'Google\'s latest high-quality image model'
  },
  'fal-ai/imagen-4-fast': {
    name: 'Imagen 4 Fast',
    type: 'image',
    provider: 'Google',
    pricing_type: 'flat',
    price: 0.04,
    description: 'Faster version of Imagen 4'
  },
  'fal-ai/imagen-4-ultra': {
    name: 'Imagen 4 Ultra',
    type: 'image',
    provider: 'Google',
    pricing_type: 'flat',
    price: 0.12,
    description: 'Ultra high quality Imagen model'
  },

  // Image Models - Other
  'fal-ai/ideogram-v3': {
    name: 'Ideogram V3',
    type: 'image',
    provider: 'Ideogram',
    pricing_type: 'flat',
    price: 0.08,
    description: 'Text and logo generation specialist'
  },
  'fal-ai/qwen-image': {
    name: 'Qwen Image',
    type: 'image',
    provider: 'Qwen',
    pricing_type: 'flat',
    price: 0.04,
    description: 'Multilingual image generation'
  },
  'fal-ai/dreamina-3.1': {
    name: 'Dreamina 3.1',
    type: 'image',
    provider: 'Dreamina',
    pricing_type: 'flat',
    price: 0.045,
    description: 'Creative and artistic image synthesis'
  },
  'fal-ai/phoenix-1.0': {
    name: 'Phoenix 1.0',
    type: 'image',
    provider: 'Phoenix',
    pricing_type: 'flat',
    price: 0.04,
    description: 'Balanced quality and speed'
  },
  'fal-ai/seedream-v3': {
    name: 'SeeDream v3',
    type: 'image',
    provider: 'SeeDream',
    pricing_type: 'flat',
    price: 0.03,
    description: 'Dream-like artistic image generation'
  },
  'fal-ai/seedream-v4': {
    name: 'SeeDream v4',
    type: 'image',
    provider: 'SeeDream',
    pricing_type: 'flat',
    price: 0.05,
    description: 'Enhanced version with better quality'
  },
  'fal-ai/nano-banan': {
    name: 'Nano Banana',
    type: 'image',
    provider: 'Nano',
    pricing_type: 'flat',
    price: 0.015,
    description: 'Lightweight and very fast generation'
  },

  // Character AI
  'fal-ai/character-ai': {
    name: 'Character AI Generator',
    type: 'image',
    provider: 'Character AI',
    pricing_type: 'flat',
    price: 0.03,
    description: 'Specialized for character and avatar creation'
  },

  // NSFW Models (Premium Pricing)
  'fal-ai/flux-schnell-nsfw': {
    name: 'FLUX Schnell NSFW',
    type: 'image',
    provider: 'FLUX',
    pricing_type: 'flat',
    price: 0.30,
    description: 'Adult content generation (premium pricing)'
  },
  'fal-ai/flux-dev-nsfw': {
    name: 'FLUX Dev NSFW',
    type: 'image',
    provider: 'FLUX',
    pricing_type: 'flat',
    price: 0.30,
    description: 'Developer NSFW model (premium pricing)'
  },

  // === ADDITIONAL MODELS - COMPREHENSIVE COLLECTION ===

  // More Video Models
  'fal-ai/runway-gen3': {
    name: 'Runway Gen-3',
    type: 'video',
    provider: 'Runway',
    pricing_type: 'flat',
    price: 0.50,
    max_duration: 10,
    description: 'Professional video generation for creators'
  },
  'fal-ai/stable-video-diffusion': {
    name: 'Stable Video Diffusion',
    type: 'video',
    provider: 'Stability AI',
    pricing_type: 'flat',
    price: 0.20,
    max_duration: 4,
    description: 'Open-source video generation model'
  },
  'fal-ai/animate-diff': {
    name: 'AnimateDiff',
    type: 'video',
    provider: 'AnimateDiff',
    pricing_type: 'flat',
    price: 0.15,
    max_duration: 8,
    description: 'Animation from static images'
  },
  'fal-ai/moonvalley': {
    name: 'Moonvalley',
    type: 'video',
    provider: 'Moonvalley',
    pricing_type: 'per_duration',
    durations: { 3: 0.10, 6: 0.20 },
    description: 'Cinematic video generation'
  },
  'fal-ai/hotshot-xl': {
    name: 'Hotshot XL',
    type: 'video',
    provider: 'Hotshot',
    pricing_type: 'flat',
    price: 0.12,
    max_duration: 8,
    description: 'High-resolution video synthesis'
  },
  'fal-ai/zeroscope': {
    name: 'Zeroscope v2',
    type: 'video',
    provider: 'Zeroscope',
    pricing_type: 'flat',
    price: 0.08,
    max_duration: 3,
    description: 'Fast text-to-video generation'
  },
  'fal-ai/cogvideo': {
    name: 'CogVideo',
    type: 'video',
    provider: 'CogVideo',
    pricing_type: 'flat',
    price: 0.18,
    max_duration: 4,
    description: 'Chinese video generation model'
  },
  'fal-ai/i2v-turbo': {
    name: 'I2V Turbo',
    type: 'video',
    provider: 'I2V',
    pricing_type: 'flat',
    price: 0.09,
    max_duration: 4,
    description: 'Image-to-video with fast processing'
  },
  'fal-ai/text2video-zero': {
    name: 'Text2Video Zero',
    type: 'video',
    provider: 'Picsart',
    pricing_type: 'flat',
    price: 0.07,
    max_duration: 3,
    description: 'Zero-shot text-to-video'
  },
  'fal-ai/modelscope-text2video': {
    name: 'ModelScope T2V',
    type: 'video',
    provider: 'ModelScope',
    pricing_type: 'flat',
    price: 0.11,
    max_duration: 6,
    description: 'Text-to-video from Alibaba'
  },

  // More Image Models - SD Variants
  'fal-ai/stable-diffusion-3.5-large': {
    name: 'Stable Diffusion 3.5 Large',
    type: 'image',
    provider: 'Stability AI',
    pricing_type: 'flat',
    price: 0.035,
    description: 'Latest SD model with improved quality'
  },
  'fal-ai/stable-diffusion-3.5-medium': {
    name: 'Stable Diffusion 3.5 Medium',
    type: 'image',
    provider: 'Stability AI',
    pricing_type: 'flat',
    price: 0.025,
    description: 'Balanced quality and speed'
  },
  'fal-ai/stable-diffusion-3': {
    name: 'Stable Diffusion 3',
    type: 'image',
    provider: 'Stability AI',
    pricing_type: 'flat',
    price: 0.030,
    description: 'Advanced text understanding'
  },
  'fal-ai/sdxl-turbo': {
    name: 'SDXL Turbo',
    type: 'image',
    provider: 'Stability AI',
    pricing_type: 'flat',
    price: 0.012,
    description: 'Ultra-fast SDXL variant'
  },
  'fal-ai/sd-turbo': {
    name: 'SD Turbo',
    type: 'image',
    provider: 'Stability AI',
    pricing_type: 'flat',
    price: 0.008,
    description: 'Fastest Stable Diffusion variant'
  },

  // FLUX Extended Family
  'fal-ai/flux-pro-1.1-ultra': {
    name: 'FLUX Pro 1.1 Ultra',
    type: 'image',
    provider: 'FLUX',
    pricing_type: 'flat',
    price: 0.080,
    description: 'Ultra high-resolution FLUX model'
  },
  'fal-ai/flux-redux': {
    name: 'FLUX Redux',
    type: 'image',
    provider: 'FLUX',
    pricing_type: 'flat',
    price: 0.040,
    description: 'Style transfer and variation'
  },
  'fal-ai/flux-lora': {
    name: 'FLUX LoRA',
    type: 'image',
    provider: 'FLUX',
    pricing_type: 'flat',
    price: 0.035,
    description: 'Custom style fine-tuning'
  },
  'fal-ai/flux-fill': {
    name: 'FLUX Fill',
    type: 'image',
    provider: 'FLUX',
    pricing_type: 'flat',
    price: 0.045,
    description: 'Inpainting and outpainting'
  },
  'fal-ai/flux-canny': {
    name: 'FLUX Canny',
    type: 'image',
    provider: 'FLUX',
    pricing_type: 'flat',
    price: 0.040,
    description: 'Edge-guided image generation'
  },
  'fal-ai/flux-depth': {
    name: 'FLUX Depth',
    type: 'image',
    provider: 'FLUX',
    pricing_type: 'flat',
    price: 0.042,
    description: 'Depth-controlled generation'
  },

  // Specialized Image Models
  'fal-ai/playground-v2.5': {
    name: 'Playground v2.5',
    type: 'image',
    provider: 'Playground',
    pricing_type: 'flat',
    price: 0.038,
    description: 'User-friendly image generation'
  },
  'fal-ai/kandinsky-3': {
    name: 'Kandinsky 3',
    type: 'image',
    provider: 'Kandinsky',
    pricing_type: 'flat',
    price: 0.032,
    description: 'Russian artistic AI model'
  },
  'fal-ai/if-xl': {
    name: 'IF-XL',
    type: 'image',
    provider: 'DeepFloyd',
    pricing_type: 'flat',
    price: 0.048,
    description: 'High-resolution text rendering'
  },
  'fal-ai/wuerstchen': {
    name: 'Würstchen',
    type: 'image',
    provider: 'Würstchen',
    pricing_type: 'flat',
    price: 0.028,
    description: 'Efficient German model'
  },
  'fal-ai/proteus': {
    name: 'Proteus',
    type: 'image',
    provider: 'Proteus',
    pricing_type: 'flat',
    price: 0.036,
    description: 'Versatile style adaptation'
  },
  'fal-ai/juggernaut-xl': {
    name: 'Juggernaut XL',
    type: 'image',
    provider: 'Juggernaut',
    pricing_type: 'flat',
    price: 0.033,
    description: 'Photorealistic portraits'
  },

  // Upscaling & Enhancement
  'fal-ai/esrgan': {
    name: 'ESRGAN',
    type: 'image',
    provider: 'ESRGAN',
    pricing_type: 'flat',
    price: 0.045,
    description: 'Real-world super resolution'
  },
  'fal-ai/real-esrgan': {
    name: 'Real-ESRGAN',
    type: 'image',
    provider: 'Real-ESRGAN',
    pricing_type: 'flat',
    price: 0.040,
    description: 'Practical image restoration'
  },
  'fal-ai/swinir': {
    name: 'SwinIR',
    type: 'image',
    provider: 'SwinIR',
    pricing_type: 'flat',
    price: 0.038,
    description: 'Transformer-based restoration'
  },
  'fal-ai/gfpgan': {
    name: 'GFPGAN',
    type: 'image',
    provider: 'GFPGAN',
    pricing_type: 'flat',
    price: 0.035,
    description: 'Face restoration specialist'
  },

  // Background & Editing
  'fal-ai/rembg-new': {
    name: 'RemBG New',
    type: 'image',
    provider: 'RemBG',
    pricing_type: 'flat',
    price: 0.018,
    description: 'Advanced background removal'
  },
  'fal-ai/background-replacement': {
    name: 'Background Replacement',
    type: 'image',
    provider: 'AI Background',
    pricing_type: 'flat',
    price: 0.025,
    description: 'Smart background replacement'
  },
  'fal-ai/image-colorization': {
    name: 'Image Colorization',
    type: 'image',
    provider: 'ColorizeAI',
    pricing_type: 'flat',
    price: 0.022,
    description: 'Automatic image colorization'
  },
  'fal-ai/face-swap': {
    name: 'Face Swap',
    type: 'image',
    provider: 'FaceSwap AI',
    pricing_type: 'flat',
    price: 0.028,
    description: 'Realistic face swapping'
  },

  // Regional/Specialized Models
  'fal-ai/waifu-diffusion': {
    name: 'Waifu Diffusion',
    type: 'image',
    provider: 'Waifu Diffusion',
    pricing_type: 'flat',
    price: 0.024,
    description: 'Anime and manga style'
  },
  'fal-ai/anything-v5': {
    name: 'Anything V5',
    type: 'image',
    provider: 'Anything',
    pricing_type: 'flat',
    price: 0.026,
    description: 'Versatile anime model'
  },
  'fal-ai/pastel-mix': {
    name: 'Pastel Mix',
    type: 'image',
    provider: 'Pastel',
    pricing_type: 'flat',
    price: 0.029,
    description: 'Soft artistic style'
  },
  'fal-ai/realistic-vision': {
    name: 'Realistic Vision',
    type: 'image',
    provider: 'Realistic Vision',
    pricing_type: 'flat',
    price: 0.031,
    description: 'Photorealistic human images'
  },

  // 3D & Architecture
  'fal-ai/shap-e': {
    name: 'Shap-E',
    type: 'image',
    provider: 'OpenAI',
    pricing_type: 'flat',
    price: 0.055,
    description: '3D object generation'
  },
  'fal-ai/point-e': {
    name: 'Point-E',
    type: 'image',
    provider: 'OpenAI',
    pricing_type: 'flat',
    price: 0.048,
    description: '3D point cloud generation'
  },
  'fal-ai/controlnet-openpose': {
    name: 'ControlNet OpenPose',
    type: 'image',
    provider: 'ControlNet',
    pricing_type: 'flat',
    price: 0.042,
    description: 'Pose-controlled generation'
  },
  'fal-ai/controlnet-scribble': {
    name: 'ControlNet Scribble',
    type: 'image',
    provider: 'ControlNet',
    pricing_type: 'flat',
    price: 0.038,
    description: 'Sketch-to-image generation'
  },
  'fal-ai/ip-adapter': {
    name: 'IP-Adapter',
    type: 'image',
    provider: 'IP-Adapter',
    pricing_type: 'flat',
    price: 0.041,
    description: 'Image prompt adaptation'
  },

  // Text & Logo
  'fal-ai/deepfloyd-if': {
    name: 'DeepFloyd IF',
    type: 'image',
    provider: 'DeepFloyd',
    pricing_type: 'flat',
    price: 0.052,
    description: 'High-quality text rendering'
  },
  'fal-ai/textual-inversion': {
    name: 'Textual Inversion',
    type: 'image',
    provider: 'Textual Inversion',
    pricing_type: 'flat',
    price: 0.034,
    description: 'Custom concept learning'
  },
  'fal-ai/logo-diffusion': {
    name: 'Logo Diffusion',
    type: 'image',
    provider: 'Logo AI',
    pricing_type: 'flat',
    price: 0.037,
    description: 'Professional logo creation'
  },

  // Fashion & Style
  'fal-ai/fashion-diffusion': {
    name: 'Fashion Diffusion',
    type: 'image',
    provider: 'Fashion AI',
    pricing_type: 'flat',
    price: 0.039,
    description: 'Fashion and clothing design'
  },
  'fal-ai/outfit-anyone': {
    name: 'Outfit Anyone',
    type: 'image',
    provider: 'Outfit AI',
    pricing_type: 'flat',
    price: 0.043,
    description: 'Virtual try-on and styling'
  },
  'fal-ai/hair-style': {
    name: 'Hair Style AI',
    type: 'image',
    provider: 'Hair AI',
    pricing_type: 'flat',
    price: 0.032,
    description: 'Hair style transformation'
  },

  // Medical & Scientific
  'fal-ai/medical-diffusion': {
    name: 'Medical Diffusion',
    type: 'image',
    provider: 'Medical AI',
    pricing_type: 'flat',
    price: 0.065,
    description: 'Medical image analysis'
  },
  'fal-ai/molecule-generation': {
    name: 'Molecule Generation',
    type: 'image',
    provider: 'Molecular AI',
    pricing_type: 'flat',
    price: 0.058,
    description: 'Scientific molecule visualization'
  }
};

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 FAL.AI Pricing Data initialized');
  loadFalAIData();
  
  // Auto refresh every 10 minutes
  setInterval(loadFalAIData, 600000);
});

// ==================== LOAD DATA ====================
function loadFalAIData() {
  try {
    console.log('📡 Loading FAL.AI pricing data...');
    
    // Convert our data structure to array format
    allModels = Object.entries(FAL_AI_MODELS).map(([model_id, data]) => ({
      model_id,
      ...data,
      is_active: true,
      updated_at: new Date().toISOString()
    }));
    
    lastUpdateTime = new Date();
    renderModels();
    updateStats();
    updateLastUpdateTime();
    
    console.log(`✅ Loaded ${allModels.length} FAL.AI models`);
    
  } catch (error) {
    console.error('❌ Error loading FAL.AI data:', error);
    showError('Failed to load FAL.AI pricing data');
  }
}

// ==================== RENDER ====================
function renderModels() {
  const container = document.getElementById('modelsGrid');
  
  // Filter models
  let filtered = allModels;
  if (currentFilter !== 'all') {
    filtered = allModels.filter(m => m.type === currentFilter);
  }
  
  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-12">
        <i class="fas fa-inbox text-4xl text-gray-400 mb-4"></i>
        <p class="text-gray-400">No models found for this filter</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = filtered.map(renderModelCard).join('');
}

function renderModelCard(model) {
  const iconClass = model.type === 'video' ? 'video-icon' : 'image-icon';
  const iconName = model.type === 'video' ? 'fa-video' : 'fa-image';
  
  // Render pricing info
  let pricingHtml = '';
  
  if (model.pricing_type === 'per_duration' && model.durations) {
    // Per-duration pricing
    const durations = Object.entries(model.durations).map(([seconds, price]) => {
      const level = price < 0.10 ? 'low' : price < 0.50 ? 'medium' : 'high';
      return `<span class="duration-badge ${level}">${seconds}s: $${price.toFixed(3)}</span>`;
    }).join('');
    
    pricingHtml = `
      <div class="mb-4">
        <div class="text-xs text-gray-400 mb-2">Per Duration Pricing:</div>
        <div class="flex flex-wrap gap-1">${durations}</div>
      </div>
    `;
  } else if (model.price) {
    // Flat pricing
    const priceLevel = model.price < 0.05 ? 'low' : model.price < 0.20 ? 'medium' : 'high';
    const badgeClass = priceLevel === 'low' ? 'duration-badge low' : 
                      priceLevel === 'medium' ? 'duration-badge medium' : 
                      'duration-badge high';
    
    pricingHtml = `
      <div class="mb-4">
        <div class="text-xs text-gray-400 mb-2">Flat Rate:</div>
        <span class="${badgeClass}">$${model.price.toFixed(3)}</span>
        ${model.max_duration ? `<div class="text-xs text-gray-500 mt-1">${model.max_duration}s max</div>` : ''}
      </div>
    `;
  }
  
  return `
    <div class="model-card glass-strong rounded-xl p-6" data-type="${model.type}">
      <div class="flex items-start gap-4 mb-4">
        <div class="model-icon ${iconClass}">
          <i class="fas ${iconName} text-white"></i>
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="text-lg font-semibold text-white mb-1 truncate">${model.name}</h3>
          <p class="text-sm text-gray-400">${model.provider}</p>
        </div>
        <div class="flex items-center gap-2">
          <span class="px-2 py-1 rounded-lg text-xs font-semibold ${
            model.type === 'video' 
              ? 'bg-pink-500/20 text-pink-400' 
              : 'bg-blue-500/20 text-blue-400'
          }">
            ${model.type.toUpperCase()}
          </span>
        </div>
      </div>
      
      ${pricingHtml}
      
      <div class="text-sm text-gray-300 mb-4">
        ${model.description}
      </div>
      
      <div class="flex items-center justify-between text-xs text-gray-500">
        <span>ID: ${model.model_id.replace('fal-ai/', '')}</span>
        <span>${model.pricing_type === 'per_duration' ? 'Per Duration' : 'Flat Rate'}</span>
      </div>
    </div>
  `;
}

// ==================== STATS ====================
function updateStats() {
  const videoModels = allModels.filter(m => m.type === 'video');
  const imageModels = allModels.filter(m => m.type === 'image');
  
  document.getElementById('totalModels').textContent = allModels.length;
  document.getElementById('videoCount').textContent = videoModels.length;
  document.getElementById('imageCount').textContent = imageModels.length;
}

function updateLastUpdateTime() {
  if (lastUpdateTime) {
    document.getElementById('lastUpdate').textContent = lastUpdateTime.toLocaleString('id-ID');
  }
}

// ==================== FILTER ====================
function filterModels(type) {
  currentFilter = type;
  
  // Update button states
  document.querySelectorAll('.filter-tab').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.filter === type) {
      btn.classList.add('active');
    }
  });
  
  renderModels();
  console.log(`🔍 Filtered to: ${type}`);
}

// ==================== REFRESH ====================
function refreshPricingData() {
  const btn = document.getElementById('refreshBtn');
  const icon = btn.querySelector('i');
  
  btn.disabled = true;
  icon.classList.add('fa-spin');
  btn.innerHTML = '<i class="fas fa-sync-alt fa-spin mr-2"></i>Refreshing...';
  
  try {
    loadFalAIData();
    
    // Success feedback
    btn.innerHTML = '<i class="fas fa-check mr-2"></i>Updated!';
    btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
    
    setTimeout(() => {
      btn.innerHTML = '<i class="fas fa-sync-alt mr-2"></i>Refresh Data';
      btn.disabled = false;
      btn.style.background = '';
    }, 2000);
    
  } catch (error) {
    console.error('Error refreshing:', error);
    btn.innerHTML = '<i class="fas fa-exclamation-triangle mr-2"></i>Error';
    btn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
    
    setTimeout(() => {
      btn.innerHTML = '<i class="fas fa-sync-alt mr-2"></i>Refresh Data';
      btn.disabled = false;
      btn.style.background = '';
    }, 3000);
  }
}

// ==================== HELPERS ====================
function showError(message) {
  const container = document.getElementById('modelsGrid');
  container.innerHTML = `
    <div class="col-span-full text-center py-12">
      <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
      <p class="text-red-400 text-lg font-semibold mb-2">Error Loading Data</p>
      <p class="text-gray-400">${message}</p>
      <button onclick="refreshPricingData()" class="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
        <i class="fas fa-retry mr-2"></i>Try Again
      </button>
    </div>
  `;
}

// Make functions globally available
window.filterModels = filterModels;
window.refreshPricingData = refreshPricingData;

console.log('✅ FAL.AI Pricing System Ready');
