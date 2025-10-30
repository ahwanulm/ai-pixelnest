/**
 * Script untuk verifikasi konfigurasi Tripay
 * Memeriksa mode (sandbox/production), endpoint, dan payment channels
 */

const { pool } = require('../config/database');
const tripayService = require('../services/tripayService');

async function verifyTripayConfig() {
  console.log('\n🔍 TRIPAY CONFIGURATION VERIFICATION\n');
  console.log('='.repeat(60));
  
  try {
    // 1. Check database configuration
    console.log('\n📊 1. DATABASE CONFIGURATION');
    console.log('-'.repeat(60));
    
    const configQuery = `
      SELECT 
        service_name,
        api_key,
        api_secret,
        endpoint_url,
        additional_config,
        is_active,
        created_at,
        updated_at
      FROM api_configs 
      WHERE service_name = 'TRIPAY'
    `;
    
    const configResult = await pool.query(configQuery);
    
    if (configResult.rows.length === 0) {
      console.log('❌ Tripay config NOT FOUND in database!');
      console.log('   Run migration: npm run migrate:tripay-payment');
      return;
    }
    
    const config = configResult.rows[0];
    const additionalConfig = config.additional_config || {};
    
    console.log('✅ Config found in database');
    console.log(`   Service Name: ${config.service_name}`);
    console.log(`   Endpoint URL: ${config.endpoint_url}`);
    console.log(`   API Key: ${config.api_key ? config.api_key.substring(0, 15) + '...' : 'NOT SET'}`);
    console.log(`   Private Key: ${config.api_secret ? '***' + config.api_secret.substring(config.api_secret.length - 5) : 'NOT SET'}`);
    console.log(`   Merchant Code: ${additionalConfig.merchant_code || 'NOT SET'}`);
    console.log(`   Merchant Name: ${additionalConfig.merchant_name || 'NOT SET'}`);
    console.log(`   Callback URL: ${additionalConfig.callback_url || 'NOT SET'}`);
    console.log(`   Mode (from DB): ${additionalConfig.mode || 'NOT SET'}`);
    console.log(`   Is Active: ${config.is_active ? '✅ Yes' : '❌ No'}`);
    console.log(`   Last Updated: ${config.updated_at}`);
    
    // 2. Detect mode from endpoint
    console.log('\n🎯 2. MODE DETECTION');
    console.log('-'.repeat(60));
    
    const endpointUrl = config.endpoint_url;
    const isProduction = endpointUrl && 
                        endpointUrl.includes('tripay.co.id/api') && 
                        !endpointUrl.includes('sandbox');
    
    const detectedMode = isProduction ? 'production' : 'sandbox';
    const configMode = additionalConfig.mode;
    
    console.log(`   Endpoint: ${endpointUrl}`);
    console.log(`   Detected Mode: ${detectedMode}`);
    console.log(`   Configured Mode: ${configMode || 'NOT SET'}`);
    
    if (configMode && configMode !== detectedMode) {
      console.log('   ⚠️  WARNING: Configured mode does not match detected mode!');
      console.log('   → Update config via Admin Panel to fix this');
    } else if (!configMode) {
      console.log('   ⚠️  WARNING: Mode not set in additional_config');
      console.log('   → Will auto-detect from endpoint, but better to set explicitly');
    } else {
      console.log('   ✅ Mode configuration is correct');
    }
    
    // 3. Initialize service and check
    console.log('\n⚙️  3. SERVICE INITIALIZATION');
    console.log('-'.repeat(60));
    
    try {
      await tripayService.initialize(true); // Force reload
      console.log('✅ TripayService initialized successfully');
      
      const serviceConfig = tripayService.config;
      if (serviceConfig) {
        console.log(`   Service Mode: ${serviceConfig.mode}`);
        console.log(`   Service Base URL: ${serviceConfig.baseUrl}`);
        console.log(`   Service Merchant Code: ${serviceConfig.merchantCode}`);
        console.log(`   Service Callback URL: ${serviceConfig.callbackUrl}`);
      }
    } catch (error) {
      console.log('❌ Failed to initialize TripayService');
      console.log(`   Error: ${error.message}`);
    }
    
    // 4. Check payment channels
    console.log('\n💳 4. PAYMENT CHANNELS');
    console.log('-'.repeat(60));
    
    const channelsQuery = `
      SELECT 
        COUNT(*) as total_channels,
        COUNT(*) FILTER (WHERE is_active = true) as active_channels,
        COUNT(*) FILTER (WHERE is_active = false) as inactive_channels
      FROM payment_channels
    `;
    
    const channelsResult = await pool.query(channelsQuery);
    const channelStats = channelsResult.rows[0];
    
    console.log(`   Total Channels: ${channelStats.total_channels}`);
    console.log(`   Active Channels: ${channelStats.active_channels}`);
    console.log(`   Inactive Channels: ${channelStats.inactive_channels}`);
    
    if (parseInt(channelStats.total_channels) === 0) {
      console.log('   ⚠️  No payment channels found!');
      console.log('   → Run: npm run sync:tripay-channels');
    } else {
      console.log('   ✅ Payment channels exist');
      
      // Show sample channels
      const sampleQuery = `
        SELECT code, name, group_channel, minimum_amount, fee_customer_percent
        FROM payment_channels
        WHERE is_active = true
        ORDER BY group_channel, name
        LIMIT 5
      `;
      
      const sampleResult = await pool.query(sampleQuery);
      
      if (sampleResult.rows.length > 0) {
        console.log('\n   Sample Active Channels:');
        sampleResult.rows.forEach(channel => {
          console.log(`   - [${channel.group_channel}] ${channel.name} (${channel.code})`);
          console.log(`     Min: Rp ${channel.minimum_amount.toLocaleString('id-ID')}, Fee: ${channel.fee_customer_percent}%`);
        });
      }
    }
    
    // 5. Test API connection (optional)
    console.log('\n🌐 5. API CONNECTION TEST');
    console.log('-'.repeat(60));
    
    try {
      const channels = await tripayService.getPaymentChannels();
      console.log(`✅ Successfully fetched ${channels.length} channels from Tripay API`);
      console.log(`   Mode: ${detectedMode}`);
      
      if (channels.length > 0) {
        console.log('\n   Sample from API:');
        channels.slice(0, 3).forEach(channel => {
          console.log(`   - ${channel.name} (${channel.code})`);
          console.log(`     Group: ${channel.group}, Active: ${channel.active ? '✅' : '❌'}`);
        });
      }
    } catch (error) {
      console.log('❌ Failed to fetch channels from Tripay API');
      console.log(`   Error: ${error.message}`);
      console.log('\n   Possible causes:');
      console.log('   - Invalid API credentials');
      console.log('   - IP not whitelisted in Tripay dashboard');
      console.log('   - Network connectivity issues');
      console.log('   - Wrong endpoint URL');
    }
    
    // 6. Summary & Recommendations
    console.log('\n📋 6. SUMMARY & RECOMMENDATIONS');
    console.log('-'.repeat(60));
    
    const issues = [];
    const recommendations = [];
    
    if (!config.is_active) {
      issues.push('Tripay service is INACTIVE');
      recommendations.push('Activate Tripay in Admin Panel > API Configs');
    }
    
    if (!config.api_key || !config.api_secret) {
      issues.push('API credentials not configured');
      recommendations.push('Set API Key and Private Key in Admin Panel');
    }
    
    if (!additionalConfig.merchant_code) {
      issues.push('Merchant Code not set');
      recommendations.push('Add Merchant Code in Admin Panel');
    }
    
    if (!additionalConfig.callback_url) {
      issues.push('Callback URL not set');
      recommendations.push('Set Callback URL in Admin Panel');
    }
    
    if (detectedMode === 'production' && additionalConfig.callback_url?.includes('localhost')) {
      issues.push('Using localhost callback URL in PRODUCTION mode');
      recommendations.push('Use a public domain for production callback URL');
    }
    
    if (configMode && configMode !== detectedMode) {
      issues.push('Mode mismatch between config and endpoint');
      recommendations.push('Update configuration in Admin Panel to sync mode');
    }
    
    if (parseInt(channelStats.total_channels) === 0) {
      issues.push('No payment channels in database');
      recommendations.push('Run: npm run sync:tripay-channels');
    }
    
    if (issues.length === 0) {
      console.log('✅ ALL CHECKS PASSED!');
      console.log('   Your Tripay configuration is correct and ready to use.');
    } else {
      console.log('⚠️  ISSUES FOUND:');
      issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
      
      console.log('\n💡 RECOMMENDATIONS:');
      recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Verification completed');
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('\n❌ Error during verification:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

// Run verification
verifyTripayConfig().catch(console.error);

