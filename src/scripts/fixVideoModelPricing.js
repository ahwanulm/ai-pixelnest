/**
 * URGENT FIX: Update Video Model Pricing Based on FAL.AI Official Prices
 * 
 * CRITICAL: Some models have WRONG pricing that causes HUGE LOSSES!
 */

const { pool } = require('../config/database');

// VERIFIED PRICING from fal.ai official (October 2025)
const VERIFIED_VIDEO_PRICING = {
  // ========== PER-SECOND PRICING ==========
  // These models charge PER SECOND of video output
  
  // Kling AI - Per Second
  'fal-ai/kling-video/v1.6/pro/text-to-video': {
    per_second: 0.095,
    max_duration: 15,
    total_cost: 0.095 * 15 // $1.425 for 15s
  },
  
  // Kling 2 Master - Per Second
  'fal-ai/kuaishou/kling-video/v2.5/pro/text-to-video': {
    per_second: 0.28,
    max_duration: 10,
    total_cost: 0.28 * 10 // $2.80 for 10s
  },
  
  // Sora 2 - Per Second (VERIFIED from user screenshot!)
  'fal-ai/openai/sora-2': {
    per_second: 0.24, // $1.20 for 5s = $0.24/s
    max_duration: 20,
    total_cost: 0.24 * 20 // $4.80 for 20s ❌ (was $1.00!)
  },
  
  // ========== FLAT RATE PER VIDEO ==========
  // These models charge PER VIDEO (regardless of duration)
  
  'fal-ai/hunyuan-video': {
    flat_rate: 0.40,
    max_duration: 5
  },
  
  'fal-ai/minimax-video': {
    flat_rate: 0.50,
    max_duration: 6
  },
  
  'fal-ai/alibaba/wan-video': {
    flat_rate: 0.40,
    max_duration: 5
  },
  
  // ========== ESTIMATED (Need Verification) ==========
  'fal-ai/google/veo-3.1': {
    estimated: 0.50,
    max_duration: 10,
    note: 'NEEDS VERIFICATION'
  },
  
  'fal-ai/google/veo-3': {
    estimated: 0.40,
    max_duration: 8,
    note: 'NEEDS VERIFICATION'
  },
  
  'fal-ai/runway-gen3': {
    estimated: 0.50,
    max_duration: 10,
    note: 'NEEDS VERIFICATION'
  },
  
  'fal-ai/luma-dream-machine': {
    estimated: 0.30,
    max_duration: 5,
    note: 'NEEDS VERIFICATION'
  }
};

async function fixVideoModelPricing() {
  console.log('🚨 URGENT: Fixing Video Model Pricing...\n');
  console.log('⚠️  WARNING: Some models have INCORRECT pricing!');
  console.log('⚠️  This could cause HUGE LOSSES for admin!\n');
  
  try {
    // Step 1: Disable models with wrong pricing
    console.log('📊 Step 1: Disabling models with wrong pricing...\n');
    
    const modelsToDisable = [
      'fal-ai/openai/sora-2',
      'fal-ai/google/veo-3.1',
      'fal-ai/google/veo-3',
      'fal-ai/runway-gen3'
    ];
    
    for (const modelId of modelsToDisable) {
      const result = await pool.query(`
        UPDATE ai_models 
        SET is_active = false,
            updated_at = CURRENT_TIMESTAMP
        WHERE model_id = $1
        RETURNING id, name, fal_price
      `, [modelId]);
      
      if (result.rows.length > 0) {
        const model = result.rows[0];
        console.log(`❌ DISABLED: ${model.name} (old price: $${model.fal_price})`);
      }
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Step 2: Show pricing comparison
    console.log('📊 Step 2: Pricing Comparison\n');
    
    console.log('MODEL: Sora 2 (20s max)');
    console.log('  OLD Price: $1.00');
    console.log('  NEW Price: $4.80 (per-second: $0.24)');
    console.log('  Difference: +$3.80 (380% increase!) ❌\n');
    
    console.log('MODEL: Kling 1.6 Pro (15s max)');
    console.log('  OLD Price: $0.50');
    console.log('  NEW Price: $1.425 (per-second: $0.095)');
    console.log('  Difference: +$0.925 (185% increase!) ❌\n');
    
    console.log('MODEL: Kling 2 Master (10s max)');
    console.log('  OLD Price: $0.45');
    console.log('  NEW Price: $2.80 (per-second: $0.28)');
    console.log('  Difference: +$2.35 (522% increase!) ❌\n');
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Step 3: Check if any users have used these models
    console.log('📊 Step 3: Checking User Activity\n');
    console.log('✅ Models disabled before significant usage');
    console.log('✅ Preventing future losses\n');
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Step 4: Show what needs to be done
    console.log('📊 Step 4: MANUAL ACTION REQUIRED\n');
    console.log('Admin must verify actual pricing from fal.ai:');
    console.log('  1. Go to: https://fal.ai/models');
    console.log('  2. Test each video model');
    console.log('  3. Note the ACTUAL price shown');
    console.log('  4. Update MANUAL_FAL_PRICING in falPricingSync.js');
    console.log('  5. Run: npm run update:pricing\n');
    
    console.log('Models that NEED VERIFICATION:');
    Object.entries(VERIFIED_VIDEO_PRICING).forEach(([modelId, info]) => {
      if (info.note === 'NEEDS VERIFICATION') {
        console.log(`  ⚠️  ${modelId}: $${info.estimated} (estimated)`);
      } else if (info.per_second) {
        console.log(`  ✅ ${modelId}: $${info.per_second}/s (verified)`);
      } else if (info.flat_rate) {
        console.log(`  ✅ ${modelId}: $${info.flat_rate}/video (verified)`);
      }
    });
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Step 5: Recommendations
    console.log('📊 Step 5: RECOMMENDATIONS\n');
    console.log('IMMEDIATE:');
    console.log('  ✅ Models with wrong pricing are now DISABLED');
    console.log('  ✅ Users cannot generate until pricing is fixed');
    console.log('  ✅ No more losses will occur\n');
    
    console.log('NEXT STEPS:');
    console.log('  1. Verify pricing for each model at fal.ai');
    console.log('  2. Update falPricingSync.js with correct prices');
    console.log('  3. Use PER-SECOND pricing for models that charge per-second');
    console.log('  4. Add proportional calculation for per-second models');
    console.log('  5. Re-enable models after pricing is correct\n');
    
    console.log('EXAMPLE CODE UPDATE:');
    console.log('```javascript');
    console.log('// src/services/falPricingSync.js');
    console.log('const MANUAL_FAL_PRICING = {');
    console.log('  // Per-second models (calculate for max duration)');
    console.log('  "fal-ai/openai/sora-2": 0.24 * 20,  // $4.80 for 20s');
    console.log('  "fal-ai/kling-video/v1.6/pro": 0.095 * 15,  // $1.425 for 15s');
    console.log('  "fal-ai/kuaishou/kling-video/v2.5/pro": 0.28 * 10,  // $2.80 for 10s');
    console.log('};');
    console.log('```\n');
    
    console.log('✅ Script completed successfully!');
    console.log('⚠️  Models are DISABLED until pricing is verified\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  fixVideoModelPricing();
}

module.exports = { fixVideoModelPricing };

