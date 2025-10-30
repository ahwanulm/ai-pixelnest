/**
 * VERIFY FAL.AI PRICING SCRIPT
 * 
 * Purpose: Verify and update FAL.AI model pricing in database
 * 
 * This script:
 * 1. Connects to database
 * 2. Lists all models with current pricing
 * 3. Shows discrepancies with known prices
 * 4. Provides recommendations for updates
 * 
 * Usage: node src/scripts/verifyFalPricing.js
 */

const { pool } = require('../config/database');

// Known verified prices from FAL.AI official website
const VERIFIED_PRICES = {
  // IMAGE MODELS (verified from fal.ai)
  'fal-ai/flux-pro/v1.1': { price: 0.055, verified: true, source: 'fal.ai/models' },
  'fal-ai/flux-pro': { price: 0.055, verified: true, source: 'fal.ai/models' },
  'fal-ai/flux-realism': { price: 0.055, verified: true, source: 'fal.ai/models' },
  'fal-ai/flux-dev': { price: 0.025, verified: true, source: 'fal.ai/models' },
  'fal-ai/flux-schnell': { price: 0.015, verified: true, source: 'fal.ai/models' },
  'fal-ai/imagen-4': { price: 0.08, verified: true, source: 'fal.ai/models' },
  'fal-ai/ideogram-v2': { price: 0.08, verified: true, source: 'fal.ai/models' },
  'fal-ai/qwen-image': { price: 0.04, verified: true, source: 'fal.ai/models' },
  'fal-ai/dreamina': { price: 0.045, verified: true, source: 'fal.ai/models' },
  'fal-ai/recraft-v3': { price: 0.05, verified: true, source: 'fal.ai/models' },
  'fal-ai/kolors': { price: 0.035, verified: true, source: 'fal.ai/models' },
  'fal-ai/playground-v25': { price: 0.04, verified: true, source: 'fal.ai/models' },
  'fal-ai/aura-flow': { price: 0.02, verified: true, source: 'fal.ai/models' },
  'fal-ai/stable-diffusion-xl': { price: 0.03, verified: true, source: 'fal.ai/models' },
  'fal-ai/flux-pro/inpainting': { price: 0.055, verified: true, source: 'fal.ai/models' },
  'fal-ai/clarity-upscaler': { price: 0.10, verified: true, source: 'fal.ai/models' },
  'fal-ai/imageutils/rembg': { price: 0.02, verified: true, source: 'fal.ai/models' },
  'fal-ai/face-to-sticker': { price: 0.03, verified: true, source: 'fal.ai/models' },
  'fal-ai/nano-banan': { price: 0.015, verified: true, source: 'fal.ai/models' },

  // VIDEO MODELS (NEEDS VERIFICATION)
  // Veo 3: $0.20-$0.40 per second (verified from fal.ai/models/fal-ai/veo3)
  // For 8s with audio: $0.40 × 8 = $3.20
  'fal-ai/google/veo-3': { price: 3.20, verified: false, source: 'calculated ($0.40/s × 8s)', note: 'With audio' },
  
  // Veo 3.1: NOT FOUND on fal.ai - needs verification
  'fal-ai/google/veo-3.1': { price: null, verified: false, source: 'NOT DOCUMENTED', note: 'User reports $0.50 but source code has $0.30' },
  
  // Sora 2: NOT FOUND on fal.ai - needs verification
  'fal-ai/openai/sora-2': { price: null, verified: false, source: 'NOT DOCUMENTED', note: 'Currently set at $0.50' },
  
  // Other video models: NOT DOCUMENTED on fal.ai
  'fal-ai/runway-gen3': { price: null, verified: false, source: 'NOT DOCUMENTED', note: 'Currently set at $0.35' },
  'fal-ai/kuaishou/kling-video/v2.5/pro/text-to-video': { price: null, verified: false, source: 'NOT DOCUMENTED' },
  'fal-ai/kling-video/v1.6/pro/text-to-video': { price: null, verified: false, source: 'NOT DOCUMENTED' },
  'fal-ai/kling-video/v1/standard/text-to-video': { price: null, verified: false, source: 'NOT DOCUMENTED' },
  'fal-ai/kling-video/v1/standard/image-to-video': { price: null, verified: false, source: 'NOT DOCUMENTED' },
  'fal-ai/luma-dream-machine': { price: null, verified: false, source: 'NOT DOCUMENTED' },
  'fal-ai/seaweedfs/seedance': { price: null, verified: false, source: 'NOT DOCUMENTED' },
  'fal-ai/minimax-video': { price: null, verified: false, source: 'NOT DOCUMENTED' },
  'fal-ai/pika-labs': { price: null, verified: false, source: 'NOT DOCUMENTED' },
  'fal-ai/haiper-video': { price: null, verified: false, source: 'NOT DOCUMENTED' },
  'fal-ai/stable-video-diffusion': { price: null, verified: false, source: 'NOT DOCUMENTED' }
};

