/**
 * Initialize default credits settings in database
 * This sets up the default configuration for new user registration
 */

const pool = require('../config/database').pool;

async function initDefaultCreditsSettings() {
  console.log('🎨 Initializing Default Credits Settings...\n');
  
  try {
    // Check if settings already exist
    const existing = await pool.query(`
      SELECT config_key, config_value 
      FROM pricing_config 
      WHERE config_key IN ('give_default_credits', 'default_user_credits')
    `);
    
    if (existing.rows.length > 0) {
      console.log('ℹ️ Settings already exist:');
      existing.rows.forEach(row => {
        console.log(`   ${row.config_key}: ${row.config_value}`);
      });
      console.log('\n❓ Do you want to reset to defaults? (Cancel if not)');
    }
    
    // Insert or update give_default_credits (1 = enabled, 0 = disabled)
    await pool.query(`
      INSERT INTO pricing_config (config_key, config_value, description)
      VALUES ('give_default_credits', 1, 'Give credits to new users on registration')
      ON CONFLICT (config_key) 
      DO UPDATE SET config_value = 1, description = 'Give credits to new users on registration'
    `);
    
    // Insert or update default_user_credits
    await pool.query(`
      INSERT INTO pricing_config (config_key, config_value, description)
      VALUES ('default_user_credits', 100, 'Default credits amount for new users')
      ON CONFLICT (config_key) 
      DO UPDATE SET config_value = 100, description = 'Default credits amount for new users'
    `);
    
    console.log('\n✅ Default credits settings initialized!');
    console.log('\n📊 Current Configuration:');
    console.log('   - Give Default Credits: ✅ Enabled');
    console.log('   - Default Amount: 💰 100 credits');
    console.log('\n💡 Admin can change these settings at: /admin/settings');
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing settings:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  initDefaultCreditsSettings();
}

module.exports = { initDefaultCreditsSettings };

