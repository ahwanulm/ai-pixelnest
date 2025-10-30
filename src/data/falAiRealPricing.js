/**
 * ============================================
 * REAL FAL.AI PRICING FROM OFFICIAL API
 * ============================================
 * 
 * Source: fal.ai API (Verified January 2026)
 * Data provided by: User from actual fal.ai API response
 * 
 * NOTE: Credits mentioned here are fal.ai credits (not PixelNest credits)
 *       Need to convert: fal.ai credits → USD → PixelNest credits
 * 
 * Assumption: 1 fal.ai credit ≈ $0.10 USD (industry standard)
 */

const FAL_AI_REAL_PRICING = {
  // ==================== VIDEO MODELS ====================
  
  // Google Veo Series
  'fal-ai/google/veo-3': {
    name: 'Google Veo 3',
    type: 'video',
    pricing_type: 'per_duration',
    durations: {
      8: { fal_credits: 10, usd_price: 1.00 }
    }
  },
  
  'fal-ai/google/veo-3.1': {
    name: 'Google VEO 3.1',
    type: 'video',
    pricing_type: 'per_duration',
    durations: {
      4: { fal_credits: 3, usd_price: 0.30 },
      6: { fal_credits: 4.5, usd_price: 0.45 },
      8: { fal_credits: 6, usd_price: 0.60 }
    }
  },
  
  'fal-ai/google/veo-2': {
    name: 'Google Veo 2',
    type: 'video',
    pricing_type: 'per_duration',
    durations: {
      5: { fal_credits: 5, usd_price: 0.50 },
      8: { fal_credits: 10, usd_price: 1.00 }
    }
  },
  
  // Kling Series
  'fal-ai/kuaishou/kling-video/v2.5/pro/text-to-video': {
    name: 'Kling 2.5 Pro',
    type: 'video',
    pricing_type: 'per_duration',
    durations: {
      5: { fal_credits: 1.5, usd_price: 0.15 },
      10: { fal_credits: 3, usd_price: 0.30 }
    }
  },
  
  'fal-ai/kling-video/v1.6/pro/text-to-video': {
    name: 'Kling v1.6 Pro',
    type: 'video',
    pricing_type: 'per_duration',
    durations: {
      5: { fal_credits: 0.75, usd_price: 0.075 },
      10: { fal_credits: 1.5, usd_price: 0.15 }
    }
  },
  
  'fal-ai/kling-video/v1.6/standard': {
    name: 'Kling v1.6 Standard',
    type: 'video',
    pricing_type: 'per_duration',
    durations: {
      5: { fal_credits: 0.5, usd_price: 0.05 },
      10: { fal_credits: 1, usd_price: 0.10 }
    }
  },
  
  'fal-ai/kling-video/v2.1/standard': {
    name: 'Kling 2.1 Standard',
    type: 'video',
    pricing_type: 'per_duration',
    durations: {
      5: { fal_credits: 0.75, usd_price: 0.075 },
      10: { fal_credits: 1, usd_price: 0.10 }
    }
  },
  
  'fal-ai/kling-video/v2.1/master': {
    name: 'Kling 2.1 Master',
    type: 'video',
    pricing_type: 'per_duration',
    durations: {
      5: { fal_credits: 2, usd_price: 0.20 },
      10: { fal_credits: 4, usd_price: 0.40 }
    }
  },
  
  'fal-ai/kling-video/v2.1/pro': {
    name: 'Kling 2.1 Pro',
    type: 'video',
    pricing_type: 'per_duration',
    durations: {
      5: { fal_credits: 1.5, usd_price: 0.15 },
      10: { fal_credits: 2.5, usd_price: 0.25 }
    }
  },
  
  'fal-ai/kling-video/v2.0': {
    name: 'Kling v2.0',
    type: 'video',
    pricing_type: 'per_duration',
    durations: {
      5: { fal_credits: 2, usd_price: 0.20 },
      10: { fal_credits: 4, usd_price: 0.40 }
    }
  },
  
  'fal-ai/kling-multi-element': {
    name: 'Kling Multi-Element',
    type: 'video',
    pricing_type: 'per_duration',
    durations: {
      5: { fal_credits: 1.0, usd_price: 0.10 },
      10: { fal_credits: 2.0, usd_price: 0.20 }
    }
  },
  
  // OpenAI Sora
  'fal-ai/openai/sora-2': {
    name: 'SORA 2',
    type: 'video',
    pricing_type: 'per_duration',
    durations: {
      4: { fal_credits: 2.5, usd_price: 0.25 },
      8: { fal_credits: 5, usd_price: 0.50 },
      12: { fal_credits: 7.5, usd_price: 0.75 }
    }
  },
  
  'fal-ai/openai/sora-2-pro': {
    name: 'SORA 2 Pro',
    type: 'video',
    pricing_type: 'per_duration',
    durations: {
      4: { fal_credits: 5, usd_price: 0.50 },
      8: { fal_credits: 10, usd_price: 1.00 },
      12: { fal_credits: 15, usd_price: 1.50 }
    }
  },
  
  // Pixverse
  'fal-ai/pixverse/v4.5': {
    name: 'Pixverse 4.5',
    type: 'video',
    pricing_type: 'per_duration',
    durations: {
      5: { fal_credits: 1, usd_price: 0.10 },
      8: { fal_credits: 1.5, usd_price: 0.15 }
    }
  },
  
  'fal-ai/pixverse/v5': {
    name: 'Pixverse v5',
    type: 'video',
    pricing_type: 'per_duration',
    durations: {
      5: { fal_credits: 1, usd_price: 0.10 },
      8: { fal_credits: 2, usd_price: 0.20 }
    }
  },
  
  // Hailuo
  'fal-ai/hailuo/02': {
    name: 'Hailuo 02',
    type: 'video',
    pricing_type: 'per_duration',
    durations: {
      6: { fal_credits: 0.8, usd_price: 0.08 },
      10: { fal_credits: 1.5, usd_price: 0.15 }
    }
  },
  
  'fal-ai/hailuo/02-pro': {
    name: 'Hailuo 02 Pro',
    type: 'video',
    pricing_type: 'per_duration',
    durations: {
      6: { fal_credits: 1.4, usd_price: 0.14 },
      10: { fal_credits: 100, usd_price: 10.00 } // Premium tier!
    }
  },
  
  // Wan (Wanx)
  'fal-ai/wan/2.5': {
    name: 'Wan 2.5',
    type: 'video',
    pricing_type: 'per_duration',
    durations: {
      5: { fal_credits: 2.5, usd_price: 0.25 },
      10: { fal_credits: 5, usd_price: 0.50 }
    }
  },
  
  'fal-ai/wan/2.2': {
    name: 'Wan 2.2',
    type: 'video',
    pricing_type: 'per_duration',
    durations: {
      5: { fal_credits: 0.5, usd_price: 0.05 }
    }
  },
  
  'fal-ai/wan/2.2-fast': {
    name: 'Wan 2.2 Fast',
    type: 'video',
    pricing_type: 'per_duration',
    durations: {
      5: { fal_credits: 0.5, usd_price: 0.05 }
    }
  },
  
  'fal-ai/wan/2.1': {
    name: 'Wan 2.1',
    type: 'video',
    pricing_type: 'per_duration',
    durations: {
      5: { fal_credits: 1, usd_price: 0.10 }
    }
  },
  
  // Luma Ray
  'fal-ai/luma-ray/2': {
    name: 'Luma Ray 2',
    type: 'video',
    pricing_type: 'per_duration',
    durations: {
      5: { fal_credits: 1, usd_price: 0.10 },
      9: { fal_credits: 2, usd_price: 0.20 }
    }
  },
  
  // Other Models
  'fal-ai/leonardo-motion/2.0': {
    name: 'Leonardo Motion 2.0',
    type: 'video',
    pricing_type: 'per_duration',
    durations: {
      5: { fal_credits: 1, usd_price: 0.10 }
    }
  },
  
  'fal-ai/pika/2.2': {
    name: 'Pika 2.2',
    type: 'video',
    pricing_type: 'per_duration',
    durations: {
      5: { fal_credits: 1, usd_price: 0.10 }
    }
  },
  
  'fal-ai/seedance': {
    name: 'SeeDance',
    type: 'video',
    pricing_type: 'per_duration',
    durations: {
      5: { fal_credits: 0.5, usd_price: 0.05 },
      10: { fal_credits: 1, usd_price: 0.10 }
    }
  }
};

