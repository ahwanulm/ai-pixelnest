/**
 * Import Model with Automatic Validation
 * Smart system to import models safely
 * 
 * Usage: node src/scripts/importModelWithValidation.js
 */

const { pool } = require('../config/database');
const { 
  validatePricing, 
  generatePricingReport,
  calculateOptimalPricing 
} = require('../utils/pricingValidator');

async function importModel(modelData) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🤖 SMART MODEL IMPORT SYSTEM');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  try {
    // Step 1: Validate pricing
    console.log('Step 1: Validating pricing...\n');
    
    const report = generatePricingReport(modelData);
    console.log(report);
    
    const validation = validatePricing(modelData);
    
    if (!validation.valid) {
      console.log('❌ IMPORT ABORTED: Pricing validation failed');
      console.log('❌ Fix the errors above and try again\n');
      return false;
    }
    
    // Step 2: Calculate optimal credits
    console.log('Step 2: Calculating optimal pricing...\n');
    
    const pricing = calculateOptimalPricing(
      modelData.fal_price,
      modelData.type,
      modelData.max_duration,
      modelData.pricing_type || 'flat'
    );
    
    console.log('📊 Calculated Pricing:');
    console.log('   FAL Price:', `$${pricing.falPrice}`);
    console.log('   Credits:', pricing.credits);
    console.log('   User Pays (IDR):', `Rp ${pricing.userPriceIDR}`);
    console.log('   Profit Margin:', pricing.profitMargin);
    console.log('\n');
    
    // Step 3: Check if model exists
    console.log('Step 3: Checking if model exists...\n');
    
    const existing = await pool.query(
      'SELECT id FROM ai_models WHERE model_id = $1',
      [modelData.model_id]
    );
    
    if (existing.rows.length > 0) {
      console.log('❌ Model already exists in database');
      console.log('   Use update script instead\n');
      return false;
    }
    
    // Step 4: Insert model
    console.log('Step 4: Inserting model into database...\n');
    
    const result = await pool.query(`
      INSERT INTO ai_models (
        model_id, name, provider, description, category, type,
        trending, viral, speed, quality, max_duration, cost,
        fal_price, pricing_type, is_active, is_custom, added_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `, [
      modelData.model_id,
      modelData.name,
      modelData.provider || 'fal.ai',
      modelData.description || '',
      modelData.category || 'AI Model',
      modelData.type,
      modelData.trending || false,
      modelData.viral || false,
      modelData.speed || 0,
      modelData.quality || 0,
      modelData.max_duration || null,
      pricing.credits, // Use calculated credits
      modelData.fal_price,
      modelData.pricing_type || 'flat',
      modelData.is_active !== false, // Default true
      modelData.is_custom || false,
      'system'
    ]);
    
    console.log('✅ Model imported successfully!');
    console.log('   ID:', result.rows[0].id);
    console.log('   Model ID:', result.rows[0].model_id);
    console.log('   Name:', result.rows[0].name);
    console.log('   Credits:', result.rows[0].cost);
    console.log('\n');
    
    // Step 5: Verify pricing
    console.log('Step 5: Verifying final pricing...\n');
    
    const verifyQuery = await pool.query(`
      SELECT 
        name,
        type,
        fal_price,
        cost,
        max_duration,
        pricing_type
      FROM ai_models 
      WHERE model_id = $1
    `, [modelData.model_id]);
    
    const model = verifyQuery.rows[0];
    
    console.log('📊 Final Pricing in Database:');
    console.log('   FAL Price:', `$${model.fal_price}`);
    console.log('   Credits:', model.cost);
    console.log('   Type:', model.pricing_type || 'flat');
    if (model.max_duration) {
      console.log('   Max Duration:', `${model.max_duration}s`);
    }
    console.log('\n');
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ IMPORT COMPLETED SUCCESSFULLY!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ Error during import:', error.message);
    console.error(error.stack);
    return false;
  }
}

// Example usage
async function main() {
  // Example: Import a new model
  const newModel = {
    model_id: 'fal-ai/your-model-id',
    name: 'Your Model Name',
    provider: 'fal.ai',
    description: 'Model description from fal.ai',
    category: 'Video Generation',
    type: 'video', // or 'image'
    fal_price: 0.50, // FAL.AI price in USD
    max_duration: 10, // for video models
    pricing_type: 'flat', // 'flat' or 'per_second'
    trending: false,
    viral: false,
    speed: 3,
    quality: 4,
    is_active: true
  };
  
  console.log('💡 EXAMPLE: Edit this file to import your model');
  console.log('   1. Update the newModel object above');
  console.log('   2. Run: node src/scripts/importModelWithValidation.js');
  console.log('   3. Follow the validation results\n');
  
  // Uncomment to actually import:
  // const success = await importModel(newModel);
  // process.exit(success ? 0 : 1);
  
  await pool.end();
}

if (require.main === module) {
  main();
}

module.exports = { importModel };




