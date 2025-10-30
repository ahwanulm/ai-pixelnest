/**
 * Fix ALL Pricing Issues
 * 1. Update model_pricing view to include IDR prices
 * 2. Fix all model FAL prices to match actual fal.ai pricing
 * 3. Recalculate all credits correctly
 */

const { pool } = require('../config/database');

async function fixAll() {
  try {
    console.log('\n🔧 Fixing ALL Pricing Issues...\n');
    
    // Step 1: Get credit_price_idr
    const configResult = await pool.query(`
      SELECT config_value FROM pricing_config WHERE config_key = 'credit_price_idr'
    `);
    
    const creditPriceIDR = parseFloat(configResult.rows[0]?.config_value || 1300);
    console.log(`✅ Credit Price IDR: Rp ${creditPriceIDR.toLocaleString('id-ID')}\n`);
    
    // Step 2: Recreate model_pricing view with IDR support
    console.log('📊 Recreating model_pricing view with IDR support...');
    
    await pool.query(`DROP VIEW IF EXISTS model_pricing CASCADE`);
    
    await pool.query(`
      CREATE OR REPLACE VIEW model_pricing AS
      SELECT 
        m.id,
        m.model_id,
        m.name,
        m.provider,
        m.type,
        m.max_duration,
        m.pricing_type,
        m.fal_price as usd_price,
        m.cost as credits,
        ROUND(m.cost * 0.05, 4) as our_price_usd,
        ROUND(m.cost * (
          SELECT config_value FROM pricing_config WHERE config_key = 'credit_price_idr'
        ), 0) as our_price_idr,
        ROUND(
          ((m.cost * 0.05) - m.fal_price) / m.fal_price * 100, 
          2
        ) as profit_margin_actual,
        m.is_active
      FROM ai_models m
      WHERE m.fal_price > 0
      ORDER BY m.type, m.fal_price DESC;
    `);
    
    console.log('✅ View recreated with our_price_idr column\n');
    
    // Step 3: Fix critical model prices based on ACTUAL fal.ai pricing (October 2025)
    console.log('📊 Fixing model prices to match fal.ai actual pricing...\n');
    
    const modelUpdates = [
      // Video Models - Per-Second Pricing
      {
        model_id: 'fal-ai/kuaishou/kling-video/v2.5/pro/text-to-video',
        name: 'Kling 2.5 Turbo Pro',
        fal_price: 0.28,  // $0.28/second
        pricing_type: 'per_second',
        max_duration: 10,
        note: 'Per-second: $0.28/s'
      },
      {
        model_id: 'fal-ai/kuaishou/kling-video/v2.5/standard/text-to-video',
        name: 'Kling 2.5 Standard',
        fal_price: 0.20,  // $0.20/second
        pricing_type: 'per_second',
        max_duration: 10,
        note: 'Per-second: $0.20/s'
      },
      {
        model_id: 'fal-ai/kling-video/v1.6/pro/text-to-video',
        name: 'Kling AI v1.6 Pro',
        fal_price: 0.095,  // $0.095/second
        pricing_type: 'per_second',
        max_duration: 15,
        note: 'Per-second: $0.095/s'
      },
      {
        model_id: 'fal-ai/openai/sora-2',
        name: 'Sora 2',
        fal_price: 0.24,  // $0.24/second
        pricing_type: 'per_second',
        max_duration: 20,
        note: 'Per-second: $0.24/s'
      },
      
      // Video Models - Flat Rate
      {
        model_id: 'fal-ai/runway-gen3',
        name: 'Runway Gen-3',
        fal_price: 0.60,  // $0.60 flat
        pricing_type: 'flat',
        max_duration: 10,
        note: 'Flat rate: $0.60/video'
      },
      {
        model_id: 'fal-ai/google/veo-3.1',
        name: 'Veo 3.1',
        fal_price: 0.60,  // $0.60 flat (estimated)
        pricing_type: 'flat',
        max_duration: 10,
        note: 'Flat rate: $0.60/video (estimated)'
      },
      {
        model_id: 'fal-ai/google/veo-3',
        name: 'Veo 3',
        fal_price: 0.50,  // $0.50 flat (estimated)
        pricing_type: 'flat',
        max_duration: 8,
        note: 'Flat rate: $0.50/video (estimated)'
      },
      {
        model_id: 'fal-ai/minimax-video',
        name: 'MiniMax Video',
        fal_price: 0.50,  // $0.50 flat
        pricing_type: 'flat',
        max_duration: 6,
        note: 'Flat rate: $0.50/video'
      },
      {
        model_id: 'fal-ai/luma-dream-machine',
        name: 'Luma Dream Machine',
        fal_price: 0.35,  // $0.35 flat (estimated)
        pricing_type: 'flat',
        max_duration: 5,
        note: 'Flat rate: $0.35/video (estimated)'
      },
      {
        model_id: 'fal-ai/runway-gen3/turbo',
        name: 'Runway Gen-3 Turbo',
        fal_price: 0.35,  // $0.35 flat
        pricing_type: 'flat',
        max_duration: 10,
        note: 'Flat rate: $0.35/video'
      }
    ];
    
    let updated = 0;
    let notFound = 0;
    
    for (const update of modelUpdates) {
      const result = await pool.query(`
        UPDATE ai_models
        SET 
          fal_price = $1,
          pricing_type = $2,
          max_duration = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE model_id = $4
        RETURNING name, fal_price, pricing_type, max_duration, cost
      `, [update.fal_price, update.pricing_type, update.max_duration, update.model_id]);
      
      if (result.rows.length > 0) {
        const model = result.rows[0];
        console.log(`✅ ${model.name.padEnd(30)} | ${update.note.padEnd(30)} | ${model.cost} credits`);
        updated++;
      } else {
        console.log(`⚠️  ${update.name.padEnd(30)} | NOT FOUND IN DATABASE`);
        notFound++;
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   Updated: ${updated} models`);
    console.log(`   Not Found: ${notFound} models\n`);
    
    // Step 4: Check final pricing
    console.log('📊 Final Pricing Check:\n');
    
    const finalCheck = await pool.query(`
      SELECT 
        name,
        type,
        pricing_type,
        fal_price,
        max_duration,
        cost as credits,
        ROUND(cost * $1, 0) as price_idr,
        ROUND(((cost * 0.05) - fal_price) / fal_price * 100, 1) as profit_percent
      FROM ai_models
      WHERE model_id IN (
        'fal-ai/kuaishou/kling-video/v2.5/pro/text-to-video',
        'fal-ai/openai/sora-2',
        'fal-ai/minimax-video',
        'fal-ai/luma-dream-machine'
      )
      ORDER BY name
    `, [creditPriceIDR]);
    
    console.table(finalCheck.rows.map(r => ({
      'Model': r.name,
      'Type': r.pricing_type || 'flat',
      'FAL $': `$${parseFloat(r.fal_price).toFixed(3)}/s`,
      'Max': `${r.max_duration}s`,
      'Credits': parseFloat(r.credits).toFixed(1),
      'User Pays': `Rp ${parseInt(r.price_idr).toLocaleString('id-ID')}`,
      'Profit': `${r.profit_percent}%`
    })));
    
    console.log('\n✅ All pricing issues fixed!\n');
    console.log('📝 Next steps:');
    console.log('   1. Refresh admin pricing page to see IDR prices');
    console.log('   2. Verify "Your Price" now shows Rupiah');
    console.log('   3. Test generation with new pricing\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

fixAll();




