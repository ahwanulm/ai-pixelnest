/**
 * Simplify Pricing System
 * - Remove complex configs
 * - Focus on essentials: credit_price_idr
 * - Clean database
 */

const { pool } = require('../config/database');

async function simplifyPricing() {
  try {
    console.log('\n🔧 Simplifying Pricing System...\n');
    
    // Step 1: Keep only essential configs
    console.log('📊 Step 1: Cleaning pricing_config table...');
    
    // Delete old configs we don't need
    await pool.query(`
      DELETE FROM pricing_config 
      WHERE config_key NOT IN (
        'credit_price_idr',
        'video_base_credit_usd',
        'video_profit_margin',
        'image_base_credit_usd',
        'image_profit_margin',
        'credit_rounding'
      )
    `);
    
    console.log('✅ Removed unnecessary configs\n');
    
    // Step 2: Ensure essential configs exist
    console.log('📊 Step 2: Ensuring essential configs...');
    
    const essentialConfigs = [
      ['credit_price_idr', '1500', 'Harga 1 credit dalam Rupiah (user pays)'],
      ['video_base_credit_usd', '0.08', 'Base USD for video = 1 credit (fal.ai cost basis)'],
      ['video_profit_margin', '25', 'Profit margin for video models (%)'],
      ['image_base_credit_usd', '0.05', 'Base USD for image = 1 credit (fal.ai cost basis)'],
      ['image_profit_margin', '20', 'Profit margin for image models (%)'],
      ['credit_rounding', '0.1', 'Round credits to nearest 0.1']
    ];
    
    for (const [key, value, desc] of essentialConfigs) {
      await pool.query(`
        INSERT INTO pricing_config (config_key, config_value, description)
        VALUES ($1, $2, $3)
        ON CONFLICT (config_key) DO UPDATE 
        SET description = $3
      `, [key, value, desc]);
      console.log(`✅ ${key}: ${value}`);
    }
    
    console.log('\n📊 Step 3: Creating simple pricing function...');
    
    // Drop old complex function
    await pool.query(`DROP FUNCTION IF EXISTS calculate_credits_typed CASCADE`);
    
    // Create new SIMPLE function
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
        credit_rounding DECIMAL;
        actual_fal_price DECIMAL;
        calculated DECIMAL;
        final_credits DECIMAL;
      BEGIN
        -- Get configs based on type
        IF model_type = 'image' THEN
          SELECT config_value INTO base_credit_usd FROM pricing_config WHERE config_key = 'image_base_credit_usd';
          SELECT config_value INTO profit_margin FROM pricing_config WHERE config_key = 'image_profit_margin';
        ELSE -- video
          SELECT config_value INTO base_credit_usd FROM pricing_config WHERE config_key = 'video_base_credit_usd';
          SELECT config_value INTO profit_margin FROM pricing_config WHERE config_key = 'video_profit_margin';
        END IF;
        
        SELECT config_value INTO credit_rounding FROM pricing_config WHERE config_key = 'credit_rounding';
        
        -- Handle NULL or zero price
        IF fal_price_usd IS NULL OR fal_price_usd <= 0 THEN
          RETURN 0.5; -- minimum
        END IF;
        
        -- For per-second pricing, calculate total cost for max duration
        IF model_pricing_type = 'per_second' AND model_max_duration IS NOT NULL AND model_max_duration > 0 THEN
          actual_fal_price := fal_price_usd * model_max_duration;
        ELSE
          actual_fal_price := fal_price_usd;
        END IF;
        
        -- Simple calculation: (fal_cost / base) * (1 + profit%)
        calculated := (actual_fal_price / base_credit_usd) * (1 + (profit_margin / 100));
        
        -- Round
        final_credits := ROUND(calculated / credit_rounding) * credit_rounding;
        
        -- Minimum 0.5 credits
        IF final_credits < 0.5 THEN
          final_credits := 0.5;
        END IF;
        
        RETURN final_credits;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('✅ Simple pricing function created\n');
    
    // Step 4: Recreate trigger
    console.log('📊 Step 4: Creating auto-calculation trigger...');
    
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
    
    await pool.query(`DROP TRIGGER IF EXISTS trigger_auto_calculate_typed ON ai_models`);
    
    await pool.query(`
      CREATE TRIGGER trigger_auto_calculate_typed
      BEFORE INSERT OR UPDATE ON ai_models
      FOR EACH ROW
      EXECUTE FUNCTION auto_calculate_typed();
    `);
    
    console.log('✅ Trigger created\n');
    
    // Step 5: Show current config
    console.log('📊 Current Configuration:\n');
    
    const config = await pool.query(`
      SELECT config_key, config_value, description
      FROM pricing_config
      ORDER BY 
        CASE config_key
          WHEN 'credit_price_idr' THEN 1
          WHEN 'video_base_credit_usd' THEN 2
          WHEN 'video_profit_margin' THEN 3
          WHEN 'image_base_credit_usd' THEN 4
          WHEN 'image_profit_margin' THEN 5
          WHEN 'credit_rounding' THEN 6
        END
    `);
    
    console.table(config.rows.map(r => ({
      'Config': r.config_key,
      'Value': parseFloat(r.config_value).toFixed(2),
      'Description': r.description
    })));
    
    console.log('\n✅ Pricing system simplified!\n');
    console.log('📝 What changed:');
    console.log('   ✅ Removed complex/unused configs');
    console.log('   ✅ Kept only 6 essential configs');
    console.log('   ✅ Simplified calculation function');
    console.log('   ✅ Credit price IDR ready to update\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

simplifyPricing();




