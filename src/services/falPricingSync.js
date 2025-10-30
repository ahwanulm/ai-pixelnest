/**
 * FAL.AI PRICING SYNC SERVICE
 * 
 * Purpose: Fetch and sync pricing directly from FAL.AI API
 * 
 * Features:
 * - Fetch pricing from FAL.AI for all models
 * - Compare with database and identify changes
 * - Update database with latest pricing
 * - Log all pricing changes
 * - Calculate new credits automatically
 */

const fal = require('@fal-ai/serverless-client');
const { pool } = require('../config/database');

/**
 * Fetch pricing for a specific model from FAL.AI
 */
async function fetchModelPricing(modelId) {
  try {
    // FAL.AI doesn't have a direct pricing API yet
    // We'll use their model info API to get pricing data
    
    // For now, we'll use the pricing from their documentation
    // In the future, they may provide a pricing API endpoint
    
    console.log(`Fetching pricing for: ${modelId}`);
    
    // Placeholder for actual FAL.AI API call
    // const response = await fal.run(`${modelId}/info`);
    // return response.pricing;
    
    return null; // Will be implemented when FAL.AI provides pricing API
    
  } catch (error) {
    console.error(`Error fetching pricing for ${modelId}:`, error.message);
    return null;
  }
}

/**
 * Manual pricing data from FAL.AI documentation
 * This should be updated when FAL.AI provides API access
 */
const MANUAL_FAL_PRICING = {
  // ========== IMAGE MODELS (Verified from fal.ai) ==========
  'fal-ai/flux-pro/v1.1': 0.055,
  'fal-ai/flux-pro': 0.055,
  'fal-ai/flux-realism': 0.055,
  'fal-ai/flux-dev': 0.025,
  'fal-ai/flux-schnell': 0.015,
  'fal-ai/imagen-4': 0.08,
  'fal-ai/ideogram-v2': 0.08,
  'fal-ai/qwen-image': 0.04,
  'fal-ai/dreamina': 0.045,
  'fal-ai/recraft-v3': 0.05,
  'fal-ai/kolors': 0.035,
  'fal-ai/playground-v25': 0.04,
  'fal-ai/aura-flow': 0.02,
  'fal-ai/stable-diffusion-xl': 0.03,
  'fal-ai/flux-pro/inpainting': 0.055,
  'fal-ai/clarity-upscaler': 0.10,
  'fal-ai/imageutils/rembg': 0.02,
  'fal-ai/face-to-sticker': 0.03,
  'fal-ai/nano-banan': 0.015,
  
  // ========== VIDEO MODELS (Per Generation - FLAT RATE) ==========
  // Based on market research and FAL.AI documentation
  // Note: Some models may use per-second pricing
  
  // Google Veo Series
  'fal-ai/google/veo-3.1': 0.50, // 10s max - Premium model
  'fal-ai/google/veo-3': 0.40, // 8s max - High quality
  
  // OpenAI Sora
  'fal-ai/openai/sora-2': 1.00, // 20s max - Flagship model
  
  // Runway
  'fal-ai/runway-gen3': 0.50, // 10s max - Professional grade
  
  // Kling AI Series
  'fal-ai/kuaishou/kling-video/v2.5/pro/text-to-video': 0.45, // 10s max
  'fal-ai/kuaishou/kling-video/v2.5/standard/text-to-video': 0.35, // 10s max
  'fal-ai/kuaishou/kling-video/v2.5/pro/image-to-video': 0.40, // 10s max
  'fal-ai/kling-video/v1.6/pro/text-to-video': 0.50, // 15s max
  'fal-ai/kling-video/v1.6/standard/image-to-video': 0.35, // 10s max
  'fal-ai/kling-video/v1/standard/text-to-video': 0.30, // 10s max
  'fal-ai/kling-video/v1/standard/image-to-video': 0.35, // 10s max
  
  // Luma AI
  'fal-ai/luma-dream-machine': 0.30, // 5s max
  
  // Other Video Models
  'fal-ai/seaweedfs/seedance': 0.25, // 5s max
  'fal-ai/minimax-video': 0.20, // 6s max
  'fal-ai/pika-labs': 0.15, // 3s max
  'fal-ai/haiper-video': 0.15, // 4s max
  'fal-ai/haiper-video/v2/image-to-video': 0.15, // 4s max
  'fal-ai/stable-video-diffusion': 0.12 // 4s max
};

/**
 * Get all models from database
 */
async function getAllModels() {
  const result = await pool.query(`
    SELECT 
      id,
      model_id,
      name,
      provider,
      type,
      max_duration,
      fal_price,
      cost as credits,
      is_active
    FROM ai_models
    ORDER BY type DESC, provider, name
  `);
  
  return result.rows;
}

/**
 * Update model pricing in database
 */
