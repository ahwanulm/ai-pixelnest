/**
 * Check pricing configuration
 */

const { pool } = require('../config/database');

async function checkConfig() {
  try {
    console.log('\n🔍 Checking pricing configuration...\n');
    
    const config = await pool.query(`
      SELECT config_key, config_value, description
      FROM pricing_config
      WHERE config_key LIKE '%profit%' 
         OR config_key LIKE '%base_credit%'
         OR config_key LIKE '%rounding%'
      ORDER BY config_key
    `);
    
    console.log('📊 Current Configuration:\n');
    config.rows.forEach(row => {
      console.log(`${row.config_key.padEnd(25)} = ${row.config_value.padStart(10)} | ${row.description}`);
    });
    
    console.log('\n💡 Expected for correct calculation:');
    console.log('   video_base_credit_usd    =       0.08 | $0.08 per credit for video');
    console.log('   video_profit_margin      =      25.00 | 25% profit for video');
    console.log('   image_base_credit_usd    =       0.05 | $0.05 per credit for image');
    console.log('   image_profit_margin      =      20.00 | 20% profit for image');
    console.log('   credit_rounding          =       0.10 | Round to 0.1 credits');
    console.log('');
    
    // Test calculation manually
    const videoBase = config.rows.find(r => r.config_key === 'video_base_credit_usd');
    const videoProfit = config.rows.find(r => r.config_key === 'video_profit_margin');
    const rounding = config.rows.find(r => r.config_key === 'credit_rounding');
    
    if (videoBase && videoProfit && rounding) {
      const falPrice = 4.80; // Sora 2: $0.24/s × 20s
      const base = parseFloat(videoBase.config_value);
      const profit = parseFloat(videoProfit.config_value);
      const round = parseFloat(rounding.config_value);
      
      const calculated = (falPrice / base) * (1 + (profit / 100));
      const rounded = Math.round(calculated / round) * round;
      
      console.log('🧮 Manual Calculation for Sora 2 (20s):');
      console.log(`   FAL Price: $${falPrice}`);
      console.log(`   Base: $${base}/credit`);
      console.log(`   Profit: ${profit}%`);
      console.log(`   Rounding: ${round}`);
      console.log('');
      console.log(`   Step 1: ${falPrice} / ${base} = ${(falPrice / base).toFixed(2)}`);
      console.log(`   Step 2: ${(falPrice / base).toFixed(2)} × ${(1 + profit/100).toFixed(2)} = ${calculated.toFixed(2)}`);
      console.log(`   Step 3: Round to ${round} → ${rounded.toFixed(1)} credits`);
      console.log('');
      console.log(`   ✅ Expected result: ${rounded.toFixed(1)} credits`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkConfig();




