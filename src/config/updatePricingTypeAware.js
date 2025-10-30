const { pool } = require('./database');

async function updatePricingTypeAware() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🚀 Updating Pricing System to be Type-Aware...\n');
    
    // ============================================
    // 0. DROP view, ALTER cost column, RECREATE view
    // ============================================
    console.log('📊 Preparing cost column for decimals...');
    
    // Drop dependent view
    await client.query(`DROP VIEW IF EXISTS model_pricing CASCADE`);
    console.log('  ✓ Dropped model_pricing view');
    
    // Alter column type
    await client.query(`
      ALTER TABLE ai_models 
      ALTER COLUMN cost TYPE DECIMAL(10,1)
    `);
    console.log('  ✓ cost column is now DECIMAL(10,1)\n');
    
    // ============================================
    // 1. Add type-specific pricing configs
    // ============================================
    console.log('📊 Adding type-specific pricing configs...');
    
    const configs = [
      // IMAGE configs
      ['image_profit_margin', '20.00', 'Profit margin for IMAGE models (%)'],
      ['image_base_credit_usd', '0.05', 'Base USD for IMAGE = 1 credit'],
      ['image_minimum_credits', '0.50', 'Minimum credits for IMAGE'],
      ['image_cheap_threshold', '0.01', 'If IMAGE < $0.01, use minimum'],
      
      // VIDEO configs  
      ['video_profit_margin', '25.00', 'Profit margin for VIDEO models (%)'],
      ['video_base_credit_usd', '0.08', 'Base USD for VIDEO = 1 credit'],
      ['video_minimum_credits', '1.00', 'Minimum credits for VIDEO'],
      ['video_cheap_threshold', '0.05', 'If VIDEO < $0.05, use minimum'],
      
      // Global
      ['credit_rounding', '0.50', 'Round to nearest 0.5']
    ];
    
    for (const [key, value, desc] of configs) {
      await client.query(`
        INSERT INTO pricing_config (config_key, config_value, description)
        VALUES ($1, $2, $3)
        ON CONFLICT (config_key) 
        DO UPDATE SET config_value = $2, description = $3
      `, [key, value, desc]);
      console.log(`  ✓ ${key}: ${value}`);
    }
    
    // ============================================
    // 2. Create type-aware pricing function
    // ============================================
    console.log('\n📊 Creating type-aware pricing function...');
    
    await client.query(`
      CREATE OR REPLACE FUNCTION calculate_credits_typed(
        fal_price_usd DECIMAL, 
        model_type VARCHAR(10)
      )
      RETURNS DECIMAL AS $$
      DECLARE
        profit_margin DECIMAL;
        base_credit_usd DECIMAL;
        min_credits DECIMAL;
        cheap_threshold DECIMAL;
        credit_rounding DECIMAL;
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
        
        -- If very cheap, use minimum (profitable but cheap for users)
        IF fal_price_usd < cheap_threshold THEN
          RETURN min_credits;
        END IF;
        
        -- Calculate with profit margin
        calculated := (fal_price_usd / base_credit_usd) * (1 + (profit_margin / 100));
        
        -- Round to nearest 0.5
        final_credits := ROUND(calculated / credit_rounding) * credit_rounding;
        
        -- Ensure minimum
        IF final_credits < min_credits THEN
          final_credits := min_credits;
        END IF;
        
        RETURN final_credits;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('  ✓ Function created: calculate_credits_typed(price, type)');
    
    // ============================================
    // 3. Update all models with type-aware pricing
    // ============================================
    console.log('\n📊 Updating all models with type-aware pricing...');
    
    const models = await client.query(`
      SELECT id, name, type, fal_price, model_id
      FROM ai_models
      WHERE fal_price IS NOT NULL AND fal_price > 0
      ORDER BY type, fal_price DESC
    `);
    
    let imageCount = 0;
    let videoCount = 0;
    
    for (const model of models.rows) {
      const newCost = await client.query(`
        SELECT calculate_credits_typed($1, $2) as cost
      `, [model.fal_price, model.type]);
      
      await client.query(`
        UPDATE ai_models
        SET cost = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [newCost.rows[0].cost, model.id]);
      
      if (model.type === 'image') {
        imageCount++;
      } else {
        videoCount++;
      }
      
      console.log(`  ✓ ${model.type.toUpperCase().padEnd(5)} | ${model.name.padEnd(30)} | $${parseFloat(model.fal_price).toFixed(4)} → ${parseFloat(newCost.rows[0].cost).toFixed(1)} credits`);
    }
    
    // ============================================
    // 4. Recreate model_pricing view
    // ============================================
    console.log('\n📊 Recreating model_pricing view...');
    
    await client.query(`
      CREATE OR REPLACE VIEW model_pricing AS
      SELECT 
        id,
        model_id,
        name,
        provider,
        type,
        max_duration,
        fal_price as usd_price,
        cost as credits,
        ROUND(cost * 0.05, 4) as our_price_usd,
        ROUND(
          ((cost * 0.05) - fal_price) / fal_price * 100, 
          2
        ) as profit_margin_actual,
        is_active
      FROM ai_models
      WHERE fal_price > 0
      ORDER BY type, fal_price DESC;
    `);
    
    console.log('  ✓ View recreated');
    
    // ============================================
    // 5. Create trigger for auto-update
    // ============================================
    console.log('\n📊 Creating auto-update trigger...');
    
    await client.query(`
      CREATE OR REPLACE FUNCTION auto_calculate_typed()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.fal_price IS NOT NULL AND NEW.fal_price > 0 AND NEW.type IS NOT NULL THEN
          NEW.cost := calculate_credits_typed(NEW.fal_price, NEW.type);
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    await client.query(`
      DROP TRIGGER IF EXISTS trigger_auto_calculate_typed ON ai_models;
    `);
    
    await client.query(`
      CREATE TRIGGER trigger_auto_calculate_typed
      BEFORE INSERT OR UPDATE ON ai_models
      FOR EACH ROW
      EXECUTE FUNCTION auto_calculate_typed();
    `);
    
    console.log('  ✓ Trigger created');
    
    await client.query('COMMIT');
    
    // ============================================
    // 5. Display summary
    // ============================================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ TYPE-AWARE PRICING SYSTEM UPDATED!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log(`📊 Updated: ${imageCount} image models, ${videoCount} video models\n`);
    
    // Show pricing examples
    const examples = await client.query(`
      SELECT 
        name, 
        type, 
        fal_price, 
        cost,
        ROUND(cost * 0.05, 4) as our_price_usd
      FROM ai_models
      WHERE fal_price IS NOT NULL AND fal_price > 0
      ORDER BY type, fal_price DESC
      LIMIT 10
    `);
    
    console.log('📋 PRICING EXAMPLES:\n');
    console.table(examples.rows.map(r => ({
      name: r.name,
      type: r.type.toUpperCase(),
      'FAL Price': `$${parseFloat(r.fal_price).toFixed(4)}`,
      'Credits': parseFloat(r.cost).toFixed(1),
      'Our Price': `$${parseFloat(r.our_price_usd).toFixed(4)}`
    })));
    
    // Show config
    const configRows = await client.query(`
      SELECT config_key, config_value, description
      FROM pricing_config
      WHERE config_key LIKE 'image_%' OR config_key LIKE 'video_%' OR config_key = 'credit_rounding'
      ORDER BY config_key
    `);
    
    console.log('\n⚙️ PRICING CONFIGURATION:\n');
    console.table(configRows.rows.map(r => ({
      key: r.config_key,
      value: parseFloat(r.config_value).toFixed(2),
      description: r.description
    })));
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Update failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  updatePricingTypeAware()
    .then(() => {
      console.log('\n✅ Update completed successfully!');
      process.exit(0);
    })
    .catch(err => {
      console.error('\n❌ Update failed:', err);
      process.exit(1);
    });
}

module.exports = { updatePricingTypeAware };

