/**
 * Database Migration: Dynamic Pricing System
 * 
 * Creates pricing configuration for automatic credit calculation
 * based on fal.ai prices with configurable profit margin
 */

const { pool } = require('./database');

async function migratePricingSystem() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting Pricing System migration...\n');
    
    await client.query('BEGIN');
    
    // ============================================
    // 1. Add fal_price column to ai_models
    // ============================================
    console.log('📊 Adding fal_price column to ai_models...');
    
    await client.query(`
      ALTER TABLE ai_models 
      ADD COLUMN IF NOT EXISTS fal_price DECIMAL(10, 4) DEFAULT 0.0400;
    `);
    
    await client.query(`
      COMMENT ON COLUMN ai_models.fal_price IS 'Price in USD from fal.ai';
    `);
    
    console.log('✓ fal_price column added');
    
    // ============================================
    // 2. Create pricing_config table
    // ============================================
    console.log('📊 Creating pricing_config table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS pricing_config (
        id SERIAL PRIMARY KEY,
        config_key VARCHAR(100) UNIQUE NOT NULL,
        config_value DECIMAL(10, 4) NOT NULL,
        description TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by INTEGER REFERENCES users(id)
      )
    `);
    
    console.log('✓ pricing_config table created');
    
    // ============================================
    // 3. Insert default pricing configuration
    // ============================================
    console.log('📊 Inserting default pricing config...');
    
    await client.query(`
      INSERT INTO pricing_config (config_key, config_value, description)
      VALUES 
        ('profit_margin_percent', 20.00, 'Profit margin percentage on top of base price'),
        ('base_credit_usd', 0.05, 'Base USD amount that equals 1 credit (before margin)'),
        ('minimum_credits', 0.5, 'Minimum credits that can be charged'),
        ('credit_rounding', 0.5, 'Round credits to nearest 0.5')
      ON CONFLICT (config_key) DO NOTHING;
    `);
    
    console.log('✓ Default pricing config inserted');
    
    // ============================================
    // 4. Create pricing calculation function
    // ============================================
    console.log('📊 Creating pricing calculation function...');
    
    await client.query(`
      CREATE OR REPLACE FUNCTION calculate_credits(fal_price_usd DECIMAL)
      RETURNS DECIMAL AS $$
      DECLARE
        base_credit_usd DECIMAL;
        profit_margin DECIMAL;
        credit_rounding DECIMAL;
        min_credits DECIMAL;
        calculated_credits DECIMAL;
        final_credits DECIMAL;
      BEGIN
        -- Get config values
        SELECT config_value INTO base_credit_usd 
        FROM pricing_config WHERE config_key = 'base_credit_usd';
        
        SELECT config_value INTO profit_margin 
        FROM pricing_config WHERE config_key = 'profit_margin_percent';
        
        SELECT config_value INTO credit_rounding 
        FROM pricing_config WHERE config_key = 'credit_rounding';
        
        SELECT config_value INTO min_credits 
        FROM pricing_config WHERE config_key = 'minimum_credits';
        
        -- Calculate base credits
        calculated_credits := fal_price_usd / base_credit_usd;
        
        -- Apply profit margin
        calculated_credits := calculated_credits * (1 + (profit_margin / 100));
        
        -- Round to nearest rounding value
        final_credits := ROUND(calculated_credits / credit_rounding) * credit_rounding;
        
        -- Ensure minimum
        IF final_credits < min_credits THEN
          final_credits := min_credits;
        END IF;
        
        RETURN final_credits;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('✓ Pricing calculation function created');
    
    // ============================================
    // 5. Update existing models with fal prices
    // ============================================
    console.log('📊 Updating models with fal.ai prices...');
    
    // Price data from fal.ai (in USD)
    const modelPrices = {
      // Image models - typical prices
      'fal-ai/flux-pro/v1.1': 0.055,
      'fal-ai/flux-pro': 0.055,
      'fal-ai/flux-dev': 0.025,
      'fal-ai/flux-realism': 0.055,
      'fal-ai/flux-schnell': 0.015,
      'fal-ai/imagen-4': 0.08,
      'fal-ai/qwen-image': 0.04,
      'fal-ai/dreamina': 0.045,
      'fal-ai/ideogram-v2': 0.08,
      'fal-ai/recraft-v3': 0.05,
      'fal-ai/stable-diffusion-xl': 0.03,
      'fal-ai/playground-v25': 0.04,
      'fal-ai/aura-flow': 0.02,
      'fal-ai/kolors': 0.035,
      'fal-ai/flux-pro/inpainting': 0.055,
      'fal-ai/clarity-upscaler': 0.10,
      'fal-ai/imageutils/rembg': 0.02,
      'fal-ai/face-to-sticker': 0.03,
      'fal-ai/nano-banan': 0.015,
      
      // Video models - higher prices
      'fal-ai/google/veo-3.1': 0.30,
      'fal-ai/google/veo-3': 0.25,
      'fal-ai/openai/sora-2': 0.50,
      'fal-ai/seaweedfs/seedance': 0.20,
      'fal-ai/kling-video/v1.6/pro/text-to-video': 0.28,
      'fal-ai/kling-video/v1/standard/text-to-video': 0.20,
      'fal-ai/kling-video/v1/standard/image-to-video': 0.25,
      'fal-ai/minimax-video': 0.18,
      'fal-ai/runway-gen3': 0.35,
      'fal-ai/luma-dream-machine': 0.22,
      'fal-ai/pika-labs': 0.15,
      'fal-ai/haiper-video': 0.12,
      'fal-ai/stable-video-diffusion': 0.10
    };
    
    let updatedCount = 0;
    for (const [modelId, price] of Object.entries(modelPrices)) {
      const result = await client.query(`
        UPDATE ai_models 
        SET fal_price = $1,
            cost = calculate_credits($1)
        WHERE model_id = $2
        RETURNING id
      `, [price, modelId]);
      
      if (result.rowCount > 0) updatedCount++;
    }
    
    console.log(`✓ Updated ${updatedCount} models with prices`);
    
    // ============================================
    // 6. Create pricing view for easy reference
    // ============================================
    console.log('📊 Creating pricing_view...');
    
    // Drop existing view first to allow column changes
    await client.query(`DROP VIEW IF EXISTS model_pricing;`);
    
    await client.query(`
      CREATE VIEW model_pricing AS
      SELECT 
        id,
        model_id,
        name,
        provider,
        type,
        max_duration,
        fal_price as usd_price,
        cost as credits,
        ROUND(cost * (SELECT config_value FROM pricing_config WHERE config_key = 'base_credit_usd'), 4) as our_price_usd,
        ROUND(
          ((cost * (SELECT config_value FROM pricing_config WHERE config_key = 'base_credit_usd')) - fal_price) / fal_price * 100, 
          2
        ) as profit_margin_actual,
        is_active
      FROM ai_models
      WHERE fal_price > 0
      ORDER BY type, fal_price DESC;
    `);
    
    console.log('✓ model_pricing view created');
    
    // ============================================
    // 7. Create trigger to auto-update credits
    // ============================================
    console.log('📊 Creating auto-update trigger...');
    
    await client.query(`
      CREATE OR REPLACE FUNCTION auto_calculate_credits()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.fal_price IS NOT NULL AND NEW.fal_price > 0 THEN
          NEW.cost := calculate_credits(NEW.fal_price);
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    await client.query(`
      DROP TRIGGER IF EXISTS trigger_auto_calculate_credits ON ai_models;
    `);
    
    await client.query(`
      CREATE TRIGGER trigger_auto_calculate_credits
      BEFORE INSERT OR UPDATE OF fal_price ON ai_models
      FOR EACH ROW
      EXECUTE FUNCTION auto_calculate_credits();
    `);
    
    console.log('✓ Auto-update trigger created');
    
    await client.query('COMMIT');
    
    console.log('\n✅ Pricing System migration completed successfully!');
    
    // Show sample calculations
    console.log('\n📊 Sample Price Calculations:');
    const samples = await client.query(`
      SELECT 
        name,
        type,
        fal_price as "USD Price",
        cost as "Credits",
        ROUND(cost * 0.05, 4) as "Our USD"
      FROM ai_models
      WHERE fal_price > 0
      ORDER BY fal_price DESC
      LIMIT 10;
    `);
    
    console.table(samples.rows);
    
    // Show profit margin
    const config = await client.query(`
      SELECT * FROM pricing_config ORDER BY config_key;
    `);
    
    console.log('\n⚙️ Pricing Configuration:');
    console.table(config.rows);
    
    return { success: true };
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    return { success: false, error: error.message };
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  migratePricingSystem()
    .then(result => {
      if (result.success) {
        console.log('\n✅ Migration script completed successfully!');
        process.exit(0);
      } else {
        console.error('\n❌ Migration failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n❌ Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { migratePricingSystem };

