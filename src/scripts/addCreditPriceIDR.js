/**
 * ADD CREDIT PRICE (IDR) TO PRICING CONFIG
 * 
 * Purpose: Add credit_price_idr to pricing_config for admin to manage
 * 
 * Features:
 * - Default: Rp 1,300 per credit
 * - Minimum: Rp 1,000 per credit
 * - Admin can edit from pricing settings page
 */

const { pool } = require('../config/database');

async function addCreditPriceIDR() {
  try {
    console.log('🇮🇩 Adding Credit Price (IDR) to Pricing Config...\n');
    
    // Insert credit_price_idr config
    await pool.query(`
      INSERT INTO pricing_config (config_key, config_value, description, updated_by)
      VALUES ('credit_price_idr', '1300', 'Harga 1 credit dalam Rupiah (minimum Rp 1,000)', 1)
      ON CONFLICT (config_key) 
      DO UPDATE SET 
        description = 'Harga 1 credit dalam Rupiah (minimum Rp 1,000)',
        updated_at = CURRENT_TIMESTAMP
    `);
    
    console.log('✅ credit_price_idr added: Rp 1,300 per credit');
    console.log('   (Minimum: Rp 1,000)\n');
    
    // Verify
    const result = await pool.query(`
      SELECT config_key, config_value, description 
      FROM pricing_config 
      WHERE config_key = 'credit_price_idr'
    `);
    
    if (result.rows.length > 0) {
      const config = result.rows[0];
      console.log('📊 Verified:');
      console.log(`   Key: ${config.config_key}`);
      console.log(`   Value: Rp ${parseInt(config.config_value).toLocaleString('id-ID')}`);
      console.log(`   Description: ${config.description}\n`);
    }
    
    // Show example calculation
    console.log('💰 Example Pricing (Sora 2 - 20s):');
    
    const modelResult = await pool.query(`
      SELECT name, cost, fal_price 
      FROM ai_models 
      WHERE model_id = 'fal-ai/openai/sora-2'
    `);
    
    if (modelResult.rows.length > 0) {
      const model = modelResult.rows[0];
      const credits = parseFloat(model.cost);
      const creditPriceIDR = 1300;
      const priceIDR = credits * creditPriceIDR;
      
      console.log(`   Model: ${model.name}`);
      console.log(`   FAL Price: $${parseFloat(model.fal_price).toFixed(2)}`);
      console.log(`   Credits: ${credits.toFixed(1)} credits`);
      console.log(`   Price IDR: Rp ${Math.ceil(priceIDR).toLocaleString('id-ID')}`);
      console.log(`   (${credits.toFixed(1)} credits × Rp ${creditPriceIDR.toLocaleString('id-ID')})\n`);
    }
    
    console.log('✅ Credit Price (IDR) system ready!');
    console.log('   Admin can now edit this from Pricing Settings page.\n');
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

addCreditPriceIDR();

