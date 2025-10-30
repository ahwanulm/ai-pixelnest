# 📧 Email Configuration - Pure .env Setup

## ✅ Simplified Email Configuration

Email configuration sekarang **100% menggunakan `.env` file** - tidak lagi tersimpan di database atau admin panel. Lebih aman dan lebih sederhana!

---

## 🚀 Quick Setup (5 menit)

### Step 1: Buat Gmail App Password

1. **Buka**: https://myaccount.google.com/apppasswords
2. **Sign in** dengan akun Gmail Anda
3. **Buat app password**:
   - App name: "PixelNest" 
   - Klik **Generate**
4. **Salin 16-character password** (format: `xxxx xxxx xxxx xxxx`)

---

### Step 2: Edit File `.env`

Buka file `.env` di root project (jika belum ada, copy dari `.env.example`):

```bash
# Jika .env belum ada:
cp .env.example .env
```

Edit `.env` dan tambahkan:

```env
# Email Configuration (REQUIRED for activation emails)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
```

**Contoh lengkap `.env`:**

```env
# Application
PORT=5005
NODE_ENV=development
BASE_URL=http://localhost:5005

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pixelnest
DB_USER=postgres
DB_PASSWORD=your_db_password

# Session
SESSION_SECRET=your-super-secret-session-key

# Email Configuration ✅
EMAIL_USER=myemail@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5005/auth/google/callback

# Tripay Payment (optional)
TRIPAY_API_KEY=your-tripay-api-key
TRIPAY_PRIVATE_KEY=your-tripay-private-key
TRIPAY_MERCHANT_CODE=your-merchant-code
TRIPAY_MODE=sandbox
```

---

### Step 3: Restart Server

```bash
# Stop server (Ctrl+C)

# Start server
npm run dev
```

**Expected output:**
```
📧 Email service initialized with: your-email@gmail.com
✅ Email service is ready to send messages
🚀 Server is running on http://localhost:5005
```

---

### Step 4: Test Email Activation

1. **Register user baru**: http://localhost:5005/register
2. **Cek console log**:
   ```
   ✅ Activation email sent to user@gmail.com with code: 123456
   ```
3. **Cek email inbox/spam** - email activation code harus sampai!
4. **Masukkan kode** di halaman verifikasi
5. **Done!** ✅

---

## 🔍 Troubleshooting

### Problem 1: Email tidak terkirim

**Check console saat start server:**

```bash
npm run dev
```

**Jika muncul:**
```
⚠️ Email not configured! Set EMAIL_USER and EMAIL_PASSWORD in .env file
```

**Fix:**
- Pastikan `.env` file ada di root project
- Pastikan `EMAIL_USER` dan `EMAIL_PASSWORD` sudah diisi
- Restart server

---

### Problem 2: Invalid credentials

**Error:**
```
❌ Invalid login: 535-5.7.8 Username and Password not accepted
```

**Fix:**
- **Pastikan menggunakan App Password**, bukan password Gmail biasa
- Generate App Password baru dari https://myaccount.google.com/apppasswords
- Pastikan Gmail Anda sudah enable 2-Step Verification

---

### Problem 3: Email masuk ke spam

**Normal!** Email pertama kali sering masuk spam.

**Fix:**
- Cek folder spam
- Mark email sebagai "Not spam"
- Add `noreply@pixelnest` ke contacts

---

### Problem 4: .env tidak terbaca

**Check:**
```bash
# Verify .env exists
ls -la .env

# Check .env content
cat .env | grep EMAIL
```

**Expected:**
```
EMAIL_USER=your@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
```

**If empty:**
- Edit `.env` file
- Add `EMAIL_USER` and `EMAIL_PASSWORD`
- **Restart server** (important!)

---

## 📊 Verify Configuration

### Test 1: Check Environment Variables

```bash
node -e "
require('dotenv').config();
console.log('EMAIL_USER:', process.env.EMAIL_USER || '❌ NOT SET');
console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✅ SET' : '❌ NOT SET');
console.log('BASE_URL:', process.env.BASE_URL || 'http://localhost:5005');
"
```

**Expected output:**
```
EMAIL_USER: your@gmail.com
EMAIL_PASSWORD: ✅ SET
BASE_URL: http://localhost:5005
```

---

### Test 2: Send Test Email

Create file `test-email.js`:

```javascript
require('dotenv').config();
const emailService = require('./src/services/emailService');

(async () => {
  try {
    console.log('Testing email service...');
    
    // Test connection
    const isConnected = await emailService.verifyConnection();
    if (!isConnected) {
      console.error('❌ Email service connection failed!');
      process.exit(1);
    }
    
    // Send test email
    await emailService.sendActivationCode(
      'your-test-email@gmail.com',
      'Test User',
      '123456'
    );
    
    console.log('✅ Test email sent successfully!');
    console.log('Check your inbox/spam folder.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
```

Run test:
```bash
node test-email.js
```

---

## 🔐 Security Best Practices

### ✅ DO:
- ✅ Store email credentials in `.env` file
- ✅ Add `.env` to `.gitignore`
- ✅ Use Gmail App Password (not regular password)
- ✅ Use different passwords for dev/staging/production
- ✅ Rotate passwords regularly

### ❌ DON'T:
- ❌ Commit `.env` to git
- ❌ Share `.env` file publicly
- ❌ Use regular Gmail password
- ❌ Store passwords in code
- ❌ Use same password across environments

---

## 📝 .gitignore Setup

**Ensure `.env` is ignored:**

```bash
# Check if .env is in .gitignore
grep .env .gitignore
```

**If not, add it:**

```bash
echo ".env" >> .gitignore
```

**Verify:**
```bash
git status
# .env should NOT appear in changes
```

---

## 🎯 Production Deployment

### For Production Server:

1. **Copy `.env.example` to `.env`** on server:
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with production values**:
   ```env
   # Production settings
   NODE_ENV=production
   PORT=5005
   BASE_URL=https://yourdomain.com
   
   # Email
   EMAIL_USER=noreply@yourdomain.com
   EMAIL_PASSWORD=production-app-password
   
   # Database
   DB_HOST=your-db-host
   DB_NAME=your-db-name
   DB_USER=your-db-user
   DB_PASSWORD=strong-password
   ```

3. **Set proper permissions**:
   ```bash
   chmod 600 .env
   ```

4. **Start server**:
   ```bash
   pm2 start npm --name "pixelnest" -- start
   # OR
   npm run start
   ```

---

## 📋 Complete Checklist

### Initial Setup:
- [ ] Gmail App Password generated
- [ ] `.env` file created/exists
- [ ] `EMAIL_USER` added to `.env`
- [ ] `EMAIL_PASSWORD` added to `.env`
- [ ] `.env` added to `.gitignore`
- [ ] Server restarted
- [ ] Test registration completed
- [ ] Email received successfully
- [ ] ✅ **EMAIL SYSTEM WORKING!**

---

## 🆚 Before vs After

### ❌ Before (Complex):
```
├── Admin Panel (database)
│   ├── Email config stored in api_configs table
│   ├── Needs sync between database and .env
│   └── Password masked in database (unusable)
├── .env file (environment variables)
└── Email Service (reads from both)
    └── Complex initialization logic
```

### ✅ After (Simple):
```
├── .env file ONLY
│   ├── EMAIL_USER
│   └── EMAIL_PASSWORD
└── Email Service
    └── Direct read from .env (simple!)
```

---

## 💡 Why This Is Better

### 🎯 Advantages:

1. **Simpler**: Only one source of truth (`.env`)
2. **More Secure**: Credentials not stored in database
3. **Standard Practice**: Industry standard for sensitive configs
4. **No Sync Issues**: No database ↔ .env sync needed
5. **Faster**: No database queries on every email send
6. **Portable**: Easy to deploy to different environments

### 📦 What Changed:

- ❌ Removed: EMAIL config from Admin Panel
- ❌ Removed: EMAIL entry in `api_configs` database table
- ❌ Removed: Database queries in email service
- ✅ Added: Pure `.env` configuration
- ✅ Added: Clear error messages if not configured
- ✅ Added: Better documentation

---

## 🔄 Migration from Old System

If you previously configured email via Admin Panel:

1. **Note your email settings** from Admin Panel (if still visible)
2. **Add them to `.env` file**:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   ```
3. **Restart server**
4. **Done!** Email will now work from `.env`

---

## 📞 Need Help?

### Common Commands:

**Check .env:**
```bash
cat .env | grep EMAIL
```

**Test email service:**
```bash
npm run dev
# Look for: 📧 Email service initialized with: ...
```

**Clean restart:**
```bash
pkill -f node
npm run dev
```

---

## ✅ Summary

### Configuration:
- **Source**: `.env` file ONLY
- **Required Variables**: `EMAIL_USER` and `EMAIL_PASSWORD`
- **Location**: Root of project
- **Format**: Gmail App Password (16 chars)

### Process:
1. Generate Gmail App Password
2. Add to `.env` file
3. Restart server
4. Test registration
5. ✅ Done!

---

**Status**: ✅ Production Ready  
**Difficulty**: Easy (5 minutes setup)  
**Security**: High (credentials in .env, not in database)  
**Maintenance**: Low (no database sync needed)  

---

**Last Updated**: October 26, 2025  
**Version**: 2.0 (Pure .env)

