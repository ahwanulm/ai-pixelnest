/**
 * 🔍 FAL.AI PRICING VERIFICATION TOOL
 * 
 * Problem: Hard-coded prices in Browse FAL.AI might be outdated
 * Solution: Manual verification against official FAL.AI prices
 * 
 * Usage:
 *   1. Visit: https://fal.ai/models
 *   2. Check prices for each model
 *   3. Update prices in this script
 *   4. Run: node verify-fal-pricing.js
 * 
 * IMPORTANT: FAL.AI does NOT have a pricing API!
 *            Prices must be verified MANUALLY from their website.
 */

require('dotenv').config();
const { pool } = require('./src/config/database');

// ============================================
// OFFICIAL FAL.AI PRICING (Update Regularly!)
// ============================================
// Last Verified: [DATE]
// Source: https://fal.ai/models

const VERIFIED_FAL_PRICES = {
  // VIDEO MODELS (verify at https://fal.ai/models?category=video)
  'fal-ai/kuaishou/kling-video/v2.5/pro/text-to-video': {
    price: 0.32,  // ← UPDATE THIS from fal.ai website
    verified_date: '2025-01-27',
    notes: 'Check https://fal.ai/models/fal-ai/kuaishou/kling-video/v2.5/pro/text-to-video'
  },
  'fal-ai/kuaishou/kling-video/v2.5/standard/text-to-video': {
    price: 0.25,
    verified_date: '2025-01-27',
    notes: 'Check https://fal.ai/models/fal-ai/kuaishou/kling-video/v2.5/standard/text-to-video'
  },
  'fal-ai/runway-gen3/turbo/video-generation': {
    price: 0.05,  // ← VERIFY THIS!
    verified_date: '2025-01-27',
    notes: 'Per frame pricing'
  },
  'fal-ai/minimax-video': {
    price: 0.32,
    verified_date: '2025-01-27',
    notes: 'Check https://fal.ai/models/fal-ai/minimax-video'
  },
  
  // IMAGE MODELS (verify at https://fal.ai/models?category=image)
  'fal-ai/flux-pro/v1.1': {
    price: 0.055,  // ← UPDATE THIS from fal.ai website
    verified_date: '2025-01-27',
    notes: 'Check https://fal.ai/models/fal-ai/flux-pro/v1.1'
  },
  'fal-ai/flux/dev': {
    price: 0.025,
    verified_date: '2025-01-27',
    notes: 'Check https://fal.ai/models/fal-ai/flux/dev'
  },
  'fal-ai/recraft-v3': {
    price: 0.040,
    verified_date: '2025-01-27',
    notes: 'Check https://fal.ai/models/fal-ai/recraft-v3'
  }
  
  // ADD MORE MODELS HERE...
  // Format:
  // 'model-id': {
  //   price: 0.xx,
  //   verified_date: 'YYYY-MM-DD',
  //   notes: 'URL to pricing page'
  // }
};

// ============================================
// PRICING VERIFICATION LOGIC
// ============================================

