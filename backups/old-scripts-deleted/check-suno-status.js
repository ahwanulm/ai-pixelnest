/**
 * Script untuk check status Suno music generations
 * Berguna untuk debugging stuck/processing generations
 */

const { pool } = require('./src/config/database');

async function checkSunoStatus() {
  console.log('\n🔍 Checking Suno Music Generation Status\n');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  try {
    // Get all audio generations
    const query = `
      SELECT 
        id,
        user_id,
        status,
        sub_type,
        result_url,
        metadata->>'task_id' as task_id,
        metadata->>'taskId' as taskId_alt,
        metadata->>'total_tracks' as total_tracks,
        cost_credits,
        created_at,
        completed_at,
        EXTRACT(EPOCH FROM (NOW() - created_at)) / 60 as minutes_ago
      FROM ai_generation_history 
      WHERE generation_type = 'audio'
      ORDER BY created_at DESC 
      LIMIT 20
    `;
    
    const result = await pool.query(query);
    
    if (result.rows.length === 0) {
      console.log('ℹ️  No audio generations found\n');
      return;
    }
    
    console.log(`📊 Found ${result.rows.length} audio generation(s):\n`);
    
    // Group by status
    const processing = result.rows.filter(r => r.status === 'processing');
    const completed = result.rows.filter(r => r.status === 'completed');
    const failed = result.rows.filter(r => r.status === 'failed');
    
    console.log(`✅ Completed: ${completed.length}`);
    console.log(`⏳ Processing: ${processing.length}`);
    console.log(`❌ Failed: ${failed.length}\n`);
    
    console.log('───────────────────────────────────────────────────────────\n');
    
    // Show processing items (potential stuck items)
    if (processing.length > 0) {
      console.log('⏳ PROCESSING ITEMS (Potential Issues):\n');
      
      processing.forEach((item, idx) => {
        console.log(`${idx + 1}. Generation ID: ${item.id}`);
        console.log(`   User ID: ${item.user_id}`);
        console.log(`   Sub Type: ${item.sub_type || 'N/A'}`);
        console.log(`   Task ID: ${item.task_id || item.taskid_alt || 'N/A'}`);
        console.log(`   Created: ${Math.round(item.minutes_ago)} minutes ago`);
        console.log(`   Cost: ${item.cost_credits} credits`);
        
        // Warning for stuck items (>5 minutes)
        if (item.minutes_ago > 5) {
          console.log(`   ⚠️  STUCK! (>5 min old, still processing)`);
          console.log(`   💡 Callback might not have arrived`);
        }
        
        console.log('');
      });
      
      console.log('───────────────────────────────────────────────────────────\n');
    }
    
    // Show recent completed items
    if (completed.length > 0) {
      console.log('✅ RECENT COMPLETED ITEMS:\n');
      
      completed.slice(0, 5).forEach((item, idx) => {
        console.log(`${idx + 1}. Generation ID: ${item.id}`);
        console.log(`   Audio URL: ${item.result_url ? 'Yes ✅' : 'Missing ❌'}`);
        console.log(`   Tracks: ${item.total_tracks || 'N/A'}`);
        console.log(`   Completed: ${Math.round(item.minutes_ago)} minutes ago\n`);
      });
      
      console.log('───────────────────────────────────────────────────────────\n');
    }
    
    // Recommendations
    if (processing.length > 0) {
      const stuckItems = processing.filter(p => p.minutes_ago > 5);
      
      if (stuckItems.length > 0) {
        console.log('🔧 RECOMMENDATIONS:\n');
        console.log('Stuck generations detected! Possible causes:\n');
        console.log('1. ❌ Callback URL incorrect or unreachable');
        console.log('   → Check Admin Panel → API Configs → SUNO → Callback URL');
        console.log('   → Verify same URL in Grok/Suno API dashboard\n');
        
        console.log('2. ❌ Callback not sent by Suno API');
        console.log('   → Check Grok/Suno API dashboard for task status');
        console.log('   → Verify task completed successfully\n');
        
        console.log('3. ❌ Callback blocked by firewall');
        console.log('   → Test: npm run test:callback');
        console.log('   → Check server logs for callback receipt\n');
        
        console.log('4. 🔧 Manual Fix (if music is actually ready):');
        stuckItems.forEach(item => {
          console.log(`   → UPDATE ai_generation_history`);
          console.log(`     SET status = 'completed', result_url = '<audio_url>', completed_at = NOW()`);
          console.log(`     WHERE id = ${item.id};\n`);
        });
      }
    }
    
    console.log('═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

// Additional function to show callback URL config
async function checkCallbackConfig() {
  console.log('\n🔍 Checking Suno Callback Configuration\n');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  try {
    const query = `
      SELECT 
        service_name,
        endpoint_url,
        is_active,
        additional_config->>'callback_url' as callback_url,
        api_key IS NOT NULL as has_api_key
      FROM api_configs 
      WHERE service_name = 'SUNO'
    `;
    
    const result = await pool.query(query);
    
    if (result.rows.length === 0) {
      console.log('❌ SUNO config not found in database!\n');
      console.log('Fix: Run npm run setup-db or add SUNO manually\n');
    } else {
      const config = result.rows[0];
      
      console.log('📋 SUNO API Configuration:\n');
      console.log(`   Service: ${config.service_name}`);
      console.log(`   Active: ${config.is_active ? '✅ Yes' : '❌ No'}`);
      console.log(`   Has API Key: ${config.has_api_key ? '✅ Yes' : '❌ No'}`);
      console.log(`   Endpoint: ${config.endpoint_url}`);
      console.log(`   Callback URL: ${config.callback_url || 'Not set ❌'}\n`);
      
      if (!config.is_active) {
        console.log('⚠️  WARNING: SUNO is not active!');
        console.log('   → Enable in Admin Panel → API Configs\n');
      }
      
      if (!config.has_api_key) {
        console.log('⚠️  WARNING: API key not set!');
        console.log('   → Add in Admin Panel → API Configs → SUNO\n');
      }
      
      if (!config.callback_url) {
        console.log('⚠️  WARNING: Callback URL not set!');
        console.log('   → Add in Admin Panel → API Configs → SUNO');
        console.log('   → Should be: https://your-domain.com/music/callback/suno\n');
      }
      
      if (config.callback_url && config.callback_url.includes('localhost')) {
        console.log('⚠️  WARNING: Callback URL uses localhost!');
        console.log('   → This will NOT work! Suno API cannot reach localhost');
        console.log('   → Use ngrok for development or public URL for production\n');
      }
    }
    
    console.log('═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Main
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--config')) {
    await checkCallbackConfig();
  } else if (args.includes('--help')) {
    console.log('\n📖 Usage:\n');
    console.log('   node check-suno-status.js           # Check generation status');
    console.log('   node check-suno-status.js --config  # Check callback config');
    console.log('   node check-suno-status.js --help    # Show this help\n');
  } else {
    await checkSunoStatus();
    
    // Also show config if there are stuck items
    const result = await pool.query(`
      SELECT COUNT(*) as count 
      FROM ai_generation_history 
      WHERE generation_type = 'audio' 
      AND status = 'processing'
      AND created_at < NOW() - INTERVAL '5 minutes'
    `);
    
    if (result.rows[0].count > 0) {
      await checkCallbackConfig();
    }
  }
  
  await pool.end();
}

if (require.main === module) {
  main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { checkSunoStatus, checkCallbackConfig };