async function updateModelPricing(modelId, newPrice, oldPrice, reason = 'Manual sync') {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get model info INCLUDING current cost (before update)
    const modelResult = await client.query(
      'SELECT id, name, type, cost as old_credits, fal_price as current_fal_price FROM ai_models WHERE model_id = $1',
      [modelId]
    );
    
    if (modelResult.rows.length === 0) {
      throw new Error(`Model not found: ${modelId}`);
    }
    
    const model = modelResult.rows[0];
    const oldCredits = parseFloat(model.old_credits) || 0;
    
    console.log(`📊 Updating ${model.name}: $${oldPrice} → $${newPrice}`);
    
    // Update fal_price
    await client.query(
      'UPDATE ai_models SET fal_price = $1, updated_at = NOW() WHERE model_id = $2',
      [newPrice, modelId]
    );
    
    // Calculate new credits using database function
    const creditsResult = await client.query(
      'SELECT calculate_credits_typed($1, $2) as new_credits',
      [newPrice, model.type]
    );
    
    const newCredits = parseFloat(creditsResult.rows[0].new_credits);
    
    console.log(`💰 Credits: ${oldCredits.toFixed(1)} → ${newCredits.toFixed(1)}`);
    
    // Update credits
    await client.query(
      'UPDATE ai_models SET cost = $1 WHERE model_id = $2',
      [newCredits, modelId]
    );
    
    // Log pricing change (use oldCredits from query, not subquery)
    await client.query(`
      INSERT INTO pricing_change_history 
        (model_id, model_name, old_price, new_price, old_credits, new_credits, change_reason, changed_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `, [modelId, model.name, oldPrice, newPrice, oldCredits, newCredits, reason]);
    
    await client.query('COMMIT');
    
    console.log(`✅ ${model.name} updated successfully`);
    
    return {
      success: true,
      modelId,
      modelName: model.name,
      oldPrice,
      newPrice,
      oldCredits,
      newCredits,
      priceChange: oldPrice > 0 ? ((newPrice - oldPrice) / oldPrice * 100).toFixed(2) : '100.00'
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`❌ Error updating ${modelId}:`, error.message);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Sync all pricing from FAL.AI
 */
async function syncAllPricing(options = {}) {
  const {
    dryRun = false,
    forceUpdate = false,
    changedBy = 'system'
  } = options;
  
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   FAL.AI PRICING SYNC                                   ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  
  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No changes will be saved\n');
  }
  
  const models = await getAllModels();
  const results = {
    total: models.length,
    updated: 0,
    unchanged: 0,
    errors: 0,
    changes: []
  };
  
  for (const model of models) {
    try {
      // Get latest pricing (from manual data for now)
      const latestPrice = MANUAL_FAL_PRICING[model.model_id];
      
      if (!latestPrice) {
        console.log(`⚠️  No pricing data for: ${model.name}`);
        continue;
      }
      
      const currentPrice = parseFloat(model.fal_price) || 0;
      const priceDiff = Math.abs(latestPrice - currentPrice);
      
      // Check if price changed (with small tolerance for floating point)
      if (priceDiff < 0.001 && !forceUpdate) {
        console.log(`✓ ${model.name.padEnd(35)} $${currentPrice.toFixed(4)} (unchanged)`);
        results.unchanged++;
        continue;
      }
      
      // Price changed!
      const changePercent = currentPrice > 0 
        ? ((latestPrice - currentPrice) / currentPrice * 100).toFixed(1)
        : 'NEW';
      
      console.log(`📊 ${model.name.padEnd(35)} $${currentPrice.toFixed(4)} → $${latestPrice.toFixed(4)} (${changePercent}%)`);
      
      if (!dryRun) {
        const updateResult = await updateModelPricing(
          model.model_id,
          latestPrice,
          currentPrice,
          `Auto-sync by ${changedBy}`
        );
        
        results.changes.push(updateResult);
        results.updated++;
        
        console.log(`   ✅ Updated: ${updateResult.newCredits.toFixed(1)} credits`);
      } else {
        results.updated++;
      }
      
    } catch (error) {
      console.error(`❌ Error syncing ${model.name}:`, error.message);
      results.errors++;
    }
  }
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📈 SYNC SUMMARY');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`  Total Models: ${results.total}`);
  console.log(`  ✅ Updated: ${results.updated}`);
  console.log(`  ✓ Unchanged: ${results.unchanged}`);
  console.log(`  ❌ Errors: ${results.errors}`);
  
  if (results.changes.length > 0) {
    console.log('\n🔄 PRICE CHANGES:\n');
    results.changes.forEach(change => {
      console.log(`  ${change.modelName}:`);
      console.log(`    Price: $${change.oldPrice.toFixed(4)} → $${change.newPrice.toFixed(4)} (${change.priceChange}%)`);
      console.log(`    Credits: ${change.newCredits.toFixed(1)}`);
    });
  }
  
  console.log('\n═══════════════════════════════════════════════════════════\n');
  
  return results;
}

/**
 * Get pricing change history
 */
async function getPricingHistory(limit = 50) {
  const result = await pool.query(`
    SELECT 
      model_id,
      model_name,
      old_price,
      new_price,
      old_credits,
      new_credits,
      change_reason,
      changed_at
    FROM pricing_change_history
    ORDER BY changed_at DESC
    LIMIT $1
  `, [limit]);
  
  return result.rows;
}

/**
 * Update manual pricing data
 * Admin can update this through UI
 */
async function updateManualPricing(modelId, price) {
  MANUAL_FAL_PRICING[modelId] = price;
  // In production, this should save to a config file or database
  return true;
}

module.exports = {
  fetchModelPricing,
  syncAllPricing,
  updateModelPricing,
  getPricingHistory,
  updateManualPricing,
  getAllModels,
  MANUAL_FAL_PRICING
};