async function verifyPricing() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔍 FAL.AI PRICING VERIFICATION');
  console.log('═══════════════════════════════════════════════════════\n');
  
  console.log('⚠️  IMPORTANT: FAL.AI does NOT have a pricing API!');
  console.log('   You MUST verify prices manually from:');
  console.log('   👉 https://fal.ai/models\n');
  
  try {
    // 1. Get all models from database
    const dbModels = await pool.query(`
      SELECT 
        id,
        model_id,
        name,
        type,
        fal_price,
        cost as credits,
        updated_at
      FROM ai_models
      WHERE is_active = true
      ORDER BY type, name
    `);
    
    console.log(`📊 Found ${dbModels.rows.length} active models in database\n`);
    
    // 2. Compare with verified prices
    let matchCount = 0;
    let mismatchCount = 0;
    let unverifiedCount = 0;
    let outdatedCount = 0;
    
    const mismatches = [];
    const unverified = [];
    const outdated = [];
    
    console.log('🔍 Comparing prices...\n');
    console.log('─'.repeat(100));
    console.log('Status | Model Name                           | DB Price | Verified | Credits | Last Updated');
    console.log('─'.repeat(100));
    
    for (const model of dbModels.rows) {
      const verifiedData = VERIFIED_FAL_PRICES[model.model_id];
      
      // ✅ FIX: Ensure fal_price is a number
      const dbPrice = parseFloat(model.fal_price) || 0;
      
      if (!verifiedData) {
        // Model not in verified list
        unverifiedCount++;
        unverified.push(model);
        console.log(`⚠️ UN  | ${model.name.padEnd(36)} | $${dbPrice.toFixed(3)} | N/A      | ${model.credits.toString().padEnd(7)} | Not verified`);
      } else {
        // Check if price matches
        const verifiedPrice = verifiedData.price;
        
        // Check if verification is outdated (>30 days)
        const verifiedDate = new Date(verifiedData.verified_date);
        const daysSinceVerification = Math.floor((Date.now() - verifiedDate) / (1000 * 60 * 60 * 24));
        
        if (daysSinceVerification > 30) {
          outdatedCount++;
          outdated.push({ ...model, verified: verifiedData, daysSince: daysSinceVerification });
        }
        
        if (Math.abs(dbPrice - verifiedPrice) < 0.001) {
          // Price matches
          matchCount++;
          console.log(`✅ OK  | ${model.name.padEnd(36)} | $${dbPrice.toFixed(3)} | $${verifiedPrice.toFixed(3)} | ${model.credits.toString().padEnd(7)} | ${daysSinceVerification}d ago`);
        } else {
          // Price mismatch!
          mismatchCount++;
          mismatches.push({
            model,
            dbPrice,
            verifiedPrice,
            difference: verifiedPrice - dbPrice,
            verifiedData
          });
          console.log(`❌ BAD | ${model.name.padEnd(36)} | $${dbPrice.toFixed(3)} | $${verifiedPrice.toFixed(3)} | ${model.credits.toString().padEnd(7)} | MISMATCH!`);
        }
      }
    }
    
    console.log('─'.repeat(100));
    console.log('');
    
    // 3. Summary
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 VERIFICATION SUMMARY');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log(`✅ Matching prices:     ${matchCount}`);
    console.log(`❌ Price mismatches:    ${mismatchCount}`);
    console.log(`⚠️  Unverified models:  ${unverifiedCount}`);
    console.log(`🕐 Outdated (>30d):     ${outdatedCount}\n`);
    
    // 4. Show mismatches in detail
    if (mismatchCount > 0) {
      console.log('═══════════════════════════════════════════════════════');
      console.log('❌ CRITICAL: PRICE MISMATCHES FOUND!');
      console.log('═══════════════════════════════════════════════════════\n');
      
      console.log('⚠️  These models have INCORRECT prices in database!');
      console.log('   This can cause PROFIT LOSS if FAL.AI price is higher!\n');
      
      mismatches.forEach((mismatch, index) => {
        const model = mismatch.model;
        const diff = mismatch.difference;
        const isLoss = diff > 0; // If verified price > db price, we're losing money
        
        console.log(`${index + 1}. ${model.name}`);
        console.log(`   Model ID: ${model.model_id}`);
        console.log(`   Database Price: $${mismatch.dbPrice.toFixed(3)}`);
        console.log(`   Verified Price: $${mismatch.verifiedPrice.toFixed(3)}`);
        console.log(`   Difference: ${diff > 0 ? '+' : ''}$${diff.toFixed(3)} ${isLoss ? '⚠️ LOSS RISK!' : '✅ Profit'}`);
        console.log(`   Verify at: ${mismatch.verifiedData.notes}`);
        console.log(`   Verified on: ${mismatch.verifiedData.verified_date}\n`);
      });
      
      // Show SQL update commands
      console.log('📝 SQL Commands to Fix Prices:\n');
      console.log('```sql');
      mismatches.forEach(mismatch => {
        const model = mismatch.model;
        const newPrice = mismatch.verifiedPrice;
        console.log(`-- ${model.name}`);
        console.log(`UPDATE ai_models SET fal_price = ${newPrice}, updated_at = CURRENT_TIMESTAMP WHERE model_id = '${model.model_id}';`);
        console.log('');
      });
      console.log('```\n');
    }
    
    // 5. Show unverified models
    if (unverifiedCount > 0) {
      console.log('═══════════════════════════════════════════════════════');
      console.log('⚠️  UNVERIFIED MODELS');
      console.log('═══════════════════════════════════════════════════════\n');
      
      console.log(`⚠️  ${unverifiedCount} model(s) not in verified pricing list!`);
      console.log('   Please verify these manually and add to VERIFIED_FAL_PRICES.\n');
      
      unverified.slice(0, 10).forEach((model, index) => {
        const currentPrice = parseFloat(model.fal_price) || 0;
        console.log(`${index + 1}. ${model.name}`);
        console.log(`   Model ID: ${model.model_id}`);
        console.log(`   Current Price: $${currentPrice.toFixed(3)}`);
        console.log(`   Verify at: https://fal.ai/models (search for model)\n`);
      });
      
      if (unverified.length > 10) {
        console.log(`   ... and ${unverified.length - 10} more\n`);
      }
    }
    
    // 6. Show outdated verifications
    if (outdatedCount > 0) {
      console.log('═══════════════════════════════════════════════════════');
      console.log('🕐 OUTDATED VERIFICATIONS');
      console.log('═══════════════════════════════════════════════════════\n');
      
      console.log(`⚠️  ${outdatedCount} model(s) have verification older than 30 days!`);
      console.log('   Please re-verify these prices on fal.ai website.\n');
      
      outdated.slice(0, 5).forEach((item, index) => {
        console.log(`${index + 1}. ${item.name} (${item.daysSince} days ago)`);
        console.log(`   Last verified: ${item.verified.verified_date}`);
        console.log(`   Verify at: ${item.verified.notes}\n`);
      });
    }
    
    // 7. Final recommendations
    console.log('═══════════════════════════════════════════════════════');
    console.log('💡 RECOMMENDATIONS');
    console.log('═══════════════════════════════════════════════════════\n');
    
    if (mismatchCount > 0) {
      console.log('🚨 URGENT: Fix price mismatches immediately!');
      console.log('   Run the SQL commands shown above.\n');
    }
    
    if (unverifiedCount > 0) {
      console.log('📝 TODO: Verify unverified models');
      console.log('   1. Visit https://fal.ai/models');
      console.log('   2. Search for each model');
      console.log('   3. Note the pricing');
      console.log('   4. Add to VERIFIED_FAL_PRICES in this script\n');
    }
    
    if (outdatedCount > 0) {
      console.log('🔄 TODO: Re-verify outdated models');
      console.log('   Prices may have changed since last verification.\n');
    }
    
    console.log('📅 Schedule: Run this verification monthly!');
    console.log('   Add reminder: First day of each month\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

// Run verification
verifyPricing().then(() => {
  console.log('🏁 Verification complete!\n');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

