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
  },

  // Per token (text processing models)
  PER_TOKEN: {
    indicators: ['per token', '/token', 'per_token'],
    typical_range: [0.0001, 0.001], // $0.0001-$0.001 per token
    examples: ['GPT models', 'language processing']
  },

  // Per character (text processing)
  PER_CHARACTER: {
    indicators: ['per character', '/char', 'per_character'],
    typical_range: [0.00001, 0.0001], // Very small per character
    examples: ['Text-to-speech', 'character counting models']
  },

  // Per 1K characters (bulk text processing)
  PER_1K_CHARS: {
    indicators: ['per 1k chars', '/1k', 'per_1k_chars'],
    typical_range: [0.01, 0.10], // $0.01-$0.10 per 1K characters
    examples: ['Bulk text processing', 'translation models']
  },

  // Per minute (audio/video processing)
  PER_MINUTE: {
    indicators: ['per minute', '/min', 'per_minute'],
    typical_range: [0.10, 1.00], // $0.10-$1.00 per minute
    examples: ['Audio generation', 'video processing']
  },

  // Per request (API calls)
  PER_REQUEST: {
    indicators: ['per request', '/req', 'per_request'],
    typical_range: [0.01, 0.50], // $0.01-$0.50 per request
    examples: ['API services', 'single operations']
  },

  // Per duration (time-based tiers)
  PER_DURATION: {
    indicators: ['per duration', 'duration tiers', 'per_duration'],
    typical_range: [0.05, 2.00], // Variable based on duration
    examples: ['Tiered video generation', 'duration-based pricing']
  },

  // Tiered usage (volume-based pricing)
  TIERED_USAGE: {
    indicators: ['tiered', 'volume pricing', 'tiered_usage'],
    typical_range: [0.01, 1.00], // Variable based on volume
    examples: ['High-volume processing', 'enterprise models']
  }
};

/**
 * Validate pricing input - supports all 14 pricing types
 */
