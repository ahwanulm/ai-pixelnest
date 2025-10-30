/**
 * Quick Fix for Overpriced Models
 * Fix models with credits > 20 using new formula: IDR 1000 = 2 credits
 */

const { pool } = require('../config/database');

const IDR_PER_CREDIT = 500;  // 1 credit = IDR 500
const USD_TO_IDR = 16000;    // 1 USD ≈ 16,000 IDR
const MAX_REASONABLE_CREDITS = 20;

function calculateCorrectCredits(falPriceUSD) {
  if (!falPriceUSD || falPriceUSD <= 0) return 1;
  
  const priceIDR = falPriceUSD * USD_TO_IDR;
  const credits = Math.max(0.5, Math.ceil(priceIDR / IDR_PER_CREDIT * 10) / 10);
  
  return Math.min(credits, MAX_REASONABLE_CREDITS);
}

async function quickFix() {
  try {
    console.log('🔧 QUICK FIX: Overpriced Models');
    console.log('================================\n');

    // Find overpriced models (>20 credits)
    const result = await pool.query(`
      SELECT id, name, model_id, cost, fal_price, provider, type
      FROM ai_models 
      WHERE cost > 20 OR (fal_price IS NOT NULL AND fal_price > 0 AND cost != LEAST(
        GREATEST(
          0.5,
          CEIL((fal_price * 16000.0 / 500.0) * 10) / 10.0
        ),
        20.0
      ))
      ORDER BY cost DESC
    `);

    console.log(`Found ${result.rows.length} models needing price fixes:\n`);

    const fixes = [];
    
    for (const model of result.rows) {
      const currentCredits = parseFloat(model.cost) || 0;
      const correctCredits = calculateCorrectCredits(parseFloat(model.fal_price) || 0);
      const saving = ((currentCredits - correctCredits) / currentCredits * 100).toFixed(1);
      
      console.log(`🔴 ${model.name}`);
      console.log(`   Current: ${currentCredits} credits`);
      console.log(`   Correct: ${correctCredits} credits`);
      console.log(`   FAL: $${parseFloat(model.fal_price || 0).toFixed(3)}`);
      console.log(`   Saving: ${saving}%\n`);
      
      fixes.push({
        id: model.id,
        name: model.name,
        old: currentCredits,
        new: correctCredits
      });
    }

    if (fixes.length > 0) {
      console.log('🚀 Applying fixes...\n');
      
      let updated = 0;
      let errors = 0;

      for (const fix of fixes) {
        try {
          await pool.query(
            'UPDATE ai_models SET cost = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [fix.new, fix.id]
          );
          console.log(`✅ ${fix.name}: ${fix.old} → ${fix.new} credits`);
          updated++;
        } catch (error) {
          console.error(`❌ Failed to update ${fix.name}:`, error.message);
          errors++;
        }
      }

      console.log(`\n✅ COMPLETED!`);
      console.log(`   Updated: ${updated} models`);
      console.log(`   Errors: ${errors}`);
      console.log(`\n💰 All models now use: IDR 1,000 = 2 Credits`);
    } else {
      console.log('✅ No overpriced models found. All pricing is correct!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

quickFix().then(() => process.exit(0)).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
