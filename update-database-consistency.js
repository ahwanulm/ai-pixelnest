#!/usr/bin/env node

/**
 * Database Consistency Update Script
 * 
 * This script ensures the database schema is consistent with the latest setupDatabase.js
 * It will:
 * 1. Create missing api_configs table
 * 2. Add missing indexes
 * 3. Verify payment_channels uses group_channel (not group_name)
 * 
 * Usage: node update-database-consistency.js
 */

const { pool } = require('./src/config/database');
require('dotenv').config();

async function updateDatabaseConsistency() {
  console.log('\n🔄 Database Consistency Update Started\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  const client = await pool.connect();
  
  try {
    // Step 1: Create api_configs table if not exists
    console.log('📝 Step 1/5: Creating api_configs table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS api_configs (
        id SERIAL PRIMARY KEY,
        service_name VARCHAR(100) UNIQUE NOT NULL,
        api_key TEXT NOT NULL,
        api_secret TEXT,
        endpoint_url TEXT,
        is_active BOOLEAN DEFAULT true,
        rate_limit INTEGER DEFAULT 100,
        additional_config JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ api_configs table ready\n');

    // Step 1.5: Add promo_code and discount_amount to payment_transactions
    console.log('📝 Step 2/5: Adding promo fields to payment_transactions...');
    await client.query(`
      ALTER TABLE payment_transactions 
      ADD COLUMN IF NOT EXISTS promo_code VARCHAR(50),
      ADD COLUMN IF NOT EXISTS discount_amount INTEGER DEFAULT 0;
    `);
    console.log('✅ Promo fields added\n');

    // Step 3: Add missing indexes
    console.log('📝 Step 3/5: Adding missing indexes...');
    await client.query(`
      -- API Configs indexes
      CREATE INDEX IF NOT EXISTS idx_api_configs_service ON api_configs(service_name);
      CREATE INDEX IF NOT EXISTS idx_api_configs_active ON api_configs(is_active) WHERE is_active = true;
    `);
    console.log('✅ Indexes added\n');

    // Step 4: Check payment_channels column structure
    console.log('📝 Step 4/5: Checking payment_channels structure...');
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'payment_channels' 
      AND column_name IN ('group_name', 'group_channel')
    `);
    
    const columns = columnCheck.rows.map(row => row.column_name);
    
    if (columns.includes('group_name') && !columns.includes('group_channel')) {
      console.log('⚠️  Found group_name column, renaming to group_channel...');
      await client.query(`
        ALTER TABLE payment_channels 
        RENAME COLUMN group_name TO group_channel;
      `);
      console.log('✅ Column renamed from group_name to group_channel');
    } else if (columns.includes('group_channel')) {
      console.log('✅ payment_channels already uses group_channel column');
    } else {
      console.log('⚠️  Neither group_name nor group_channel found in payment_channels');
    }
    console.log('');

    // Step 5: Verify database structure
    console.log('📝 Step 5/5: Verifying database structure...');
    
    // Check api_configs table
    const apiConfigsCheck = await client.query(`
      SELECT COUNT(*) as count FROM api_configs
    `);
    console.log(`✅ api_configs table: ${apiConfigsCheck.rows[0].count} records`);

    // Check payment_channels table
    const paymentChannelsCheck = await client.query(`
      SELECT COUNT(*) as count FROM payment_channels
    `);
    console.log(`✅ payment_channels table: ${paymentChannelsCheck.rows[0].count} records`);

    // Check if Tripay config exists
    const tripayCheck = await client.query(`
      SELECT service_name, is_active, endpoint_url 
      FROM api_configs 
      WHERE service_name = 'TRIPAY'
    `);
    
    if (tripayCheck.rows.length > 0) {
      const tripay = tripayCheck.rows[0];
      console.log(`✅ TRIPAY config found: ${tripay.is_active ? 'Active' : 'Inactive'}`);
      console.log(`   Endpoint: ${tripay.endpoint_url || 'Not set'}`);
    } else {
      console.log('⚠️  TRIPAY config not found - you can add it via Admin Panel');
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🎉 Database Consistency Update Completed!\n');
    console.log('📊 Summary:');
    console.log('  ✓ api_configs table created/verified');
    console.log('  ✓ Indexes added for better performance');
    console.log('  ✓ payment_channels column structure verified');
    console.log('  ✓ Database structure is now consistent\n');

  } catch (error) {
    console.error('\n❌ Database Update Failed:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('  1. Check your database connection in .env file');
    console.error('  2. Make sure PostgreSQL is running');
    console.error('  3. Verify database user has proper permissions\n');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the update
if (require.main === module) {
  updateDatabaseConsistency()
    .then(() => {
      console.log('🚀 Database is now consistent and ready!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Update failed:', error);
      process.exit(1);
    });
}

module.exports = { updateDatabaseConsistency };
