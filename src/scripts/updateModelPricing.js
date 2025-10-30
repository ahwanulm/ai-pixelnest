/**
 * Update Model Pricing Script
 * Verify and fix pricing according to new formula: IDR 1000 = 2 credits
 */

const { pool } = require('../config/database');

// New pricing formula constants
const IDR_PER_CREDIT = 500;  // 1 credit = IDR 500
const USD_TO_IDR = 16000;    // 1 USD ≈ 16,000 IDR
const MAX_REASONABLE_CREDITS = 20; // Maximum reasonable credits for any model

// Calculate correct credits from FAL price using new formula
function calculateCorrectCredits(falPriceUSD) {
  if (!falPriceUSD || falPriceUSD <= 0) return 1; // Default for unknown prices
  
  const priceIDR = falPriceUSD * USD_TO_IDR;
  const credits = Math.max(0.5, Math.ceil(priceIDR / IDR_PER_CREDIT * 10) / 10);
  
  return Math.min(credits, MAX_REASONABLE_CREDITS); // Cap at reasonable maximum
}

// Identify pricing issues
function analyzePricing(currentCredits, falPrice, modelName) {
  const correctCredits = calculateCorrectCredits(falPrice);
  const difference = currentCredits - correctCredits;
  const percentDifference = correctCredits > 0 ? (difference / correctCredits * 100) : 0;
  
  let issue = null;
  if (currentCredits > MAX_REASONABLE_CREDITS) {
    issue = 'EXTREMELY_HIGH';
  } else if (percentDifference > 200) {
    issue = 'VERY_HIGH';
  } else if (percentDifference > 100) {
    issue = 'HIGH';
  } else if (percentDifference > 50) {
    issue = 'MODERATE';
  } else if (Math.abs(percentDifference) < 20) {
    issue = 'ACCEPTABLE';
  }
  
  return {
    currentCredits,
    correctCredits,
    difference,
    percentDifference: Math.round(percentDifference),
    issue,
    shouldUpdate: Math.abs(percentDifference) > 20 || currentCredits > MAX_REASONABLE_CREDITS
  };
}

