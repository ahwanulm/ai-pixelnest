/**
 * Check Sora 2 credits calculation
 */

const { pool } = require('../config/database');

async function checkSora() {
  try {
    console.log('\n🔍 Checking Sora 2 model...\n');
    
    const result = await pool.query(`
      SELECT 
        id,
        name,
        model_id,
        type,
        cost,
        fal_price,
        max_duration,
        is_active
      FROM ai_models 
      WHERE name ILIKE '%sora%'
      ORDER BY name
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ No Sora models found in database!');
      console.log('   This is why it shows wrong credits (fallback pricing)');
      console.log('\n💡 Solution: Import Sora 2 model first!');
    } else {
      console.log(`✅ Found ${result.rows.length} Sora model(s):\n`);
      
      result.rows.forEach(model => {
        console.log(`Name: ${model.name}`);
        console.log(`Model ID: ${model.model_id}`);
        console.log(`Type: ${model.type}`);
        console.log(`Cost (credits): ${model.cost}`);
        console.log(`FAL Price: $${model.fal_price || 'N/A'}`);
        console.log(`Max Duration: ${model.max_duration}s`);
        console.log(`Active: ${model.is_active}`);
        console.log('');
        
        // Calculate what it should be
        if (model.fal_price && model.max_duration) {
          const totalFalCost = model.fal_price * model.max_duration;
          const calculatedCredits = (totalFalCost / 0.08) * 1.25;
          
          console.log(`📊 Calculation for max ${model.max_duration}s:`);
          console.log(`   FAL Cost: $${model.fal_price} × ${model.max_duration}s = $${totalFalCost.toFixed(2)}`);
          console.log(`   Credits: ($${totalFalCost.toFixed(2)} / $0.08) × 1.25 = ${calculatedCredits.toFixed(1)}`);
          console.log(`   Database has: ${model.cost}`);
          console.log(`   Match: ${model.cost == calculatedCredits.toFixed(1) ? '✅ YES' : '❌ NO'}`);
          console.log('');
          
          // Show proportional for 5s
          const cost5s = (model.fal_price * 5 / 0.08) * 1.25;
          console.log(`📊 Proportional for 5s:`);
          console.log(`   Credits: ${cost5s.toFixed(1)}`);
          console.log(`   User pays: Rp ${(cost5s * 1500).toLocaleString('id-ID')}`);
        }
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      });
    }
    
    // Check if there are any video models with wrong credits
    const wrongModels = await pool.query(`
      SELECT 
        name,
        cost,
        fal_price,
        max_duration
      FROM ai_models 
      WHERE type = 'video'
        AND cost < 10
        AND fal_price IS NOT NULL
      ORDER BY cost
    `);
    
    if (wrongModels.rows.length > 0) {
      console.log('⚠️  Found per-second video models with suspiciously low credits:\n');
      wrongModels.rows.forEach(model => {
        console.log(`${model.name}: ${model.cost} credits (FAL: $${model.fal_price}/s)`);
      });
      console.log('\n💡 These might be using fallback pricing or wrong calculations\n');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkSora();

