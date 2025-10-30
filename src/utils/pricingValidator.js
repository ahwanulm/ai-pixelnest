/**
 * Smart Pricing Validator & Calculator
 * Prevents pricing errors when importing new models
 */

// Known pricing patterns from fal.ai
const PRICING_PATTERNS = {
  // Per-second models (usually premium video models)
  PER_SECOND: {
    indicators: ['per second', '/s', 'per_second'],
    typical_range: [0.05, 0.30], // $0.05-$0.30 per second
    max_duration_range: [5, 20],
    examples: ['Sora', 'Kling', 'premium video models']
  },
  
  // Flat rate models (most common for video)
  FLAT_RATE: {
    indicators: ['per video', 'per generation', 'flat'],
    typical_range: [0.20, 2.00], // $0.20-$2.00 per video
    max_duration_range: [3, 10],
    examples: ['Hunyuan', 'MiniMax', 'Luma', 'most video models']
  },
  
  // Per megapixel (image models)
  PER_MEGAPIXEL: {
    indicators: ['per megapixel', '/mp', 'per_megapixel'],
    typical_range: [0.003, 0.10], // $0.003-$0.10 per megapixel
    examples: ['FLUX models', 'image generation']
  },
  
  // Per image (flat rate for images)
  PER_IMAGE: {
    indicators: ['per image', 'per generation'],
    typical_range: [0.015, 0.15], // $0.015-$0.15 per image
    examples: ['Stable Diffusion', 'most image models']
  }
};

/**
 * Validate pricing input
 */
function validatePricing(modelData) {
  const errors = [];
  const warnings = [];
  const suggestions = [];
  
  const { name, type, fal_price, max_duration, pricing_type } = modelData;
  
  // 1. Check if price exists
  if (!fal_price || fal_price <= 0) {
    errors.push('❌ FAL Price must be greater than 0');
    errors.push('💡 Check fal.ai/models for actual pricing');
    return { valid: false, errors, warnings, suggestions };
  }
  
  // 2. Validate video model pricing
  if (type === 'video') {
    // Check if per-second pricing
    if (pricing_type === 'per_second') {
      const range = PRICING_PATTERNS.PER_SECOND.typical_range;
      
      if (fal_price < range[0] || fal_price > range[1]) {
        warnings.push(`⚠️  Per-second price $${fal_price}/s is unusual`);
        warnings.push(`   Typical range: $${range[0]}-$${range[1]}/s`);
        suggestions.push('Verify this is the per-second price, not total price');
      }
      
      // Calculate total cost
      const totalCost = fal_price * (max_duration || 10);
      if (totalCost > 5.0) {
        warnings.push(`⚠️  Total cost for max duration: $${totalCost.toFixed(2)}`);
        warnings.push('   This is EXPENSIVE! User will need many credits');
      }
      
      suggestions.push(`📊 Credits for max ${max_duration}s: ~${Math.ceil(totalCost / 0.08)} credits`);
      
    } else {
      // Flat rate pricing
      const range = PRICING_PATTERNS.FLAT_RATE.typical_range;
      
      if (fal_price < range[0]) {
        warnings.push(`⚠️  Price $${fal_price} is very cheap for video`);
        suggestions.push('Double-check this is the correct price');
      }
      
      if (fal_price > range[1]) {
        warnings.push(`⚠️  Price $${fal_price} is expensive`);
        warnings.push('   Make sure this is flat rate, not per-second!');
      }
      
      suggestions.push(`📊 Credits: ~${Math.ceil(fal_price / 0.08)} credits`);
    }
    
    // Check max duration
    if (!max_duration || max_duration <= 0) {
      warnings.push('⚠️  Max duration not specified');
      suggestions.push('Set max_duration for proportional pricing');
    }
  }
  
  // 3. Validate image model pricing
  if (type === 'image') {
    const range = PRICING_PATTERNS.PER_IMAGE.typical_range;
    
    if (fal_price < range[0]) {
      warnings.push(`⚠️  Price $${fal_price} is very cheap for image`);
    }
    
    if (fal_price > range[1]) {
      warnings.push(`⚠️  Price $${fal_price} is expensive for image`);
      warnings.push('   Check if this is per-megapixel pricing');
    }
    
    suggestions.push(`📊 Credits: ~${Math.ceil(fal_price / 0.05)} credits`);
  }
  
  // 4. Sanity check: Detect likely per-second mistake
  if (type === 'video' && pricing_type !== 'per_second' && fal_price < 0.10) {
    errors.push('❌ LIKELY ERROR: Price too low for flat rate video');
    errors.push('   Did you mean per-second pricing?');
    errors.push(`   If this is $${fal_price}/second for ${max_duration}s:`);
    errors.push(`   → Total would be $${(fal_price * max_duration).toFixed(2)}`);
  }
  
  // 5. Check profit margin
  const baseCredit = type === 'video' ? 0.08 : 0.05;
  const profitMargin = type === 'video' ? 0.25 : 0.20;
  
  const credits = (fal_price / baseCredit) * (1 + profitMargin);
  const userPrice = credits * baseCredit;
  const actualProfit = ((userPrice - fal_price) / fal_price * 100);
  
  if (actualProfit < 15) {
    warnings.push(`⚠️  Profit margin only ${actualProfit.toFixed(1)}%`);
    warnings.push('   Consider if this is profitable');
  }
  
  if (actualProfit > 50) {
    warnings.push(`⚠️  Profit margin ${actualProfit.toFixed(1)}% is very high`);
    suggestions.push('Price might be too expensive for users');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    suggestions,
    calculated: {
      credits: credits.toFixed(1),
      userPriceUSD: userPrice.toFixed(3),
      userPriceIDR: Math.ceil(credits * 1500).toLocaleString('id-ID'),
      profitMargin: actualProfit.toFixed(1) + '%'
    }
  };
}

