/**
 * ============================================
 * UPDATE DATABASE WITH REAL FAL.AI PRICING
 * ============================================
 * 
 * Source: Real fal.ai API data (January 2026)
 * Provided by: User with accurate per-duration pricing
 * 
 * This script updates the database with CORRECT pricing
 * from fal.ai official API response
 */

const { pool } = require('../config/database');
const { convertToFlatList } = require('../data/falAiRealPricing');

async function updateRealPricing() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   UPDATE REAL FAL.AI PRICING FROM API                   ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  
  const models = convertToFlatList();
  
  console.log(`📊 Found ${models.length} models with real pricing\n`);
  
  let updated = 0;
  let notFound = 0;
  let created = 0;
  
  for (const model of models) {
    try {
      // Check if model exists
      const existingModel = await pool.query(
        'SELECT id, name, fal_price, max_duration FROM ai_models WHERE model_id = $1',
        [model.model_id]
      );
      
      if (existingModel.rows.length === 0) {
        console.log(`⚠️  Model not found in DB: ${model.name}`);
        console.log(`   Suggested: Import this model first`);
        notFound++;
        continue;
      }
      
      const current = existingModel.rows[0];
      const oldPrice = parseFloat(current.fal_price) || 0;
      const newPrice = model.fal_price;
      
      // Update price and duration
      await pool.query(`
        UPDATE ai_models 
        SET 
          fal_price = $1,
          max_duration = $2,
          pricing_type = $3,
          updated_at = NOW()
        WHERE model_id = $4
      `, [newPrice, model.max_duration, model.pricing_type, model.model_id]);
      
      // Recalculate credits
      await pool.query(`
        UPDATE ai_models 
        SET cost = calculate_credits_typed(
          id, 
          type, 
          $1, 
          $2, 
          $3
        )
        WHERE model_id = $4
      `, [newPrice, model.max_duration, model.pricing_type, model.model_id]);
      
      const changePercent = oldPrice > 0 
        ? ((newPrice - oldPrice) / oldPrice * 100).toFixed(1)
        : 'NEW';
      
      console.log(`✅ ${model.name.padEnd(30)} $${oldPrice.toFixed(4)} → $${newPrice.toFixed(4)} (${changePercent}%)`);
      console.log(`   Max Duration: ${model.max_duration}s | Type: ${model.pricing_type}`);
      console.log(`   fal.ai Credits: ${model.fal_credits} | Durations: ${Object.keys(model.all_durations).join(', ')}s`);
      console.log('');
      
      updated++;
      
    } catch (error) {
      console.error(`❌ Error updating ${model.name}:`, error.message);
    }
  }
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 UPDATE SUMMARY');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`  Total Models: ${models.length}`);
  console.log(`  ✅ Updated: ${updated}`);
  console.log(`  ⚠️  Not Found: ${notFound}`);
  console.log(`  ➕ Created: ${created}`);
  console.log('\n═══════════════════════════════════════════════════════════\n');
  
  console.log('✅ UPDATE COMPLETE!\n');
  console.log('💡 IMPORTANT NOTES:');
  console.log('   - Prices are for MAX duration of each model');
  console.log('   - Shorter durations cost proportionally less');
  console.log('   - Example: Kling 2.5 Pro');
  console.log('     • 10s video = 3 fal.ai credits = $0.30');
  console.log('     •  5s video = 1.5 fal.ai credits = $0.15');
  console.log('   - Frontend should show correct price based on selected duration\n');
}

// Run update
updateRealPricing()
  .then(() => {
    console.log('✅ Process completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
