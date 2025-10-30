const { pool } = require('./database');

/**
 * Fix Column Inconsistencies
 * 
 * This script fixes column inconsistencies found in the database:
 * 1. Duplicate credit columns in ai_generation_history
 * 2. Duplicate type columns in feature_requests
 * 3. Missing fal_request_id in setupDatabase.js
 * 4. Numeric precision issues
 */

async function fixColumnInconsistencies() {
  console.log('\n🔧 Fixing Database Column Inconsistencies\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  const client = await pool.connect();
  
  try {
    // ===== FIX 1: Sync cost_credits in ai_generation_history =====
    console.log('📝 Step 1/5: Syncing cost_credits data...');
    
    const syncResult = await client.query(`
      UPDATE ai_generation_history
      SET cost_credits = COALESCE(cost_credits, credits_cost, credits_used, 0)
      WHERE cost_credits IS NULL OR cost_credits = 0;
    `);
    console.log(`   ✅ Updated ${syncResult.rowCount} rows in ai_generation_history`);

    // ===== FIX 2: Add fal_request_id if not exists =====
    console.log('\n📝 Step 2/5: Adding fal_request_id column...');
    
    await client.query(`
      ALTER TABLE ai_generation_history 
      ADD COLUMN IF NOT EXISTS fal_request_id VARCHAR(255);
    `);
    console.log('   ✅ fal_request_id column ensured');

    // ===== FIX 3: Add index for fal_request_id =====
    console.log('\n📝 Step 3/5: Adding index for fal_request_id...');
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_generation_fal_request_id 
      ON ai_generation_history(fal_request_id);
    `);
    console.log('   ✅ Index created for fal_request_id');

    // ===== FIX 4: Sync request_type in feature_requests =====
    console.log('\n📝 Step 4/5: Syncing feature_requests type columns...');
    
    const featureResult = await client.query(`
      UPDATE feature_requests
      SET request_type = COALESCE(request_type, type)
      WHERE request_type IS NULL OR request_type = '';
    `);
    console.log(`   ✅ Updated ${featureResult.rowCount} rows in feature_requests`);

    // ===== FIX 5: Ensure users.credits is DECIMAL(10,2) =====
    console.log('\n📝 Step 5/5: Ensuring proper numeric precision...');
    
    try {
      await client.query(`
        ALTER TABLE users 
        ALTER COLUMN credits TYPE DECIMAL(10, 2) USING credits::DECIMAL(10, 2);
      `);
      console.log('   ✅ users.credits converted to DECIMAL(10, 2)');
    } catch (err) {
      if (err.message.includes('already')) {
        console.log('   ℹ️  users.credits already has correct type');
      } else {
        throw err;
      }
    }

    // ===== VERIFICATION =====
    console.log('\n\n📊 Verification:');
    console.log('─────────────────────────────────────────────────────────');

    // Check ai_generation_history columns
    const genHistCheck = await client.query(`
      SELECT COUNT(*) as total,
             COUNT(*) FILTER (WHERE cost_credits > 0) as has_cost_credits,
             COUNT(*) FILTER (WHERE cost_credits = 0 OR cost_credits IS NULL) as missing_cost_credits,
             COUNT(*) FILTER (WHERE fal_request_id IS NOT NULL) as has_fal_id
      FROM ai_generation_history
    `);
    
    const ghc = genHistCheck.rows[0];
    console.log(`\n  ai_generation_history:`);
    console.log(`    Total rows: ${ghc.total}`);
    console.log(`    With cost_credits > 0: ${ghc.has_cost_credits}`);
    console.log(`    Missing cost_credits: ${ghc.missing_cost_credits}`);
    console.log(`    With fal_request_id: ${ghc.has_fal_id}`);

    // Check feature_requests columns
    const featureCheck = await client.query(`
      SELECT COUNT(*) as total,
             COUNT(*) FILTER (WHERE request_type IS NOT NULL) as has_request_type,
             COUNT(*) FILTER (WHERE request_type IS NULL) as missing_request_type
      FROM feature_requests
    `);
    
    const fc = featureCheck.rows[0];
    console.log(`\n  feature_requests:`);
    console.log(`    Total rows: ${fc.total}`);
    console.log(`    With request_type: ${fc.has_request_type}`);
    console.log(`    Missing request_type: ${fc.missing_request_type}`);

    // Check users.credits type
    const usersTypeCheck = await client.query(`
      SELECT data_type, numeric_precision, numeric_scale
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'credits'
    `);
    
    const utc = usersTypeCheck.rows[0];
    console.log(`\n  users.credits type:`);
    console.log(`    Data type: ${utc.data_type}`);
    console.log(`    Precision: ${utc.numeric_precision}`);
    console.log(`    Scale: ${utc.numeric_scale}`);

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ All inconsistencies fixed!\n');

    console.log('📋 Summary of Changes:');
    console.log('  ✓ Synced cost_credits in ai_generation_history');
    console.log('  ✓ Added fal_request_id column');
    console.log('  ✓ Added index for fal_request_id');
    console.log('  ✓ Synced request_type in feature_requests');
    console.log('  ✓ Ensured proper numeric precision for credits');

    console.log('\n⚠️  Note: Old columns NOT dropped for safety');
    console.log('  To drop redundant columns (AFTER testing):');
    console.log('    1. ALTER TABLE ai_generation_history DROP COLUMN credits_used;');
    console.log('    2. ALTER TABLE ai_generation_history DROP COLUMN credits_cost;');
    console.log('    3. ALTER TABLE feature_requests DROP COLUMN type;');
    console.log('\n  Make sure to backup first!\n');

  } catch (error) {
    console.error('\n❌ Error fixing inconsistencies:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  fixColumnInconsistencies()
    .then(() => {
      console.log('🎉 Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed:', error);
      process.exit(1);
    });
}

module.exports = { fixColumnInconsistencies };