/**
 * Calculate optimal pricing
 */
function calculateOptimalPricing(falPrice, type, maxDuration = null, pricingType = 'flat') {
  const baseCredit = type === 'video' ? 0.08 : 0.05;
  const profitMargin = type === 'video' ? 0.25 : 0.20;
  const rounding = 0.1; // Round to 0.1 for accuracy
  
  let totalFalPrice = falPrice;
  
  // If per-second pricing, calculate for max duration
  if (pricingType === 'per_second' && maxDuration) {
    totalFalPrice = falPrice * maxDuration;
  }
  
  // Calculate credits with profit margin
  let credits = (totalFalPrice / baseCredit) * (1 + profitMargin);
  
  // Round to nearest 0.1
  credits = Math.round(credits / rounding) * rounding;
  
  // User pays
  const userPriceUSD = credits * baseCredit;
  const userPriceIDR = credits * 1500;
  
  // Actual profit
  const profit = ((userPriceUSD - totalFalPrice) / totalFalPrice * 100);
  
  return {
    falPrice: totalFalPrice,
    credits: credits,
    userPriceUSD: userPriceUSD.toFixed(3),
    userPriceIDR: Math.ceil(userPriceIDR).toLocaleString('id-ID'),
    profitMargin: profit.toFixed(1) + '%',
    baseCredit: baseCredit,
    formula: `($${totalFalPrice} / $${baseCredit}) * ${1 + profitMargin} = ${credits.toFixed(1)} credits`
  };
}

/**
 * Detect pricing type from description
 */
function detectPricingType(description) {
  const desc = (description || '').toLowerCase();
  
  for (const [type, pattern] of Object.entries(PRICING_PATTERNS)) {
    for (const indicator of pattern.indicators) {
      if (desc.includes(indicator)) {
        return {
          type: type,
          confidence: 'high',
          pattern: pattern
        };
      }
    }
  }
  
  return {
    type: 'UNKNOWN',
    confidence: 'low',
    message: 'Please specify pricing type manually'
  };
}

/**
 * Generate pricing report for admin
 */
function generatePricingReport(modelData) {
  const validation = validatePricing(modelData);
  const pricing = calculateOptimalPricing(
    modelData.fal_price,
    modelData.type,
    modelData.max_duration,
    modelData.pricing_type
  );
  
  let report = '\n';
  report += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  report += `📊 PRICING REPORT: ${modelData.name}\n`;
  report += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
  
  // Basic info
  report += `Type: ${modelData.type}\n`;
  report += `FAL Price: $${modelData.fal_price}\n`;
  if (modelData.max_duration) {
    report += `Max Duration: ${modelData.max_duration}s\n`;
  }
  report += '\n';
  
  // Calculated pricing
  report += '💰 CALCULATED PRICING:\n';
  report += `   Credits: ${pricing.credits}\n`;
  report += `   User Pays (USD): $${pricing.userPriceUSD}\n`;
  report += `   User Pays (IDR): Rp ${pricing.userPriceIDR}\n`;
  report += `   Profit Margin: ${pricing.profitMargin}\n`;
  report += '\n';
  
  // Errors
  if (validation.errors.length > 0) {
    report += '❌ ERRORS:\n';
    validation.errors.forEach(err => report += `   ${err}\n`);
    report += '\n';
  }
  
  // Warnings
  if (validation.warnings.length > 0) {
    report += '⚠️  WARNINGS:\n';
    validation.warnings.forEach(warn => report += `   ${warn}\n`);
    report += '\n';
  }
  
  // Suggestions
  if (validation.suggestions.length > 0) {
    report += '💡 SUGGESTIONS:\n';
    validation.suggestions.forEach(sug => report += `   ${sug}\n`);
    report += '\n';
  }
  
  // Status
  report += validation.valid ? '✅ VALID - Safe to import\n' : '❌ INVALID - Fix errors first\n';
  report += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  
  return report;
}

module.exports = {
  validatePricing,
  calculateOptimalPricing,
  detectPricingType,
  generatePricingReport,
  PRICING_PATTERNS
};




