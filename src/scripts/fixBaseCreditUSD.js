/**
 * ============================================
 * FIX BASE CREDIT USD
 * ============================================
 * 
 * Problem: base_credit_usd is 0.008 (should be 0.08)
 * This causes credits to be 10x too high!
 * 
 * Example:
 * - Wrong: $1.00 / 0.008 = 125 credits
 * - Correct: $1.00 / 0.08 = 12.5 credits
 */

const { pool } = require('../config/database');

async function fixBaseCreditUSD() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   FIX BASE CREDIT USD VALUE                              ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  
  try {
    // Check current value
    const currentResult = await pool.query(`
      SELECT config_value 
      FROM pricing_config 
      WHERE config_key IN ('base_credit_usd', 'video_base_credit_usd', 'image_base_credit_usd')
    `);
    
    console.log('📊 Current Values:');
    currentResult.rows.forEach(row => {
      console.log(`   ${row.config_key}: $${parseFloat(row.config_value)}`);
    });
    console.log('');
    
    // Fix video base credit
    console.log('🔧 Fixing video_base_credit_usd: 0.008 → 0.08');
    await pool.query(`
      UPDATE pricing_config 
      SET config_value = 0.08 
      WHERE config_key = 'video_base_credit_usd'
    `);
    
    // Fix image base credit
    console.log('🔧 Fixing image_base_credit_usd: 0.05');
    await pool.query(`
      INSERT INTO pricing_config (config_key, config_value, description)
      VALUES ('image_base_credit_usd', 0.05, 'Base credit value for image models')
      ON CONFLICT (config_key) 
      DO UPDATE SET config_value = 0.05
    `);
    
    console.log('✅ Base credit values updated!\n');
    
    // Recalculate all credits
    console.log('🔄 Recalculating credits for all models...\n');
    
    const recalcResult = await pool.query(`
      UPDATE ai_models 
      SET cost = calculate_credits_typed(
        id, 
        type, 
        fal_price, 
        max_duration, 
        COALESCE(pricing_type, 'flat')
      )
      WHERE fal_price IS NOT NULL AND fal_price > 0
      RETURNING name, type, fal_price, cost
    `);
    
    console.log('📊 Updated Models:');
    recalcResult.rows.forEach(model => {
      console.log(`   ${model.name.padEnd(30)} $${parseFloat(model.fal_price).toFixed(4)} → ${parseFloat(model.cost).toFixed(1)} credits`);
    });
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ FIX COMPLETE!');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('💡 Expected Results:');
    console.log('   - Veo 3 ($1.00): ~16 credits (was 125)');
    console.log('   - Sora 2 ($0.75): ~12 credits (was 140)');
    console.log('   - Veo 3.1 ($0.60): ~10 credits (was 75)');
    console.log('   - User prices will be ~10x cheaper!');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Run fix
fixBaseCreditUSD()
  .then(() => {
    console.log('✅ Process completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });




