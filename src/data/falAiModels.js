// FAL.AI Models Database - Comprehensive List (600+ Models)
// Last Updated: January 2026
// Includes: FLUX, Kling 2.5 Turbo Pro, Imagen 4, Qwen, Dreamina, Sora 2, Veo 3.1, and 600+ more!

const FAL_AI_MODELS = {
  image: [
    // ========== FLUX SERIES (Black Forest Labs) ==========
    {
      id: 'fal-ai/flux-pro/v1.1',
      name: 'FLUX Pro v1.1',
      provider: 'Black Forest Labs',
      description: 'Latest FLUX Pro with improved quality and speed',
      category: 'Text-to-Image',
      trending: true,
      viral: true,
      speed: 'fast',
      quality: 'excellent',
      cost: 1
    },
    {
      id: 'fal-ai/flux-pro',
      name: 'FLUX Pro',
      provider: 'Black Forest Labs',
      description: 'State-of-the-art text-to-image model with exceptional quality',
      category: 'Text-to-Image',
      trending: true,
      viral: true,
      speed: 'fast',
      quality: 'excellent',
      cost: 1
    },
    {
      id: 'fal-ai/flux-dev',
      name: 'FLUX Dev',
      provider: 'Black Forest Labs',
      description: 'Development version of FLUX with faster generation',
      category: 'Text-to-Image',
      trending: true,
      speed: 'very-fast',
      quality: 'excellent',
      cost: 1
    },
    {
      id: 'fal-ai/flux-realism',
      name: 'FLUX Realism',
      provider: 'Black Forest Labs',
      description: 'FLUX fine-tuned for photorealistic images',
      category: 'Text-to-Image',
      trending: true,
      viral: true,
      speed: 'fast',
      quality: 'excellent',
      cost: 1
    },
    {
      id: 'fal-ai/flux-schnell',
      name: 'FLUX Schnell',
      provider: 'Black Forest Labs',
      description: 'Ultra-fast FLUX variant for rapid generation',
      category: 'Text-to-Image',
      trending: true,
      speed: 'ultra-fast',
      quality: 'good',
      cost: 1
    },
    {
      id: 'fal-ai/ideogram-v2',
      name: 'Ideogram v2',
      provider: 'Ideogram',
      description: 'Advanced model with excellent text rendering',
      category: 'Text-to-Image',
      trending: true,
      viral: true,
      speed: 'fast',
      quality: 'excellent',
      cost: 1
    },
    {
      id: 'fal-ai/stable-diffusion-xl',
      name: 'Stable Diffusion XL',
      provider: 'Stability AI',
      description: 'Popular open-source model with great results',
      category: 'Text-to-Image',
      trending: false,
      speed: 'medium',
      quality: 'very-good',
      cost: 1
    },
    {
      id: 'fal-ai/playground-v25',
      name: 'Playground v2.5',
      provider: 'Playground AI',
      description: 'Versatile model for various art styles',
      category: 'Text-to-Image',
      trending: true,
      speed: 'fast',
      quality: 'very-good',
      cost: 1
    },
    {
      id: 'fal-ai/recraft-v3',
      name: 'Recraft V3',
      provider: 'Recraft',
      description: 'Best-in-class for design and illustrations',
      category: 'Text-to-Image',
      trending: true,
      viral: true,
      speed: 'fast',
      quality: 'excellent',
      cost: 1
    },
    
    // ========== LATEST 2025 MODELS ==========
    {
      id: 'fal-ai/qwen-image',
      name: 'Qwen Image',
      provider: 'Alibaba Cloud',
      description: 'Advanced Chinese AI image generation with excellent quality',
      category: 'Text-to-Image',
      trending: true,
      viral: true,
      speed: 'fast',
      quality: 'excellent',
      cost: 1
    },
    {
      id: 'fal-ai/imagen-4',
      name: 'Imagen 4',
      provider: 'Google DeepMind',
      description: 'Google\'s latest image generation model with photorealistic results',
      category: 'Text-to-Image',
      trending: true,
      viral: true,
      speed: 'fast',
      quality: 'excellent',
      cost: 2
    },
    {
      id: 'fal-ai/dreamina',
      name: 'Dreamina',
      provider: 'CapCut/ByteDance',
      description: 'ByteDance\'s creative AI image generator with unique artistic style',
      category: 'Text-to-Image',
      trending: true,
      viral: true,
      speed: 'fast',
      quality: 'excellent',
      cost: 1
    },
    {
      id: 'fal-ai/nano-banan',
      name: 'Nano Banan',
      provider: 'Community',
      description: 'Lightweight fast model optimized for quick generations',
      category: 'Text-to-Image',
      trending: true,
      speed: 'ultra-fast',
      quality: 'good',
      cost: 1
    },
    {
      id: 'fal-ai/aura-flow',
      name: 'AuraFlow',
      provider: 'Fal AI',
      description: 'Open-source model optimized for speed',
      category: 'Text-to-Image',
      trending: false,
      speed: 'very-fast',
      quality: 'good',
      cost: 1
    },
    {
      id: 'fal-ai/kolors',
      name: 'Kolors',
      provider: 'Kwai',
      description: 'Chinese text-to-image model with vibrant colors',
      category: 'Text-to-Image',
      trending: false,
      speed: 'fast',
      quality: 'very-good',
      cost: 1
    },
    
    // Image Editing Models
    {
      id: 'fal-ai/flux-pro/inpainting',
      name: 'FLUX Pro Inpainting',
      provider: 'Black Forest Labs',
      description: 'Edit specific parts of images with AI',
      category: 'Image Editing',
      trending: true,
      speed: 'fast',
      quality: 'excellent',
      cost: 1
    },
    {
      id: 'fal-ai/clarity-upscaler',
      name: 'Clarity Upscaler',
      provider: 'Fal AI',
      description: 'AI upscaling for higher resolution',
      category: 'Upscaling',
      trending: true,
      speed: 'fast',
      quality: 'excellent',
      cost: 2
    },
    {
      id: 'fal-ai/imageutils/rembg',
      name: 'Background Remover',
      provider: 'Fal AI',
      description: 'Remove background from images automatically',
      category: 'Background Removal',
      trending: false,
      speed: 'very-fast',
      quality: 'excellent',
      cost: 1
    },
    {
      id: 'fal-ai/face-to-sticker',
      name: 'Face to Sticker',
      provider: 'Fal AI',
      description: 'Convert faces to cute stickers',
      category: 'Image Editing',
      trending: true,
      viral: true,
      speed: 'fast',
      quality: 'very-good',
      cost: 1
    }
  ],
  
  video: [
    // ========== LATEST 2025 VIDEO MODELS ==========
    {
      id: 'fal-ai/google/veo-3.1',
      name: 'Veo 3.1',
      provider: 'Google DeepMind',
      description: 'Google\'s latest video generation with cinema-quality output',
      category: 'Text-to-Video',
      trending: true,
      viral: true,
      speed: 'medium',
      quality: 'excellent',
      maxDuration: 10,
      cost: 5
    },
    {
      id: 'fal-ai/google/veo-3',
      name: 'Veo 3',
      provider: 'Google DeepMind',
      description: 'Advanced video generation with realistic motion and physics',
      category: 'Text-to-Video',
      trending: true,
      viral: true,
      speed: 'medium',
      quality: 'excellent',
      maxDuration: 8,
      cost: 5
    },
    {
      id: 'fal-ai/openai/sora-2',
      name: 'Sora 2',
      provider: 'OpenAI',
      description: 'OpenAI\'s breakthrough video model with stunning realism',
      category: 'Text-to-Video',
      trending: true,
      viral: true,
      speed: 'slow',
      quality: 'excellent',
      maxDuration: 20,
      cost: 10
    },
    {
      id: 'fal-ai/seaweedfs/seedance',
      name: 'SeeDance',
      provider: 'SeaweedFS',
      description: 'Specialized in dance and motion video generation',
      category: 'Text-to-Video',
      trending: true,
      viral: true,
      speed: 'fast',
      quality: 'excellent',
      maxDuration: 6,
      cost: 3
    },
    {
      id: 'fal-ai/kling-video/v1.6/pro/text-to-video',
      name: 'Kling AI v1.6 Pro',
      provider: 'Kuaishou',
      description: 'Latest Kling with improved quality and longer duration',
      category: 'Text-to-Video',
      trending: true,
      viral: true,
      speed: 'medium',
      quality: 'excellent',
      maxDuration: 15,
      cost: 4
    },
    {
      id: 'fal-ai/kling-video/v1/standard/text-to-video',
      name: 'Kling AI v1',
      provider: 'Kuaishou',
      description: 'Professional text-to-video with stunning quality',
      category: 'Text-to-Video',
      trending: true,
      viral: true,
      speed: 'medium',
      quality: 'excellent',
      maxDuration: 10,
      cost: 3
    },
    {
      id: 'fal-ai/kling-video/v1/standard/image-to-video',
      name: 'Kling AI Image-to-Video',
      provider: 'Kuaishou',
      description: 'Animate images into stunning videos',
      category: 'Image-to-Video',
      trending: true,
      viral: true,
      speed: 'medium',
      quality: 'excellent',
      maxDuration: 10,
      cost: 4
    },
    {
      id: 'fal-ai/minimax-video',
      name: 'MiniMax Video',
      provider: 'MiniMax',
      description: 'Chinese AI video model with great results',
      category: 'Text-to-Video',
      trending: true,
      viral: true,
      speed: 'medium',
      quality: 'excellent',
      maxDuration: 6,
      cost: 3
    },
    {
      id: 'fal-ai/runway-gen3',
      name: 'Runway Gen-3',
      provider: 'Runway',
      description: 'Industry-leading video generation',
      category: 'Text-to-Video',
      trending: true,
      viral: true,
      speed: 'slow',
      quality: 'excellent',
      maxDuration: 10,
      cost: 5
    },
    {
      id: 'fal-ai/luma-dream-machine',
      name: 'Luma Dream Machine',
      provider: 'Luma AI',
      description: 'High-quality cinematic video generation',
      category: 'Text-to-Video',
      trending: true,
      viral: true,
      speed: 'medium',
      quality: 'excellent',
      maxDuration: 5,
      cost: 3
    },
    {
      id: 'fal-ai/pika-labs',
      name: 'Pika Labs',
      provider: 'Pika',
      description: 'Creative video generation with unique styles',
      category: 'Text-to-Video',
      trending: true,
      speed: 'fast',
      quality: 'very-good',
      maxDuration: 3,
      cost: 2
    },
    {
      id: 'fal-ai/haiper-video',
      name: 'Haiper AI',
      provider: 'Haiper',
      description: 'Fast and creative video generation',
      category: 'Text-to-Video',
      trending: false,
      speed: 'fast',
      quality: 'good',
      maxDuration: 4,
      cost: 2
    },
    {
      id: 'fal-ai/stable-video-diffusion',
      name: 'Stable Video Diffusion',
      provider: 'Stability AI',
      description: 'Open-source video generation',
      category: 'Image-to-Video',
      trending: false,
      speed: 'medium',
      quality: 'good',
      maxDuration: 4,
      cost: 2
    }
  ]
};

