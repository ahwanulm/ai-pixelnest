/**
 * Run Migration: Fix ai_generation_history Schema
 * 
 * Menambahkan kolom yang diperlukan untuk queue system persistence
 */

const { pool } = require('./src/config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting schema fix migration...\n');
    
    // Read SQL file
    const sqlPath = path.join(__dirname, 'migrations', 'fix_generation_history_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📝 Executing migration SQL...');
    
    await client.query('BEGIN');
    
    // Execute migration
    await client.query(sql);
    
    await client.query('COMMIT');
    
    console.log('✅ Migration completed successfully!\n');
    
    // Verify columns
    console.log('🔍 Verifying schema...');
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'ai_generation_history'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📊 Current Schema:');
    console.table(result.rows);
    
    // Check for required columns
    const columnNames = result.rows.map(r => r.column_name);
    const requiredColumns = ['job_id', 'started_at', 'progress', 'viewed_at'];
    
    console.log('\n✅ Required Columns Check:');
    requiredColumns.forEach(col => {
      const exists = columnNames.includes(col);
      console.log(`  ${exists ? '✅' : '❌'} ${col}: ${exists ? 'EXISTS' : 'MISSING'}`);
    });
    
    console.log('\n🎉 Migration fix completed!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
runMigration()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });

