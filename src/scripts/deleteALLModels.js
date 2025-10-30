/**
 * DELETE ALL MODELS (INCLUDING CUSTOM)
 * 
 * ⚠️ WARNING: This will delete ALL models, including custom ones!
 * Use this ONLY if you want to completely reset the models table.
 * 
 * Usage: node src/scripts/deleteALLModels.js
 */

const { pool } = require('../config/database');
const readline = require('readline');

// Create readline interface for user confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askConfirmation(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.toLowerCase() === 'yes');
    });
  });
}

async function deleteALLModels() {
  const client = await pool.connect();
  
  try {
    console.log('\n⚠️  WARNING: DELETE ALL MODELS (INCLUDING CUSTOM)\n');
    console.log('=' .repeat(60));
    
    // Get current count
    const countResult = await client.query(`
      SELECT 
        COUNT(*) as total_models,
        COUNT(*) FILTER (WHERE is_custom = true) as custom_models,
        COUNT(*) FILTER (WHERE is_custom = false OR is_custom IS NULL) as default_models
      FROM ai_models
    `);
    
    const { total_models, custom_models, default_models } = countResult.rows[0];
    
    console.log('📊 Current Database:');
    console.log(`   Total models: ${total_models}`);
    console.log(`   Default models: ${default_models}`);
    console.log(`   Custom models: ${custom_models}`);
    console.log('');
    
    if (total_models === 0) {
      console.log('ℹ️  No models found in database. Nothing to delete.\n');
      rl.close();
      return;
    }
    
    // Show some examples
    const exampleResult = await client.query(`
      SELECT id, name, type, is_custom
      FROM ai_models
      ORDER BY is_custom DESC, type, name
      LIMIT 15
    `);
    
    console.log('📋 Example models (first 15):');
    exampleResult.rows.forEach(model => {
      const label = model.is_custom ? '[CUSTOM]' : '[DEFAULT]';
      console.log(`   ${label} [${model.type}] ${model.name}`);
    });
    if (total_models > 15) {
      console.log(`   ... and ${total_models - 15} more`);
    }
    console.log('');
    
    console.log('⚠️  THIS WILL DELETE ALL MODELS INCLUDING CUSTOM ONES!');
    console.log('⚠️  THIS ACTION CANNOT BE UNDONE!\n');
    
    // Ask for confirmation
    const confirmed = await askConfirmation('Type "yes" to confirm deletion of ALL models: ');
    
    if (!confirmed) {
      console.log('\n❌ Deletion cancelled by user.\n');
      rl.close();
      return;
    }
    
    console.log('\n🗑️  Deleting all models...\n');
    
    await client.query('BEGIN');
    
    // Delete ALL models
    const deleteResult = await client.query(`
      DELETE FROM ai_models
      RETURNING id, name, type, is_custom
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
    
    // Custom vs default
    const customCount = deleteResult.rows.filter(m => m.is_custom).length;
    const defaultCount = deleteResult.rows.filter(m => !m.is_custom).length;
    
    console.log('\n📊 Breakdown by origin:');
    console.log(`   - Default: ${defaultCount} models`);
    console.log(`   - Custom: ${customCount} models`);
    
    await client.query('COMMIT');
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL MODELS DELETED SUCCESSFULLY!\n');
    console.log('Next steps:');
    console.log('1. Verify in Admin Panel → Models (should be empty)');
    console.log('2. Run: npm run setup-db (to re-populate with correct defaults)');
    console.log('3. Or manually add models in Admin Panel\n');
    
    rl.close();
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Error deleting models:', error.message);
    console.error('Transaction rolled back. No changes made.\n');
    rl.close();
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  deleteALLModels()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = deleteALLModels;