/**
 * Helper function to get price for specific model and duration
 */
function getPrice(modelId, durationSeconds) {
  const model = FAL_AI_REAL_PRICING[modelId];
  if (!model) return null;
  
  if (model.pricing_type === 'per_duration') {
    const pricing = model.durations[durationSeconds];
    return pricing || null;
  }
  
  return null;
}

/**
 * Helper function to get all available durations for a model
 */
function getAvailableDurations(modelId) {
  const model = FAL_AI_REAL_PRICING[modelId];
  if (!model || model.pricing_type !== 'per_duration') return [];
  
  return Object.keys(model.durations).map(d => parseInt(d)).sort((a, b) => a - b);
}

/**
 * Convert to flat list for database update
 */
function convertToFlatList() {
  const flatList = [];
  
  for (const [modelId, model] of Object.entries(FAL_AI_REAL_PRICING)) {
    if (model.pricing_type === 'per_duration') {
      // Use max duration pricing as base
      const durations = Object.keys(model.durations).map(d => parseInt(d));
      const maxDuration = Math.max(...durations);
      const maxPricing = model.durations[maxDuration];
      
      flatList.push({
        model_id: modelId,
        name: model.name,
        type: model.type,
        pricing_type: 'per_second',
        max_duration: maxDuration,
        fal_price: maxPricing.usd_price,
        fal_credits: maxPricing.fal_credits,
        all_durations: model.durations
      });
    }
  }
  
  return flatList;
}

module.exports = {
  FAL_AI_REAL_PRICING,
  getPrice,
  getAvailableDurations,
  convertToFlatList
};




