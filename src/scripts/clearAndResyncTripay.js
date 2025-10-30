#!/usr/bin/env node

/**
 * Script untuk clear semua data payment lama dan re-sync dari production
 * Usage: node src/scripts/clearAndResyncTripay.js
 */

const { pool } = require('../config/database');
const tripayService = require('../services/tripayService');

async function clearAndResync() {
  console.log('\n🔄 CLEAR & RE-SYNC TRIPAY PAYMENT CHANNELS\n');
  console.log('='.repeat(60));
  
  try {
    // Step 1: Clear old payment channels
    console.log('\n📋 Step 1: Clearing old payment channels...');
    const deleteResult = await pool.query('DELETE FROM payment_channels');
    console.log(`✅ Deleted ${deleteResult.rowCount} old channels`);
    
    // Step 2: Force reload Tripay config
    console.log('\n⚙️  Step 2: Force reloading Tripay configuration...');
    await tripayService.initialize(true); // Force reload
    console.log('✅ Tripay config reloaded');
    console.log(`   Mode: ${tripayService.config.mode}`);
    console.log(`   Endpoint: ${tripayService.config.baseUrl}`);
    console.log(`   Merchant: ${tripayService.config.merchantCode}`);
    
    // Step 3: Fetch channels from Tripay API
    console.log('\n🌐 Step 3: Fetching payment channels from Tripay API...');
    const channels = await tripayService.getPaymentChannels();
    console.log(`✅ Fetched ${channels.length} channels from Tripay`);
    
    if (channels.length === 0) {
      console.log('\n⚠️  WARNING: No channels received from Tripay API!');
      console.log('\nPossible causes:');
      console.log('  - API credentials incorrect');
      console.log('  - No payment channels activated in Tripay Dashboard');
      console.log('  - IP not whitelisted');
      console.log('  - Account not verified');
      console.log('\nPlease check your Tripay Dashboard.');
      process.exit(1);
    }
    
    // Step 4: Sync to database
    console.log('\n💾 Step 4: Syncing channels to database...');
    const syncResult = await tripayService.syncPaymentChannels();
    console.log(`✅ Synced successfully`);
    console.log(`   Processed: ${syncResult.processed}`);
    console.log(`   Inserted: ${syncResult.inserted}`);
    console.log(`   Updated: ${syncResult.updated}`);
    
    // Step 5: Verify
    console.log('\n🔍 Step 5: Verifying database...');
    const verifyResult = await pool.query(`
      SELECT 
        code, name, group_channel, 
        minimum_amount, fee_customer_percent, fee_customer_flat,
        is_active
      FROM payment_channels 
      WHERE is_active = true
      ORDER BY group_channel, name
    `);
    
    console.log(`✅ Found ${verifyResult.rows.length} active channels in database`);
    console.log('\nActive Payment Channels:');
    console.log('-'.repeat(60));
    
    const grouped = {};
    verifyResult.rows.forEach(channel => {
      if (!grouped[channel.group_channel]) {
        grouped[channel.group_channel] = [];
      }
      grouped[channel.group_channel].push(channel);
    });
    
    for (const [group, items] of Object.entries(grouped)) {
      console.log(`\n${group}:`);
      items.forEach(channel => {
        const fee = channel.fee_customer_flat > 0 
          ? `Rp ${channel.fee_customer_flat.toLocaleString('id-ID')}`
          : `${channel.fee_customer_percent}%`;
        console.log(`  • ${channel.name} (${channel.code})`);
        console.log(`    Min: Rp ${channel.minimum_amount.toLocaleString('id-ID')}, Fee: ${fee}`);
      });
    }
    
    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ CLEAR & RE-SYNC COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\n📝 Next Steps:');
    console.log('  1. Restart your server:');
    console.log('     - PM2: pm2 restart pixelnest');
    console.log('     - Dev: Stop and run npm run dev again');
    console.log('  2. Clear browser cache (Ctrl+F5)');
    console.log('  3. Logout & login again');
    console.log('  4. Test top-up page');
    console.log('');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run
clearAndResync();

