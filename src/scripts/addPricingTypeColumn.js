/**
 * Add pricing_type column to ai_models table
 * Required for per-second vs flat rate differentiation
 */

const { pool } = require('../config/database');

async function addPricingTypeColumn() {
  try {
    console.log('\n🔧 Adding pricing_type column to ai_models table...\n');
    
    // Check if column already exists
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='ai_models' AND column_name='pricing_type'
    `);
    
    if (checkColumn.rows.length > 0) {
      console.log('✅ Column pricing_type already exists!');
    } else {
      // Add pricing_type column
      await pool.query(`
        ALTER TABLE ai_models 
        ADD COLUMN IF NOT EXISTS pricing_type VARCHAR(20) DEFAULT 'flat'
      `);
      
      console.log('✅ Column pricing_type added successfully!');
    }
    
    // Set all current video models to 'flat' by default
    await pool.query(`
      UPDATE ai_models 
      SET pricing_type = 'flat' 
      WHERE pricing_type IS NULL AND type = 'video'
    `);
    
    console.log('✅ Set all existing video models to flat rate');
    
    // Set image models to 'flat' or 'per_image'
    await pool.query(`
      UPDATE ai_models 
      SET pricing_type = 'flat' 
      WHERE pricing_type IS NULL AND type = 'image'
    `);
    
    console.log('✅ Set all existing image models to flat rate');
    
    console.log('\n✅ Migration complete!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

addPricingTypeColumn();




