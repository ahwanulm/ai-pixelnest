const { pool } = require('../config/database');

async function cleanupFalMigration() {
  const client = await pool.connect();
  
  try {
    console.log('\n🧹 Cleaning up failed fal.ai migration...\n');
    
    await client.query('BEGIN');
    
    // Drop view if exists
    console.log('📝 Dropping generation_stats view if exists...');
    await client.query('DROP VIEW IF EXISTS generation_stats CASCADE');
    console.log('✅ View dropped');
    
    // Drop trigger if exists
    console.log('📝 Dropping trigger if exists...');
    await client.query('DROP TRIGGER IF EXISTS trigger_update_generation_count ON ai_generation_history');
    console.log('✅ Trigger dropped');
    
    // Drop function if exists
    console.log('📝 Dropping function if exists...');
    await client.query('DROP FUNCTION IF EXISTS update_user_generation_count()');
    console.log('✅ Function dropped');
    
    // Drop indexes if exist
    console.log('📝 Dropping indexes if exist...');
    await client.query('DROP INDEX IF EXISTS idx_generation_user_id');
    await client.query('DROP INDEX IF EXISTS idx_generation_type');
    await client.query('DROP INDEX IF EXISTS idx_generation_status');
    await client.query('DROP INDEX IF EXISTS idx_generation_created');
    console.log('✅ Indexes dropped');
    
    // Drop table if exists (optional - comment out if you want to keep data)
    console.log('📝 Dropping ai_generation_history table if exists...');
    await client.query('DROP TABLE IF EXISTS ai_generation_history CASCADE');
    console.log('✅ Table dropped');
    
    // Remove generation_count column if exists
    console.log('📝 Removing generation_count column if exists...');
    try {
      await client.query('ALTER TABLE users DROP COLUMN IF EXISTS generation_count');
      console.log('✅ Column removed');
    } catch (e) {
      console.log('ℹ️  Column does not exist or already removed');
    }
    
    await client.query('COMMIT');
    
    console.log('\n✅ Cleanup completed successfully!');
    console.log('\n📝 Now you can run: npm run migrate:fal\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Cleanup failed:', error);
    throw error;
  } finally {
    client.release();
    pool.end();
  }
}

// Run cleanup
cleanupFalMigration()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });

