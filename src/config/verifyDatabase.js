const { pool } = require('./database');

/**
 * Database Verification Script
 * 
 * Checks if all required tables exist in the database.
 * This is useful for:
 * - Verifying successful setup
 * - Pre-deployment checks
 * - Troubleshooting missing tables
 * 
 * Usage: npm run verify-db
 */

// List of all required tables
const REQUIRED_TABLES = [
  // Authentication
  'users',
  'sessions',
  
  // Basic application
  'contacts',
  'services',
  'testimonials',
  'blog_posts',
  'pricing_plans',
  'newsletter_subscribers',
  
  // Admin & Management
  'promo_codes',
  'api_configs',
  'notifications',
  'user_activity_logs',
  'credit_transactions',
  'ai_generation_history',
  'admin_settings',
  
  // AI Models
  'ai_models',
  'pinned_models',
  'pricing_config',
  
  // Payments
  'payment_transactions',
  'payment_channels',
  
  // Referral System
  'referral_transactions',
  'payout_requests',
  'payout_settings',
  
  // Features
  'feature_requests',
  'feature_request_votes',
  'feature_request_rate_limits'
];

async function verifyDatabase() {
  console.log('\n🔍 PixelNest Database Verification\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Test connection
    console.log('📡 Testing database connection...');
    const client = await pool.connect();
    console.log('✅ Database connection successful\n');

    // Get all existing tables
    console.log('📊 Checking database tables...\n');
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const existingTables = result.rows.map(row => row.table_name);
    
    let missingTables = [];
    let foundTables = [];

    // Check each required table
    for (const tableName of REQUIRED_TABLES) {
      if (existingTables.includes(tableName)) {
        console.log(`✅ ${tableName}`);
        foundTables.push(tableName);
      } else {
        console.log(`❌ ${tableName} - MISSING`);
        missingTables.push(tableName);
      }
    }

    // Summary
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📈 Verification Summary:\n');
    console.log(`  ✓ Found: ${foundTables.length}/${REQUIRED_TABLES.length} tables`);
    console.log(`  ✗ Missing: ${missingTables.length} tables\n`);

    if (missingTables.length === 0) {
      console.log('🎉 SUCCESS! All required tables are present.\n');
      console.log('✅ Your database is ready for:');
      console.log('   • Development');
      console.log('   • Production deployment');
      console.log('   • Running the application\n');
    } else {
      console.log('⚠️  WARNING! Missing tables detected:\n');
      missingTables.forEach(table => {
        console.log(`   • ${table}`);
      });
      console.log('\n💡 To fix this, run: npm run setup-db\n');
    }

    // Check critical columns in users table
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔑 Checking users table structure...\n');
    
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);

    const criticalColumns = [
      'id', 'email', 'name', 'password_hash', 'google_id',
      'role', 'credits', 'is_active', 'referral_code',
      'email_verified', 'activation_code', 'created_at'
    ];

    const userColumns = columnsResult.rows.map(row => row.column_name);
    let missingColumns = [];

    for (const col of criticalColumns) {
      if (userColumns.includes(col)) {
        console.log(`✅ ${col}`);
      } else {
        console.log(`❌ ${col} - MISSING`);
        missingColumns.push(col);
      }
    }

    if (missingColumns.length > 0) {
      console.log('\n⚠️  Some columns are missing. Run: npm run setup-db');
    } else {
      console.log('\n✅ Users table structure is complete');
    }

    // Check ai_models table
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🤖 Checking ai_models table structure...\n');
    
    const modelsColumnsResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_name = 'ai_models'
    `);

    const criticalModelsColumns = [
      'id', 'model_id', 'name', 'type', 'cost', 
      'fal_price', 'fal_verified', 'pricing_type'
    ];

    const modelsColumns = modelsColumnsResult.rows.map(row => row.column_name);
    let missingModelsColumns = [];

    for (const col of criticalModelsColumns) {
      if (modelsColumns.includes(col)) {
        console.log(`✅ ${col}`);
      } else {
        console.log(`❌ ${col} - MISSING`);
        missingModelsColumns.push(col);
      }
    }

    if (missingModelsColumns.length > 0) {
      console.log('\n⚠️  Some ai_models columns are missing. Run: npm run setup-db');
    } else {
      console.log('\n✅ ai_models table structure is complete');
    }

    // Check ai_generation_history table
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 Checking ai_generation_history table structure...\n');
    
    const historyColumnsResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_name = 'ai_generation_history'
    `);

    const criticalHistoryColumns = [
      'id', 'user_id', 'generation_type', 'type', 
      'model_name', 'cost_credits', 'status',
      'error_message', 'completed_at'
    ];

    const historyColumns = historyColumnsResult.rows.map(row => row.column_name);
    let missingHistoryColumns = [];

    for (const col of criticalHistoryColumns) {
      if (historyColumns.includes(col)) {
        console.log(`✅ ${col}`);
      } else {
        console.log(`❌ ${col} - MISSING`);
        missingHistoryColumns.push(col);
      }
    }

    if (missingHistoryColumns.length > 0) {
      console.log('\n⚠️  Some ai_generation_history columns are missing. Run: npm run setup-db');
      missingColumns = [...missingColumns, ...missingHistoryColumns];
    } else {
      console.log('\n✅ ai_generation_history table structure is complete');
    }

    // Update missing columns check
    missingColumns = [...missingColumns, ...missingModelsColumns, ...missingHistoryColumns];

    // Check indexes
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📇 Checking database indexes...\n');
    
    const indexResult = await client.query(`
      SELECT 
        schemaname,
        tablename,
        indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `);

    const indexCount = indexResult.rows.length;
    console.log(`Found ${indexCount} indexes\n`);

    // Group indexes by table
    const indexesByTable = {};
    for (const row of indexResult.rows) {
      if (!indexesByTable[row.tablename]) {
        indexesByTable[row.tablename] = [];
      }
      indexesByTable[row.tablename].push(row.indexname);
    }

    // Show some important indexes
    const importantTables = ['users', 'ai_generation_history', 'payment_transactions'];
    for (const table of importantTables) {
      if (indexesByTable[table]) {
        console.log(`📋 ${table}: ${indexesByTable[table].length} indexes`);
      }
    }

    console.log('\n═══════════════════════════════════════════════════════════\n');

    client.release();
    
    // Exit with appropriate code
    if (missingTables.length > 0 || missingColumns.length > 0) {
      console.log('❌ Database verification FAILED\n');
      process.exit(1);
    } else {
      console.log('✅ Database verification PASSED\n');
      process.exit(0);
    }

  } catch (error) {
    console.error('\n❌ Verification Error:', error.message);
    console.error('\n💡 Possible issues:');
    console.error('  1. Database connection failed');
    console.error('  2. Wrong database credentials in .env');
    console.error('  3. PostgreSQL not running');
    console.error('  4. Database does not exist\n');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run verification
if (require.main === module) {
  verifyDatabase();
}

module.exports = { verifyDatabase, REQUIRED_TABLES };

