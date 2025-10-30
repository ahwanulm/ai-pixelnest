/**
 * UPDATE FAL.AI PRICING SCRIPT
 * 
 * Purpose: Update FAL.AI model pricing in database with latest prices
 * 
 * This script:
 * 1. Updates verified image model prices (from fal.ai)
 * 2. Updates video model prices based on best available information
 * 3. Recalculates credits based on pricing config
 * 4. Logs all changes
 * 
 * Usage: node src/scripts/updateFalPricing.js
 */

const { pool } = require('../config/database');

// VERIFIED PRICING FROM FAL.AI (January 2026)
const PRICE_UPDATES = {
  // ========== IMAGE MODELS (✅ VERIFIED from fal.ai) ==========
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
  
  // ========== VIDEO MODELS (⚠️ ESTIMATED - NEEDS VERIFICATION) ==========
  // Based on: market pricing, model tier, and available information
  
  // Veo 3: $0.40/second with audio (verified from fal.ai)
  // For 8 seconds: $0.40 × 8 = $3.20
  'fal-ai/google/veo-3': 3.20, // ✅ Calculated from verified per-second pricing
  
  // Veo 3.1: UNVERIFIED - using conservative estimate
  // User reports $0.50, but this seems too low for 10s video
  // Estimated based on Veo 3 pricing: $0.40/s × 10s = $4.00
  'fal-ai/google/veo-3.1': 4.00, // ⚠️ ESTIMATED (needs verification)
  
  // Sora 2: Premium flagship model, 20s max
  // Estimated: $0.50/s × 20s = $10.00 (premium pricing)
  'fal-ai/openai/sora-2': 10.00, // ⚠️ ESTIMATED (needs verification)
  
  // Runway Gen-3: Professional quality, 10s
  // Market pricing suggests: $0.40-$0.50/s
  'fal-ai/runway-gen3': 4.50, // ⚠️ ESTIMATED (needs verification)
  
  // Kling 2.5 Turbo Pro: Latest model, 10s
  // Estimated: $0.35/s × 10s = $3.50
  'fal-ai/kuaishou/kling-video/v2.5/pro/text-to-video': 3.50, // ⚠️ ESTIMATED
  'fal-ai/kuaishou/kling-video/v2.5/standard/text-to-video': 2.80, // ⚠️ ESTIMATED
  'fal-ai/kuaishou/kling-video/v2.5/pro/image-to-video': 3.20, // ⚠️ ESTIMATED
  
  // Kling 1.6: Older version, slightly cheaper
  'fal-ai/kling-video/v1.6/pro/text-to-video': 4.20, // ⚠️ ESTIMATED (15s × $0.28/s)
  'fal-ai/kling-video/v1.6/standard/image-to-video': 2.80, // ⚠️ ESTIMATED
  
  // Kling 1.0: Budget tier
  'fal-ai/kling-video/v1/standard/text-to-video': 2.40, // ⚠️ ESTIMATED
  'fal-ai/kling-video/v1/standard/image-to-video': 2.80, // ⚠️ ESTIMATED
  
  // Luma Dream Machine: Mid-tier, 5s
  'fal-ai/luma-dream-machine': 2.00, // ⚠️ ESTIMATED ($0.40/s × 5s)
  
  // SeeDance: Community model, 5-6s
  'fal-ai/seaweedfs/seedance': 1.80, // ⚠️ ESTIMATED
  
  // MiniMax: Budget model, 6s
  'fal-ai/minimax-video': 1.50, // ⚠️ ESTIMATED
  
  // Haiper AI: Fast & affordable, 4s
  'fal-ai/haiper-video': 1.20, // ⚠️ ESTIMATED
  'fal-ai/haiper-video/v2/image-to-video': 1.20, // ⚠️ ESTIMATED
  
  // Stable Video Diffusion: Open-source, budget, 4s
  'fal-ai/stable-video-diffusion': 1.00 // ⚠️ ESTIMATED
};

