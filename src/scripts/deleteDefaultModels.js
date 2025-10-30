/**
 * DELETE ALL DEFAULT MODELS
 * 
 * Purpose: Delete all default models that have incorrect pricing
 * Keeps: Custom models added by users (is_custom = true)
 * 
 * Usage: node src/scripts/deleteDefaultModels.js
 */

const { pool } = require('../config/database');

async function deleteDefaultModels() {
  const client = await pool.connect();
  
  try {
    console.log('\n🗑️  DELETING DEFAULT MODELS WITH INCORRECT PRICING\n');
    console.log('=' .repeat(60));
    
    await client.query('BEGIN');
    
    // First, get count of models to be deleted
    const countResult = await client.query(`
      SELECT 
        COUNT(*) as total_models,
        COUNT(*) FILTER (WHERE is_custom = false OR is_custom IS NULL) as default_models,
        COUNT(*) FILTER (WHERE is_custom = true) as custom_models
      FROM ai_models
    `);
    
    const { total_models, default_models, custom_models } = countResult.rows[0];
    
    console.log('📊 Current Database Status:');
    console.log(`   Total models: ${total_models}`);
    console.log(`   Default models (will be deleted): ${default_models}`);
    console.log(`   Custom models (will be kept): ${custom_models}`);
    console.log('');
    
    // Show some example models to be deleted
    const exampleResult = await client.query(`
      SELECT id, name, type, cost, fal_price, is_custom
      FROM ai_models
      WHERE is_custom = false OR is_custom IS NULL
      ORDER BY type, name
      LIMIT 10
    `);
    
    console.log('📋 Example models to be deleted (first 10):');
    exampleResult.rows.forEach(model => {
      console.log(`   - [${model.type}] ${model.name} (cost: ${model.cost} cr, fal: $${model.fal_price || 'N/A'})`);
    });
    console.log('   ... and more\n');
    
    // Delete default models only
    // Keep custom models (where is_custom = true)
    const deleteResult = await client.query(`
      DELETE FROM ai_models
      WHERE is_custom = false OR is_custom IS NULL
      RETURNING id, name, type
    `);
    
    console.log('✅ Deleted models:');
    console.log(`   Total deleted: ${deleteResult.rows.length} models`);
    
    // Count by type
    const types = {};
    deleteResult.rows.forEach(model => {
      types[model.type] = (types[model.type] || 0) + 1;
    });
    
    console.log('\n📊 Breakdown by type:');
    Object.entries(types).forEach(([type, count]) => {
      console.log(`   - ${type}: ${count} models`);
    });
    
    // Check what remains
    const remainingResult = await client.query(`
      SELECT 
        COUNT(*) as remaining_models,
        COUNT(*) FILTER (WHERE is_custom = true) as custom_models
      FROM ai_models
    `);
    
    console.log('\n📊 After Deletion:');
    console.log(`   Remaining models: ${remainingResult.rows[0].remaining_models}`);
    console.log(`   Custom models (preserved): ${remainingResult.rows[0].custom_models}`);
    
    await client.query('COMMIT');
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ DEFAULT MODELS DELETED SUCCESSFULLY!\n');
    console.log('Next steps:');
    console.log('1. Verify in Admin Panel → Models (should only show custom models)');
    console.log('2. Add new models with correct pricing in Admin Panel');
    console.log('3. Or run: npm run setup-db (to re-populate with correct defaults)\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Error deleting models:', error.message);
    console.error('Transaction rolled back. No changes made.\n');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  deleteDefaultModels()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = deleteDefaultModels;

