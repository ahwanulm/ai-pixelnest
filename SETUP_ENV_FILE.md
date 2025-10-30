# 🚀 Quick Setup: Create .env File on Production Server

## ✅ **Good News!**
- Network connectivity: **WORKING** ✅
- SMTP Port 587: **ACCESSIBLE** ✅  
- SMTP Port 465: **ACCESSIBLE** ✅

**The ONLY issue**: `.env` file is missing on your production server.

---

## 📝 **Step-by-Step Setup**

### **Step 1: SSH into Your Production Server**

```bash
ssh your-user@your-server-ip
```

### **Step 2: Navigate to Your Project Directory**

```bash
cd /var/www/pixelnest
```

### **Step 3: Create the .env File**

```bash
nano .env
```

### **Step 4: Copy and Paste This Template**

```env
# ═══════════════════════════════════════════════════
# PixelNest Production Configuration
# ═══════════════════════════════════════════════════

# ───────────────────────────────────────────────────
# 📧 EMAIL CONFIGURATION (REQUIRED!)
# ───────────────────────────────────────────────────
# ⚠️  IMPORTANT: Use Gmail App Password!
# Get it from: https://myaccount.google.com/apppasswords
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password

# ───────────────────────────────────────────────────
# 🌐 SERVER CONFIGURATION
# ───────────────────────────────────────────────────
BASE_URL=http://103.82.92.142:5005
NODE_ENV=production
PORT=5005

# ───────────────────────────────────────────────────
# 🗄️  DATABASE CONFIGURATION
# ───────────────────────────────────────────────────
DB_HOST=localhost
DB_PORT=5432
DB_USER=pixelnest_user
DB_PASSWORD=your_db_password
DB_NAME=pixelnest_db

# ───────────────────────────────────────────────────
# 🔐 SECURITY
# ───────────────────────────────────────────────────
JWT_SECRET=your-super-secret-jwt-key-change-this
SESSION_SECRET=your-super-secret-session-key-change-this

# ───────────────────────────────────────────────────
# 💳 PAYMENT (MIDTRANS)
# ───────────────────────────────────────────────────
MIDTRANS_SERVER_KEY=your-midtrans-server-key
MIDTRANS_CLIENT_KEY=your-midtrans-client-key
MIDTRANS_IS_PRODUCTION=false

# ───────────────────────────────────────────────────
# 🤖 AI API KEYS (Optional - can configure via Admin Panel)
# ───────────────────────────────────────────────────
FAL_AI_KEY=
REPLICATE_API_TOKEN=
LEONARDO_API_KEY=
STABILITY_API_KEY=
ELEVENLABS_API_KEY=
LUMA_API_KEY=
```

### **Step 5: Get Your Gmail App Password**

**🔴 CRITICAL: You MUST use an App Password, NOT your regular Gmail password!**

1. **Enable 2-Step Verification** (if not already enabled):
   ```
   https://myaccount.google.com/security
   ```
   Click "2-Step Verification" and follow the setup

2. **Generate App Password**:
   ```
   https://myaccount.google.com/apppasswords
   ```
   
   - **Select app**: "Mail"
   - **Select device**: "Other (Custom name)"
   - **Type**: "PixelNest"
   - Click **"Generate"**
   - Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

3. **Update .env file**:
   Replace `your-email@gmail.com` with your Gmail address
   Replace `your-gmail-app-password` with the generated password

### **Step 6: Save the File**

In nano:
- Press `Ctrl + X`
- Press `Y` to confirm
- Press `Enter` to save

### **Step 7: Set Proper Permissions**

```bash
chmod 600 .env
```

This ensures only your user can read the file (security best practice).

### **Step 8: Verify the File**

```bash
cat .env | grep EMAIL
```

You should see:
```
EMAIL_USER=youremail@gmail.com
EMAIL_PASSWORD=your-password-here
```

### **Step 9: Restart PM2**

```bash
pm2 restart pixelnest-server
```

### **Step 10: Check Logs**

```bash
pm2 logs pixelnest-server --lines 20
```

You should now see:
```
📧 Email service initialized with: youremail@gmail.com
```

---

## 🧪 **Test Email Sending**

### **Option A: Use the Test Script**

From your local machine, copy the test script to the server:

```bash
# On your local machine
cd /Users/ahwanulm/Desktop/PROJECT/PIXELNEST
scp test-email-connection.js your-user@your-server:/var/www/pixelnest/

# On the server
cd /var/www/pixelnest
node test-email-connection.js
```

### **Option B: Test via Registration**

1. Go to your PixelNest website
2. Try to register a new account
3. Check if activation email is sent

---

## 🔍 **Troubleshooting**

### **If you see: "Email not configured!"**

The .env file was not loaded. Check:

```bash
# Make sure file exists
ls -la /var/www/pixelnest/.env

# Make sure it has email variables
grep EMAIL /var/www/pixelnest/.env

# Restart PM2
pm2 restart pixelnest-server
```

### **If you still get ETIMEDOUT after adding credentials**

1. **Wrong App Password**: Generate a new one
2. **2-Step Verification not enabled**: Enable it first
3. **Old password in .env**: Make sure you saved the file

### **Quick Debug Commands**

```bash
# Check if .env is loaded
pm2 logs pixelnest-server | grep EMAIL

# Watch logs in real-time
pm2 logs pixelnest-server

# Restart and watch
pm2 restart pixelnest-server && pm2 logs pixelnest-server
```

---

## 📋 **Quick Checklist**

Before testing, make sure:

- [ ] SSH'd into production server
- [ ] Created `.env` file in `/var/www/pixelnest/`
- [ ] Added `EMAIL_USER` with your Gmail address
- [ ] Added `EMAIL_PASSWORD` with Gmail **App Password** (not regular password)
- [ ] Gmail 2-Step Verification is **enabled**
- [ ] File permissions set to `600`
- [ ] PM2 restarted
- [ ] Checked logs for "Email service initialized"

---

## ✅ **Expected Success Output**

After restart, in logs you should see:

```
📧 Email service initialized with: your-email@gmail.com
📨 Activation email queued for: user@example.com
✅ Activation email sent to: user@example.com
📧 Message ID: <some-message-id>
```

---

## 🆘 **Still Having Issues?**

If emails still don't send after following all steps:

1. **Verify App Password is correct**:
   - Delete old App Password in Google Account
   - Generate a brand new one
   - Update .env immediately
   - Restart PM2

2. **Check server logs**:
   ```bash
   pm2 logs pixelnest-server --err --lines 50
   ```

3. **Test with the diagnostic script**:
   ```bash
   node test-email-connection.js
   ```

4. **Try alternative SMTP** (if Gmail doesn't work):
   - Use SendGrid (free tier available)
   - See `EMAIL_TIMEOUT_FIX.md` for alternatives

---

## 💡 **Pro Tip: Environment Variables Priority**

Your app checks credentials in this order:
1. ✅ **`.env` file** (what we just created)
2. ❌ Admin Panel database config (requires .env to work first)

So the .env file is **essential** for initial setup!

---

## 🎉 **Once Working**

After email is working, you can optionally configure via Admin Panel:
```
http://your-server-ip:5005/admin/api-configs
```

But .env credentials will always be used as fallback.

---

**Need help? Run the diagnostic script or check the detailed guide in `EMAIL_TIMEOUT_FIX.md`!**