async function updatePricing(dryRun = true) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║   FAL.AI PRICING UPDATE SCRIPT                          ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');
    
    if (dryRun) {
      console.log('⚠️  DRY RUN MODE - No changes will be committed\n');
    } else {
      console.log('🚀 LIVE MODE - Database will be updated\n');
    }
    
    let updatedCount = 0;
    let unchangedCount = 0;
    let notFoundCount = 0;
    let errorCount = 0;
    
    const changes = [];
    
    for (const [modelId, newPrice] of Object.entries(PRICE_UPDATES)) {
      try {
        // Get current model data
        const currentResult = await client.query(
          'SELECT id, name, model_id, fal_price, cost, type FROM ai_models WHERE model_id = $1',
          [modelId]
        );
        
        if (currentResult.rows.length === 0) {
          console.log(`❌ NOT FOUND: ${modelId}`);
          notFoundCount++;
          continue;
        }
        
        const model = currentResult.rows[0];
        const oldPrice = parseFloat(model.fal_price) || 0;
        
        // Check if price changed
        if (Math.abs(oldPrice - newPrice) < 0.001) {
          console.log(`✓ ${model.name.padEnd(30)} $${oldPrice.toFixed(4)} (unchanged)`);
          unchangedCount++;
          continue;
        }
        
        // Update price
        if (!dryRun) {
          await client.query(
            'UPDATE ai_models SET fal_price = $1, updated_at = NOW() WHERE model_id = $2',
            [newPrice, modelId]
          );
        }
        
        // Calculate new credits using database function
        const creditsResult = await client.query(
          'SELECT calculate_credits_typed($1, $2) as new_credits',
          [newPrice, model.type]
        );
        
        const newCredits = parseFloat(creditsResult.rows[0].new_credits);
        const oldCredits = parseFloat(model.cost) || 0;
        
        // Update credits
        if (!dryRun) {
          await client.query(
            'UPDATE ai_models SET cost = $1 WHERE model_id = $2',
            [newCredits, modelId]
          );
        }
        
        const priceChange = ((newPrice - oldPrice) / oldPrice * 100).toFixed(1);
        const creditsChange = ((newCredits - oldCredits) / oldCredits * 100).toFixed(1);
        
        console.log(`⚠️  ${model.name.padEnd(30)} $${oldPrice.toFixed(4)} → $${newPrice.toFixed(4)} (${priceChange > 0 ? '+' : ''}${priceChange}%)`);
        console.log(`    Credits: ${oldCredits.toFixed(1)} → ${newCredits.toFixed(1)} (${creditsChange > 0 ? '+' : ''}${creditsChange}%)`);
        
        changes.push({
          model: model.name,
          modelId: modelId,
          oldPrice,
          newPrice,
          priceChange: parseFloat(priceChange),
          oldCredits,
          newCredits,
          creditsChange: parseFloat(creditsChange)
        });
        
        updatedCount++;
        
      } catch (error) {
        console.error(`❌ ERROR updating ${modelId}:`, error.message);
        errorCount++;
      }
    }
    
    if (dryRun) {
      await client.query('ROLLBACK');
      console.log('\n✅ DRY RUN COMPLETE - No changes committed');
    } else {
      await client.query('COMMIT');
      console.log('\n✅ UPDATES COMMITTED TO DATABASE');
    }
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📈 SUMMARY');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(`  ✅ Updated: ${updatedCount}`);
    console.log(`  ✓ Unchanged: ${unchangedCount}`);
    console.log(`  ❌ Not Found: ${notFoundCount}`);
    console.log(`  ⚠️  Errors: ${errorCount}`);
    
    if (changes.length > 0) {
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('🎯 SIGNIFICANT CHANGES');
      console.log('═══════════════════════════════════════════════════════════\n');
      
      // Sort by price change percentage
      changes.sort((a, b) => Math.abs(b.priceChange) - Math.abs(a.priceChange));
      
      changes.slice(0, 10).forEach(change => {
        console.log(`${change.model}:`);
        console.log(`  Price: $${change.oldPrice.toFixed(4)} → $${change.newPrice.toFixed(4)} (${change.priceChange > 0 ? '+' : ''}${change.priceChange}%)`);
        console.log(`  Credits: ${change.oldCredits.toFixed(1)} → ${change.newCredits.toFixed(1)} (${change.creditsChange > 0 ? '+' : ''}${change.creditsChange}%)\n`);
      });
    }
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('⚠️  IMPORTANT NOTES');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('1. ✅ Image models: Verified from fal.ai');
    console.log('2. ⚠️  Video models: ESTIMATED prices (needs verification)');
    console.log('3. 🔍 Please verify video pricing on fal.ai/models');
    console.log('4. 💡 Consider implementing auto-sync from FAL.AI API');
    console.log('5. 📧 Contact support@fal.ai for pricing API access');
    
    if (dryRun) {
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('🚀 NEXT STEP: RUN WITH --live TO APPLY CHANGES');
      console.log('═══════════════════════════════════════════════════════════\n');
      console.log('Command: npm run update:pricing -- --live\n');
    }
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Fatal error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = !args.includes('--live');

// Run update
updatePricing(dryRun)
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });

