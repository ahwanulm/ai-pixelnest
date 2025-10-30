const { pool } = require('./database');

async function migrateReferralSystem() {
  const client = await pool.connect();
  
  try {
    console.log('🎁 Creating referral system tables...');
    
    // 1. Add referral_code column to users table
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE,
      ADD COLUMN IF NOT EXISTS referred_by INTEGER REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS referral_earnings DECIMAL(10, 2) DEFAULT 0.00
    `);
    console.log('✅ Updated users table with referral fields');
    
    // 2. Create referral_transactions table (untuk track setiap transaksi referral)
    await client.query(`
      CREATE TABLE IF NOT EXISTS referral_transactions (
        id SERIAL PRIMARY KEY,
        referrer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        referred_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        transaction_type VARCHAR(50) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        description TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Created referral_transactions table');
    
    // 3. Create payout_requests table
    await client.query(`
      CREATE TABLE IF NOT EXISTS payout_requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(10, 2) NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        payment_details JSONB NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        admin_notes TEXT,
        processed_by INTEGER REFERENCES users(id),
        processed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Created payout_requests table');
    
    // 4. Create payout_settings table (untuk konfigurasi payout)
    await client.query(`
      CREATE TABLE IF NOT EXISTS payout_settings (
        id SERIAL PRIMARY KEY,
        minimum_payout DECIMAL(10, 2) DEFAULT 50000.00,
        payout_cooldown_days INTEGER DEFAULT 7,
        commission_rate DECIMAL(5, 2) DEFAULT 10.00,
        commission_per_signup DECIMAL(10, 2) DEFAULT 5000.00,
        commission_per_purchase DECIMAL(5, 2) DEFAULT 5.00,
        is_active BOOLEAN DEFAULT true,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Created payout_settings table');
    
    // 5. Insert default payout settings
    await client.query(`
      INSERT INTO payout_settings (
        minimum_payout, 
        payout_cooldown_days, 
        commission_rate,
        commission_per_signup,
        commission_per_purchase
      )
      SELECT 25000.00, 7, 10.00, 5000.00, 5.00
      WHERE NOT EXISTS (SELECT 1 FROM payout_settings LIMIT 1)
    `);
    console.log('✅ Inserted default payout settings');
    
    // 6. Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_referral_code ON users(referral_code);
      CREATE INDEX IF NOT EXISTS idx_referred_by ON users(referred_by);
      CREATE INDEX IF NOT EXISTS idx_referral_transactions_referrer ON referral_transactions(referrer_id);
      CREATE INDEX IF NOT EXISTS idx_payout_requests_user ON payout_requests(user_id);
      CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON payout_requests(status);
    `);
    console.log('✅ Created indexes');
    
    // 7. Generate referral codes for existing users
    const existingUsers = await client.query(`
      SELECT id FROM users WHERE referral_code IS NULL
    `);
    
    for (const user of existingUsers.rows) {
      const referralCode = generateReferralCode();
      await client.query(`
        UPDATE users SET referral_code = $1 WHERE id = $2
      `, [referralCode, user.id]);
    }
    console.log(`✅ Generated referral codes for ${existingUsers.rows.length} existing users`);
    
    console.log('🎉 Referral system migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Helper function to generate unique referral code
function generateReferralCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Run if called directly
if (require.main === module) {
  migrateReferralSystem()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateReferralSystem };

