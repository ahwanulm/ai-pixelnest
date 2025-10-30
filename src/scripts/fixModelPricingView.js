/**
 * Fix model_pricing view to use type-aware base credit
 * 
 * Problem: View uses single base_credit_usd for ALL models
 * Solution: Use CASE statement to check model type
 */

const { pool } = require('../config/database');

async function fixModelPricingView() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing model_pricing view...\n');
    
    await client.query('BEGIN');
    
    // Drop existing view
    console.log('📊 Dropping old view...');
    await client.query(`DROP VIEW IF EXISTS model_pricing;`);
    console.log('  ✓ Old view dropped');
    
    // Recreate with type-aware pricing
    console.log('📊 Creating new view with type-aware pricing...');
    await client.query(`
      CREATE VIEW model_pricing AS
      SELECT 
        id,
        model_id,
        name,
        provider,
        type,
        max_duration,
        fal_price as usd_price,
        cost as credits,
        -- TYPE-AWARE: Use different base_credit for image vs video
        ROUND(
          cost * CASE 
            WHEN type = 'image' THEN (SELECT config_value FROM pricing_config WHERE config_key = 'image_base_credit_usd')
            WHEN type = 'video' THEN (SELECT config_value FROM pricing_config WHERE config_key = 'video_base_credit_usd')
            ELSE 0.05
          END,
          4
        ) as our_price_usd,
        -- Calculate profit margin with correct our_price
        ROUND(
          (
            (
              cost * CASE 
                WHEN type = 'image' THEN (SELECT config_value FROM pricing_config WHERE config_key = 'image_base_credit_usd')
                WHEN type = 'video' THEN (SELECT config_value FROM pricing_config WHERE config_key = 'video_base_credit_usd')
                ELSE 0.05
              END
            ) - fal_price
          ) / fal_price * 100, 
          2
        ) as profit_margin_actual,
        is_active
      FROM ai_models
      WHERE fal_price > 0
      ORDER BY type, fal_price DESC;
    `);
    console.log('  ✓ New view created with type-aware pricing');
    
    await client.query('COMMIT');
    
    // Show examples
    console.log('\n📋 TESTING NEW VIEW:\n');
    const examples = await client.query(`
      SELECT name, type, usd_price, credits, our_price_usd, profit_margin_actual
      FROM model_pricing
      WHERE name IN ('Sora 2', 'FLUX Pro', 'Kling 2.5 Turbo Pro', 'Runway Gen-3 Turbo')
      ORDER BY type, name
    `);
    
    console.table(examples.rows.map(r => ({
      name: r.name,
      type: r.type.toUpperCase(),
      'FAL Price': `$${parseFloat(r.usd_price).toFixed(4)}`,
      'Credits': parseFloat(r.credits).toFixed(1),
      'Our Price': `$${parseFloat(r.our_price_usd).toFixed(4)}`,
      'Profit %': `+${parseFloat(r.profit_margin_actual).toFixed(1)}%`
    })));
    
    // Verify base credits being used
    console.log('\n⚙️ CHECKING BASE CREDITS:\n');
    const configs = await client.query(`
      SELECT config_key, config_value
      FROM pricing_config
      WHERE config_key IN ('image_base_credit_usd', 'video_base_credit_usd')
      ORDER BY config_key
    `);
    
    console.table(configs.rows.map(r => ({
      config: r.config_key,
      value: `$${parseFloat(r.config_value).toFixed(3)}`
    })));
    
    console.log('\n✅ model_pricing view fixed!');
    console.log('   Image models now use: $0.050/credit');
    console.log('   Video models now use: $0.080/credit\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error fixing view:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  fixModelPricingView()
    .then(() => {
      console.log('✅ Done!');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Failed:', err);
      process.exit(1);
    });
}

module.exports = fixModelPricingView;

