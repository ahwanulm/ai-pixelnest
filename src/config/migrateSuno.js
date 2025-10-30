const { pool } = require('./database');

async function migrateSunoApi() {
  const client = await pool.connect();
  
  try {
    console.log('🎵 Starting Suno API migration...');
    
    // Check if Suno API config already exists
    const checkQuery = `
      SELECT id FROM api_configs WHERE service_name = 'SUNO'
    `;
    const checkResult = await client.query(checkQuery);
    
    if (checkResult.rows.length > 0) {
      console.log('✅ Suno API config already exists');
      return;
    }
    
    // Insert Suno API config
    const insertQuery = `
      INSERT INTO api_configs (
        service_name,
        api_key,
        endpoint_url,
        is_active,
        rate_limit,
        additional_config,
        created_at,
        updated_at
      ) VALUES (
        'SUNO',
        '',
        'https://api.sunoapi.org',
        false,
        100,
        '{"default_model":"v5","models":["v3_5","v4","v4_5","v4_5PLUS","v5"],"supported_features":["music_generation","lyrics_generation","music_extension","wav_conversion","vocal_removal"],"callback_url":"https://pixelnest.app/music/callback/suno"}'::jsonb,
        NOW(),
        NOW()
      )
      ON CONFLICT (service_name) DO NOTHING
    `;
    
    await client.query(insertQuery);
    console.log('✅ Suno API config created successfully');
    
  } catch (error) {
    console.error('❌ Error during Suno API migration:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateSunoApi()
    .then(() => {
      console.log('✅ Suno API migration completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = migrateSunoApi;