async function verifyPricing() {
  const client = await pool.connect();
  
  try {
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║   FAL.AI PRICING VERIFICATION REPORT                    ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');
    
    // Get all models from database
    const result = await client.query(`
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
      WHERE provider IN ('OpenAI', 'Google DeepMind', 'Runway', 'Kuaishou', 'Luma AI', 'SeaweedFS', 'Community', 'Black Forest Labs', 'Fal AI', 'ByteDance', 'Kwai', 'MiniMax', 'Haiper', 'Stability AI', 'Ideogram', 'Qwen', 'Recraft')
      ORDER BY type DESC, fal_price DESC NULLS LAST
    `);
    
    console.log(`Found ${result.rows.length} models in database\n`);
    
    // Separate by type
    const imageModels = result.rows.filter(m => m.type === 'image');
    const videoModels = result.rows.filter(m => m.type === 'video');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 IMAGE MODELS PRICING');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    let imageVerified = 0;
    let imageUnverified = 0;
    let imageMismatch = 0;
    
    imageModels.forEach(model => {
      const verified = VERIFIED_PRICES[model.model_id];
      const dbPrice = parseFloat(model.fal_price) || 0;
      
      if (verified && verified.verified) {
        const expectedPrice = verified.price;
        const match = Math.abs(dbPrice - expectedPrice) < 0.001;
        
        if (match) {
          console.log(`✅ ${model.name.padEnd(30)} $${dbPrice.toFixed(4)} → CORRECT`);
          imageVerified++;
        } else {
          console.log(`⚠️  ${model.name.padEnd(30)} $${dbPrice.toFixed(4)} → SHOULD BE $${expectedPrice.toFixed(4)}`);
          imageMismatch++;
        }
      } else {
        console.log(`❓ ${model.name.padEnd(30)} $${dbPrice.toFixed(4)} → NOT VERIFIED`);
        imageUnverified++;
      }
    });
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🎬 VIDEO MODELS PRICING');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    let videoVerified = 0;
    let videoUnverified = 0;
    let videoMismatch = 0;
    let videoMissing = 0;
    
    videoModels.forEach(model => {
      const verified = VERIFIED_PRICES[model.model_id];
      const dbPrice = parseFloat(model.fal_price) || 0;
      const duration = model.max_duration || '?';
      
      if (!verified) {
        console.log(`❌ ${model.name.padEnd(25)} (${duration}s) $${dbPrice.toFixed(4)} → NO REFERENCE DATA`);
        videoMissing++;
      } else if (verified.price === null) {
        console.log(`⚠️  ${model.name.padEnd(25)} (${duration}s) $${dbPrice.toFixed(4)} → ${verified.source}`);
        if (verified.note) {
          console.log(`    📝 Note: ${verified.note}`);
        }
        videoUnverified++;
      } else if (verified.verified) {
        const expectedPrice = verified.price;
        const match = Math.abs(dbPrice - expectedPrice) < 0.001;
        
        if (match) {
          console.log(`✅ ${model.name.padEnd(25)} (${duration}s) $${dbPrice.toFixed(4)} → CORRECT`);
          videoVerified++;
        } else {
          console.log(`⚠️  ${model.name.padEnd(25)} (${duration}s) $${dbPrice.toFixed(4)} → SHOULD BE $${expectedPrice.toFixed(4)}`);
          videoMismatch++;
        }
      } else {
        console.log(`❓ ${model.name.padEnd(25)} (${duration}s) $${dbPrice.toFixed(4)} → ${verified.source}`);
        videoUnverified++;
      }
    });
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📈 SUMMARY');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('IMAGE MODELS:');
    console.log(`  ✅ Verified & Correct: ${imageVerified}`);
    console.log(`  ⚠️  Mismatch: ${imageMismatch}`);
    console.log(`  ❓ Not Verified: ${imageUnverified}`);
    
    console.log('\nVIDEO MODELS:');
    console.log(`  ✅ Verified & Correct: ${videoVerified}`);
    console.log(`  ⚠️  Mismatch: ${videoMismatch}`);
    console.log(`  ❓ Not Verified: ${videoUnverified}`);
    console.log(`  ❌ No Reference Data: ${videoMissing}`);
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🎯 RECOMMENDATIONS');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    if (imageMismatch > 0) {
      console.log('1. ⚠️  UPDATE IMAGE MODEL PRICING');
      console.log('   Run: npm run update:pricing');
    }
    
    if (videoUnverified > 0 || videoMissing > 0) {
      console.log('2. ⚠️  VIDEO MODEL PRICING NEEDS VERIFICATION');
      console.log('   - Visit fal.ai/models');
      console.log('   - Check each video model page');
      console.log('   - Record actual pricing');
      console.log('   - Update VERIFIED_PRICES in this script');
    }
    
    console.log('\n3. 💡 ALTERNATIVE: USE FAL.AI API');
    console.log('   Implement auto-sync from FAL.AI pricing API');
    console.log('   Contact: support@fal.ai for API access');
    
    console.log('\n4. 🔍 MANUAL CHECK REQUIRED:');
    console.log('   Models needing immediate verification:');
    console.log('   - Veo 3.1 (user reports $0.50, code has $0.30)');
    console.log('   - Sora 2 (currently $0.50)');
    console.log('   - Runway Gen-3 (currently $0.35)');
    console.log('   - All Kling models');
    console.log('   - Luma Dream Machine');
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ VERIFICATION COMPLETE');
    console.log('═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error verifying pricing:', error);
  } finally {
    client.release();
  }
}

// Run verification
verifyPricing()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });

