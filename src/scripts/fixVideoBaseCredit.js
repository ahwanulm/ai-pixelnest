/**
 * Fix Video Base Credit USD
 * 
 * Issue: video_base_credit_usd is $0.05 but should be $0.08
 * This causes all video models to have incorrect costs
 */

const { pool } = require('../config/database');

async function fixVideoBaseCredit() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🔧 Fixing Video Base Credit USD...\n');
    
    // Check current value
    const currentResult = await client.query(`
      SELECT config_value 
      FROM pricing_config 
      WHERE config_key = 'video_base_credit_usd'
    `);
    
    const currentValue = currentResult.rows[0]?.config_value || '0.05';
    console.log(`Current video_base_credit_usd: $${currentValue}`);
    console.log(`Expected: $0.08`);
    console.log('');
    
    if (parseFloat(currentValue) === 0.08) {
      console.log('✅ Already correct! No fix needed.');
      await client.query('ROLLBACK');
      return;
    }
    
    // Fix the value
    console.log('Updating video_base_credit_usd to $0.08...');
    await client.query(`
      UPDATE pricing_config 
      SET config_value = 0.08,
          updated_at = CURRENT_TIMESTAMP
      WHERE config_key = 'video_base_credit_usd'
    `);
    console.log('✅ Updated pricing_config\n');
    
    // Also update image_base_credit_usd to $0.05 (for consistency)
    console.log('Ensuring image_base_credit_usd = $0.05...');
    await client.query(`
      INSERT INTO pricing_config (config_key, config_value, description)
      VALUES ('image_base_credit_usd', 0.05, 'Base credit USD for image models')
      ON CONFLICT (config_key)
      DO UPDATE SET config_value = 0.05, updated_at = CURRENT_TIMESTAMP
    `);
    console.log('✅ Updated image_base_credit_usd\n');
    
    // Recalculate all video model costs
    console.log('Recalculating all video model costs...');
    const videoModelsResult = await client.query(`
      SELECT name, fal_price, cost as old_cost
      FROM ai_models 
      WHERE type = 'video' AND fal_price IS NOT NULL AND fal_price > 0
      ORDER BY name
    `);
    
    console.log(`Found ${videoModelsResult.rows.length} video models to recalculate\n`);
    
    // Update all video models
    await client.query(`
      UPDATE ai_models 
      SET cost = calculate_credits_typed(fal_price, type),
          updated_at = CURRENT_TIMESTAMP
      WHERE type = 'video' AND fal_price IS NOT NULL AND fal_price > 0
    `);
    
    // Get updated costs
    const updatedResult = await client.query(`
      SELECT name, fal_price, cost as new_cost
      FROM ai_models 
      WHERE type = 'video' AND fal_price IS NOT NULL AND fal_price > 0
      ORDER BY name
    `);
    
    console.log('📊 Updated Video Model Costs:\n');
    updatedResult.rows.forEach(model => {
      const oldModel = videoModelsResult.rows.find(m => m.name === model.name);
      const oldCost = oldModel ? parseFloat(oldModel.old_cost) : 0;
      const newCost = parseFloat(model.new_cost);
      const change = newCost - oldCost;
      const changePercent = oldCost > 0 ? ((change / oldCost) * 100).toFixed(1) : '0';
      
      console.log(`${model.name}:`);
      console.log(`  FAL: $${parseFloat(model.fal_price).toFixed(4)}`);
      console.log(`  Old: ${oldCost.toFixed(1)} credits`);
      console.log(`  New: ${newCost.toFixed(1)} credits (${change > 0 ? '+' : ''}${change.toFixed(1)}, ${change > 0 ? '+' : ''}${changePercent}%)`);
      console.log('');
    });
    
    await client.query('COMMIT');
    
    console.log('✅ All video model costs recalculated successfully!');
    console.log('');
    console.log('🎉 FIX COMPLETE!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Hard refresh your browser (Ctrl+F5 or Cmd+Shift+R)');
    console.log('2. Check Sora 2 in dropdown - should show ~9-10 credits now');
    console.log('3. Select Sora 2 and check Total Cost - should be correct');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run
fixVideoBaseCredit()
  .then(() => {
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });

