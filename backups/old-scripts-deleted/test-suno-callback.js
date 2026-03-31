/**
 * Test Script untuk Suno Callback
 * 
 * Script ini untuk:
 * 1. Test apakah callback endpoint bisa menerima data
 * 2. Simulate callback dari Suno/Grok API
 * 3. Debug masalah callback yang tidak sampai
 */

const axios = require('axios');

// ===== CONFIGURATION =====
const BASE_URL = process.env.BASE_URL || 'http://localhost:5005';
const CALLBACK_ENDPOINT = `${BASE_URL}/music/callback/suno`;

// Sample callback data (sesuai format Suno API)
const sampleCallback = {
  code: 200,
  msg: 'Success',
  data: {
    callbackType: 'first', // atau 'complete'
    task_id: 'test-task-123456',
    data: [
      {
        id: 'track-1',
        audio_url: 'https://example.com/audio1.mp3',
        video_url: 'https://example.com/video1.mp4',
        image_url: 'https://example.com/image1.jpg',
        title: 'Test Music Track 1',
        tags: 'electronic, upbeat',
        duration: 120,
        audio_length: 120,
        model_name: 'v5'
      },
      {
        id: 'track-2',
        audio_url: '', // Track 2 masih processing
        video_url: '',
        image_url: '',
        title: 'Test Music Track 2',
        tags: 'electronic, upbeat',
        duration: 120,
        audio_length: 120,
        model_name: 'v5'
      }
    ]
  }
};

async function testCallback() {
  console.log('\n🧪 Testing Suno Callback Endpoint\n');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log('📍 Target URL:', CALLBACK_ENDPOINT);
  console.log('📦 Payload:', JSON.stringify(sampleCallback, null, 2));
  console.log('\n───────────────────────────────────────────────────────────\n');
  
  try {
    console.log('🚀 Sending POST request...\n');
    
    const response = await axios.post(CALLBACK_ENDPOINT, sampleCallback, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Callback received successfully!\n');
    console.log('📊 Response Status:', response.status);
    console.log('📦 Response Data:', JSON.stringify(response.data, null, 2));
    
    console.log('\n✅ SUCCESS: Callback endpoint is working correctly!');
    console.log('\n💡 Next Steps:');
    console.log('   1. Check server logs untuk melihat callback processing');
    console.log('   2. Verify task_id ada di database (ai_generation_history)');
    console.log('   3. Check status di database berubah jadi "completed"');
    
  } catch (error) {
    console.error('\n❌ CALLBACK FAILED!\n');
    
    if (error.response) {
      console.error('📛 Server Error:');
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    } else if (error.request) {
      console.error('📛 No Response Received:');
      console.error('   Error:', error.message);
      console.error('\n💡 Kemungkinan masalah:');
      console.error('   - Server tidak running (npm start)');
      console.error('   - Port salah (check .env PORT)');
      console.error('   - Firewall blocking connection');
    } else {
      console.error('📛 Request Error:');
      console.error('   ', error.message);
    }
    
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Pastikan server running: npm start');
    console.error('   2. Check BASE_URL: ' + BASE_URL);
    console.error('   3. Test manual: curl -X POST ' + CALLBACK_ENDPOINT);
  }
  
  console.log('\n═══════════════════════════════════════════════════════════\n');
}

// ===== ADDITIONAL DIAGNOSTIC FUNCTIONS =====

async function checkServerHealth() {
  console.log('🏥 Checking server health...\n');
  
  try {
    const response = await axios.get(BASE_URL, { timeout: 5000 });
    console.log('✅ Server is running!');
    console.log('   Status:', response.status);
    return true;
  } catch (error) {
    console.error('❌ Server not reachable!');
    console.error('   Error:', error.message);
    return false;
  }
}

async function testWithRealTaskId(taskId) {
  console.log('\n🎯 Testing with real task ID:', taskId);
  
  const realCallback = {
    ...sampleCallback,
    data: {
      ...sampleCallback.data,
      task_id: taskId
    }
  };
  
  try {
    const response = await axios.post(CALLBACK_ENDPOINT, realCallback);
    console.log('✅ Callback sent with real task ID');
    console.log('   Response:', response.data);
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
}

// ===== MAIN EXECUTION =====

async function main() {
  const args = process.argv.slice(2);
  
  if (args[0] === '--health') {
    await checkServerHealth();
  } else if (args[0] === '--task-id' && args[1]) {
    await testWithRealTaskId(args[1]);
  } else if (args[0] === '--help') {
    console.log('\n📖 Usage:\n');
    console.log('   node test-suno-callback.js              # Test with sample data');
    console.log('   node test-suno-callback.js --health     # Check server health');
    console.log('   node test-suno-callback.js --task-id <id>  # Test with real task ID');
    console.log('   node test-suno-callback.js --help       # Show this help\n');
  } else {
    // Default: run full test
    const isHealthy = await checkServerHealth();
    
    if (isHealthy) {
      console.log('\n');
      await testCallback();
    } else {
      console.error('\n⚠️ Server not running. Start it first: npm start\n');
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { testCallback, checkServerHealth, testWithRealTaskId };

