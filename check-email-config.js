#!/usr/bin/env node
/**
 * Quick Email Configuration Check
 * 
 * Jalankan script ini untuk cek apakah konfigurasi email sudah benar
 * Run: node check-email-config.js
 */

require('dotenv').config();

console.log('═══════════════════════════════════════════════════');
console.log('🔍 PixelNest Email Configuration Check');
console.log('═══════════════════════════════════════════════════\n');

let hasError = false;

// Check 1: Environment Variables
console.log('1️⃣  Checking Environment Variables...\n');

const emailUser = process.env.EMAIL_USER;
const emailPassword = process.env.EMAIL_PASSWORD;
const baseUrl = process.env.BASE_URL;

if (!emailUser) {
  console.log('   ❌ EMAIL_USER: NOT SET');
  hasError = true;
} else {
  console.log(`   ✅ EMAIL_USER: ${emailUser}`);
}

if (!emailPassword) {
  console.log('   ❌ EMAIL_PASSWORD: NOT SET');
  hasError = true;
} else {
  const length = emailPassword.length;
  console.log(`   ✅ EMAIL_PASSWORD: Set (length: ${length} characters)`);
  
  // Gmail App Password biasanya 16 karakter
  if (length !== 16 && length !== 19) { // 19 jika ada spasi
    console.log('   ⚠️  Warning: Gmail App Password biasanya 16 karakter');
    console.log('      Pastikan Anda menggunakan App Password, bukan password Gmail biasa!');
  }
}

if (!baseUrl) {
  console.log('   ⚠️  BASE_URL: NOT SET (akan use default)');
} else {
  console.log(`   ✅ BASE_URL: ${baseUrl}`);
}

console.log('');

// Check 2: File .env exists
console.log('2️⃣  Checking .env File...\n');

const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env');

if (!fs.existsSync(envPath)) {
  console.log('   ❌ .env file NOT FOUND!');
  console.log('      Location: ' + envPath);
  hasError = true;
} else {
  console.log('   ✅ .env file exists');
  console.log('      Location: ' + envPath);
  
  // Check permissions
  const stats = fs.statSync(envPath);
  const mode = (stats.mode & parseInt('777', 8)).toString(8);
  console.log(`      Permissions: ${mode}`);
  
  if (mode !== '600') {
    console.log('      ⚠️  Warning: Recommended permissions adalah 600');
    console.log('         Run: chmod 600 .env');
  }
}

console.log('');

// Check 3: Email Service File
console.log('3️⃣  Checking Email Service...\n');

const emailServicePath = path.join(process.cwd(), 'src', 'services', 'emailService.js');

if (!fs.existsSync(emailServicePath)) {
  console.log('   ❌ emailService.js NOT FOUND!');
  hasError = true;
} else {
  console.log('   ✅ emailService.js exists');
  
  try {
    const emailService = require(emailServicePath);
    console.log('   ✅ Email service loaded successfully');
  } catch (error) {
    console.log('   ❌ Failed to load email service:');
    console.log('      ' + error.message);
    hasError = true;
  }
}

console.log('');

// Summary
console.log('═══════════════════════════════════════════════════');
console.log('📊 Summary');
console.log('═══════════════════════════════════════════════════\n');

if (hasError) {
  console.log('❌ CONFIGURATION INCOMPLETE!\n');
  console.log('📝 Action Required:\n');
  
  if (!emailUser || !emailPassword) {
    console.log('1. Create Gmail App Password:');
    console.log('   https://myaccount.google.com/apppasswords\n');
    
    console.log('2. Create/Update .env file:');
    console.log('   Copy from .env.example if available\n');
    
    console.log('3. Add to .env:');
    console.log('   EMAIL_USER=your-email@gmail.com');
    console.log('   EMAIL_PASSWORD=your-app-password\n');
    
    console.log('4. Restart server:');
    console.log('   pm2 restart all\n');
  }
  
  console.log('📖 Detailed guide: CARA_FIX_EMAIL_DEPLOY.md');
  console.log('');
  process.exit(1);
} else {
  console.log('✅ ALL CHECKS PASSED!\n');
  console.log('Your email configuration looks good.\n');
  console.log('🧪 Next Steps:\n');
  console.log('1. Test email connection:');
  console.log('   node test-email-connection.js\n');
  console.log('2. Test user registration on your website\n');
  console.log('3. Check if activation email is received\n');
  process.exit(0);
}

