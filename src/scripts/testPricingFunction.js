/**
 * Test pricing function
 */

const { pool } = require('../config/database');

async function testFunction() {
  try {
    console.log('\n🧪 Testing pricing function...\n');
    
    // Test per-second model (Sora 2)
    const testPerSecond = await pool.query(`
      SELECT calculate_credits_typed(
        1,               -- model_id (dummy)
        'video',         -- type
        0.24,            -- fal_price ($0.24/s)
        20,              -- max_duration (20s)
        'per_second'     -- pricing_type
      ) as credits
    `);
    
    console.log('Test 1: Sora 2 (per-second)');
    console.log(`  Input: $0.24/s × 20s = $4.80`);
    console.log(`  Expected: ~75.0 credits`);
    console.log(`  Got: ${testPerSecond.rows[0].credits} credits`);
    console.log('');
    
    // Test flat rate model
    const testFlat = await pool.query(`
      SELECT calculate_credits_typed(
        2,               -- model_id (dummy)
        'video',         -- type
        0.50,            -- fal_price ($0.50 flat)
        5,               -- max_duration (5s)
        'flat'           -- pricing_type
      ) as credits
    `);
    
    console.log('Test 2: Flat rate video');
    console.log(`  Input: $0.50 flat`);
    console.log(`  Expected: ~7.8 credits`);
    console.log(`  Got: ${testFlat.rows[0].credits} credits`);
    console.log('');
    
    // Now get actual Sora 2 from database
    const sora = await pool.query(`
      SELECT 
        name,
        fal_price,
        max_duration,
        pricing_type,
        cost
      FROM ai_models
      WHERE model_id = 'fal-ai/openai/sora-2'
    `);
    
    if (sora.rows.length > 0) {
      const model = sora.rows[0];
      console.log('📊 Sora 2 in database:');
      console.log(`  Name: ${model.name}`);
      console.log(`  FAL Price: $${model.fal_price}/s`);
      console.log(`  Max Duration: ${model.max_duration}s`);
      console.log(`  Pricing Type: ${model.pricing_type}`);
      console.log(`  Cost: ${model.cost} credits`);
      console.log('');
      
      if (model.cost != 75.0) {
        console.log('⚠️  Cost is incorrect! Should be 75.0');
        console.log('   Trying to recalculate...\n');
        
        // Force recalculate by updating a dummy field
        await pool.query(`
          UPDATE ai_models
          SET updated_at = CURRENT_TIMESTAMP
          WHERE model_id = 'fal-ai/openai/sora-2'
        `);
        
        // Check again
        const updated = await pool.query(`
          SELECT cost FROM ai_models
          WHERE model_id = 'fal-ai/openai/sora-2'
        `);
        
        console.log(`   After update: ${updated.rows[0].cost} credits`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

testFunction();




