/**
 * Validate Model Before Import
 * Use this before importing any new model to prevent pricing errors
 * 
 * Usage: node src/scripts/validateModelBeforeImport.js
 */

const { 
  validatePricing, 
  generatePricingReport,
  detectPricingType,
  calculateOptimalPricing 
} = require('../utils/pricingValidator');

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function validateModelBeforeImport() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 MODEL PRICING VALIDATOR');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('This tool helps validate pricing before importing new models.');
  console.log('It prevents costly mistakes!\n');
  
  try {
    // Get model info
    console.log('📝 Enter Model Information:\n');
    
    const name = await question('Model Name: ');
    const type = await question('Type (image/video): ');
    const falPriceInput = await question('FAL.AI Price (in USD): $');
    const falPrice = parseFloat(falPriceInput);
    
    let maxDuration = null;
    let pricingType = 'flat';
    
    if (type === 'video') {
      const maxDurInput = await question('Max Duration (in seconds): ');
      maxDuration = parseInt(maxDurInput);
      
      const isPerSecond = await question('Is this per-second pricing? (yes/no): ');
      pricingType = isPerSecond.toLowerCase() === 'yes' ? 'per_second' : 'flat';
    }
    
    console.log('\n');
    
    // Validate
    const modelData = {
      name,
      type,
      fal_price: falPrice,
      max_duration: maxDuration,
      pricing_type: pricingType
    };
    
    // Generate report
    const report = generatePricingReport(modelData);
    console.log(report);
    
    // Ask if want to see examples
    const showExamples = await question('Show pricing examples? (yes/no): ');
    
    if (showExamples.toLowerCase() === 'yes') {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📊 PRICING EXAMPLES\n');
      
      if (type === 'video' && maxDuration) {
        // Show proportional pricing
        const durations = [5, 10, Math.min(maxDuration, 20)];
        
        durations.forEach(dur => {
          if (dur <= maxDuration) {
            const proportionalPrice = pricingType === 'per_second' 
              ? falPrice * dur 
              : falPrice;
            
            const pricing = calculateOptimalPricing(
              proportionalPrice / (pricingType === 'per_second' ? dur : 1),
              type,
              dur,
              pricingType
            );
            
            console.log(`Duration: ${dur}s`);
            console.log(`  FAL Cost: $${proportionalPrice.toFixed(3)}`);
            console.log(`  Credits: ${pricing.credits}`);
            console.log(`  User Pays: Rp ${pricing.userPriceIDR}`);
            console.log(`  Profit: ${pricing.profitMargin}\n`);
          }
        });
      } else {
        const pricing = calculateOptimalPricing(falPrice, type);
        console.log(`FAL Cost: $${falPrice}`);
        console.log(`Credits: ${pricing.credits}`);
        console.log(`User Pays: Rp ${pricing.userPriceIDR}`);
        console.log(`Profit: ${pricing.profitMargin}\n`);
      }
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
    
    // Summary
    const validation = validatePricing(modelData);
    
    if (validation.valid) {
      console.log('✅ This model is SAFE to import!');
      console.log('✅ Pricing is reasonable and will be profitable\n');
    } else {
      console.log('❌ DO NOT IMPORT YET!');
      console.log('❌ Fix the errors above first\n');
    }
    
    console.log('💡 To import this model:');
    console.log('   1. Go to: /admin/models');
    console.log('   2. Click "Add Model"');
    console.log('   3. Enter the information above');
    console.log('   4. System will auto-calculate credits\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

// Run
validateModelBeforeImport();

