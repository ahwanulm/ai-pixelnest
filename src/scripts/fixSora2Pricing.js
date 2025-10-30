/**
 * Fix Sora 2 pricing - Set correct per-second rate
 */

const { pool } = require('../config/database');

async function fixSora2() {
  try {
    console.log('\n🔧 Fixing Sora 2 pricing...\n');
    
    // Update Sora 2 with correct per-second pricing
    const result = await pool.query(`
      UPDATE ai_models 
      SET 
        fal_price = 0.24,
        pricing_type = 'per_second',
        max_duration = 20,
        cost = 75.0
      WHERE model_id = 'fal-ai/openai/sora-2'
      RETURNING 
        name,
        model_id,
        fal_price,
        pricing_type,
        max_duration,
        cost
    `);
    
    if (result.rows.length > 0) {
      const model = result.rows[0];
      
      console.log('✅ Sora 2 updated successfully!\n');
      console.log('Updated values:');
      console.log(`  Name: ${model.name}`);
      console.log(`  FAL Price: $${model.fal_price}/second`);
      console.log(`  Pricing Type: ${model.pricing_type}`);
      console.log(`  Max Duration: ${model.max_duration}s`);
      console.log(`  Cost (for max): ${model.cost} credits`);
      console.log('');
      
      // Calculate proportional costs
      console.log('📊 Proportional Pricing:');
      
      const durations = [5, 10, 15, 20];
      durations.forEach(dur => {
        const totalFalCost = model.fal_price * dur;
        const credits = (totalFalCost / 0.08) * 1.25;
        const roundedCredits = Math.round(credits * 10) / 10;
        const userPays = roundedCredits * 1500;
        
        console.log(`  ${dur}s: ${roundedCredits} credits = Rp ${userPays.toLocaleString('id-ID')}`);
      });
      
      console.log('');
      console.log('💡 Frontend will calculate proportional credits based on duration');
      console.log('   Formula: (fal_price × duration / 0.08) × 1.25');
      console.log('');
    } else {
      console.log('❌ Sora 2 not found in database!');
      console.log('   Model ID: fal-ai/openai/sora-2');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

fixSora2();




