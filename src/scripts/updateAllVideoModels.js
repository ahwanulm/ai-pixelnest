/**
 * Update ALL Video Models with Correct FAL.AI Pricing
 * Verified from fal.ai official pricing (October 2025)
 */

const { pool } = require('../config/database');

// OFFICIAL FAL.AI VIDEO PRICING (Verified)
// Source: https://fal.ai/pricing & manual testing
const FAL_VIDEO_PRICING = {
  // ========== PER-SECOND MODELS ==========
  'kling-1.6-pro': {
    model_id: 'fal-ai/kling-video/v1.6/pro/text-to-video',
    name: 'Kling AI 1.6 Pro',
    per_second: 0.095,
    max_duration: 15,
    total_for_max: 0.095 * 15, // $1.425
    verified: true
  },
  
  'kling-2-master': {
    model_id: 'fal-ai/kuaishou/kling-video/v2.5/pro/text-to-video',
    name: 'Kling 2.5 Turbo Pro',
    per_second: 0.28,
    max_duration: 10,
    total_for_max: 0.28 * 10, // $2.80
    verified: true
  },
  
  'kling-2-standard': {
    model_id: 'fal-ai/kuaishou/kling-video/v2.5/standard/text-to-video',
    name: 'Kling 2.5 Standard',
    per_second: 0.20, // Estimated (cheaper than pro)
    max_duration: 10,
    total_for_max: 0.20 * 10, // $2.00
    verified: false
  },
  
  // Sora 2 - Per Second (from user screenshot!)
  'sora-2': {
    model_id: 'fal-ai/openai/sora-2',
    name: 'Sora 2',
    per_second: 0.24, // $1.20 / 5s = $0.24/s
    max_duration: 20,
    total_for_max: 0.24 * 20, // $4.80
    verified: true
  },
  
  // ========== FLAT RATE MODELS ==========
  'hunyuan': {
    model_id: 'fal-ai/hunyuan-video',
    name: 'Hunyuan Video',
    flat_rate: 0.40,
    max_duration: 5,
    verified: true
  },
  
  'minimax': {
    model_id: 'fal-ai/minimax-video',
    name: 'MiniMax Video',
    flat_rate: 0.50,
    max_duration: 6,
    verified: true
  },
  
  'wan-video': {
    model_id: 'fal-ai/alibaba/wan-video',
    name: 'Alibaba Wan Video',
    flat_rate: 0.40,
    max_duration: 5,
    verified: true
  },
  
  // ========== ESTIMATED (Common Market Rates) ==========
  'veo-3.1': {
    model_id: 'fal-ai/google/veo-3.1',
    name: 'Veo 3.1',
    flat_rate: 0.60, // Estimated (premium model)
    max_duration: 10,
    verified: false,
    note: 'Premium Google model - estimated'
  },
  
  'veo-3': {
    model_id: 'fal-ai/google/veo-3',
    name: 'Veo 3',
    flat_rate: 0.50, // Estimated
    max_duration: 8,
    verified: false,
    note: 'Google model - estimated'
  },
  
  'runway-gen3': {
    model_id: 'fal-ai/runway-gen3',
    name: 'Runway Gen-3',
    flat_rate: 0.60, // Estimated (premium)
    max_duration: 10,
    verified: false,
    note: 'Premium Runway model - estimated'
  },
  
  'luma-dream': {
    model_id: 'fal-ai/luma-dream-machine',
    name: 'Luma Dream Machine',
    flat_rate: 0.35,
    max_duration: 5,
    verified: false,
    note: 'Estimated based on market'
  }
};

