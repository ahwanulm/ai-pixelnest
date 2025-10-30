/**
 * Create pricing_change_history table
 * 
 * This table tracks all pricing changes for audit purposes
 */

const { pool } = require('./database');

async function createPricingHistoryTable() {
  const client = await pool.connect();
  
  try {
    console.log('📋 Creating pricing_change_history table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS pricing_change_history (
        id SERIAL PRIMARY KEY,
        model_id VARCHAR(255) NOT NULL,
        model_name VARCHAR(255) NOT NULL,
        old_price DECIMAL(10, 4),
        new_price DECIMAL(10, 4) NOT NULL,
        old_credits DECIMAL(10, 2),
        new_credits DECIMAL(10, 2) NOT NULL,
        change_reason TEXT,
        changed_by VARCHAR(100) DEFAULT 'system',
        changed_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    console.log('✅ pricing_change_history table created');
    
    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_pricing_history_model 
      ON pricing_change_history(model_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_pricing_history_date 
      ON pricing_change_history(changed_at DESC);
    `);
    
    console.log('✅ pricing_change_history table created successfully');
    
    // Add comment
    await client.query(`
      COMMENT ON TABLE pricing_change_history IS 
      'Tracks all pricing changes for AI models - used for audit and history'
    `);
    
    console.log('✅ Table comments added');
    console.log('\n🎉 Pricing history table setup complete!');
    
  } catch (error) {
    console.error('❌ Error creating pricing history table:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  createPricingHistoryTable()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = createPricingHistoryTable;
