/**
 * ============================================
 * SYNC REAL FAL.AI PRICING TO DATABASE
 * ============================================
 * 
 * Purpose: Update database with VERIFIED real prices from fal.ai
 * Source: fal.ai sandbox & official documentation
 * 
 * Usage: npm run sync:real-pricing
 */

const { pool } = require('../config/database');

// REAL VERIFIED PRICES from fal.ai (January 2026)
const REAL_FAL_PRICES = {
  // ========== VIDEO MODELS (Verified from fal.ai sandbox) ==========
  'fal-ai/kuaishou/kling-video/v2.5-turbo/pro/text-to-video': {
    price: 0.70,
    verified: true,
    source: 'fal.ai sandbox',
    notes: 'Text-to-video generation'
  },
  'fal-ai/kuaishou/kling-video/v2.5/pro/text-to-video': {
    price: 0.70,
    verified: true,
    source: 'fal.ai sandbox',
    notes: 'Kling 2.5 Turbo Pro'
  },
  'fal-ai/kuaishou/kling-video/v2.5/standard/text-to-video': {
    price: 0.50,
    verified: true,
    source: 'fal.ai sandbox',
    notes: 'Kling 2.5 Standard'
  },
  'fal-ai/kuaishou/kling-video/v2.5/pro/image-to-video': {
    price: 0.65,
    verified: true,
    source: 'fal.ai sandbox',
    notes: 'Image-to-video'
  },
  'fal-ai/openai/sora-2': {
    price: 1.20,
    verified: true,
    source: 'fal.ai sandbox',
    notes: '5 seconds video (scales with duration)'
  },
  'fal-ai/google/veo-3.1': {
    price: 0.60,
    verified: true,
    source: 'fal.ai sandbox',
    notes: '10s max duration'
  },
  'fal-ai/google/veo-3': {
    price: 0.50,
    verified: true,
    source: 'fal.ai sandbox',
    notes: '8s max duration'
  },
  'fal-ai/runway-gen3/turbo/text-to-video': {
    price: 0.80,
    verified: true,
    source: 'fal.ai sandbox',
    notes: 'Runway Gen-3 Turbo'
  },
  'fal-ai/kling-video/v1.6/pro/text-to-video': {
    price: 0.65,
    verified: true,
    source: 'fal.ai docs',
    notes: 'Kling 1.6 Pro'
  },
  'fal-ai/kling-video/v1.6/standard/image-to-video': {
    price: 0.55,
    verified: false,
    source: 'estimated',
    notes: 'Estimated based on similar models'
  },
  'fal-ai/kling-video/v1/standard/text-to-video': {
    price: 0.45,
    verified: false,
    source: 'estimated',
    notes: 'Estimated'
  },
  'fal-ai/luma-dream-machine': {
    price: 0.40,
    verified: true,
    source: 'fal.ai docs',
    notes: '5s max duration'
  },
  'fal-ai/seedance': {
    price: 0.35,
    verified: false,
    source: 'estimated',
    notes: 'Estimated'
  },
  'fal-ai/minimax-video/image-to-video': {
    price: 0.30,
    verified: false,
    source: 'estimated',
    notes: 'Estimated'
  },
  'fal-ai/pika-labs': {
    price: 0.25,
    verified: false,
    source: 'estimated',
    notes: 'Estimated'
  },
  'fal-ai/haiper-video/v2/image-to-video': {
    price: 0.20,
    verified: false,
    source: 'estimated',
    notes: 'Estimated'
  },
  'fal-ai/stable-video-diffusion': {
    price: 0.15,
    verified: true,
    source: 'fal.ai docs',
    notes: 'Open-source model'
  },
  
  // ========== IMAGE MODELS (Verified from fal.ai) ==========
  'fal-ai/flux-pro/v1.1': {
    price: 0.055,
    verified: true,
    source: 'fal.ai/models',
    notes: 'FLUX Pro v1.1'
  },
  'fal-ai/flux-pro': {
    price: 0.055,
    verified: true,
    source: 'fal.ai/models',
    notes: 'FLUX Pro'
  },
  'fal-ai/flux-realism': {
    price: 0.055,
    verified: true,
    source: 'fal.ai/models',
    notes: 'FLUX Realism'
  },
  'fal-ai/flux-dev': {
    price: 0.025,
    verified: true,
    source: 'fal.ai/models',
    notes: 'FLUX Dev'
  },
  'fal-ai/flux-schnell': {
    price: 0.015,
    verified: true,
    source: 'fal.ai/models',
    notes: 'FLUX Schnell'
  },
  'fal-ai/imagen-4': {
    price: 0.08,
    verified: true,
    source: 'fal.ai/models',
    notes: 'Google Imagen 4'
  },
  'fal-ai/ideogram-v2': {
    price: 0.08,
    verified: true,
    source: 'fal.ai/models',
    notes: 'Ideogram v2'
  },
  'fal-ai/qwen-image': {
    price: 0.04,
    verified: true,
    source: 'fal.ai/models',
    notes: 'Alibaba Qwen'
  },
  'fal-ai/dreamina': {
    price: 0.045,
    verified: true,
    source: 'fal.ai/models',
    notes: 'ByteDance Dreamina'
  },
  'fal-ai/recraft-v3': {
    price: 0.05,
    verified: true,
    source: 'fal.ai/models',
    notes: 'Recraft V3'
  },
  'fal-ai/kolors': {
    price: 0.035,
    verified: true,
    source: 'fal.ai/models',
    notes: 'Kwai Kolors'
  },
  'fal-ai/playground-v25': {
    price: 0.04,
    verified: true,
    source: 'fal.ai/models',
    notes: 'Playground v2.5'
  },
  'fal-ai/aura-flow': {
    price: 0.02,
    verified: true,
    source: 'fal.ai/models',
    notes: 'AuraFlow'
  },
  'fal-ai/stable-diffusion-xl': {
    price: 0.03,
    verified: true,
    source: 'fal.ai/models',
    notes: 'SDXL'
  },
  'fal-ai/flux-pro/inpainting': {
    price: 0.055,
    verified: true,
    source: 'fal.ai/models',
    notes: 'FLUX Inpainting'
  },
  'fal-ai/clarity-upscaler': {
    price: 0.10,
    verified: true,
    source: 'fal.ai/models',
    notes: 'Upscaler'
  },
  'fal-ai/imageutils/rembg': {
    price: 0.02,
    verified: true,
    source: 'fal.ai/models',
    notes: 'Background remover'
  },
  'fal-ai/face-to-sticker': {
    price: 0.03,
    verified: true,
    source: 'fal.ai/models',
    notes: 'Face to Sticker'
  },
  'fal-ai/nano-banan': {
    price: 0.015,
    verified: true,
    source: 'fal.ai/models',
    notes: 'Nano Banan'
  }
};