function validatePricing(modelData) {
  const errors = [];
  const warnings = [];
  const suggestions = [];
  
  const { name, type, fal_price, max_duration, pricing_type, metadata = {} } = modelData;
  
  // 1. Check if price exists
  if (!fal_price || fal_price <= 0) {
    errors.push('❌ FAL Price must be greater than 0');
    errors.push('💡 Check fal.ai/models for actual pricing');
    return { valid: false, errors, warnings, suggestions };
  }
  
  // 2. Validate based on pricing type
  switch (pricing_type) {
    case 'per_second':
      validatePerSecond(fal_price, max_duration, warnings, suggestions);
      break;
    
    case 'per_image':
      validatePerImage(fal_price, warnings, suggestions);
      break;
      
    case 'per_token':
      validatePerToken(fal_price, metadata, warnings, suggestions);
      break;
      
    case 'per_character':
      validatePerCharacter(fal_price, metadata, warnings, suggestions);
      break;
      
    case 'per_1k_chars':
      validatePer1KChars(fal_price, metadata, warnings, suggestions);
      break;
      
    case 'per_minute':
      validatePerMinute(fal_price, metadata, warnings, suggestions);
      break;
      
    case 'per_request':
      validatePerRequest(fal_price, metadata, warnings, suggestions);
      break;
      
    case 'per_duration':
      validatePerDuration(metadata, warnings, suggestions);
      break;
      
    case 'tiered_usage':
      validateTieredUsage(metadata, warnings, suggestions);
      break;
      
    case 'per_pixel':
    case 'per_megapixel':
    case '3d_modeling':
    case 'resolution_based':
      // These are handled by existing backend columns
      validateAdvancedPricing(pricing_type, fal_price, warnings, suggestions);
      break;
      
    default: // 'flat' or others
      validateFlatRate(fal_price, type, warnings, suggestions);
      break;
  }
  
  // 3. Sanity checks
  if (type === 'video' && pricing_type !== 'per_second' && fal_price < 0.10) {
    errors.push('❌ LIKELY ERROR: Price too low for flat rate video');
    errors.push('   Did you mean per-second pricing?');
    errors.push(`   If this is $${fal_price}/second for ${max_duration}s:`);
    errors.push(`   → Total would be $${(fal_price * max_duration).toFixed(2)}`);
  }
  
  // 4. Check profit margin
  const baseCredit = type === 'video' || type === 'audio' ? 0.08 : 0.05;
  const profitMargin = type === 'video' || type === 'audio' ? 0.25 : 0.20;
  
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

// Validation helper functions for each pricing type
function validatePerSecond(fal_price, max_duration, warnings, suggestions) {
  const range = PRICING_PATTERNS.PER_SECOND.typical_range;
  
  if (fal_price < range[0] || fal_price > range[1]) {
    warnings.push(`⚠️  Per-second price $${fal_price}/s is unusual`);
    warnings.push(`   Typical range: $${range[0]}-$${range[1]}/s`);
    suggestions.push('Verify this is the per-second price, not total price');
  }
  
  const totalCost = fal_price * (max_duration || 10);
  if (totalCost > 5.0) {
    warnings.push(`⚠️  Total cost for max duration: $${totalCost.toFixed(2)}`);
    warnings.push('   This is EXPENSIVE! User will need many credits');
  }
  
  suggestions.push(`📊 Credits for max ${max_duration}s: ~${Math.ceil(totalCost / 0.08)} credits`);
}

function validatePerImage(fal_price, warnings, suggestions) {
  const range = PRICING_PATTERNS.PER_IMAGE.typical_range;
  
  if (fal_price < range[0]) {
    warnings.push(`⚠️  Price $${fal_price} is very cheap for per-image`);
  }
  
  if (fal_price > range[1]) {
    warnings.push(`⚠️  Price $${fal_price} is expensive for per-image`);
  }
  
  suggestions.push(`📊 Credits: ~${Math.ceil(fal_price / 0.05)} credits per image`);
}

function validatePerToken(fal_price, metadata, warnings, suggestions) {
  const range = PRICING_PATTERNS.PER_TOKEN.typical_range;
  
  if (fal_price < range[0] || fal_price > range[1]) {
    warnings.push(`⚠️  Per-token price $${fal_price} is unusual`);
    warnings.push(`   Typical range: $${range[0]}-$${range[1]} per token`);
  }
  
  suggestions.push('💡 Consider input vs output token pricing differences');
  suggestions.push(`📊 Credits for 1K tokens: ~${Math.ceil((fal_price * 1000) / 0.05)} credits`);
}

function validatePerCharacter(fal_price, metadata, warnings, suggestions) {
  const range = PRICING_PATTERNS.PER_CHARACTER.typical_range;
  
  if (fal_price < range[0] || fal_price > range[1]) {
    warnings.push(`⚠️  Per-character price $${fal_price} is unusual`);
    warnings.push(`   Typical range: $${range[0]}-$${range[1]} per character`);
  }
  
  suggestions.push(`📊 Credits for 100 chars: ~${Math.ceil((fal_price * 100) / 0.05)} credits`);
}

function validatePer1KChars(fal_price, metadata, warnings, suggestions) {
  const range = PRICING_PATTERNS.PER_1K_CHARS.typical_range;
  
  if (fal_price < range[0] || fal_price > range[1]) {
    warnings.push(`⚠️  Per-1K-chars price $${fal_price} is unusual`);
    warnings.push(`   Typical range: $${range[0]}-$${range[1]} per 1K characters`);
  }
  
  suggestions.push(`📊 Credits: ~${Math.ceil(fal_price / 0.05)} credits per 1K chars`);
}

function validatePerMinute(fal_price, metadata, warnings, suggestions) {
  const range = PRICING_PATTERNS.PER_MINUTE.typical_range;
  
  if (fal_price < range[0] || fal_price > range[1]) {
    warnings.push(`⚠️  Per-minute price $${fal_price} is unusual`);
    warnings.push(`   Typical range: $${range[0]}-$${range[1]} per minute`);
  }
  
  suggestions.push(`📊 Credits: ~${Math.ceil(fal_price / 0.08)} credits per minute`);
}

function validatePerRequest(fal_price, metadata, warnings, suggestions) {
  const range = PRICING_PATTERNS.PER_REQUEST.typical_range;
  
  if (fal_price < range[0] || fal_price > range[1]) {
    warnings.push(`⚠️  Per-request price $${fal_price} is unusual`);
    warnings.push(`   Typical range: $${range[0]}-$${range[1]} per request`);
  }
  
  suggestions.push(`📊 Credits: ~${Math.ceil(fal_price / 0.05)} credits per request`);
}

function validatePerDuration(metadata, warnings, suggestions) {
  if (!metadata.price_4s || !metadata.price_6s) {
    warnings.push('⚠️  Duration tiers should include multiple price points');
    suggestions.push('💡 Set prices for 4s, 6s, 8s, 10s, 15s, 20s durations');
  }
  
  suggestions.push('📊 Duration-based pricing allows flexible user options');
}

function validateTieredUsage(metadata, warnings, suggestions) {
  if (!metadata.tier1_price || !metadata.tier2_price) {
    warnings.push('⚠️  Tiered usage should include multiple tier prices');
    suggestions.push('💡 Set prices for tier 1, tier 2, and tier 3');
  }
  
  suggestions.push('📊 Tiered pricing encourages higher volume usage');
}

function validateAdvancedPricing(pricing_type, fal_price, warnings, suggestions) {
  suggestions.push(`💡 ${pricing_type} pricing is handled by dedicated backend fields`);
  suggestions.push('📊 Check specific pricing structure configuration');
}

function validateFlatRate(fal_price, type, warnings, suggestions) {
  const range = type === 'video' ? PRICING_PATTERNS.FLAT_RATE.typical_range : PRICING_PATTERNS.PER_IMAGE.typical_range;
  
  if (fal_price < range[0]) {
    warnings.push(`⚠️  Price $${fal_price} is very cheap for ${type}`);
    suggestions.push('Double-check this is the correct price');
  }
  
  if (fal_price > range[1]) {
    warnings.push(`⚠️  Price $${fal_price} is expensive for ${type}`);
  }
  
  const baseCredit = type === 'video' || type === 'audio' ? 0.08 : 0.05;
  suggestions.push(`📊 Credits: ~${Math.ceil(fal_price / baseCredit)} credits`);
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




