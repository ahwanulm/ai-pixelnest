const { pool } = require('../config/database');

/**
 * Initialize Credit Price Configuration
 * Set default price per credit: Rp 2.000
 */

async function initCreditPriceConfig() {
  try {
    console.log('🚀 Initializing Credit Price Configuration...');
    
    // Check if config exists
    const checkQuery = `
      SELECT * FROM pricing_config 
      WHERE config_key = 'credit_price_idr'
    `;
    const checkResult = await pool.query(checkQuery);
    
    if (checkResult.rows.length > 0) {
      console.log('⚠️  Credit price config already exists');
      console.log(`   Current price: Rp ${parseInt(checkResult.rows[0].config_value).toLocaleString('id-ID')} per credit`);
      return;
    }
    
    // Insert default config
    const insertQuery = `
      INSERT INTO pricing_config (config_key, config_value, description)
      VALUES ($1, $2, $3)
    `;
    
    await pool.query(insertQuery, [
      'credit_price_idr',
      '2000',
      'Harga per 1 credit dalam Rupiah (untuk top-up)'
    ]);
    
    console.log('✅ Credit price config initialized successfully!');
    console.log('   Default price: Rp 2.000 per credit');
    console.log('');
    console.log('💡 Admin can update this price at:');
    console.log('   Admin Panel → Settings → Credit Price');
    
  } catch (error) {
    console.error('❌ Failed to initialize credit price config:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run
if (require.main === module) {
  initCreditPriceConfig().catch(console.error);
}

module.exports = initCreditPriceConfig;

