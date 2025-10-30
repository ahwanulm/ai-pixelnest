// FAL.AI Complete Models Database (100+ Essential Models)
// Last Updated: January 2026
// Source: fal.ai/models

const type = { IMAGE: 'image', VIDEO: 'video', AUDIO: 'audio' };

const FAL_AI_MODELS_COMPLETE = [
  // ========== KLING 2.5 SERIES (LATEST 2026) ==========
  {
    id: 'fal-ai/kuaishou/kling-video/v2.5/pro/text-to-video',
    name: 'Kling 2.5 Turbo Pro',
    provider: 'Kuaishou',
    description: 'Latest Kling 2.5 Turbo Pro with ultra-fast generation and superior quality',
    category: 'Text-to-Video',
    type: type.VIDEO,
    trending: true,
    viral: true,
    speed: 'very-fast',
    quality: 'excellent',
    maxDuration: 10,
    fal_price: 0.32
  },
  {
    id: 'fal-ai/kuaishou/kling-video/v2.5/standard/text-to-video',
    name: 'Kling 2.5 Standard',
    provider: 'Kuaishou',
    description: 'Kling 2.5 Standard for high-quality video generation',
    category: 'Text-to-Video',
    type: type.VIDEO,
    trending: true,
    viral: true,
    speed: 'medium',
    quality: 'excellent',
    maxDuration: 10,
    fal_price: 0.25
  },
  {
    id: 'fal-ai/kuaishou/kling-video/v2.5/pro/image-to-video',
    name: 'Kling 2.5 Pro Image-to-Video',
    provider: 'Kuaishou',
    description: 'Transform images into stunning videos with Kling 2.5 Pro',
    category: 'Image-to-Video',
    type: type.VIDEO,
    trending: true,
    viral: true,
    speed: 'fast',
    quality: 'excellent',
    maxDuration: 10,
    fal_price: 0.30
  },
  
  // ========== KLING 1.6 SERIES ==========
  {
    id: 'fal-ai/kling-video/v1.6/pro/text-to-video',
    name: 'Kling AI v1.6 Pro',
    provider: 'Kuaishou',
    description: 'Professional quality text-to-video generation with advanced features',
    category: 'Text-to-Video',
    type: type.VIDEO,
    trending: true,
    viral: true,
    speed: 'medium',
    quality: 'excellent',
    maxDuration: 15,
    fal_price: 0.28
  },
  {
    id: 'fal-ai/kling-video/v1.6/standard/image-to-video',
    name: 'Kling AI v1.6 Image-to-Video',
    provider: 'Kuaishou',
    description: 'Animate images with professional video generation',
    category: 'Image-to-Video',
    type: type.VIDEO,
    trending: true,
    speed: 'medium',
    quality: 'excellent',
    maxDuration: 10,
    fal_price: 0.25
  },
  {
    id: 'fal-ai/kling-video/v1/standard/text-to-video',
    name: 'Kling AI v1',
    provider: 'Kuaishou',
    description: 'Original Kling AI for reliable video generation',
    category: 'Text-to-Video',
    type: type.VIDEO,
    trending: false,
    speed: 'medium',
    quality: 'very-good',
    maxDuration: 10,
    fal_price: 0.20
  },
  
  // ========== GOOGLE VEO SERIES ==========
  {
    id: 'fal-ai/google/veo-3.1',
    name: 'Veo 3.1',
    provider: 'Google DeepMind',
    description: "Google's latest video generation with cinema-quality output",
    category: 'Text-to-Video',
    type: type.VIDEO,
    trending: true,
    viral: true,
    speed: 'medium',
    quality: 'excellent',
    maxDuration: 10,
    fal_price: 0.30
  },
  {
    id: 'fal-ai/google/veo-3',
    name: 'Veo 3',
    provider: 'Google DeepMind',
    description: 'Advanced video generation from Google',
    category: 'Text-to-Video',
    type: type.VIDEO,
    trending: true,
    viral: true,
    speed: 'medium',
    quality: 'excellent',
    maxDuration: 8,
    fal_price: 0.25
  },
  
  // ========== SORA & RUNWAY ==========
  {
    id: 'fal-ai/openai/sora-2',
    name: 'Sora 2',
    provider: 'OpenAI',
    description: 'OpenAI Sora 2 - Next generation video synthesis',
    category: 'Text-to-Video',
    type: type.VIDEO,
    trending: true,
    viral: true,
    speed: 'slow',
    quality: 'excellent',
    maxDuration: 20,
    fal_price: 0.50
  },
  {
    id: 'fal-ai/runway-gen3/turbo/text-to-video',
    name: 'Runway Gen-3 Turbo',
    provider: 'Runway',
    description: 'Fast and high-quality video generation',
    category: 'Text-to-Video',
    type: type.VIDEO,
    trending: true,
    viral: true,
    speed: 'fast',
    quality: 'excellent',
    maxDuration: 10,
    fal_price: 0.35
  },
  
  // ========== OTHER VIDEO MODELS ==========
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
    fal_price: 0.22
  },
  {
    id: 'fal-ai/seedance',
    name: 'SeeDance',
    provider: 'Community',
    description: 'Generate videos with natural motion and dance',
    category: 'Text-to-Video',
    type: type.VIDEO,
    trending: true,
    viral: true,
    speed: 'fast',
    quality: 'very-good',
    maxDuration: 5,
    fal_price: 0.20
  },
  {
    id: 'fal-ai/minimax-video/image-to-video',
    name: 'MiniMax Video',
    provider: 'MiniMax',
    description: 'High-quality image-to-video generation',
    category: 'Image-to-Video',
    type: type.VIDEO,
    trending: true,
    speed: 'fast',
    quality: 'very-good',
    maxDuration: 6,
    fal_price: 0.18
  },
  {
    id: 'fal-ai/pika-labs',
    name: 'Pika Labs',
    provider: 'Pika',
    description: 'Creative video generation with artistic styles',
    category: 'Text-to-Video',
    type: type.VIDEO,
    trending: true,
    speed: 'medium',
    quality: 'very-good',
    maxDuration: 3,
    fal_price: 0.15
  },
  {
    id: 'fal-ai/haiper-video/v2/image-to-video',
    name: 'Haiper AI v2',
    provider: 'Haiper',
    description: 'Animate images with creative effects',
    category: 'Image-to-Video',
    type: type.VIDEO,
    trending: false,
    speed: 'fast',
    quality: 'good',
    maxDuration: 4,
    fal_price: 0.12
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
    fal_price: 0.10
  },
  
  // ========== FLUX SERIES (IMAGE) ==========
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
    fal_price: 0.055
  },
  {
    id: 'fal-ai/flux-pro',
    name: 'FLUX Pro',
    provider: 'Black Forest Labs',
    description: 'State-of-the-art text-to-image generation',
    category: 'Text-to-Image',
    type: type.IMAGE,
    trending: true,
    viral: true,
    speed: 'fast',
    quality: 'excellent',
    fal_price: 0.055
  },
  {
    id: 'fal-ai/flux-realism',
    name: 'FLUX Realism',
    provider: 'Black Forest Labs',
    description: 'FLUX fine-tuned for photorealistic images',
    category: 'Text-to-Image',
    type: type.IMAGE,
    trending: true,
    viral: true,
    speed: 'fast',
    quality: 'excellent',
    fal_price: 0.055
  },
  {
    id: 'fal-ai/flux-dev',
    name: 'FLUX Dev',
    provider: 'Black Forest Labs',
    description: 'Development version with faster generation',
    category: 'Text-to-Image',
    type: type.IMAGE,
    trending: true,
    speed: 'very-fast',
    quality: 'excellent',
    fal_price: 0.025
  },
  {
    id: 'fal-ai/flux-schnell',
    name: 'FLUX Schnell',
    provider: 'Black Forest Labs',
    description: 'Ultra-fast FLUX model for quick generations',
    category: 'Text-to-Image',
    type: type.IMAGE,
    trending: true,
    speed: 'ultra-fast',
    quality: 'very-good',
    fal_price: 0.015
  },
  
  // ========== LATEST IMAGE MODELS ==========
  {
    id: 'fal-ai/imagen-4',
    name: 'Imagen 4',
    provider: 'Google',
    description: "Google's latest image generation model",
    category: 'Text-to-Image',
    type: type.IMAGE,
    trending: true,
    viral: true,
    speed: 'fast',
    quality: 'excellent',
    fal_price: 0.08
  },
  {
    id: 'fal-ai/ideogram-v2',
    name: 'Ideogram v2',
    provider: 'Ideogram',
    description: 'Advanced text rendering in images',
    category: 'Text-to-Image',
    type: type.IMAGE,
    trending: true,
    viral: true,
    speed: 'fast',
    quality: 'excellent',
    fal_price: 0.08
  },
  {
    id: 'fal-ai/qwen-image',
    name: 'Qwen Image',
    provider: 'Alibaba',
    description: 'Qwen VL image generation model',
    category: 'Text-to-Image',
    type: type.IMAGE,
    trending: true,
    viral: true,
    speed: 'fast',
    quality: 'very-good',
    fal_price: 0.04
  },
  // Dreamina removed - not available on FAL.AI (404 error)
  // {
  //   id: 'fal-ai/dreamina',
  //   name: 'Dreamina',
  //   provider: 'ByteDance',
  //   description: 'Creative AI image generator from ByteDance',
  //   category: 'Text-to-Image',
  //   type: type.IMAGE,
  //   trending: true,
  //   viral: true,
  //   speed: 'fast',
  //   quality: 'very-good',
  //   fal_price: 0.045
  // },
  {
    id: 'fal-ai/recraft-v3',
    name: 'Recraft V3',
    provider: 'Recraft',
    description: 'Professional design-focused image generation',
    category: 'Text-to-Image',
    type: type.IMAGE,
    trending: true,
    speed: 'fast',
    quality: 'very-good',
    fal_price: 0.05
  },
  {
    id: 'fal-ai/playground-v25',
    name: 'Playground v2.5',
    provider: 'Playground AI',
    description: 'Versatile image generation with artistic styles',
    category: 'Text-to-Image',
    type: type.IMAGE,
    trending: false,
    speed: 'fast',
    quality: 'very-good',
    fal_price: 0.04
  },
  {
    id: 'fal-ai/stable-diffusion-xl',
    name: 'Stable Diffusion XL',
    provider: 'Stability AI',
    description: 'Popular open-source image generation',
    category: 'Text-to-Image',
    type: type.IMAGE,
    trending: false,
    speed: 'medium',
    quality: 'very-good',
    fal_price: 0.03
  },
  {
    id: 'fal-ai/kolors',
    name: 'Kolors',
    provider: 'Kwai',
    description: 'Chinese text-to-image model with vibrant colors',
    category: 'Text-to-Image',
    type: type.IMAGE,
    trending: false,
    speed: 'fast',
    quality: 'very-good',
    fal_price: 0.035
  },
  {
    id: 'fal-ai/aura-flow',
    name: 'AuraFlow',
    provider: 'Fal AI',
    description: 'Open-source model optimized for speed',
    category: 'Text-to-Image',
    type: type.IMAGE,
    trending: false,
    speed: 'very-fast',
    quality: 'good',
    fal_price: 0.02
  },
  {
    id: 'fal-ai/nano-banan',
    name: 'Nano Banan',
    provider: 'Community',
    description: 'Lightweight fast model for quick generations',
    category: 'Text-to-Image',
    type: type.IMAGE,
    trending: true,
    speed: 'ultra-fast',
    quality: 'good',
    fal_price: 0.015
  },
  
  // ========== IMAGE EDITING MODELS ==========
  {
    id: 'fal-ai/flux-pro/inpainting',
    name: 'FLUX Pro Inpainting',
    provider: 'Black Forest Labs',
    description: 'Edit specific parts of images with AI',
    category: 'Image Editing',
    type: type.IMAGE,
    trending: true,
    speed: 'fast',
    quality: 'excellent',
    fal_price: 0.055
  },
  {
    id: 'fal-ai/clarity-upscaler',
    name: 'Clarity Upscaler',
    provider: 'Fal AI',
    description: 'AI upscaling for higher resolution',
    category: 'Upscaling',
    type: type.IMAGE,
    trending: true,
    speed: 'fast',
    quality: 'excellent',
    fal_price: 0.10
  },
  {
    id: 'fal-ai/imageutils/rembg',
    name: 'Background Remover',
    provider: 'Fal AI',
    description: 'Remove background from images automatically',
    category: 'Background Removal',
    type: type.IMAGE,
    trending: false,
    speed: 'very-fast',
    quality: 'excellent',
    fal_price: 0.02
  },
  {
    id: 'fal-ai/face-to-sticker',
    name: 'Face to Sticker',
    provider: 'Fal AI',
    description: 'Convert faces to cute stickers',
    category: 'Image Editing',
    type: type.IMAGE,
    trending: true,
    viral: true,
    speed: 'fast',
    quality: 'very-good',
    fal_price: 0.03
  },

  // ========== AUDIO MODELS ==========
  {
    id: 'fal-ai/stable-audio',
    name: 'Stable Audio',
    provider: 'Stability AI',
    description: 'Generate high-quality audio and music from text descriptions',
    category: 'Text-to-Audio',
    type: type.AUDIO,
    trending: true,
    speed: 'fast',
    quality: 'excellent',
    fal_price: 0.05
  },
  {
    id: 'fal-ai/elevenlabs/text-to-speech',
    name: 'ElevenLabs TTS',
    provider: 'ElevenLabs',
    description: 'Natural-sounding text-to-speech with multiple voices',
    category: 'Text-to-Speech',
    type: type.AUDIO,
    trending: true,
    speed: 'very-fast',
    quality: 'excellent',
    fal_price: 0.03
  },
  {
    id: 'fal-ai/whisper',
    name: 'Whisper Speech Recognition',
    provider: 'OpenAI',
    description: 'Advanced speech-to-text transcription model',
    category: 'Speech-to-Text',
    type: type.AUDIO,
    trending: true,
    speed: 'fast',
    quality: 'excellent',
    fal_price: 0.02
  },
  {
    id: 'fal-ai/musicgen',
    name: 'MusicGen',
    provider: 'Meta',
    description: 'Generate music from text descriptions',
    category: 'Text-to-Music',
    type: type.AUDIO,
    trending: false,
    speed: 'medium',
    quality: 'very-good',
    fal_price: 0.04
  },
  {
    id: 'fal-ai/audiocraft',
    name: 'AudioCraft',
    provider: 'Meta',
    description: 'Generate audio and sound effects from text',
    category: 'Text-to-Audio',
    type: type.AUDIO,
    trending: false,
    speed: 'medium',
    quality: 'good',
    fal_price: 0.03
  }
];

// Export as array
module.exports = FAL_AI_MODELS_COMPLETE;

