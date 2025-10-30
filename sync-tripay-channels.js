#!/usr/bin/env node

/**
 * Script untuk sync payment channels dari Tripay API
 * Usage: node sync-tripay-channels.js
 */

const tripayService = require('./src/services/tripayService');

async function syncChannels() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔄 Syncing Payment Channels from Tripay API');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  try {
    // Initialize Tripay service
    console.log('⏳ Initializing Tripay service...');
    await tripayService.initialize();
    console.log('✅ Tripay service initialized');
    console.log('');

    // Sync channels
    console.log('⏳ Fetching channels from Tripay API...');
    const result = await tripayService.syncPaymentChannels();
    console.log('');

    // Display results
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Sync Completed Successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log(`📊 Statistics:`);
    console.log(`   - Channels processed: ${result.processed || 0}`);
    console.log(`   - Channels inserted: ${result.inserted || 0}`);
    console.log(`   - Channels updated: ${result.updated || 0}`);
    console.log('');

    // Get grouped channels
    console.log('📋 Payment Channels by Group:');
    console.log('');
    
    const channels = await tripayService.getPaymentChannelsGrouped();
    
    for (const [group, items] of Object.entries(channels)) {
      console.log(`   ${group}:`);
      items.forEach(channel => {
        const fee = channel.fee_customer_flat > 0 
          ? `Rp ${channel.fee_customer_flat.toLocaleString('id-ID')}`
          : `${channel.fee_customer_percent}%`;
        console.log(`     - ${channel.name} (${channel.code}) - Fee: ${fee}`);
      });
      console.log('');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('🎉 All done! Payment channels are ready to use.');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Test the API: curl http://localhost:3000/api/payment/channels');
    console.log('  2. Open your app and try to top up credits');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ Sync Failed!');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('');
    console.error('Error:', error.message);
    console.error('');

    if (error.message.includes('configuration not found')) {
      console.error('💡 Solution:');
      console.error('   1. Make sure Tripay config exists in database (api_configs table)');
      console.error('   2. Run: node src/config/setupTripayConfig.js (if exists)');
      console.error('   3. Or insert manually through Admin Panel');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('💡 Solution:');
      console.error('   1. Check your internet connection');
      console.error('   2. Verify Tripay API is accessible: curl https://tripay.co.id');
      console.error('   3. Check if API endpoint is correct in config');
    } else if (error.message.includes('401') || error.message.includes('403')) {
      console.error('💡 Solution:');
      console.error('   1. Check your Tripay API credentials');
      console.error('   2. Make sure API key and private key are correct');
      console.error('   3. Update in Admin Panel > API Configs');
    }

    console.error('');
    process.exit(1);
  }
}

// Run the sync
syncChannels();

