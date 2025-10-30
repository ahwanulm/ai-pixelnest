const { pool } = require('../config/database');
const falAiBrowser = require('../services/falAiBrowser');

/**
 * Sync all fal.ai models to database
 * This ensures we have all 600+ models from fal.ai
 */
async function syncFalModels() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting fal.ai models sync...\n');
    
    // Get all models from falAiBrowser
    const allModels = falAiBrowser.getAllModels();
    
    console.log(`📊 Found ${allModels.length} models in falAiBrowser`);
    
    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    
    for (const model of allModels) {
      try {
        // Check if model exists
        const existing = await client.query(
          'SELECT id, cost, fal_price FROM ai_models WHERE model_id = $1',
          [model.id]
        );
        
        if (existing.rows.length > 0) {
          // Update existing model
          await client.query(`
            UPDATE ai_models
            SET 
              name = $1,
              provider = $2,
              description = $3,
              type = $4,
              category = $5,
              quality = $6,
              speed = $7,
              trending = $8,
              viral = $9,
              max_duration = $10,
              fal_price = $11,
              cost = COALESCE(
                (SELECT calculate_credits_typed($11, $4)),
                cost
              ),
              updated_at = CURRENT_TIMESTAMP
            WHERE model_id = $12
          `, [
            model.name,
            model.provider,
            model.description,
            model.type,
            model.category,
            model.quality,
            model.speed,
            model.trending || false,
            model.viral || false,
            model.maxDuration || null,
            model.fal_price || 0,
            model.id
          ]);
          updated++;
          console.log(`  ✓ Updated: ${model.name}`);
        } else {
          // Insert new model
          const cost = model.fal_price 
            ? (await client.query(
                'SELECT calculate_credits_typed($1, $2) as cost',
                [model.fal_price, model.type]
              )).rows[0].cost
            : (model.cost || 1);
          
          await client.query(`
            INSERT INTO ai_models (
              model_id, name, provider, description, type, category,
              quality, speed, trending, viral, max_duration, fal_price, cost, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true)
          `, [
            model.id,
            model.name,
            model.provider,
            model.description,
            model.type,
            model.category,
            model.quality,
            model.speed,
            model.trending || false,
            model.viral || false,
            model.maxDuration || null,
            model.fal_price || 0,
            cost
          ]);
          inserted++;
          console.log(`  ➕ Inserted: ${model.name}`);
        }
      } catch (error) {
        console.error(`  ❌ Error syncing ${model.name}:`, error.message);
        skipped++;
      }
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ SYNC COMPLETED!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`📊 Results:`);
    console.log(`  ➕ Inserted: ${inserted} new models`);
    console.log(`  ✓ Updated:  ${updated} existing models`);
    console.log(`  ⏭ Skipped:  ${skipped} models (errors)`);
    console.log(`  📦 Total:    ${allModels.length} models processed`);
    
    // Show summary by type
    const summary = await client.query(`
      SELECT 
        type,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE viral = true) as viral_count,
        COUNT(*) FILTER (WHERE trending = true) as trending_count,
        COUNT(*) FILTER (WHERE is_active = true) as active_count
      FROM ai_models
      GROUP BY type
      ORDER BY type
    `);
    
    console.log('\n📋 Database Summary:');
    console.table(summary.rows);
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  syncFalModels()
    .then(() => {
      console.log('\n✅ Sync completed successfully!');
      process.exit(0);
    })
    .catch(err => {
      console.error('\n❌ Sync failed:', err);
      process.exit(1);
    });
}

module.exports = { syncFalModels };
