const pool = require('./database');

async function migratePasswordReset() {
  console.log('🔧 Starting password reset migration...');
  
  try {
    // Check if columns already exist
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('password_reset_code', 'password_reset_expires_at', 'password_reset_attempts')
    `;
    
    const existing = await pool.query(checkQuery);
    const existingColumns = existing.rows.map(row => row.column_name);
    
    console.log('📊 Existing password reset columns:', existingColumns);
    
    // Add password_reset_code column if not exists
    if (!existingColumns.includes('password_reset_code')) {
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN password_reset_code VARCHAR(6)
      `);
      console.log('✅ Added password_reset_code column');
    } else {
      console.log('ℹ️  password_reset_code column already exists');
    }
    
    // Add password_reset_expires_at column if not exists
    if (!existingColumns.includes('password_reset_expires_at')) {
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN password_reset_expires_at TIMESTAMP
      `);
      console.log('✅ Added password_reset_expires_at column');
    } else {
      console.log('ℹ️  password_reset_expires_at column already exists');
    }
    
    // Add password_reset_attempts column if not exists
    if (!existingColumns.includes('password_reset_attempts')) {
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN password_reset_attempts INTEGER DEFAULT 0
      `);
      console.log('✅ Added password_reset_attempts column');
    } else {
      console.log('ℹ️  password_reset_attempts column already exists');
    }
    
    console.log('✅ Password reset migration completed successfully!');
    
    // Display table structure
    const columnsQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name LIKE '%password%'
      ORDER BY column_name
    `;
    
    const columns = await pool.query(columnsQuery);
    console.log('\n📋 Password-related columns in users table:');
    console.table(columns.rows);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  migratePasswordReset()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = migratePasswordReset;

