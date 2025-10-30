/**
 * FAL.AI Model Browser Service
 * Browse and fetch model information directly from fal.ai
 */

const axios = require('axios');
const falAiModelsComplete = require('../data/falAiModelsComplete');

class FalAiBrowser {
  constructor() {
    this.baseURL = 'https://fal.ai/api';
    this.modelsListURL = 'https://fal.ai/models'; // For scraping
  }

  /**
   * Popular/Curated models list from fal.ai
   * This is a curated list based on fal.ai's popular models
   */
  getPopularModels() {
    return {
      image: [
        {
          id: 'fal-ai/flux-pro/v1.1',
          name: 'FLUX.1 Pro v1.1',
          provider: 'Black Forest Labs',
          description: 'State-of-the-art image generation with improved quality and speed',
          category: 'Text-to-Image',
          trending: true,
          viral: true,
          speed: 'fast',
          quality: 'excellent',
          fal_price: 0.055, // USD price from fal.ai
          cost: 1
        },
        {
          id: 'fal-ai/flux-pro',
          name: 'FLUX.1 Pro',
          provider: 'Black Forest Labs',
          description: 'Professional-grade text-to-image generation',
          category: 'Text-to-Image',
          trending: true,
          viral: true,
          speed: 'fast',
          quality: 'excellent',
          cost: 1
        },
        {
          id: 'fal-ai/flux-dev',
          name: 'FLUX.1 Dev',
          provider: 'Black Forest Labs',
          description: 'Development version with faster generation',
          category: 'Text-to-Image',
          trending: true,
          speed: 'very-fast',
          quality: 'excellent',
          cost: 1
        },
        {
          id: 'fal-ai/flux-realism',
          name: 'FLUX.1 Realism',
          provider: 'Black Forest Labs',
          description: 'Specialized for photorealistic images',
          category: 'Text-to-Image',
          trending: true,
          viral: true,
          speed: 'fast',
          quality: 'excellent',
          cost: 1
        },
        {
          id: 'fal-ai/flux-schnell',
          name: 'FLUX.1 Schnell',
          provider: 'Black Forest Labs',
          description: 'Ultra-fast image generation',
          category: 'Text-to-Image',
          trending: true,
          speed: 'ultra-fast',
          quality: 'very-good',
          cost: 1
        },
        {
          id: 'fal-ai/imagen-4',
          name: 'Imagen 4',
          provider: 'Google DeepMind',
          description: 'Google\'s latest photorealistic image generation',
          category: 'Text-to-Image',
          trending: true,
          viral: true,
          speed: 'fast',
          quality: 'excellent',
          cost: 2
        },
        {
          id: 'fal-ai/qwen-image',
          name: 'Qwen Image',
          provider: 'Alibaba Cloud',
          description: 'Advanced Chinese AI image generation',
          category: 'Text-to-Image',
          trending: true,
          viral: true,
          speed: 'fast',
          quality: 'excellent',
          cost: 1
        },
        {
          id: 'fal-ai/dreamina',
          name: 'Dreamina',
          provider: 'ByteDance',
          description: 'Creative AI with unique artistic style',
          category: 'Text-to-Image',
          trending: true,
          viral: true,
          speed: 'fast',
          quality: 'excellent',
          cost: 1
        },
        {
          id: 'fal-ai/ideogram-v2',
          name: 'Ideogram v2',
          provider: 'Ideogram',
          description: 'Excellent text rendering in images',
          category: 'Text-to-Image',
          trending: true,
          viral: true,
          speed: 'fast',
          quality: 'excellent',
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
        {
          id: 'fal-ai/stable-diffusion-xl',
          name: 'Stable Diffusion XL',
          provider: 'Stability AI',
          description: 'Popular open-source image generation',
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
          id: 'fal-ai/flux-pro/inpainting',
          name: 'FLUX Pro Inpainting',
          provider: 'Black Forest Labs',
          description: 'Edit specific parts of images',
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
          description: 'Remove background automatically',
          category: 'Image Editing',
          trending: false,
          speed: 'very-fast',
          quality: 'excellent',
          cost: 1
        }
      ],
      video: [
        {
          id: 'fal-ai/google/veo-3.1',
          name: 'Veo 3.1',
          provider: 'Google DeepMind',
          description: 'Cinema-quality video generation',
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
          description: 'Realistic motion and physics',
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
          description: 'Breakthrough video generation',
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
          description: 'Specialized in dance and motion',
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
          description: 'Latest Kling with longer duration',
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
          description: 'Professional text-to-video',
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
          description: 'Animate images into videos',
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
          description: 'Chinese AI video model',
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
          description: 'Cinematic video generation',
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
          description: 'Creative video with unique styles',
          category: 'Text-to-Video',
          trending: true,
          speed: 'fast',
          quality: 'very-good',
          maxDuration: 3,
          cost: 2
        }
      ]
    };
  }

  /**
   * Search models from the popular list
   */
  searchModels(query, type = null) {
    const allModels = this.getAllModels();
    const lowerQuery = query.toLowerCase();
    
    let filtered = allModels.filter(model => 
      model.name.toLowerCase().includes(lowerQuery) ||
      model.provider.toLowerCase().includes(lowerQuery) ||
      model.description.toLowerCase().includes(lowerQuery) ||
      model.id.toLowerCase().includes(lowerQuery) ||
      model.category.toLowerCase().includes(lowerQuery)
    );
    
    if (type) {
      filtered = filtered.filter(m => m.type === type);
    }
    
    return filtered;
  }

  /**
   * Get all models (includes Kling 2.5 and 100+ other models)
   */
  getAllModels() {
    // Use complete models list (includes Kling 2.5 and latest models)
    return falAiModelsComplete;
  }
  
  /**
   * Get legacy popular models (from old structure)
   */
  getPopularModelsFlat() {
    const popular = this.getPopularModels();
    const imageModels = popular.image.map(m => ({ ...m, type: 'image' }));
    const videoModels = popular.video.map(m => ({ ...m, type: 'video' }));
    return [...imageModels, ...videoModels];
  }

  /**
   * Get model details by ID
   */
  getModelById(modelId) {
    const allModels = this.getAllModels();
    return allModels.find(m => m.id === modelId);
  }

  /**
   * Validate if a model ID exists in fal.ai format
   */
  validateModelId(modelId) {
    // Check if it follows fal.ai format: fal-ai/...
    const pattern = /^fal-ai\/.+/;
    return pattern.test(modelId);
  }

  /**
   * Get suggestions based on partial input
   */
  getSuggestions(partial, limit = 5) {
    if (!partial || partial.length < 2) return [];
    
    const allModels = this.getAllModels();
    const lowerPartial = partial.toLowerCase();
    
    return allModels
      .filter(m => 
        m.name.toLowerCase().includes(lowerPartial) ||
        m.id.toLowerCase().includes(lowerPartial)
      )
      .slice(0, limit);
  }

  /**
   * Get trending models
   */
  getTrendingModels(limit = 10) {
    return this.getAllModels()
      .filter(m => m.trending)
      .slice(0, limit);
  }

  /**
   * Get viral models
   */
  getViralModels(limit = 10) {
    return this.getAllModels()
      .filter(m => m.viral)
      .slice(0, limit);
  }

  /**
   * Get models by category
   */
  getModelsByCategory(category) {
    return this.getAllModels()
      .filter(m => m.category === category);
  }

  /**
   * Get all unique categories
   */
  getCategories() {
    const allModels = this.getAllModels();
    const categories = new Set(allModels.map(m => m.category));
    return Array.from(categories).sort();
  }

  /**
   * Get all unique providers
   */
  getProviders() {
    const allModels = this.getAllModels();
    const providers = new Set(allModels.map(m => m.provider));
    return Array.from(providers).sort();
  }

  /**
   * Quick import - convert fal.ai model to database format
   */
  prepareForImport(model) {
    return {
      model_id: model.id,
      name: model.name,
      provider: model.provider,
      description: model.description,
      category: model.category,
      type: model.type,
      trending: model.trending || false,
      viral: model.viral || false,
      speed: model.speed || 'medium',
      quality: model.quality || 'good',
      max_duration: model.maxDuration || null,
      fal_price: model.fal_price || 0,
      cost: model.cost || 1,
      is_active: true,
      is_custom: true // Imported via browser
    };
  }
}

module.exports = new FalAiBrowser();

