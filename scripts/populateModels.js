#!/usr/bin/env node

/**
 * Populate AI Models from Curated List
 * 
 * This script populates the ai_models table with curated models from falAiModelsComplete.js
 * Run: node scripts/populateModels.js
 */

const { pool } = require('../src/config/database');
const FAL_AI_MODELS = require('../src/data/falAiModelsComplete');

async function populateModels() {
  console.log('\n🚀 Starting AI Models Population...\n');
  console.log(`📚 Found ${FAL_AI_MODELS.length} curated models`);
  
  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  try {
    for (const model of FAL_AI_MODELS) {
      try {
        // Check if model exists
        const existing = await pool.query(
          'SELECT id, name, fal_price FROM ai_models WHERE model_id = $1',
          [model.id]
        );

        // Calculate credits from FAL price
        const calculateCredits = (falPrice, type) => {
          if (!falPrice || falPrice <= 0) return 1;
          
          // Simple formula: Credits = FAL_Price × 20 (with 100% markup)
          const baseCredits = falPrice * 20;
          
          // Round to nearest 0.5
          return Math.max(0.5, Math.round(baseCredits * 2) / 2);
        };

        const credits = calculateCredits(model.fal_price, model.type);

        // Map category properly
        const categoryMap = {
          'image': 'Text-to-Image',
          'video': 'Text-to-Video',
          'audio': 'Text-to-Audio'
        };
        const category = categoryMap[model.type] || 'Text-to-Image';

        if (existing.rows.length > 0) {
          // Update existing model
          await pool.query(`
            UPDATE ai_models SET
              name = $1,
              provider = $2,
              description = $3,
              category = $4,
              type = $5,
              fal_price = $6,
              cost = $7,
              pricing_type = $8,
              speed = $9,
              quality = $10,
              trending = $11,
              is_active = true,
              fal_verified = true,
              updated_at = CURRENT_TIMESTAMP
            WHERE model_id = $12
          `, [
            model.name,
            model.provider,
            model.description || `High-quality ${model.type} generation with ${model.name}`,
            category,
            model.type,
            model.fal_price,
            credits,
            model.pricing_type || 'flat',
            model.speed || 'medium',
            model.quality || 'high',
            model.trending || false,
            model.id
          ]);
          
          console.log(`✅ Updated: ${model.name} (${model.type}) - ${credits} credits`);
          updated++;
        } else {
          // Insert new model
          await pool.query(`
            INSERT INTO ai_models (
              model_id, name, provider, description, category, type,
              fal_price, cost, pricing_type, speed, quality, trending,
              is_active, is_custom, fal_verified
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, false, true)
          `, [
            model.id,
            model.name,
            model.provider,
            model.description || `High-quality ${model.type} generation with ${model.name}`,
            category,
            model.type,
            model.fal_price,
            credits,
            model.pricing_type || 'flat',
            model.speed || 'medium',
            model.quality || 'high',
            model.trending || false
          ]);
          
          console.log(`➕ Inserted: ${model.name} (${model.type}) - ${credits} credits`);
          inserted++;
        }
      } catch (modelError) {
        console.error(`❌ Error processing ${model.name}:`, modelError.message);
        errors++;
      }
    }

    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('📊 Population Summary:');
    console.log(`   ➕ Inserted: ${inserted} models`);
    console.log(`   ✅ Updated: ${updated} models`);
    console.log(`   ⏭️  Skipped: ${skipped} models`);
    console.log(`   ❌ Errors: ${errors} models`);
    console.log(`   📦 Total: ${inserted + updated + skipped} models`);
    console.log('═'.repeat(60));

    // Show stats
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE type = 'image') as image_count,
        COUNT(*) FILTER (WHERE type = 'video') as video_count,
        COUNT(*) FILTER (WHERE type = 'audio') as audio_count,
        COUNT(*) FILTER (WHERE is_active = true) as active_count
      FROM ai_models
    `);

    const { total, image_count, video_count, audio_count, active_count } = stats.rows[0];
    
    console.log('\n📈 Database Stats:');
    console.log(`   Total Models: ${total}`);
    console.log(`   Image Models: ${image_count}`);
    console.log(`   Video Models: ${video_count}`);
    console.log(`   Audio Models: ${audio_count}`);
    console.log(`   Active Models: ${active_count}`);
    console.log('\n✅ Models population completed!\n');

  } catch (error) {
    console.error('\n❌ Population failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  populateModels()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { populateModels };

