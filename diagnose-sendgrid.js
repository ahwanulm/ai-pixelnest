#!/usr/bin/env node
/**
 * SendGrid Email Diagnosis Tool
 * Checks SendGrid configuration and tests email sending
 */

require('dotenv').config();
const sgMail = require('@sendgrid/mail');
const { pool } = require('./src/config/database');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, symbol, message) {
  console.log(`${colors[color]}${symbol}${colors.reset} ${message}`);
}

async function diagnoseSendGrid() {
  console.log('\n' + '='.repeat(60));
  console.log('📧 SENDGRID EMAIL DIAGNOSIS TOOL');
  console.log('='.repeat(60) + '\n');

  let hasErrors = false;

  // ========================================
  // 1. Check .env file
  // ========================================
  log('cyan', '🔍', 'Step 1: Checking .env configuration...\n');
  
  const envApiKey = process.env.SENDGRID_API_KEY;
  const emailFrom = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  
  if (envApiKey) {
    log('green', '✅', `SENDGRID_API_KEY found: ${envApiKey.substring(0, 10)}...`);
  } else {
    log('yellow', '⚠️', 'SENDGRID_API_KEY not found in .env (will check database)');
  }
  
  if (emailFrom) {
    log('green', '✅', `EMAIL_FROM: ${emailFrom}`);
  } else {
    log('red', '❌', 'EMAIL_FROM not set (using default: noreply@pixelnest.com)');
  }

  // ========================================
  // 2. Check Database Configuration
  // ========================================
  log('cyan', '\n🔍', 'Step 2: Checking database configuration...\n');
  
  let dbConfig = null;
  try {
    const result = await pool.query(
      'SELECT * FROM api_configs WHERE service_name = $1',
      ['SENDGRID']
    );
    
    if (result.rows.length > 0) {
      dbConfig = result.rows[0];
      log('green', '✅', 'SendGrid config found in database');
      console.log('   Service Name:', dbConfig.service_name);
      console.log('   API Key:', dbConfig.api_key ? `${dbConfig.api_key.substring(0, 10)}...***` : '❌ NOT SET');
      console.log('   Endpoint:', dbConfig.endpoint_url);
      console.log('   Is Active:', dbConfig.is_active ? '✅ Yes' : '❌ No');
      
      if (dbConfig.additional_config) {
        console.log('   Email From:', dbConfig.additional_config.email_from || 'Not set');
        console.log('   Email From Name:', dbConfig.additional_config.email_from_name || 'Not set');
      }
      
      // Check if active
      if (!dbConfig.is_active) {
        log('red', '❌', 'ERROR: SendGrid is configured but NOT ACTIVE in database!');
        hasErrors = true;
      }
      
      // Check if API key exists
      if (!dbConfig.api_key || dbConfig.api_key.trim() === '') {
        log('red', '❌', 'ERROR: SendGrid API Key is empty in database!');
        hasErrors = true;
      }
    } else {
      log('yellow', '⚠️', 'SendGrid config NOT found in database (will use .env)');
    }
  } catch (error) {
    log('red', '❌', `Database error: ${error.message}`);
    hasErrors = true;
  }

  // ========================================
  // 3. Validate SendGrid API Key
  // ========================================
  log('cyan', '\n🔍', 'Step 3: Validating SendGrid API Key...\n');
  
  const activeApiKey = dbConfig?.api_key || envApiKey;
  const activeEmailFrom = dbConfig?.additional_config?.email_from || emailFrom || 'noreply@pixelnest.com';
  
  if (!activeApiKey) {
    log('red', '❌', 'CRITICAL: No SendGrid API Key found anywhere!');
    log('yellow', '💡', 'Solution: Add SENDGRID_API_KEY to .env or configure in Admin Panel');
    hasErrors = true;
  } else {
    // Validate API key format
    if (activeApiKey.startsWith('SG.')) {
      log('green', '✅', 'API Key format is correct (starts with SG.)');
    } else {
      log('red', '❌', 'ERROR: Invalid API Key format (should start with SG.)');
      hasErrors = true;
    }
    
    // Check API key length
    if (activeApiKey.length > 60) {
      log('green', '✅', `API Key length looks good (${activeApiKey.length} chars)`);
    } else {
      log('yellow', '⚠️', `API Key seems short (${activeApiKey.length} chars) - might be invalid`);
    }
  }

  // ========================================
  // 4. Test SendGrid Connection
  // ========================================
  log('cyan', '\n🔍', 'Step 4: Testing SendGrid connection...\n');
  
  if (activeApiKey && activeApiKey.startsWith('SG.')) {
    try {
      sgMail.setApiKey(activeApiKey);
      log('green', '✅', 'SendGrid API initialized');
      
      // Try to send a test email
      console.log('\n📨 Sending test email...');
      console.log(`   From: ${activeEmailFrom}`);
      console.log(`   To: ${activeEmailFrom} (sending to self for testing)`);
      
      const msg = {
        to: activeEmailFrom,
        from: {
          email: activeEmailFrom,
          name: 'PixelNest Test'
        },
        subject: `🧪 SendGrid Test - ${new Date().toLocaleString('id-ID')}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
              .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .header { background: #10b981; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px; }
              .content { color: #333; line-height: 1.6; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
              .success { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">✅ SendGrid Test Berhasil!</h1>
              </div>
              <div class="content">
                <div class="success">
                  <strong>🎉 Selamat!</strong> SendGrid API Anda berfungsi dengan baik!
                </div>
                <p>Email ini dikirim dari sistem diagnosa SendGrid PixelNest.</p>
                <h3>📋 Informasi Test:</h3>
                <ul>
                  <li><strong>Waktu:</strong> ${new Date().toLocaleString('id-ID')}</li>
                  <li><strong>From Email:</strong> ${activeEmailFrom}</li>
                  <li><strong>Status:</strong> ✅ Berhasil terkirim</li>
                </ul>
                <h3>✅ Apa Artinya?</h3>
                <p>Jika Anda menerima email ini, berarti:</p>
                <ul>
                  <li>✅ SendGrid API Key valid</li>
                  <li>✅ Email sender (${activeEmailFrom}) terverifikasi</li>
                  <li>✅ Koneksi ke SendGrid berhasil</li>
                  <li>✅ Email deliverability berfungsi</li>
                </ul>
                <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <strong>⚠️ Catatan:</strong> Jika email ini masuk ke <strong>SPAM</strong>, pastikan Anda sudah melakukan <strong>Domain Authentication</strong> di SendGrid untuk meningkatkan deliverability.
                </div>
              </div>
              <div class="footer">
                <p><strong>PixelNest</strong> - AI Automation Platform</p>
                <p>© ${new Date().getFullYear()} PixelNest</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const response = await sgMail.send(msg);
      
      log('green', '✅', 'Test email sent successfully!');
      console.log(`   Status Code: ${response[0].statusCode}`);
      console.log(`   Message ID: ${response[0].headers['x-message-id'] || 'N/A'}`);
      
      log('green', '\n🎉', 'SUCCESS: SendGrid is working correctly!');
      log('cyan', '📬', `Check inbox of ${activeEmailFrom} for the test email`);
      log('yellow', '⚠️', 'If email not received, check SPAM folder');
      
    } catch (error) {
      log('red', '❌', 'ERROR: Failed to send test email');
      console.error('\n   Error Details:');
      console.error('   Message:', error.message);
      
      if (error.response) {
        console.error('   Status Code:', error.response.statusCode);
        console.error('   Response Body:', JSON.stringify(error.response.body, null, 2));
        
        // Specific error messages
        if (error.response.statusCode === 403) {
          log('red', '\n❌', 'PERMISSION DENIED: API Key tidak memiliki permission yang cukup');
          log('yellow', '💡', 'Solution: Buat API Key baru dengan "Mail Send" permission');
        } else if (error.response.statusCode === 401) {
          log('red', '\n❌', 'AUTHENTICATION FAILED: API Key tidak valid');
          log('yellow', '💡', 'Solution: Periksa kembali API Key Anda di SendGrid dashboard');
        } else if (error.response.body?.errors) {
          error.response.body.errors.forEach(err => {
            if (err.message.includes('does not match a verified')) {
              log('red', '\n❌', `EMAIL NOT VERIFIED: ${activeEmailFrom} belum diverifikasi di SendGrid`);
              log('yellow', '💡', 'Solution: Verify sender email di SendGrid → Settings → Sender Authentication');
            }
          });
        }
      }
      
      hasErrors = true;
    }
  } else {
    log('red', '❌', 'Skipping connection test - no valid API key');
    hasErrors = true;
  }

  // ========================================
  // 5. Summary & Recommendations
  // ========================================
  console.log('\n' + '='.repeat(60));
  log('cyan', '📊', 'DIAGNOSIS SUMMARY');
  console.log('='.repeat(60) + '\n');

  if (hasErrors) {
    log('red', '❌', 'ISSUES FOUND - Email aktivasi tidak akan terkirim!\n');
    
    console.log('🔧 LANGKAH PERBAIKAN:\n');
    
    if (!activeApiKey) {
      console.log('1️⃣  DAPATKAN SENDGRID API KEY:');
      console.log('   → Daftar/Login di: https://app.sendgrid.com/');
      console.log('   → Settings → API Keys → Create API Key');
      console.log('   → Copy API Key (mulai dengan SG.xxx...)\n');
    }
    
    if (activeApiKey && !activeApiKey.startsWith('SG.')) {
      console.log('2️⃣  API KEY FORMAT SALAH:');
      console.log('   → API Key harus dimulai dengan "SG."');
      console.log('   → Buat API Key baru di SendGrid\n');
    }
    
    console.log('3️⃣  KONFIGURASI SENDGRID:');
    console.log('   Pilih salah satu metode:');
    console.log('   ');
    console.log('   A. Via Admin Panel (Recommended):');
    console.log('      → Login ke /admin');
    console.log('      → API Configs → SENDGRID');
    console.log('      → Masukkan API Key & Email From');
    console.log('      → Save & Test\n');
    console.log('   B. Via .env file:');
    console.log('      → Tambahkan ke .env:');
    console.log('        SENDGRID_API_KEY=SG.your-api-key-here');
    console.log('        EMAIL_FROM=noreply@yourdomain.com');
    console.log('      → Restart aplikasi\n');
    
    console.log('4️⃣  VERIFY SENDER EMAIL:');
    console.log('   → SendGrid → Settings → Sender Authentication');
    console.log('   → Verify a Single Sender');
    console.log('   → Masukkan email yang sama dengan EMAIL_FROM');
    console.log('   → Cek email inbox dan klik link verifikasi\n');
    
    console.log('5️⃣  TEST LAGI:');
    console.log('   → Jalankan: node diagnose-sendgrid.js');
    console.log('   → Atau register user baru di aplikasi\n');
    
  } else {
    log('green', '✅', 'NO CRITICAL ISSUES FOUND!\n');
    
    console.log('📋 CHECKLIST:\n');
    log('green', '✅', 'SendGrid API Key configured');
    log('green', '✅', 'Email sender configured');
    log('green', '✅', 'SendGrid connection successful');
    log('green', '✅', 'Test email sent\n');
    
    console.log('🎯 NEXT STEPS:\n');
    console.log('1. Check email inbox untuk test email');
    console.log('2. Jika masuk ke SPAM, setup Domain Authentication');
    console.log('3. Test user registration di aplikasi');
    console.log('4. Monitor logs saat kirim email aktivasi\n');
  }

  console.log('📚 RESOURCES:');
  console.log('   • SendGrid Dashboard: https://app.sendgrid.com/');
  console.log('   • API Keys: https://app.sendgrid.com/settings/api_keys');
  console.log('   • Sender Authentication: https://app.sendgrid.com/settings/sender_auth');
  console.log('   • Activity Feed: https://app.sendgrid.com/email_activity');
  console.log('   • Documentation: SENDGRID_SETUP.md\n');

  console.log('='.repeat(60) + '\n');
}

// Run diagnosis
diagnoseSendGrid()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });

