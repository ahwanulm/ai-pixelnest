const { pool } = require('./database');

/**
 * Check all columns in important tables
 */
async function checkColumns() {
  console.log('\n🔍 Checking Database Column Consistency\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  const client = await pool.connect();
  
  try {
    const tables = [
      'users',
      'ai_models',
      'ai_generation_history',
      'payment_transactions',
      'promo_codes',
      'credit_transactions',
      'feature_requests',
      'pinned_models'
    ];

    for (const tableName of tables) {
      console.log(`\n📋 Table: ${tableName}`);
      console.log('─────────────────────────────────────────────────────────');
      
      const result = await client.query(`
        SELECT 
          column_name, 
          data_type, 
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);

      result.rows.forEach((col, idx) => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const type = col.character_maximum_length 
          ? `${col.data_type}(${col.character_maximum_length})`
          : col.data_type;
        const def = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        console.log(`  ${idx + 1}. ${col.column_name.padEnd(35)} ${type.padEnd(25)} ${nullable}${def}`);
      });
      
      console.log(`\n  Total columns: ${result.rows.length}`);
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ Column check complete\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkColumns().catch(console.error);

