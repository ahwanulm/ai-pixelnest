/**
 * FIX ALL MODEL PRICING IN DATABASE
 * 
 * Purpose: Recalculate pricing for all models using correct formulas
 * Handles: Per-second, per-pixel, multi-tier, and all pricing structures
 * 
 * Usage: node src/scripts/fixAllModelPricing.js
 */

const { pool } = require('../config/database');

// Correct pricing formulas
const FORMULAS = {
  STANDARD: 10,        // Standard models: × 10
  PER_PIXEL: 2,        // Upscaling: × 2 (due to high base cost)
  PER_MEGAPIXEL: 10,   // FLUX: × 10
  MINIMUM: 0.5         // Minimum credits
};

async function fixAllModelPricing() {
  const client = await pool.connect();
  
  try {
    console.log('\n🔧 FIXING ALL MODEL PRICING IN DATABASE\n');
    console.log('=' .repeat(70));
    
    await client.query('BEGIN');
    
    // First, check what columns exist
    const columnsResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'ai_models'
    `);
    
    const availableColumns = columnsResult.rows.map(row => row.column_name);
    console.log(`📋 Available columns: ${availableColumns.length} columns found\n`);
    
    // Build query with only existing columns
    const baseColumns = ['id', 'name', 'type', 'fal_price', 'cost'];
    const optionalColumns = [
      'pricing_structure',
      'pricing_type', 
      'max_duration',
      'price_per_pixel',
      'base_resolution',
      'max_upscale_factor',
      'price_per_megapixel',
      'base_megapixels',
      'has_multi_tier_pricing',
      'price_text_to_video_no_audio',
      'price_text_to_video_with_audio',
      'price_image_to_video_no_audio',
      'price_image_to_video_with_audio'
    ];
    
    const columnsToSelect = [
      ...baseColumns,
      ...optionalColumns.filter(col => availableColumns.includes(col))
    ];
    
    // Get all models with available columns only
    const modelsResult = await client.query(`
      SELECT ${columnsToSelect.map(col => col === 'cost' ? 'cost as old_cost' : col).join(', ')}
      FROM ai_models
      ORDER BY type, name
    `);
    
    console.log(`📊 Found ${modelsResult.rows.length} models to check\n`);
    
    let fixedCount = 0;
    let skipCount = 0;
    const fixes = [];
    
    for (const model of modelsResult.rows) {
      const oldCost = parseFloat(model.old_cost) || 1;
      let newCost = oldCost;
      let formula = 'unchanged';
      let reason = '';
      
      try {
        // Determine pricing structure
        const structure = model.pricing_structure || 'simple';
        
        switch (structure) {
          case 'simple':
            // SIMPLE PRICING (Flat or Per-Second)
            if (model.pricing_type === 'per_second') {
              // Per-second: Store credits PER SECOND
              const falPrice = parseFloat(model.fal_price) || 0;
              if (falPrice > 0) {
                newCost = Math.max(FORMULAS.MINIMUM, Math.round(falPrice * FORMULAS.STANDARD * 10) / 10);
                formula = `$${falPrice}/s × ${FORMULAS.STANDARD} = ${newCost} cr/s`;
                reason = 'Per-second pricing (credits per second)';
              }
            } else {
              // Flat rate: Standard formula
              const falPrice = parseFloat(model.fal_price) || 0;
              if (falPrice > 0) {
                newCost = Math.max(FORMULAS.MINIMUM, Math.round(falPrice * FORMULAS.STANDARD * 10) / 10);
                formula = `$${falPrice} × ${FORMULAS.STANDARD} = ${newCost} cr`;
                reason = 'Flat rate pricing';
              }
            }
            break;
            
          case 'per_pixel':
            // PER-PIXEL PRICING (Upscaling)
            if (model.price_per_pixel !== undefined) {
              const pricePerPixel = parseFloat(model.price_per_pixel) || 0;
              if (pricePerPixel > 0 && model.base_resolution && model.max_upscale_factor) {
                const [width, height] = model.base_resolution.split('x').map(v => parseInt(v) || 1920);
                const basePixels = width * height;
                const upscaleFactor = parseFloat(model.max_upscale_factor) || 4;
                const upscaledPixels = basePixels * (upscaleFactor * upscaleFactor);
                const totalPrice = pricePerPixel * upscaledPixels;
                
                // Use × 2 formula for per-pixel (not × 10!)
                newCost = Math.max(FORMULAS.MINIMUM, Math.round(totalPrice * FORMULAS.PER_PIXEL * 10) / 10);
                formula = `$${pricePerPixel.toFixed(7)}/px × ${upscaledPixels.toLocaleString()} px × ${FORMULAS.PER_PIXEL} = ${newCost} cr`;
                reason = 'Per-pixel pricing (upscaling)';
              }
            } else {
              // Fallback if per-pixel fields don't exist
              const falPrice = parseFloat(model.fal_price) || 0;
              if (falPrice > 0) {
                newCost = Math.max(FORMULAS.MINIMUM, Math.round(falPrice * FORMULAS.STANDARD * 10) / 10);
                formula = `$${falPrice} × ${FORMULAS.STANDARD} = ${newCost} cr`;
                reason = 'Per-pixel pricing (using fal_price fallback)';
              }
            }
            break;
            
          case 'per_megapixel':
            // PER-MEGAPIXEL PRICING (FLUX)
            if (model.price_per_megapixel !== undefined) {
              const pricePerMP = parseFloat(model.price_per_megapixel) || 0;
              const baseMP = parseFloat(model.base_megapixels) || 1.0;
              if (pricePerMP > 0) {
                const totalPrice = pricePerMP * baseMP;
                newCost = Math.max(FORMULAS.MINIMUM, Math.round(totalPrice * FORMULAS.PER_MEGAPIXEL * 10) / 10);
                formula = `$${pricePerMP}/MP × ${baseMP} MP × ${FORMULAS.PER_MEGAPIXEL} = ${newCost} cr`;
                reason = 'Per-megapixel pricing';
              }
            } else {
              // Fallback
              const falPrice = parseFloat(model.fal_price) || 0;
              if (falPrice > 0) {
                newCost = Math.max(FORMULAS.MINIMUM, Math.round(falPrice * FORMULAS.STANDARD * 10) / 10);
                formula = `$${falPrice} × ${FORMULAS.STANDARD} = ${newCost} cr`;
                reason = 'Per-megapixel pricing (using fal_price fallback)';
              }
            }
            break;
            
          case 'multi_tier':
            // MULTI-TIER PRICING (Veo)
            // Use the cheapest tier (text-to-video no audio)
            // Check if multi-tier fields exist
            if (model.price_text_to_video_no_audio !== undefined) {
              const prices = [
                parseFloat(model.price_text_to_video_no_audio) || 0,
                parseFloat(model.price_text_to_video_with_audio) || 0,
                parseFloat(model.price_image_to_video_no_audio) || 0,
                parseFloat(model.price_image_to_video_with_audio) || 0
              ].filter(p => p > 0);
              
              if (prices.length > 0) {
                const minPrice = Math.min(...prices);
                const maxDuration = parseInt(model.max_duration) || 8;
                const totalPrice = minPrice * maxDuration;
                newCost = Math.max(FORMULAS.MINIMUM, Math.round(totalPrice * FORMULAS.STANDARD * 10) / 10);
                formula = `$${minPrice}/s × ${maxDuration}s × ${FORMULAS.STANDARD} = ${newCost} cr`;
                reason = 'Multi-tier pricing (base tier)';
              }
            } else {
              // Fallback to fal_price if multi-tier fields don't exist
              const falPrice = parseFloat(model.fal_price) || 0;
              if (falPrice > 0) {
                newCost = Math.max(FORMULAS.MINIMUM, Math.round(falPrice * FORMULAS.STANDARD * 10) / 10);
                formula = `$${falPrice} × ${FORMULAS.STANDARD} = ${newCost} cr`;
                reason = 'Multi-tier pricing (using fal_price fallback)';
              }
            }
            break;
            
          case '3d_modeling':
            // 3D MODELING PRICING
            // Keep as-is or use fal_price
            const falPrice3D = parseFloat(model.fal_price) || 0;
            if (falPrice3D > 0) {
              newCost = Math.max(FORMULAS.MINIMUM, Math.round(falPrice3D * FORMULAS.STANDARD * 10) / 10);
              formula = `$${falPrice3D} × ${FORMULAS.STANDARD} = ${newCost} cr`;
              reason = '3D modeling pricing';
            }
            break;
            
          case 'resolution_based':
            // RESOLUTION-BASED PRICING
            // Keep as-is (highest tier already stored)
            const falPriceRes = parseFloat(model.fal_price) || 0;
            if (falPriceRes > 0) {
              newCost = Math.max(FORMULAS.MINIMUM, Math.round(falPriceRes * FORMULAS.STANDARD * 10) / 10);
              formula = `$${falPriceRes} × ${FORMULAS.STANDARD} = ${newCost} cr`;
              reason = 'Resolution-based pricing';
            }
            break;
            
          default:
            // Unknown structure - use standard formula
            const falPriceDef = parseFloat(model.fal_price) || 0;
            if (falPriceDef > 0) {
              newCost = Math.max(FORMULAS.MINIMUM, Math.round(falPriceDef * FORMULAS.STANDARD * 10) / 10);
              formula = `$${falPriceDef} × ${FORMULAS.STANDARD} = ${newCost} cr`;
              reason = 'Standard pricing (fallback)';
            }
            break;
        }
        
        // Check if update needed
        const diff = Math.abs(newCost - oldCost);
        
        if (diff > 0.05) { // More than 0.05 difference
          // Update database
          await client.query(`
            UPDATE ai_models
            SET cost = $1, updated_at = NOW()
            WHERE id = $2
          `, [newCost, model.id]);
          
          fixedCount++;
          fixes.push({
            name: model.name,
            type: model.type,
            structure: structure,
            oldCost: oldCost,
            newCost: newCost,
            diff: newCost - oldCost,
            formula: formula,
            reason: reason
          });
          
          console.log(`✅ FIXED: ${model.name}`);
          console.log(`   Type: ${model.type} | Structure: ${structure}`);
          console.log(`   Old: ${oldCost.toFixed(2)} cr → New: ${newCost.toFixed(2)} cr (${diff > 0 ? '+' : ''}${(newCost - oldCost).toFixed(2)})`);
          console.log(`   Formula: ${formula}`);
          console.log(`   Reason: ${reason}\n`);
        } else {
          skipCount++;
        }
        
      } catch (error) {
        console.error(`❌ Error fixing ${model.name}:`, error.message);
      }
    }
    
    await client.query('COMMIT');
    
    console.log('\n' + '='.repeat(70));
    console.log('📊 SUMMARY:\n');
    console.log(`   Total models checked: ${modelsResult.rows.length}`);
    console.log(`   Models fixed: ${fixedCount}`);
    console.log(`   Models unchanged: ${skipCount}`);
    
    if (fixes.length > 0) {
      console.log('\n📋 BREAKDOWN BY TYPE:\n');
      
      const byType = {};
      fixes.forEach(fix => {
        byType[fix.type] = byType[fix.type] || [];
        byType[fix.type].push(fix);
      });
      
      Object.entries(byType).forEach(([type, typeFixes]) => {
        console.log(`   ${type.toUpperCase()}: ${typeFixes.length} models`);
        typeFixes.forEach(fix => {
          const change = fix.diff > 0 ? `+${fix.diff.toFixed(1)}` : fix.diff.toFixed(1);
          console.log(`      - ${fix.name}: ${fix.oldCost.toFixed(1)} → ${fix.newCost.toFixed(1)} (${change})`);
        });
      });
      
      console.log('\n📋 BREAKDOWN BY STRUCTURE:\n');
      
      const byStructure = {};
      fixes.forEach(fix => {
        byStructure[fix.structure] = byStructure[fix.structure] || [];
        byStructure[fix.structure].push(fix);
      });
      
      Object.entries(byStructure).forEach(([structure, structFixes]) => {
        console.log(`   ${structure}: ${structFixes.length} models`);
      });
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ ALL MODEL PRICING FIXED!\n');
    console.log('Next steps:');
    console.log('1. Verify in Admin Panel → Models');
    console.log('2. Check user dashboard pricing display');
    console.log('3. Test generation with updated models\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Error fixing pricing:', error.message);
    console.error('Transaction rolled back. No changes made.\n');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  fixAllModelPricing()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = fixAllModelPricing;

