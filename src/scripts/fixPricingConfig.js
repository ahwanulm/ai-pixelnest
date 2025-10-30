/**
 * Fix pricing configuration
 * Set correct values for video models
 */

const { pool } = require('../config/database');

async function fixConfig() {
  try {
    console.log('\n🔧 Fixing pricing configuration...\n');
    
    // Update video base credit from 0.05 to 0.08
    await pool.query(`
      UPDATE pricing_config
      SET config_value = 0.08,
          description = 'Base USD for VIDEO = 1 credit ($0.08 per credit for video)'
      WHERE config_key = 'video_base_credit_usd'
    `);
    
    console.log('✅ Updated video_base_credit_usd: 0.05 → 0.08');
    
    // Update video profit margin from 20% to 25%
    await pool.query(`
      UPDATE pricing_config
      SET config_value = 25.00,
          description = 'Profit margin for VIDEO models (25%)'
      WHERE config_key = 'video_profit_margin'
    `);
    
    console.log('✅ Updated video_profit_margin: 20% → 25%');
    
    // Verify changes
    const config = await pool.query(`
      SELECT config_key, config_value, description
      FROM pricing_config
      WHERE config_key LIKE '%video%'
         OR config_key LIKE '%image%'
         OR config_key = 'credit_rounding'
      ORDER BY config_key
    `);
    
    console.log('\n📊 Updated Configuration:\n');
    config.rows.forEach(row => {
      console.log(`${row.config_key.padEnd(25)} = ${parseFloat(row.config_value).toFixed(2).padStart(6)}`);
    });
    
    console.log('\n🧮 Testing with Sora 2:');
    const falPrice = 4.80; // $0.24/s × 20s
    const base = 0.08;
    const profit = 0.25;
    const rounding = 0.1;
    
    const calculated = (falPrice / base) * (1 + profit);
    const rounded = Math.round(calculated / rounding) * rounding;
    
    console.log(`   FAL Price: $${falPrice}`);
    console.log(`   Calculation: ($${falPrice} / $${base}) × ${1 + profit} = ${calculated.toFixed(2)}`);
    console.log(`   Rounded: ${rounded.toFixed(1)} credits`);
    console.log(`   User pays: Rp ${(rounded * 1500).toLocaleString('id-ID')}`);
    console.log(`   Profit margin: 25%`);
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixConfig();