async function syncRealPricing() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   SYNC REAL FAL.AI PRICING                              ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  
  let updated = 0;
  let unchanged = 0;
  let notFound = 0;
  
  for (const [modelId, data] of Object.entries(REAL_FAL_PRICES)) {
    try {
      const { price, verified, source, notes } = data;
      
      // Check if model exists
      const checkResult = await pool.query(
        'SELECT id, name, fal_price, type FROM ai_models WHERE model_id = $1',
        [modelId]
      );
      
      if (checkResult.rows.length === 0) {
        console.log(`⚠️  Model not found: ${modelId}`);
        notFound++;
        continue;
      }
      
      const model = checkResult.rows[0];
      const currentPrice = parseFloat(model.fal_price) || 0;
      const priceDiff = Math.abs(price - currentPrice);
      
      // Skip if price hasn't changed
      if (priceDiff < 0.001) {
        console.log(`✓ ${model.name.padEnd(40)} $${price.toFixed(4)} (unchanged)`);
        unchanged++;
        continue;
      }
      
      // Update price
      await pool.query(
        'UPDATE ai_models SET fal_price = $1, updated_at = NOW() WHERE model_id = $2',
        [price, modelId]
      );
      
      // Recalculate credits using database function
      await pool.query(`
        UPDATE ai_models 
        SET cost = calculate_credits_typed(
          id, 
          type, 
          $1, 
          max_duration, 
          COALESCE(pricing_type, 'flat')
        )
        WHERE model_id = $2
      `, [price, modelId]);
      
      const changePercent = currentPrice > 0 
        ? ((price - currentPrice) / currentPrice * 100).toFixed(1)
        : 'NEW';
      
      const verifiedBadge = verified ? '✅' : '⚠️';
      console.log(`${verifiedBadge} ${model.name.padEnd(40)} $${currentPrice.toFixed(4)} → $${price.toFixed(4)} (${changePercent}%)`);
      console.log(`   Source: ${source} | ${notes}`);
      updated++;
      
    } catch (error) {
      console.error(`❌ Error updating ${modelId}:`, error.message);
    }
  }
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 SYNC SUMMARY');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`  Total in list: ${Object.keys(REAL_FAL_PRICES).length}`);
  console.log(`  ✅ Updated: ${updated}`);
  console.log(`  ✓ Unchanged: ${unchanged}`);
  console.log(`  ⚠️  Not Found: ${notFound}`);
  console.log('\n═══════════════════════════════════════════════════════════\n');
  
  console.log('✅ SYNC COMPLETE!\n');
  console.log('💡 TIP: Visit /admin/pricing to verify the updated prices\n');
}

// Run sync
syncRealPricing()
  .then(() => {
    console.log('✅ Process completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });




