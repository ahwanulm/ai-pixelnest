/**
 * FAL.AI Model Scraper
 * Fetches all available models from fal.ai website
 * Since FAL.AI doesn't have a public API to list all models,
 * we scrape their models page and combine with our curated list
 * 
 * NOTE: Cheerio is optional - if not installed, will fallback to curated list only
 */

const axios = require('axios');

// Try to load cheerio, but don't fail if not available
let cheerio;
try {
  cheerio = require('cheerio');
} catch (err) {
  console.warn('⚠️  Cheerio not installed. Web scraping disabled. Using curated list only.');
  console.warn('   To enable scraping, run: npm install cheerio');
  cheerio = null;
}

class FalAiScraper {
  constructor() {
    this.baseURL = 'https://fal.ai';
    this.modelsCache = null;
    this.cacheExpiry = 60 * 60 * 1000; // 1 hour
    this.lastFetch = null;
  }

  /**
   * Fetch all models from fal.ai/models page
   */
  async fetchAllModelsFromWebsite() {
    // Check if cheerio is available
    if (!cheerio) {
      console.log('⚠️  Cheerio not available. Skipping web scraping.');
      return [];
    }
    
    try {
      console.log('🌐 Fetching models from fal.ai/models...');
      
      const response = await axios.get(`${this.baseURL}/models`, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const models = [];
      
      // Try to parse model cards from the page
      // Note: This is fragile and may break if FAL.AI changes their HTML structure
      
      // Look for model links and cards
      $('a[href^="/models/"]').each((i, element) => {
        try {
          const href = $(element).attr('href');
          const modelId = href.replace('/models/', '');
          
          // Skip if not a valid model ID
          if (!modelId || modelId.includes('/') === false) {
            return;
          }
          
          // Get model name from the card
          const name = $(element).find('h3, h2, .model-name').first().text().trim() 
                    || modelId.split('/').pop().replace(/-/g, ' ');
          
          // Try to detect type from context
          const text = $(element).text().toLowerCase();
          const type = text.includes('video') || text.includes('animation') ? 'video' : 'image';
          
          models.push({
            id: modelId,
            name: this.capitalizeWords(name),
            type: type,
            source: 'website_scraped',
            scraped_at: new Date().toISOString()
          });
        } catch (err) {
          // Skip invalid entries
        }
      });

      console.log(`✅ Scraped ${models.length} models from website`);
      return models;
      
    } catch (error) {
      console.error('❌ Error scraping fal.ai/models:', error.message);
      return [];
    }
  }

  /**
   * Get comprehensive model list: Curated + Website scraped
   */
  async getAllModels(forceRefresh = false) {
    // Check cache
    if (!forceRefresh && this.modelsCache && this.lastFetch) {
      const age = Date.now() - this.lastFetch;
      if (age < this.cacheExpiry) {
        console.log('📋 Using cached models');
        return this.modelsCache;
      }
    }

    try {
      // 1. Load curated models (high quality, verified)
      const FAL_AI_MODELS_COMPLETE = require('../data/falAiModelsComplete');
      console.log(`📚 Loaded ${FAL_AI_MODELS_COMPLETE.length} curated models`);
      
      const curatedModels = FAL_AI_MODELS_COMPLETE.map(model => ({
        ...model,
        model_id: model.id,
        source: 'curated',
        verified: true,
        has_pricing: true
      }));

      // 2. Try to scrape additional models from website
      let scrapedModels = [];
      try {
        scrapedModels = await this.fetchAllModelsFromWebsite();
      } catch (error) {
        console.warn('⚠️  Could not scrape website, using curated list only');
      }

      // 3. Merge: Curated takes priority
      const curatedIds = new Set(curatedModels.map(m => m.id));
      const newModels = scrapedModels.filter(m => !curatedIds.has(m.id));

      // 4. Enrich scraped models with default data
      const enrichedNewModels = newModels.map(model => ({
        ...model,
        model_id: model.id,
        provider: this.inferProvider(model.id),
        category: model.type === 'video' ? 'Text-to-Video' : 'Text-to-Image',
        description: `AI ${model.type} generation model`,
        fal_price: model.type === 'video' ? 0.25 : 0.05, // Default pricing
        pricing_type: 'flat',
        quality: 'good',
        speed: 'medium',
        verified: false,
        has_pricing: false,
        source: 'website_scraped'
      }));

      // 5. Combine all
      const allModels = [...curatedModels, ...enrichedNewModels];
      
      console.log(`🎉 Total models available: ${allModels.length}`);
      console.log(`   📚 Curated: ${curatedModels.length}`);
      console.log(`   🌐 Scraped: ${enrichedNewModels.length}`);
      
      // Cache result
      this.modelsCache = allModels;
      this.lastFetch = Date.now();
      
      return allModels;
      
    } catch (error) {
      console.error('❌ Error getting all models:', error);
      
      // Fallback to curated only
      const FAL_AI_MODELS_COMPLETE = require('../data/falAiModelsComplete');
      return FAL_AI_MODELS_COMPLETE.map(model => ({
        ...model,
        model_id: model.id,
        source: 'curated',
        verified: true
      }));
    }
  }

  /**
   * Fetch real-time pricing for a specific model
   */
  async fetchModelPricing(modelId) {
    try {
      const { pool } = require('../config/database');
      
      // Get API key
      const result = await pool.query(
        "SELECT api_key FROM api_configs WHERE service_name = 'FAL_AI' AND is_active = true LIMIT 1"
      );
      
      if (result.rows.length === 0) {
        throw new Error('FAL.AI API key not configured');
      }
      
      const apiKey = result.rows[0].api_key;
      
      // Try to get pricing from FAL.AI endpoint
      const response = await axios.get(`https://queue.fal.run/${modelId}/pricing`, {
        headers: {
          'Authorization': `Key ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000,
        validateStatus: (status) => status < 500
      });

      if (response.data && response.data.price) {
        return {
          price: parseFloat(response.data.price),
          currency: 'USD',
          pricing_type: response.data.type || 'flat',
          source: 'api',
          fetched_at: new Date().toISOString()
        };
      }
      
      // Fallback to inferred pricing
      return this.inferPricing(modelId);
      
    } catch (error) {
      console.warn(`⚠️  Could not fetch pricing for ${modelId}, using inference`);
      return this.inferPricing(modelId);
    }
  }

  /**
   * Infer pricing based on model ID patterns
   */
  inferPricing(modelId) {
    const id = modelId.toLowerCase();
    
    // Video models
    if (id.includes('video') || id.includes('runway') || id.includes('sora')) {
      if (id.includes('sora-2') || id.includes('runway-gen3')) {
        return { price: 0.30, pricing_type: 'flat', source: 'inferred' };
      }
      if (id.includes('kling') || id.includes('luma')) {
        return { price: 0.25, pricing_type: 'per_second', source: 'inferred' };
      }
      return { price: 0.20, pricing_type: 'flat', source: 'inferred' };
    }
    
    // Image models
    if (id.includes('flux-pro') || id.includes('imagen-4')) {
      return { price: 0.055, pricing_type: 'flat', source: 'inferred' };
    }
    if (id.includes('flux') || id.includes('ideogram') || id.includes('recraft')) {
      return { price: 0.040, pricing_type: 'flat', source: 'inferred' };
    }
    
    // Default
    return { price: 0.025, pricing_type: 'flat', source: 'inferred' };
  }

  /**
   * Infer provider from model ID
   */
  inferProvider(modelId) {
    const id = modelId.toLowerCase();
    
    if (id.includes('google') || id.includes('veo') || id.includes('imagen')) return 'Google DeepMind';
    if (id.includes('flux')) return 'Black Forest Labs';
    if (id.includes('kling') || id.includes('kuaishou')) return 'Kuaishou';
    if (id.includes('runway')) return 'Runway';
    if (id.includes('sora') || id.includes('openai')) return 'OpenAI';
    if (id.includes('luma')) return 'Luma AI';
    if (id.includes('minimax')) return 'MiniMax';
    if (id.includes('pika')) return 'Pika Labs';
    if (id.includes('haiper')) return 'Haiper';
    if (id.includes('stable')) return 'Stability AI';
    if (id.includes('ideogram')) return 'Ideogram';
    if (id.includes('recraft')) return 'Recraft';
    if (id.includes('qwen')) return 'Alibaba Cloud';
    
    return 'FAL.AI';
  }

  /**
   * Capitalize words
   */
  capitalizeWords(str) {
    return str.replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Sync pricing for all models in database
   */
  async syncPricingToDatabase() {
    try {
      const { pool } = require('../config/database');
      
      console.log('💰 Syncing pricing for all models...');
      
      // Get all models from database
      const result = await pool.query('SELECT id, model_id FROM ai_models');
      const models = result.rows;
      
      let updated = 0;
      let errors = 0;
      
      for (const model of models) {
        try {
          const pricing = await this.fetchModelPricing(model.model_id);
          
          // Update fal_price in database
          await pool.query(
            'UPDATE ai_models SET fal_price = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [pricing.price, model.id]
          );
          
          updated++;
          
          // Rate limit: Wait 100ms between requests
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error(`Error syncing ${model.model_id}:`, error.message);
          errors++;
        }
      }
      
      console.log(`✅ Pricing sync completed: ${updated} updated, ${errors} errors`);
      return { updated, errors, total: models.length };
      
    } catch (error) {
      console.error('❌ Error syncing pricing:', error);
      throw error;
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.modelsCache = null;
    this.lastFetch = null;
    console.log('🗑️  Cache cleared');
  }
}

module.exports = new FalAiScraper();

