const { pool } = require('./database');
require('dotenv').config();

/**
 * Migration script to add SendGrid configuration to api_configs table
 * Run this after updating to SendGrid email service
 */
async function migrateSendGrid() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting SendGrid migration...');
    
    // Check if SendGrid config already exists
    const checkQuery = 'SELECT * FROM api_configs WHERE service_name = $1';
    const existingConfig = await client.query(checkQuery, ['SENDGRID']);
    
    const sendgridApiKey = process.env.SENDGRID_API_KEY || '';
    const emailFrom = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@pixelnest.com';
    const emailFromName = 'PixelNest';
    
    if (existingConfig.rows.length > 0) {
      console.log('✅ SendGrid config already exists');
      console.log('   Current config:', existingConfig.rows[0].service_name);
      
      // Update existing config if API key is provided
      if (sendgridApiKey) {
        await client.query(`
          UPDATE api_configs 
          SET 
            api_key = $1,
            endpoint_url = $2,
            additional_config = $3,
            updated_at = CURRENT_TIMESTAMP
          WHERE service_name = 'SENDGRID'
        `, [
          sendgridApiKey,
          'https://api.sendgrid.com/v3',
          JSON.stringify({
            email_from: emailFrom,
            email_from_name: emailFromName
          })
        ]);
        console.log('✅ SendGrid config updated from .env');
      } else {
        console.log('⚠️  No SENDGRID_API_KEY in .env, keeping existing config');
      }
    } else {
      console.log('➕ Creating new SendGrid config...');
      
      // Insert new SendGrid config
      await client.query(`
        INSERT INTO api_configs (
          service_name, 
          api_key, 
          api_secret, 
          endpoint_url, 
          is_active, 
          rate_limit, 
          additional_config
        ) VALUES ($1, $2, null, $3, $4, $5, $6)
      `, [
        'SENDGRID',
        sendgridApiKey,
        'https://api.sendgrid.com/v3',
        sendgridApiKey ? true : false, // Only active if API key is provided
        100,
        JSON.stringify({
          email_from: emailFrom,
          email_from_name: emailFromName
        })
      ]);
      
      if (sendgridApiKey) {
        console.log('✅ SendGrid config created and activated');
      } else {
        console.log('⚠️  SendGrid config created but inactive (no API key)');
        console.log('   Add SENDGRID_API_KEY to .env or configure via Admin Panel');
      }
    }
    
    // Display current configuration
    const currentConfig = await client.query(
      'SELECT * FROM api_configs WHERE service_name = $1',
      ['SENDGRID']
    );
    
    console.log('\n📧 Current SendGrid Configuration:');
    console.log('   Service:', currentConfig.rows[0].service_name);
    console.log('   API Key:', currentConfig.rows[0].api_key ? '***' + currentConfig.rows[0].api_key.slice(-4) : 'Not set');
    console.log('   Endpoint:', currentConfig.rows[0].endpoint_url);
    console.log('   Active:', currentConfig.rows[0].is_active);
    console.log('   Email From:', currentConfig.rows[0].additional_config?.email_from);
    console.log('   Email From Name:', currentConfig.rows[0].additional_config?.email_from_name);
    
    console.log('\n✅ SendGrid migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Install SendGrid package: npm install @sendgrid/mail');
    console.log('   2. Configure SendGrid in Admin Panel > API Configs');
    console.log('   3. Get API key from: https://app.sendgrid.com/settings/api_keys');
    
  } catch (error) {
    console.error('❌ SendGrid migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateSendGrid()
    .then(() => {
      console.log('\n✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateSendGrid };

