/**
 * Fix Profit Margin by changing credit rounding from 0.5 to 0.1
 * This makes the actual profit margin closer to the configured margin
 */

const { pool } = require('../config/database');

async function fixProfitMargin() {
  console.log('🔧 Fixing Profit Margin Calculation...\n');
  
  try {
    // Show current rounding
    const current = await pool.query(`
      SELECT config_key, config_value, description 
      FROM pricing_config 
      WHERE config_key = 'credit_rounding'
    `);
    
    if (current.rows.length > 0) {
      console.log('Current Rounding:');
      console.log(`   ${current.rows[0].config_key}: ${current.rows[0].config_value}`);
      console.log('');
    }
    
    // Show problem
    console.log('⚠️  PROBLEM:');
    console.log('   Rounding to 0.5 causes actual profit to be 25-50%');
    console.log('   while configured profit is only 20-25%\n');
    
    // Show example
    console.log('📊 Example (Flux Pro):');
    console.log('   FAL Price: $0.055');
    console.log('   Config Margin: 20%');
    console.log('');
    console.log('   With 0.5 rounding:');
    console.log('     Credits: 1.5 (rounded from 1.32)');
    console.log('     Your Price: $0.075');
    console.log('     Actual Profit: 36.4% ❌\n');
    console.log('   With 0.1 rounding:');
    console.log('     Credits: 1.3 (rounded from 1.32)');
    console.log('     Your Price: $0.065');
    console.log('     Actual Profit: 18.2% ✅\n');
    
    // Ask confirmation
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('💡 SOLUTION: Change rounding from 0.5 to 0.1\n');
    console.log('Benefits:');
    console.log('  ✅ Profit margin more accurate (~20-25%)');
    console.log('  ✅ Still user-friendly (1.3, 2.5, 3.9 credits)');
    console.log('  ✅ More fair pricing for users');
    console.log('  ✅ More predictable margins\n');
    
    // Update rounding
    await pool.query(`
      UPDATE pricing_config 
      SET config_value = 0.1,
          description = 'Round credits to nearest 0.1 (for accurate profit margin)',
          updated_at = CURRENT_TIMESTAMP
      WHERE config_key = 'credit_rounding'
    `);
    
    console.log('✅ Updated credit_rounding from 0.5 to 0.1\n');
    
    // Recalculate all model credits
    console.log('🔄 Recalculating all model credits...');
    const updateResult = await pool.query(`
      UPDATE ai_models 
      SET cost = calculate_credits_typed(fal_price, type)
      WHERE fal_price IS NOT NULL AND fal_price > 0
      RETURNING id, name, type, fal_price, cost
    `);
    
    console.log(`✅ Updated ${updateResult.rowCount} models\n`);
    
    // Show sample results
    console.log('📊 Sample Updated Prices:\n');
    const samples = updateResult.rows.slice(0, 10);
    
    samples.forEach(model => {
      const falPrice = parseFloat(model.fal_price);
      const credits = parseFloat(model.cost);
      const baseCredit = model.type === 'image' ? 0.05 : 0.08;
      const yourPrice = credits * baseCredit;
      const profit = ((yourPrice - falPrice) / falPrice * 100).toFixed(1);
      
      console.log(`${model.name} (${model.type}):`);
      console.log(`   FAL: $${falPrice.toFixed(3)} → Credits: ${credits.toFixed(1)} → Your: $${yourPrice.toFixed(3)} → Profit: ${profit}%`);
    });
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Profit margin fix completed!');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Restart server (if running)');
    console.log('  2. Check admin pricing settings: /admin/pricing-settings');
    console.log('  3. Verify new credits in models: /admin/models');
    console.log('  4. Test generation in dashboard');
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing profit margin:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  fixProfitMargin();
}

module.exports = { fixProfitMargin };




