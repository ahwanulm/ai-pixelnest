const { pool } = require('./database');

const createAdminTables = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Creating admin tables...');

    // Update users table to add admin role and credits
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user',
      ADD COLUMN IF NOT EXISTS credits DECIMAL(10, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(100),
      ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP;
    `);

    // Create promo_codes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS promo_codes (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        code_type VARCHAR(20) DEFAULT 'promo' CHECK (code_type IN ('promo', 'claim')),
        discount_type VARCHAR(20),
        discount_value DECIMAL(10, 2),
        credit_amount INTEGER DEFAULT 0,
        credits_bonus INTEGER DEFAULT 0,
        single_use BOOLEAN DEFAULT false,
        min_purchase DECIMAL(10, 2) DEFAULT 0,
        max_uses INTEGER,
        usage_limit INTEGER,
        uses_count INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        valid_from TIMESTAMP,
        valid_until TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add missing columns if upgrading
    await client.query(`
      ALTER TABLE promo_codes 
      ADD COLUMN IF NOT EXISTS code_type VARCHAR(20) DEFAULT 'promo',
      ADD COLUMN IF NOT EXISTS credit_amount INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS single_use BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS min_purchase DECIMAL(10, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS usage_limit INTEGER;
    `);

    // Create api_configs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS api_configs (
        id SERIAL PRIMARY KEY,
        service_name VARCHAR(100) UNIQUE NOT NULL,
        api_key TEXT,
        api_secret TEXT,
        endpoint_url TEXT,
        is_active BOOLEAN DEFAULT true,
        rate_limit INTEGER,
        additional_config JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create notifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        target_users VARCHAR(50) DEFAULT 'all',
        user_id INTEGER REFERENCES users(id),
        is_read BOOLEAN DEFAULT false,
        priority VARCHAR(20) DEFAULT 'normal',
        action_url VARCHAR(500),
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create user_activity_logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_activity_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        activity_type VARCHAR(100) NOT NULL,
        description TEXT,
        metadata JSONB,
        ip_address VARCHAR(50),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create credit_transactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS credit_transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(10, 2) NOT NULL,
        transaction_type VARCHAR(50) NOT NULL,
        description TEXT,
        balance_after DECIMAL(10, 2) NOT NULL,
        admin_id INTEGER REFERENCES users(id),
        promo_code_id INTEGER REFERENCES promo_codes(id),
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create ai_generation_history table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_generation_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        generation_type VARCHAR(50) NOT NULL,
        model_used VARCHAR(100),
        prompt TEXT,
        result_url TEXT,
        credits_used INTEGER DEFAULT 1,
        status VARCHAR(50) DEFAULT 'completed',
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create admin_settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_settings (
        id SERIAL PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT,
        setting_type VARCHAR(50) DEFAULT 'string',
        description TEXT,
        updated_by INTEGER REFERENCES users(id),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert default API configs (read from .env if available)
    const PORT = process.env.PORT || 5005;
    const HOST = process.env.HOST || 'localhost';
    const PROTOCOL = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const defaultCallbackUrl = `${PROTOCOL}://${HOST}:${PORT}/auth/google/callback`;
    
    const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
    const googleCallbackUrl = process.env.GOOGLE_CALLBACK_URL || defaultCallbackUrl;
    
    const sendgridApiKey = process.env.SENDGRID_API_KEY || '';
    const emailFrom = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@pixelnest.com';
    
    const sunoApiKey = process.env.SUNO_API_KEY || '';
    
    await client.query(`
      INSERT INTO api_configs (service_name, api_key, api_secret, endpoint_url, is_active, rate_limit, additional_config) VALUES
      ('FAL_AI', $1, null, 'https://fal.ai/api', true, 100, '{"models": ["flux/dev", "flux-pro", "flux-realism"]}'),
      ('OPENAI', $2, null, 'https://api.openai.com/v1', true, 60, '{"models": ["gpt-4", "gpt-3.5-turbo", "dall-e-3"]}'),
      ('REPLICATE', $3, null, 'https://api.replicate.com/v1', true, 50, '{"models": ["stable-diffusion", "llama-2"]}'),
      ('GOOGLE_OAUTH', $4, $5, $6, true, null, '{"scopes": ["profile", "email"]}'),
      ('SENDGRID', $7, null, 'https://api.sendgrid.com/v3', true, 100, $8),
      ('SUNO', $9, null, 'https://api.sunoapi.org', false, 100, '{"default_model":"v5","models":["v3_5","v4","v4_5","v4_5PLUS","v5"],"supported_features":["music_generation","lyrics_generation","music_extension","wav_conversion","vocal_removal"],"callback_url":"https://pixelnest.app/music/callback/suno"}')
      ON CONFLICT (service_name) DO UPDATE SET
        api_key = COALESCE(EXCLUDED.api_key, api_configs.api_key),
        api_secret = COALESCE(EXCLUDED.api_secret, api_configs.api_secret),
        endpoint_url = COALESCE(EXCLUDED.endpoint_url, api_configs.endpoint_url),
        additional_config = COALESCE(EXCLUDED.additional_config, api_configs.additional_config);
    `, [
      process.env.FAL_KEY || '',
      process.env.OPENAI_API_KEY || '',
      process.env.REPLICATE_API_TOKEN || '',
      googleClientId,
      googleClientSecret,
      googleCallbackUrl,
      sendgridApiKey,
      JSON.stringify({ 
        email_from: emailFrom,
        email_from_name: 'PixelNest'
      }),
      sunoApiKey
    ]);

    // Insert default admin settings
    await client.query(`
      INSERT INTO admin_settings (setting_key, setting_value, setting_type, description) VALUES
      ('site_name', 'PixelNest AI', 'string', 'Website name'),
      ('site_maintenance', 'false', 'boolean', 'Maintenance mode status'),
      ('default_credits', '100', 'number', 'Default credits for new users'),
      ('credit_per_image', '1', 'number', 'Credits per image generation'),
      ('credit_per_video', '5', 'number', 'Credits per video generation'),
      ('max_daily_generations', '50', 'number', 'Max generations per day per user'),
      ('enable_registration', 'true', 'boolean', 'Allow new user registration'),
      ('enable_google_auth', 'true', 'boolean', 'Enable Google OAuth login')
      ON CONFLICT (setting_key) DO NOTHING;
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
      CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at);
      CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
      CREATE INDEX IF NOT EXISTS idx_ai_generation_history_user_id ON ai_generation_history(user_id);
      CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
    `);

    console.log('✅ Admin tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating admin tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run the admin database initialization
if (require.main === module) {
  createAdminTables()
    .then(() => {
      console.log('🎉 Admin database initialization completed!');
      pool.end();
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Admin database initialization failed:', error);
      pool.end();
      process.exit(1);
    });
}

module.exports = { createAdminTables };

