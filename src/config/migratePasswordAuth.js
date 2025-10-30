const { pool } = require('./database');

async function migratePasswordAuth() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Migrating users table for password authentication...');
    
    // Add password_hash column if not exists
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)
    `);
    console.log('✅ Added password_hash column');
    
    // Add phone column if not exists
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS phone VARCHAR(50)
    `);
    console.log('✅ Added phone column');
    
    // Add province column if not exists
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS province VARCHAR(100)
    `);
    console.log('✅ Added province column');
    
    // Add city column if not exists
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS city VARCHAR(100)
    `);
    console.log('✅ Added city column');
    
    // Add address column if not exists
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS address TEXT
    `);
    console.log('✅ Added address column');
    
    // Remove country column if exists (replacing with province)
    await client.query(`
      ALTER TABLE users 
      DROP COLUMN IF EXISTS country
    `);
    console.log('✅ Removed old country column');
    
    // Make google_id nullable (since we now support email/password auth)
    await client.query(`
      ALTER TABLE users 
      ALTER COLUMN google_id DROP NOT NULL
    `);
    console.log('✅ Made google_id nullable');
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  migratePasswordAuth()
    .then(() => {
      console.log('✅ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Failed:', error);
      process.exit(1);
    });
}

module.exports = migratePasswordAuth;

