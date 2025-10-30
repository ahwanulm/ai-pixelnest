const { pool } = require('../config/database');
const sunoModels = require('../data/sunoModels');

/**
 * Populate Suno AI Models into Database
 * Run this script to add all Suno models to ai_models table
 * 
 * Usage: node src/scripts/populateSunoModels.js
 */

async function populateSunoModels() {
  console.log('🎵 Starting Suno Models Population...\n');
  
  try {
    let added = 0;
    let updated = 0;
    let skipped = 0;

    for (const model of sunoModels) {
      try {
        // Check if model already exists
        const existingQuery = `
          SELECT id FROM ai_models WHERE model_id = $1
        `;
        const existing = await pool.query(existingQuery, [model.model_id]);

        if (existing.rows.length > 0) {
          // Update existing model
          const updateQuery = `
            UPDATE ai_models SET
              name = $1,
              provider = $2,
              description = $3,
              category = $4,
              type = $5,
              trending = $6,
              viral = $7,
              speed = $8,
              quality = $9,
              max_duration = $10,
              cost = $11,
              fal_price = $12,
              pricing_type = $13,
              is_active = $14,
              is_custom = $15,
              pricing_structure = $16,
              metadata = $17,
              updated_at = NOW()
            WHERE model_id = $18
            RETURNING id, name
          `;

          const updateValues = [
            model.name,
            model.provider,
            model.description,
            model.category,
            model.type,
            model.trending,
            model.viral,
            model.speed,
            model.quality,
            model.max_duration,
            model.cost,
            model.fal_price,
            model.pricing_type,
            model.is_active,
            model.is_custom,
            model.pricing_structure ? JSON.stringify(model.pricing_structure) : null,
            JSON.stringify(model.metadata),
            model.model_id
          ];

          const result = await pool.query(updateQuery, updateValues);
          console.log(`✅ Updated: ${result.rows[0].name}`);
          updated++;
        } else {
          // Insert new model
          const insertQuery = `
            INSERT INTO ai_models (
              model_id, name, provider, description, category, type,
              trending, viral, speed, quality, max_duration, cost,
              fal_price, pricing_type, is_active, is_custom,
              pricing_structure, metadata, created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW()
            )
            RETURNING id, name
          `;

          const insertValues = [
            model.model_id,
            model.name,
            model.provider,
            model.description,
            model.category,
            model.type,
            model.trending,
            model.viral,
            model.speed,
            model.quality,
            model.max_duration,
            model.cost,
            model.fal_price,
            model.pricing_type,
            model.is_active,
            model.is_custom,
            model.pricing_structure ? JSON.stringify(model.pricing_structure) : null,
            JSON.stringify(model.metadata)
          ];

          const result = await pool.query(insertQuery, insertValues);
          console.log(`✨ Added: ${result.rows[0].name}`);
          added++;
        }
      } catch (error) {
        console.error(`❌ Error with model ${model.model_id}:`, error.message);
        skipped++;
      }
    }

    console.log('\n📊 Population Summary:');
    console.log(`✨ Added: ${added} models`);
    console.log(`✅ Updated: ${updated} models`);
    console.log(`⏭️  Skipped: ${skipped} models`);
    console.log(`📦 Total: ${sunoModels.length} models processed\n`);

    console.log('🎉 Suno models population completed successfully!');
    console.log('🔗 Access them at: /admin/models\n');

  } catch (error) {
    console.error('❌ Fatal error during population:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  populateSunoModels()
    .then(() => {
      console.log('✅ Script completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = populateSunoModels;