async function updateAllVideoModels() {
  console.log('🔧 Updating ALL Video Models with Correct Pricing...\n');
  console.log('📊 Source: fal.ai official pricing + manual verification\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  try {
    let updatedCount = 0;
    let notFoundCount = 0;
    
    for (const [key, data] of Object.entries(FAL_VIDEO_PRICING)) {
      console.log(`📹 ${data.name}`);
      console.log(`   Model ID: ${data.model_id}`);
      
      // Calculate price
      const falPrice = data.flat_rate || data.total_for_max;
      
      if (data.per_second) {
        console.log(`   Pricing: $${data.per_second}/second`);
        console.log(`   Max Duration: ${data.max_duration}s`);
        console.log(`   Total Cost: $${falPrice.toFixed(4)} (for ${data.max_duration}s)`);
      } else {
        console.log(`   Pricing: $${falPrice}/video (flat rate)`);
        console.log(`   Max Duration: ${data.max_duration}s`);
      }
      
      console.log(`   Status: ${data.verified ? '✅ VERIFIED' : '⚠️  ESTIMATED'}`);
      if (data.note) console.log(`   Note: ${data.note}`);
      
      // Update in database
      const result = await pool.query(`
        UPDATE ai_models 
        SET fal_price = $1,
            max_duration = $2,
            is_active = $3,
            updated_at = CURRENT_TIMESTAMP
        WHERE model_id = $4
        RETURNING id, name, cost
      `, [falPrice, data.max_duration, data.verified, data.model_id]);
      
      if (result.rows.length > 0) {
        const model = result.rows[0];
        console.log(`   ✅ Updated! Old credits: ${model.cost}`);
        updatedCount++;
      } else {
        console.log(`   ⚠️  Model not found in database`);
        notFoundCount++;
      }
      
      console.log('');
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Recalculate all credits
    console.log('🔄 Recalculating credits for updated models...\n');
    
    const recalcResult = await pool.query(`
      UPDATE ai_models 
      SET cost = calculate_credits_typed(fal_price, type)
      WHERE type = 'video' AND fal_price > 0
      RETURNING id, name, fal_price, cost, max_duration
    `);
    
    console.log(`✅ Recalculated ${recalcResult.rowCount} video models\n`);
    
    // Show sample pricing with Rupiah
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('💰 PRICING CALCULATION (Proportional to Duration)\n');
    
    // Get video base credit from config
    const configResult = await pool.query(`
      SELECT config_value 
      FROM pricing_config 
      WHERE config_key = 'video_base_credit_usd'
    `);
    
    const baseCredit = configResult.rows.length > 0 
      ? parseFloat(configResult.rows[0].config_value) 
      : 0.08;
    
    console.log(`Base Credit (Video): $${baseCredit.toFixed(2)} per credit`);
    console.log(`Credit Price (IDR): Rp 1,500 per credit\n`);
    
    // Show examples
    const samples = recalcResult.rows.slice(0, 5);
    samples.forEach(model => {
      const falPrice = parseFloat(model.fal_price);
      const maxDuration = model.max_duration || 10;
      const fullCredits = parseFloat(model.cost);
      
      console.log(`${model.name}:`);
      console.log(`  FAL Price: $${falPrice.toFixed(3)} (for ${maxDuration}s max)`);
      console.log(`  Credits (${maxDuration}s): ${fullCredits.toFixed(1)} credits`);
      console.log(`  User pays (${maxDuration}s): Rp ${(fullCredits * 1500).toLocaleString('id-ID')}`);
      
      // Show proportional for 5s
      if (maxDuration >= 5) {
        const credits5s = fullCredits * (5 / maxDuration);
        console.log(`  Credits (5s): ${credits5s.toFixed(1)} credits`);
        console.log(`  User pays (5s): Rp ${(credits5s * 1500).toLocaleString('id-ID')}`);
      }
      
      // Calculate profit for full duration
      const userPriceUSD = fullCredits * baseCredit;
      const profit = ((userPriceUSD - falPrice) / falPrice * 100);
      console.log(`  Profit Margin: ${profit.toFixed(1)}%`);
      console.log('');
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📊 SUMMARY\n');
    console.log(`✅ Updated: ${updatedCount} models`);
    console.log(`⚠️  Not Found: ${notFoundCount} models`);
    console.log(`✅ All video models recalculated\n`);
    
    console.log('🎯 IMPORTANT NOTES:\n');
    console.log('1. ✅ VERIFIED models have confirmed pricing');
    console.log('2. ⚠️  ESTIMATED models need manual verification');
    console.log('3. 💰 User pricing is PROPORTIONAL to duration');
    console.log('4. 📊 Credits calculated with 25% profit margin\n');
    
    console.log('🔍 TO VERIFY ESTIMATED MODELS:\n');
    console.log('1. Go to: https://fal.ai/models');
    console.log('2. Test each ESTIMATED model');
    console.log('3. Note actual price shown');
    console.log('4. Update this script if different');
    console.log('5. Run script again\n');
    
    console.log('✅ Pricing update completed!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  updateAllVideoModels();
}

module.exports = { updateAllVideoModels };




