const { pool } = require('../config/database');
const readline = require('readline');

/**
 * 🔴 FULL DATABASE RESET SCRIPT
 * 
 * ⚠️ WARNING: This will DELETE ALL DATA in the database!
 * 
 * This script will:
 * 1. Drop ALL tables (complete reset)
 * 2. Run setupDatabase.js to recreate all tables
 * 3. Create default admin user
 * 4. Optionally populate with default AI models
 * 
 * Usage: npm run reset-db
 */

// Create readline interface for user confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function resetDatabase() {
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🔴 FULL DATABASE RESET');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('\n');
  console.log('⚠️  WARNING: This will DELETE ALL DATA in the database!');
  console.log('\n');
  console.log('This includes:');
  console.log('  ❌ All users (except will recreate default admin)');
  console.log('  ❌ All AI models');
  console.log('  ❌ All generation history');
  console.log('  ❌ All transactions');
  console.log('  ❌ All payments');
  console.log('  ❌ All promo codes');
  console.log('  ❌ All referrals');
  console.log('  ❌ All notifications');
  console.log('  ❌ All blog posts');
  console.log('  ❌ All feature requests');
  console.log('  ❌ ALL DATA from ALL TABLES');
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('\n');

  const client = await pool.connect();
  
  try {
    // Step 1: Ask for confirmation
    const answer1 = await askQuestion('❓ Are you ABSOLUTELY SURE you want to reset the database? (yes/no): ');
    
    if (answer1.toLowerCase() !== 'yes') {
      console.log('\n❌ Database reset cancelled.\n');
      rl.close();
      await pool.end();
      return;
    }
    
    // Step 2: Double confirmation
    const answer2 = await askQuestion('❓ Type "DELETE ALL DATA" to confirm: ');
    
    if (answer2 !== 'DELETE ALL DATA') {
      console.log('\n❌ Database reset cancelled. Confirmation text did not match.\n');
      rl.close();
      await pool.end();
      return;
    }
    
    console.log('\n🔴 Starting database reset...\n');
    
    // Step 3: Get list of all tables
    console.log('📋 Getting list of all tables...');
    const tablesResult = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    
    const tables = tablesResult.rows.map(row => row.tablename);
    console.log(`   Found ${tables.length} tables\n`);
    
    if (tables.length > 0) {
      console.log('📊 Tables to be deleted:');
      tables.forEach((table, index) => {
        console.log(`   ${index + 1}. ${table}`);
      });
      console.log('');
    }
    
    // Step 4: Drop all tables
    console.log('🗑️  Dropping all tables...\n');
    await client.query('BEGIN');
    
    // Drop all tables with CASCADE to handle foreign keys
    for (const table of tables) {
      try {
        await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
        console.log(`   ✓ Dropped: ${table}`);
      } catch (error) {
        console.log(`   ⚠️  Error dropping ${table}:`, error.message);
      }
    }
    
    // Drop all views
    console.log('\n📊 Dropping all views...');
    const viewsResult = await client.query(`
      SELECT viewname 
      FROM pg_views 
      WHERE schemaname = 'public'
    `);
    
    for (const view of viewsResult.rows) {
      try {
        await client.query(`DROP VIEW IF EXISTS ${view.viewname} CASCADE`);
        console.log(`   ✓ Dropped view: ${view.viewname}`);
      } catch (error) {
        console.log(`   ⚠️  Error dropping view ${view.viewname}:`, error.message);
      }
    }
    
    // Drop all sequences
    console.log('\n🔢 Dropping all sequences...');
    const sequencesResult = await client.query(`
      SELECT sequence_name 
      FROM information_schema.sequences 
      WHERE sequence_schema = 'public'
    `);
    
    for (const seq of sequencesResult.rows) {
      try {
        await client.query(`DROP SEQUENCE IF EXISTS ${seq.sequence_name} CASCADE`);
        console.log(`   ✓ Dropped sequence: ${seq.sequence_name}`);
      } catch (error) {
        console.log(`   ⚠️  Error dropping sequence ${seq.sequence_name}:`, error.message);
      }
    }
    
    // Drop all functions
    console.log('\n⚙️  Dropping all functions...');
    const functionsResult = await client.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'
    `);
    
    for (const func of functionsResult.rows) {
      try {
        await client.query(`DROP FUNCTION IF EXISTS ${func.routine_name} CASCADE`);
        console.log(`   ✓ Dropped function: ${func.routine_name}`);
      } catch (error) {
        // Ignore errors for functions (might have multiple signatures)
      }
    }
    
    await client.query('COMMIT');
    
    console.log('\n✅ All tables, views, sequences, and functions dropped successfully!\n');
    
    // Step 5: Release client and close pool before running setup
    client.release();
    await pool.end();
    
    // Step 6: Run setupDatabase.js to recreate all tables
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔧 Recreating database structure...\n');
    
    const setupDatabase = require('../config/setupDatabase');
    await setupDatabase();
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ DATABASE RESET COMPLETED SUCCESSFULLY!\n');
    console.log('📊 Database Status:');
    console.log('  ✓ All old data deleted');
    console.log('  ✓ All tables recreated with fresh structure');
    console.log('  ✓ Default admin user created');
    console.log('\n👤 Default Admin Credentials:');
    console.log('  Email: admin@pixelnest.pro');
    console.log('  Password: andr0Hardcore');
    console.log('  Credits: 999,999');
    console.log('\n💡 Next Steps:');
    console.log('  1. Populate AI models: npm run populate:models');
    console.log('  2. Add Suno models: npm run populate:suno');
    console.log('  3. Setup pricing config: npm run init:pricing');
    console.log('  4. Give users default credits: npm run give:credits');
    console.log('  5. Sync payment channels: npm run sync:tripay');
    console.log('\n🚀 Your database is ready to use!');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    rl.close();
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Error during database reset:', error.message);
    console.error('\nStack trace:', error.stack);
    console.error('\n💡 The database may be in an inconsistent state.');
    console.error('   You may need to manually recreate it:\n');
    console.error('   dropdb pixelnest_db');
    console.error('   createdb pixelnest_db');
    console.error('   npm run setup-db\n');
    
    client.release();
    await pool.end();
    rl.close();
    
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  resetDatabase()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error.message);
      process.exit(1);
    });
}

module.exports = resetDatabase;

