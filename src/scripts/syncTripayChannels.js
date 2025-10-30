const tripayService = require('../services/tripayService');

/**
 * Script untuk sync payment channels dari Tripay API ke database
 * Run: npm run sync:tripay-channels
 */

async function syncTripayChannels() {
  try {
    console.log('🚀 Starting Tripay Payment Channels Sync...');
    console.log('');
    
    const result = await tripayService.syncPaymentChannels();
    
    console.log('');
    console.log('✅ Sync completed successfully!');
    console.log(`   Total channels synced: ${result.count}`);
    console.log('');
    console.log('💡 Payment channels are now available in the database');
    console.log('   Users can now use these channels for top-up');
    
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ Sync failed:', error.message);
    console.error('');
    console.error('💡 Possible issues:');
    console.error('   - Tripay API credentials not configured');
    console.error('   - Database connection error');
    console.error('   - Network connectivity issues');
    console.error('');
    console.error('🔧 To fix:');
    console.error('   1. Check TRIPAY_API_KEY in database or .env');
    console.error('   2. Verify database connection');
    console.error('   3. Check network connection');
    
    process.exit(1);
  }
}

// Run sync
if (require.main === module) {
  syncTripayChannels();
}

module.exports = syncTripayChannels;