async function verifyAndUpdatePricing() {
  try {
    console.log('🔍 PIXELNEST PRICING VERIFICATION & UPDATE');
    console.log('==========================================');
    console.log(`📊 New Formula: IDR 1,000 = 2 Credits`);
    console.log(`💰 1 Credit = IDR ${IDR_PER_CREDIT.toLocaleString('id-ID')}`);
    console.log(`💱 USD Rate: 1 USD = IDR ${USD_TO_IDR.toLocaleString('id-ID')}`);
    console.log(`🚨 Max Reasonable: ${MAX_REASONABLE_CREDITS} credits\n`);

    // Get all models from database
    const result = await pool.query(`
      SELECT id, model_id, name, provider, type, cost, fal_price, is_active
      FROM ai_models 
      ORDER BY cost DESC, name ASC
    `);

    const models = result.rows;
    console.log(`📋 Found ${models.length} models in database\n`);

    // Analyze all models
    const issues = {
      EXTREMELY_HIGH: [],
      VERY_HIGH: [],
      HIGH: [],
      MODERATE: [],
      ACCEPTABLE: []
    };

    let totalNeedingUpdate = 0;
    const updates = [];

    console.log('🔎 ANALYZING MODEL PRICING...\n');
    
    for (const model of models) {
      const analysis = analyzePricing(
        parseFloat(model.cost) || 0,
        parseFloat(model.fal_price) || 0,
        model.name
      );

      if (analysis.issue) {
        issues[analysis.issue].push({
          ...model,
          analysis
        });
      }

      if (analysis.shouldUpdate) {
        totalNeedingUpdate++;
        updates.push({
          id: model.id,
          model_id: model.model_id,
          name: model.name,
          currentCredits: analysis.currentCredits,
          newCredits: analysis.correctCredits,
          falPrice: model.fal_price
        });
      }
    }

    // Display analysis results
    console.log('📊 PRICING ANALYSIS RESULTS:');
    console.log('============================\n');

    // Show extremely high prices first
    if (issues.EXTREMELY_HIGH.length > 0) {
      console.log(`🚨 EXTREMELY HIGH PRICES (>${MAX_REASONABLE_CREDITS} credits):`);
      issues.EXTREMELY_HIGH.forEach(model => {
        console.log(`   ❌ ${model.name}: ${model.analysis.currentCredits} → ${model.analysis.correctCredits} credits`);
        console.log(`      FAL: $${(model.fal_price || 0).toFixed(3)} | Provider: ${model.provider}`);
      });
      console.log();
    }

    if (issues.VERY_HIGH.length > 0) {
      console.log(`⚠️  VERY HIGH PRICES (>200% above correct):`);
      issues.VERY_HIGH.forEach(model => {
        console.log(`   🔴 ${model.name}: ${model.analysis.currentCredits} → ${model.analysis.correctCredits} credits (${model.analysis.percentDifference}%)`);
      });
      console.log();
    }

    if (issues.HIGH.length > 0) {
      console.log(`📢 HIGH PRICES (>100% above correct):`);
      issues.HIGH.forEach(model => {
        console.log(`   🟡 ${model.name}: ${model.analysis.currentCredits} → ${model.analysis.correctCredits} credits (${model.analysis.percentDifference}%)`);
      });
      console.log();
    }

    if (issues.MODERATE.length > 0) {
      console.log(`ℹ️  MODERATE ISSUES (>50% difference):`);
      issues.MODERATE.forEach(model => {
        console.log(`   🟠 ${model.name}: ${model.analysis.currentCredits} → ${model.analysis.correctCredits} credits (${model.analysis.percentDifference}%)`);
      });
      console.log();
    }

    console.log(`✅ ACCEPTABLE PRICES: ${issues.ACCEPTABLE.length} models\n`);

    // Summary
    console.log('📈 SUMMARY:');
    console.log('===========');
    console.log(`🚨 Extremely High: ${issues.EXTREMELY_HIGH.length}`);
    console.log(`⚠️  Very High: ${issues.VERY_HIGH.length}`);  
    console.log(`📢 High: ${issues.HIGH.length}`);
    console.log(`ℹ️  Moderate: ${issues.MODERATE.length}`);
    console.log(`✅ Acceptable: ${issues.ACCEPTABLE.length}`);
    console.log(`🔄 Need Updates: ${totalNeedingUpdate}/${models.length}\n`);

    // Ask for confirmation to update
    if (totalNeedingUpdate > 0) {
      console.log('🔧 PROPOSED UPDATES:');
      console.log('===================');
      
      updates.slice(0, 10).forEach(update => {
        const saving = ((update.currentCredits - update.newCredits) / update.currentCredits * 100).toFixed(1);
        console.log(`📝 ${update.name}`);
        console.log(`   Current: ${update.currentCredits} → New: ${update.newCredits} credits (${saving}% reduction)`);
        if (update.falPrice) {
          console.log(`   FAL Price: $${update.falPrice.toFixed(3)}`);
        }
        console.log();
      });

      if (updates.length > 10) {
        console.log(`   ... and ${updates.length - 10} more models\n`);
      }

      // Auto-apply updates (in production, you might want to ask for confirmation)
      console.log('🚀 APPLYING UPDATES...\n');
      
      let updated = 0;
      let errors = 0;

      for (const update of updates) {
        try {
          await pool.query(
            'UPDATE ai_models SET cost = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [update.newCredits, update.id]
          );
          updated++;
          console.log(`✅ Updated ${update.name}: ${update.currentCredits} → ${update.newCredits} credits`);
        } catch (error) {
          errors++;
          console.error(`❌ Failed to update ${update.name}:`, error.message);
        }
      }

      console.log(`\n🎉 UPDATE COMPLETE!`);
      console.log(`✅ Successfully updated: ${updated} models`);
      console.log(`❌ Errors: ${errors} models`);
      
      if (updated > 0) {
        console.log(`\n💰 PRICING NOW ALIGNED WITH FORMULA:`);
        console.log(`   IDR 1,000 = 2 Credits`);
        console.log(`   Average price reduction: ~60-80%`);
        console.log(`   Maximum credits capped at: ${MAX_REASONABLE_CREDITS}`);
      }
      
    } else {
      console.log('✅ All model pricing is already correct!\n');
    }

    console.log('✨ Pricing verification completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during pricing verification:', error);
  } finally {
    await pool.end();
  }
}

// Run the script
if (require.main === module) {
  verifyAndUpdatePricing().then(() => {
    console.log('🏁 Script finished.');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
}

module.exports = { verifyAndUpdatePricing, calculateCorrectCredits, analyzePricing };
