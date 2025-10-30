/**
 * Check and Fix Sora 2 Pricing
 * 
 * Issue: Sora 2 shows 15.0 credits but should be ~8.0 credits
 */

const { pool } = require('../config/database');

async function checkAndFixSora2() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking Sora 2 pricing...\n');
    
    // Get current Sora 2 data
    const result = await client.query(`
      SELECT 
        id,
        model_id,
        name,
        provider,
        type,
        max_duration,
        fal_price,
        cost,
        is_active,
        updated_at
      FROM ai_models 
      WHERE name ILIKE '%sora%'
      ORDER BY name
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ No Sora models found in database');
      return;
    }
    
    console.log('📊 Current Sora Models:\n');
    result.rows.forEach(model => {
      console.log(`Model: ${model.name}`);
      console.log(`  ID: ${model.id}`);
      console.log(`  Model ID: ${model.model_id}`);
      console.log(`  FAL Price: $${model.fal_price}`);
      console.log(`  Cost (Credits): ${model.cost}`);
      console.log(`  Max Duration: ${model.max_duration}s`);
      console.log(`  Updated: ${model.updated_at}`);
      console.log('');
    });
    
    // Check pricing config
    console.log('💰 Checking pricing configuration...\n');
    const configResult = await client.query(`
      SELECT config_key, config_value 
      FROM pricing_config 
      WHERE config_key LIKE '%video%' OR config_key LIKE '%profit%'
      ORDER BY config_key
    `);
    
    console.log('Pricing Config:');
    configResult.rows.forEach(row => {
      console.log(`  ${row.config_key}: ${row.config_value}`);
    });
    console.log('');
    
    // Calculate what Sora 2 SHOULD be
    const videoProfit = parseFloat(configResult.rows.find(r => r.config_key === 'video_profit_margin')?.config_value || 25);
    const videoBaseCredit = parseFloat(configResult.rows.find(r => r.config_key === 'video_base_credit_usd')?.config_value || 0.08);
    
    console.log('🧮 Calculation for Sora 2:\n');
    
    // From FAL.AI pricing sync, Sora 2 = $1.00 per generation
    const sora2FalPrice = 1.00;
    
    console.log(`  FAL Price: $${sora2FalPrice}`);
    console.log(`  Video Base Credit: $${videoBaseCredit}`);
    console.log(`  Video Profit Margin: ${videoProfit}%`);
    console.log('');
    console.log(`  Step 1: Base Credits = ${sora2FalPrice} / ${videoBaseCredit} = ${(sora2FalPrice / videoBaseCredit).toFixed(2)}`);
    console.log(`  Step 2: With Profit = ${(sora2FalPrice / videoBaseCredit).toFixed(2)} × ${(1 + videoProfit/100).toFixed(2)} = ${(sora2FalPrice / videoBaseCredit * (1 + videoProfit/100)).toFixed(2)}`);
    console.log(`  Step 3: Rounded = ${Math.round((sora2FalPrice / videoBaseCredit * (1 + videoProfit/100)) * 2) / 2}`);
    console.log('');
    
    const correctCost = Math.round((sora2FalPrice / videoBaseCredit * (1 + videoProfit/100)) * 2) / 2;
    
    console.log(`✅ Sora 2 SHOULD BE: ${correctCost} credits\n`);
    
    // Check if fix needed
    const sora2 = result.rows.find(m => m.name.toLowerCase().includes('sora 2'));
    if (sora2) {
      console.log(`Current Sora 2 cost: ${sora2.cost} credits`);
      console.log(`Expected cost: ${correctCost} credits`);
      
      if (Math.abs(parseFloat(sora2.cost) - correctCost) > 0.1) {
        console.log('\n⚠️  MISMATCH DETECTED!\n');
        console.log('Do you want to fix this? (This script will show SQL to run manually)\n');
        
        console.log('SQL to fix:');
        console.log(`UPDATE ai_models SET cost = ${correctCost} WHERE id = ${sora2.id};`);
        console.log('');
        console.log('Or recalculate using database function:');
        console.log(`UPDATE ai_models SET cost = calculate_credits_typed(fal_price, type) WHERE name = 'Sora 2';`);
      } else {
        console.log('\n✅ Sora 2 pricing is correct!\n');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run
checkAndFixSora2()
  .then(() => {
    console.log('✅ Check complete');
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });

