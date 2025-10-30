const { pool } = require('./database');

async function migrateFalAi() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting fal.ai migration...');
    
    await client.query('BEGIN');
    
    // 1. Add FAL_AI to api_configs if not exists
    console.log('📝 Adding FAL_AI configuration...');
    const checkConfig = await client.query(
      "SELECT * FROM api_configs WHERE service_name = 'FAL_AI'"
    );
    
    if (checkConfig.rows.length === 0) {
      await client.query(`
        INSERT INTO api_configs (service_name, api_key, endpoint_url, is_active, rate_limit)
        VALUES ('FAL_AI', '', 'https://rest.alpha.fal.ai', false, 100)
      `);
      console.log('✅ FAL_AI configuration added');
    } else {
      console.log('ℹ️  FAL_AI configuration already exists');
    }
    
    // 2. Create ai_generation_history table if not exists
    console.log('📝 Creating ai_generation_history table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_generation_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        generation_type VARCHAR(50) NOT NULL,
        sub_type VARCHAR(50) NOT NULL,
        prompt TEXT NOT NULL,
        result_url TEXT,
        settings JSONB,
        credits_cost INTEGER NOT NULL DEFAULT 1,
        status VARCHAR(50) DEFAULT 'pending',
        error_message TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP,
        job_id VARCHAR(255),
        started_at TIMESTAMP DEFAULT NOW(),
        progress INTEGER DEFAULT 0,
        viewed_at TIMESTAMP
      );
    `);
    console.log('✅ ai_generation_history table created');
    
    // 2a. Add missing columns to existing tables (for upgrade path)
    console.log('📝 Adding missing columns (if needed)...');
    await client.query(`
      ALTER TABLE ai_generation_history 
      ADD COLUMN IF NOT EXISTS job_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS started_at TIMESTAMP DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMP;
    `);
    console.log('✅ Missing columns added (if any)');
    
    // 2a. Verify table was created
    const checkTable = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'ai_generation_history'
    `);
    console.log(`ℹ️  Table has ${checkTable.rows.length} columns`);
    
    // 3. Create indexes for better performance
    console.log('📝 Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_generation_user_id ON ai_generation_history(user_id);
      CREATE INDEX IF NOT EXISTS idx_generation_type ON ai_generation_history(generation_type);
      CREATE INDEX IF NOT EXISTS idx_generation_status ON ai_generation_history(status);
      CREATE INDEX IF NOT EXISTS idx_generation_created ON ai_generation_history(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_generation_job_id ON ai_generation_history(job_id);
      CREATE INDEX IF NOT EXISTS idx_generation_user_status ON ai_generation_history(user_id, status) WHERE status IN ('pending', 'processing');
      CREATE INDEX IF NOT EXISTS idx_generation_viewed ON ai_generation_history(user_id, viewed_at) WHERE viewed_at IS NULL;
    `);
    console.log('✅ Indexes created');
    
    // 4. Add generation_count to users table if not exists
    console.log('📝 Adding generation_count to users table...');
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='users' AND column_name='generation_count'
    `);
    
    if (checkColumn.rows.length === 0) {
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN generation_count INTEGER DEFAULT 0
      `);
      console.log('✅ generation_count column added');
    } else {
      console.log('ℹ️  generation_count column already exists');
    }
    
    // 5. Create generation_stats view for analytics
    console.log('📝 Creating generation_stats view...');
    await client.query(`
      CREATE OR REPLACE VIEW generation_stats AS
      SELECT 
        DATE(created_at) as date,
        generation_type,
        sub_type,
        COUNT(*) as total_generations,
        SUM(credits_cost) as total_credits_used,
        COUNT(DISTINCT user_id) as unique_users,
        AVG(credits_cost) as avg_credits_per_generation
      FROM ai_generation_history
      WHERE status = 'completed'
      GROUP BY DATE(created_at), generation_type, sub_type
      ORDER BY date DESC;
    `);
    console.log('✅ generation_stats view created');
    
    // 6. Create function to update user generation count
    console.log('📝 Creating trigger function...');
    await client.query(`
      CREATE OR REPLACE FUNCTION update_user_generation_count()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.status = 'completed' THEN
          UPDATE users 
          SET generation_count = generation_count + 1 
          WHERE id = NEW.user_id;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('✅ Trigger function created');
    
    // 7. Create trigger to auto-update generation count
    console.log('📝 Creating trigger...');
    await client.query(`
      DROP TRIGGER IF EXISTS trigger_update_generation_count ON ai_generation_history;
      
      CREATE TRIGGER trigger_update_generation_count
      AFTER INSERT OR UPDATE ON ai_generation_history
      FOR EACH ROW
      WHEN (NEW.status = 'completed')
      EXECUTE FUNCTION update_user_generation_count();
    `);
    console.log('✅ Trigger created');
    
    await client.query('COMMIT');
    
    console.log('\n🎉 fal.ai migration completed successfully!\n');
    console.log('Next steps:');
    console.log('1. Go to /admin/api-configs');
    console.log('2. Configure FAL_AI API key');
    console.log('3. Test generation in dashboard\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    pool.end();
  }
}

// Run migration
migrateFalAi()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });

