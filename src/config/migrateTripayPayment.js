const { pool } = require('./database');

/**
 * Migration untuk Tripay Payment Integration
 * Membuat tabel dan konfigurasi yang diperlukan untuk payment gateway Tripay
 */

async function migrateTripayPayment() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting Tripay Payment Migration...');
    
    await client.query('BEGIN');

    // 1. Membuat tabel payment_transactions
    console.log('📦 Creating payment_transactions table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS payment_transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        
        -- Tripay Transaction Info
        reference VARCHAR(100) UNIQUE NOT NULL,
        merchant_ref VARCHAR(100) UNIQUE,
        payment_method VARCHAR(50) NOT NULL,
        payment_name VARCHAR(100) NOT NULL,
        
        -- Amount Info
        amount INTEGER NOT NULL,
        fee_merchant INTEGER DEFAULT 0,
        fee_customer INTEGER DEFAULT 0,
        total_fee INTEGER DEFAULT 0,
        amount_received INTEGER NOT NULL,
        
        -- Credits Info
        credits_amount INTEGER NOT NULL,
        credit_price_idr INTEGER NOT NULL,
        
        -- Payment Details
        pay_code VARCHAR(100),
        pay_url TEXT,
        checkout_url TEXT,
        qr_url TEXT,
        qr_string TEXT,
        
        -- Status & Timestamps
        status VARCHAR(50) DEFAULT 'UNPAID',
        paid_at TIMESTAMP,
        expired_time TIMESTAMP,
        
        -- Instructions (JSONB untuk fleksibilitas)
        payment_instructions JSONB,
        
        -- Callback & Metadata
        callback_received BOOLEAN DEFAULT false,
        callback_data JSONB,
        metadata JSONB,
        
        -- Audit
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Membuat indexes untuk performance
    console.log('📇 Creating indexes...');
    await client.query(`
      -- Payment Transactions indexes
      CREATE INDEX IF NOT EXISTS idx_payment_user_id ON payment_transactions(user_id);
      CREATE INDEX IF NOT EXISTS idx_payment_reference ON payment_transactions(reference);
      CREATE INDEX IF NOT EXISTS idx_payment_status ON payment_transactions(status);
      CREATE INDEX IF NOT EXISTS idx_payment_created ON payment_transactions(created_at DESC);
    `);

    // 3. Membuat tabel payment_channels untuk menyimpan channel yang tersedia
    console.log('📦 Creating payment_channels table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS payment_channels (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        group_channel VARCHAR(50) NOT NULL,
        
        -- Fee Info
        fee_merchant_flat INTEGER DEFAULT 0,
        fee_merchant_percent DECIMAL(5,2) DEFAULT 0,
        fee_customer_flat INTEGER DEFAULT 0,
        fee_customer_percent DECIMAL(5,2) DEFAULT 0,
        
        -- Limits
        minimum_amount INTEGER DEFAULT 10000,
        maximum_amount INTEGER DEFAULT 0,
        
        -- Icons & Display
        icon_url TEXT,
        is_active BOOLEAN DEFAULT true,
        
        -- Settings
        settings JSONB,
        
        -- Audit
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3b. Create payment_channels indexes
    console.log('📇 Creating payment_channels indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_payment_channels_code ON payment_channels(code);
      CREATE INDEX IF NOT EXISTS idx_payment_channels_active ON payment_channels(is_active) WHERE is_active = true;
      CREATE INDEX IF NOT EXISTS idx_payment_channels_group ON payment_channels(group_channel);
    `);

    // 4. Insert atau update Tripay API config
    console.log('🔑 Setting up Tripay API configuration...');
    await client.query(`
      INSERT INTO api_configs (
        service_name, 
        api_key, 
        api_secret,
        endpoint_url, 
        is_active, 
        rate_limit,
        additional_config
      ) VALUES (
        'TRIPAY',
        $1,
        $2,
        'https://tripay.co.id/api-sandbox',
        true,
        100,
        $3
      )
      ON CONFLICT (service_name) 
      DO UPDATE SET
        api_key = COALESCE(EXCLUDED.api_key, api_configs.api_key),
        api_secret = COALESCE(EXCLUDED.api_secret, api_configs.api_secret),
        endpoint_url = COALESCE(EXCLUDED.endpoint_url, api_configs.endpoint_url),
        additional_config = COALESCE(EXCLUDED.additional_config, api_configs.additional_config),
        updated_at = CURRENT_TIMESTAMP;
    `, [
      process.env.TRIPAY_API_KEY || 'DEV-gvVnLRQQG1drVQq3oCDm5DNmhCf6ZdwmsMc5S3BV',
      process.env.TRIPAY_PRIVATE_KEY || 'UPr4R-iTY5y-Mhz7I-BfTUS-34dRC',
      JSON.stringify({
        merchant_code: process.env.TRIPAY_MERCHANT_CODE || 'T41400',
        merchant_name: 'Merchant Sandbox',
        mode: 'sandbox', // 'sandbox' or 'production'
        callback_url: process.env.TRIPAY_CALLBACK_URL || 'http://localhost:5005/api/payment/callback'
      })
    ]);

    // 5. Membuat function untuk update payment status
    console.log('⚙️ Creating payment status update function...');
    await client.query(`
      CREATE OR REPLACE FUNCTION update_payment_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 6. Membuat trigger untuk auto-update timestamp
    await client.query(`
      DROP TRIGGER IF EXISTS payment_transactions_update_timestamp ON payment_transactions;
      CREATE TRIGGER payment_transactions_update_timestamp
        BEFORE UPDATE ON payment_transactions
        FOR EACH ROW
        EXECUTE FUNCTION update_payment_timestamp();
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS payment_channels_update_timestamp ON payment_channels;
      CREATE TRIGGER payment_channels_update_timestamp
        BEFORE UPDATE ON payment_channels
        FOR EACH ROW
        EXECUTE FUNCTION update_payment_timestamp();
    `);

    await client.query('COMMIT');
    
    console.log('✅ Tripay Payment Migration completed successfully!');
    console.log('');
    console.log('📋 Created tables:');
    console.log('  - payment_transactions: Menyimpan semua transaksi payment');
    console.log('  - payment_channels: Menyimpan channel payment yang tersedia');
    console.log('');
    console.log('🔑 API Configuration:');
    console.log('  - Service: TRIPAY');
    console.log('  - Endpoint: https://tripay.co.id/api-sandbox');
    console.log('  - Status: Active');
    console.log('');
    console.log('💡 Next Steps:');
    console.log('  1. Update .env dengan TRIPAY_API_KEY, TRIPAY_PRIVATE_KEY, TRIPAY_MERCHANT_CODE');
    console.log('  2. Run sync payment channels: npm run sync:tripay-channels');
    console.log('  3. Test payment flow dari user dashboard');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
if (require.main === module) {
  migrateTripayPayment().catch(console.error);
}

module.exports = migrateTripayPayment;

