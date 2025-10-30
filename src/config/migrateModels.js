/**
 * Database Migration: AI Models Management
 * 
 * Creates tables for managing custom AI models
 * Admin can add/remove models from fal.ai
 */

const { pool } = require('./database');

async function migrateModelsManagement() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting AI Models Management migration...\n');
    
    await client.query('BEGIN');
    
    // ============================================
    // 1. Create ai_models table
    // ============================================
    console.log('📊 Creating ai_models table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_models (
        id SERIAL PRIMARY KEY,
        model_id VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        provider VARCHAR(255),
        description TEXT,
        category VARCHAR(100) NOT NULL,
        type VARCHAR(50) NOT NULL, -- 'image' or 'video'
        trending BOOLEAN DEFAULT false,
        viral BOOLEAN DEFAULT false,
        speed VARCHAR(50),
        quality VARCHAR(50),
        max_duration INTEGER, -- for video models (in seconds)
        cost INTEGER DEFAULT 1,
        is_active BOOLEAN DEFAULT true,
        is_custom BOOLEAN DEFAULT false, -- if added by admin
        metadata JSONB, -- extra data like supported features
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        added_by INTEGER REFERENCES users(id)
      )
    `);
    
    console.log('✓ ai_models table created');
    
    // ============================================
    // 2. Create indexes for performance
    // ============================================
    console.log('📊 Creating indexes...');
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_models_type ON ai_models(type);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_models_category ON ai_models(category);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_models_trending ON ai_models(trending);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_models_viral ON ai_models(viral);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_models_active ON ai_models(is_active);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_models_custom ON ai_models(is_custom);
    `);
    
    console.log('✓ Indexes created');
    
    // ============================================
    // 3. Create updated_at trigger
    // ============================================
    console.log('📊 Creating trigger for updated_at...');
    
    await client.query(`
      CREATE OR REPLACE FUNCTION update_ai_models_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    await client.query(`
      DROP TRIGGER IF EXISTS trigger_update_ai_models_updated_at ON ai_models;
    `);
    
    await client.query(`
      CREATE TRIGGER trigger_update_ai_models_updated_at
      BEFORE UPDATE ON ai_models
      FOR EACH ROW
      EXECUTE FUNCTION update_ai_models_updated_at();
    `);
    
    console.log('✓ Trigger created');
    
    // ============================================
    // 4. Insert default models from falAiModels.js
    // ============================================
    console.log('📊 Inserting default models...');
    
    const { FAL_AI_MODELS } = require('../data/falAiModels');
    
    let insertedCount = 0;
    
    // Insert image models
    for (const model of FAL_AI_MODELS.image) {
      const result = await client.query(`
        INSERT INTO ai_models (
          model_id, name, provider, description, category, type,
          trending, viral, speed, quality, cost, is_custom
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (model_id) DO NOTHING
        RETURNING id
      `, [
        model.id,
        model.name,
        model.provider,
        model.description,
        model.category,
        'image',
        model.trending || false,
        model.viral || false,
        model.speed,
        model.quality,
        model.cost || 1,
        false
      ]);
      
      if (result.rowCount > 0) insertedCount++;
    }
    
    // Insert video models
    for (const model of FAL_AI_MODELS.video) {
      const result = await client.query(`
        INSERT INTO ai_models (
          model_id, name, provider, description, category, type,
          trending, viral, speed, quality, max_duration, cost, is_custom
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (model_id) DO NOTHING
        RETURNING id
      `, [
        model.id,
        model.name,
        model.provider,
        model.description,
        model.category,
        'video',
        model.trending || false,
        model.viral || false,
        model.speed,
        model.quality,
        model.maxDuration,
        model.cost || 1,
        false
      ]);
      
      if (result.rowCount > 0) insertedCount++;
    }
    
    console.log(`✓ Inserted ${insertedCount} default models`);
    
    // ============================================
    // 5. Create models_stats view
    // ============================================
    console.log('📊 Creating models_stats view...');
    
    await client.query(`
      CREATE OR REPLACE VIEW models_stats AS
      SELECT
        COUNT(*) as total_models,
        COUNT(*) FILTER (WHERE type = 'image') as image_models,
        COUNT(*) FILTER (WHERE type = 'video') as video_models,
        COUNT(*) FILTER (WHERE trending = true) as trending_models,
        COUNT(*) FILTER (WHERE viral = true) as viral_models,
        COUNT(*) FILTER (WHERE is_custom = true) as custom_models,
        COUNT(*) FILTER (WHERE is_active = true) as active_models
      FROM ai_models;
    `);
    
    console.log('✓ models_stats view created');
    
    await client.query('COMMIT');
    
    console.log('\n✅ AI Models Management migration completed successfully!');
    console.log('\n📊 Stats:');
    
    const stats = await pool.query('SELECT * FROM models_stats');
    console.log(`   - Total Models: ${stats.rows[0].total_models}`);
    console.log(`   - Image Models: ${stats.rows[0].image_models}`);
    console.log(`   - Video Models: ${stats.rows[0].video_models}`);
    console.log(`   - Trending: ${stats.rows[0].trending_models}`);
    console.log(`   - Viral: ${stats.rows[0].viral_models}`);
    console.log(`   - Custom: ${stats.rows[0].custom_models}`);
    console.log(`   - Active: ${stats.rows[0].active_models}`);
    
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
  migrateModelsManagement()
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

module.exports = { migrateModelsManagement };