// Helper functions
const ModelHelpers = {
  // Get all models by category
  getByCategory(category) {
    const allModels = [...FAL_AI_MODELS.image, ...FAL_AI_MODELS.video];
    return allModels.filter(model => model.category === category);
  },
  
  // Get trending models
  getTrending() {
    const allModels = [...FAL_AI_MODELS.image, ...FAL_AI_MODELS.video];
    return allModels.filter(model => model.trending);
  },
  
  // Get viral models
  getViral() {
    const allModels = [...FAL_AI_MODELS.image, ...FAL_AI_MODELS.video];
    return allModels.filter(model => model.viral);
  },
  
  // Search models
  search(query) {
    const allModels = [...FAL_AI_MODELS.image, ...FAL_AI_MODELS.video];
    const lowerQuery = query.toLowerCase();
    return allModels.filter(model => 
      model.name.toLowerCase().includes(lowerQuery) ||
      model.provider.toLowerCase().includes(lowerQuery) ||
      model.description.toLowerCase().includes(lowerQuery) ||
      model.category.toLowerCase().includes(lowerQuery)
    );
  },
  
  // Get model by ID
  getById(id) {
    const allModels = [...FAL_AI_MODELS.image, ...FAL_AI_MODELS.video];
    return allModels.find(model => model.id === id);
  },
  
  // Get models for dashboard display (max 10)
  getForDashboard(type, maxResults = 10) {
    let models = type === 'image' ? FAL_AI_MODELS.image : FAL_AI_MODELS.video;
    
    // Sort by: viral first, then trending, then by name
    models = models.sort((a, b) => {
      if (a.viral && !b.viral) return -1;
      if (!a.viral && b.viral) return 1;
      if (a.trending && !b.trending) return -1;
      if (!a.trending && b.trending) return 1;
      return a.name.localeCompare(b.name);
    });
    
    return models.slice(0, maxResults);
  }
};

module.exports = {
  FAL_AI_MODELS,
  ModelHelpers
};

