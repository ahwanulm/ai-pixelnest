const { pool } = require('./database');

/**
 * Migration: Add PIN Verification and Password Reset Columns
 * 
 * This migration adds all necessary columns for:
 * - User activation with PIN codes
 * - Password reset with PIN codes
 * - Email verification
 * 
 * Safe to run multiple times - uses IF NOT EXISTS
 */

async function migrateAuthColumns() {
  const client = await pool.connect();
  
  console.log('\n🔧 Starting Auth Columns Migration...\n');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  try {
    await client.query('BEGIN');
    
    // ========================================
    // 1. Add Activation/PIN Verification Columns
    // ========================================
    console.log('📝 Step 1/5: Adding activation/PIN verification columns...');
    
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS activation_code VARCHAR(6),
      ADD COLUMN IF NOT EXISTS activation_code_expires_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS activation_attempts INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS last_activation_resend TIMESTAMP;
    `);
    
    console.log('✅ Activation columns added\n');
    
    // ========================================
    // 2. Add Password Reset Columns
    // ========================================
    console.log('📝 Step 2/5: Adding password reset columns...');
    
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS password_reset_code VARCHAR(6),
      ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS password_reset_attempts INTEGER DEFAULT 0;
    `);
    
    console.log('✅ Password reset columns added\n');
    
    // ========================================
    // 3. Add Email Verification Columns
    // ========================================
    console.log('📝 Step 3/5: Adding email verification columns...');
    
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255),
      ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMP,
      ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255),
      ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP;
    `);
    
    console.log('✅ Email verification columns added\n');
    
    // ========================================
    // 4. Create Indexes
    // ========================================
    console.log('📝 Step 4/5: Creating indexes for performance...');
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_activation_code 
      ON users(activation_code) 
      WHERE activation_code IS NOT NULL;
      
      CREATE INDEX IF NOT EXISTS idx_users_password_reset_code 
      ON users(password_reset_code) 
      WHERE password_reset_code IS NOT NULL;
      
      CREATE INDEX IF NOT EXISTS idx_users_email_verification_token 
      ON users(email_verification_token) 
      WHERE email_verification_token IS NOT NULL;
      
      CREATE INDEX IF NOT EXISTS idx_users_password_reset_token 
      ON users(password_reset_token) 
      WHERE password_reset_token IS NOT NULL;
      
      CREATE INDEX IF NOT EXISTS idx_users_email_verified 
      ON users(email_verified);
      
      CREATE INDEX IF NOT EXISTS idx_users_is_active 
      ON users(is_active);
    `);
    
    console.log('✅ Indexes created\n');
    
    // ========================================
    // 5. Update Existing Users
    // ========================================
    console.log('📝 Step 5/5: Updating existing users...');
    
    const updateResult = await client.query(`
      UPDATE users 
      SET 
        email_verified = true,
        activated_at = created_at
      WHERE 
        is_active = true 
        AND (email_verified IS NULL OR email_verified = false)
        AND activated_at IS NULL
      RETURNING id, email, name;
    `);
    
    if (updateResult.rows.length > 0) {
      console.log(`✅ Updated ${updateResult.rows.length} existing users\n`);
    } else {
      console.log('ℹ️  No existing users to update\n');
    }
    
    // ========================================
    // 6. Verify Migration
    // ========================================
    console.log('📝 Verifying migration...');
    
    const columnsQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN (
        'activation_code', 'activation_code_expires_at', 'activation_attempts',
        'activated_at', 'last_activation_resend',
        'password_reset_code', 'password_reset_expires_at', 'password_reset_attempts',
        'email_verified', 'email_verification_token', 'email_verification_expires',
        'password_reset_token', 'password_reset_expires'
      )
      ORDER BY column_name;
    `;
    
    const columns = await client.query(columnsQuery);
    
    console.log('\n📋 Auth-related columns in users table:');
    console.table(columns.rows.map(row => ({
      'Column': row.column_name,
      'Type': row.data_type,
      'Nullable': row.is_nullable,
      'Default': row.column_default || 'NULL'
    })));
    
    await client.query('COMMIT');
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🎉 Auth Columns Migration Completed Successfully!\n');
    console.log('📊 Summary:');
    console.log('  ✓ Activation columns (PIN verification)');
    console.log('  ✓ Password reset columns (PIN-based)');
    console.log('  ✓ Email verification columns');
    console.log('  ✓ Performance indexes');
    console.log('  ✓ Existing users updated\n');
    console.log('🚀 Your authentication system is now fully configured!');
    console.log('═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Migration Failed:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('  1. Check your database connection');
    console.error('  2. Make sure users table exists');
    console.error('  3. Verify database user has ALTER TABLE permissions\n');
    throw error;
  } finally {
    client.release();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateAuthColumns()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error('\n❌ Migration script failed:', error);
      await pool.end();
      process.exit(1);
    });
}

module.exports = migrateAuthColumns;

