/**
 * Migration: Add resend limit tracking to users table
 * - resend_count: jumlah resend yang sudah dilakukan
 * - last_resend_at: waktu terakhir resend
 * - resend_locked_until: waktu unlock jika kena delay 1 hari
 */

const { getClient } = require('./database');

async function migrate() {
  const client = await getClient();
  
  try {
    console.log('🔄 Starting resend limit migration...');
    
    // Check if columns already exist
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('resend_count', 'last_resend_at', 'resend_locked_until')
    `;
    
    const existingColumns = await client.query(checkQuery);
    const columnNames = existingColumns.rows.map(row => row.column_name);
    
    // Add resend_count if not exists
    if (!columnNames.includes('resend_count')) {
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN resend_count INTEGER DEFAULT 0
      `);
      console.log('✅ Added resend_count column');
    } else {
      console.log('ℹ️  resend_count column already exists');
    }
    
    // Add last_resend_at if not exists
    if (!columnNames.includes('last_resend_at')) {
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN last_resend_at TIMESTAMP
      `);
      console.log('✅ Added last_resend_at column');
    } else {
      console.log('ℹ️  last_resend_at column already exists');
    }
    
    // Add resend_locked_until if not exists
    if (!columnNames.includes('resend_locked_until')) {
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN resend_locked_until TIMESTAMP
      `);
      console.log('✅ Added resend_locked_until column');
    } else {
      console.log('ℹ️  resend_locked_until column already exists');
    }
    
    // Initialize existing users with default values
    await client.query(`
      UPDATE users 
      SET resend_count = 0 
      WHERE resend_count IS NULL
    `);
    
    console.log('✅ Resend limit migration completed successfully!');
    console.log('');
    console.log('📋 New columns added:');
    console.log('   - resend_count: Track jumlah resend');
    console.log('   - last_resend_at: Track waktu terakhir resend');
    console.log('   - resend_locked_until: Lock sampai waktu tertentu jika exceed limit');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    process.exit(0);
  }
}

// Run migration
migrate().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

