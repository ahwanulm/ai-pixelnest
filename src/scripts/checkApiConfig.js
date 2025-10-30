const { pool } = require('../config/database');

async function checkApiConfig() {
  try {
    console.log('🔍 Checking API configurations...\n');
    
    const result = await pool.query(
      "SELECT service_name, api_key, api_secret, endpoint_url, is_active FROM api_configs ORDER BY service_name"
    );
    
    if (result.rows.length === 0) {
      console.log('❌ No API configurations found in database');
      console.log('💡 Run: npm run init-admin');
      process.exit(1);
    }
    
    console.log('📋 API Configurations:\n');
    result.rows.forEach(config => {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`🔹 Service: ${config.service_name}`);
      console.log(`   Status: ${config.is_active ? '✅ Active' : '❌ Inactive'}`);
      console.log(`   API Key: ${config.api_key ? '✓ Set (' + config.api_key.substring(0, 20) + '...)' : '✗ Not set'}`);
      
      if (config.service_name === 'GOOGLE_OAUTH') {
        console.log(`   Client Secret: ${config.api_secret ? '✓ Set (hidden)' : '✗ Not set'}`);
        console.log(`   Callback URL: ${config.endpoint_url || 'Not set'}`);
      } else {
        console.log(`   Endpoint: ${config.endpoint_url || 'N/A'}`);
      }
    });
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    
    // Check Google OAuth specifically
    const googleConfig = result.rows.find(c => c.service_name === 'GOOGLE_OAUTH');
    
    if (!googleConfig) {
      console.log('❌ Google OAuth not found in database');
      console.log('💡 Run: npm run init-admin');
    } else if (!googleConfig.api_key || !googleConfig.api_secret) {
      console.log('⚠️  Google OAuth found but credentials incomplete:');
      console.log(`   Client ID: ${googleConfig.api_key ? '✓' : '✗'}`);
      console.log(`   Client Secret: ${googleConfig.api_secret ? '✓' : '✗'}`);
      console.log(`   Callback URL: ${googleConfig.endpoint_url ? '✓' : '✗'}`);
      console.log('\n💡 Configure via Admin Panel: http://localhost:5005/admin/api-configs');
    } else {
      console.log('✅ Google OAuth is fully configured!');
      console.log('📌 Restart server to apply: npm run dev');
    }
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking API config:', error.message);
    process.exit(1);
  }
}

checkApiConfig();

