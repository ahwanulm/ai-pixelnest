/**
 * Update pricing function to support per-second pricing
 */

const { pool } = require('../config/database');

async function updatePricingFunction() {
  try {
    console.log('\n🔧 Updating pricing function to support pricing_type...\n');
    
    // Drop old function and create new one
    await pool.query(`
      DROP FUNCTION IF EXISTS calculate_credits_typed(DECIMAL, VARCHAR) CASCADE;
    `);
    
    console.log('✅ Dropped old function');
    
    // Create NEW function that handles pricing_type
    await pool.query(`
      CREATE OR REPLACE FUNCTION calculate_credits_typed(
        model_id_param INTEGER,
        model_type VARCHAR(10),
        fal_price_usd DECIMAL,
        model_max_duration INTEGER DEFAULT NULL,
        model_pricing_type VARCHAR(20) DEFAULT 'flat'
      )
      RETURNS DECIMAL AS $$
      DECLARE
        profit_margin DECIMAL;
        base_credit_usd DECIMAL;
        min_credits DECIMAL;
        cheap_threshold DECIMAL;
        credit_rounding DECIMAL;
        actual_fal_price DECIMAL;
        calculated DECIMAL;
        final_credits DECIMAL;
      BEGIN
        -- Get type-specific configs
        IF model_type = 'image' THEN
          SELECT config_value INTO profit_margin FROM pricing_config WHERE config_key = 'image_profit_margin';
          SELECT config_value INTO base_credit_usd FROM pricing_config WHERE config_key = 'image_base_credit_usd';
          SELECT config_value INTO min_credits FROM pricing_config WHERE config_key = 'image_minimum_credits';
          SELECT config_value INTO cheap_threshold FROM pricing_config WHERE config_key = 'image_cheap_threshold';
        ELSE -- video
          SELECT config_value INTO profit_margin FROM pricing_config WHERE config_key = 'video_profit_margin';
          SELECT config_value INTO base_credit_usd FROM pricing_config WHERE config_key = 'video_base_credit_usd';
          SELECT config_value INTO min_credits FROM pricing_config WHERE config_key = 'video_minimum_credits';
          SELECT config_value INTO cheap_threshold FROM pricing_config WHERE config_key = 'video_cheap_threshold';
        END IF;
        
        SELECT config_value INTO credit_rounding FROM pricing_config WHERE config_key = 'credit_rounding';
        
        -- Handle edge cases
        IF fal_price_usd IS NULL OR fal_price_usd <= 0 THEN
          RETURN min_credits;
        END IF;
        
        -- IMPORTANT: For per-second pricing, calculate total cost for max duration
        IF model_pricing_type = 'per_second' AND model_max_duration IS NOT NULL AND model_max_duration > 0 THEN
          -- Total FAL cost = per-second price × max duration
          actual_fal_price := fal_price_usd * model_max_duration;
          
          -- Log for debugging
          RAISE NOTICE 'Per-second model: $% × %s = $%', fal_price_usd, model_max_duration, actual_fal_price;
        ELSE
          -- Flat rate: use price as-is
          actual_fal_price := fal_price_usd;
        END IF;
        
        -- If very cheap, use minimum
        IF actual_fal_price < cheap_threshold THEN
          RETURN min_credits;
        END IF;
        
        -- Calculate credits with profit margin
        calculated := (actual_fal_price / base_credit_usd) * (1 + (profit_margin / 100));
        
        -- Round to nearest rounding value
        final_credits := ROUND(calculated / credit_rounding) * credit_rounding;
        
        -- Ensure minimum
        IF final_credits < min_credits THEN
          final_credits := min_credits;
        END IF;
        
        RETURN final_credits;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('✅ Created new function with pricing_type support');
    
    // Update trigger to use new function signature
    await pool.query(`
      CREATE OR REPLACE FUNCTION auto_calculate_typed()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.fal_price IS NOT NULL AND NEW.fal_price > 0 AND NEW.type IS NOT NULL THEN
          NEW.cost := calculate_credits_typed(
            NEW.id,
            NEW.type,
            NEW.fal_price,
            NEW.max_duration,
            COALESCE(NEW.pricing_type, 'flat')
          );
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('✅ Updated trigger function');
    
    // Recreate trigger
    await pool.query(`
      DROP TRIGGER IF EXISTS trigger_auto_calculate_typed ON ai_models;
    `);
    
    await pool.query(`
      CREATE TRIGGER trigger_auto_calculate_typed
      BEFORE INSERT OR UPDATE ON ai_models
      FOR EACH ROW
      EXECUTE FUNCTION auto_calculate_typed();
    `);
    
    console.log('✅ Recreated trigger');
    
    console.log('\n✅ Pricing function updated successfully!\n');
    console.log('📝 Function now supports:');
    console.log('   - pricing_type: "per_second" or "flat"');
    console.log('   - Automatic calculation for per-second models');
    console.log('   - Proportional pricing based on max_duration');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

updatePricingFunction();




