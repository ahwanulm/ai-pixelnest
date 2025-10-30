# 🔧 Troubleshooting: Google OAuth "Not Configured"

## Problem
Google OAuth credentials sudah ada di `.env` file, tapi masih muncul error **"Not Configured"** atau **"Google OAuth not configured"**.

## ✅ Solution (Quick Fix)

### Step 1: Sync .env to Database
```bash
npm run init-admin
```

Output yang benar:
```
✅ Connected to PostgreSQL database
🔧 Creating admin tables...
✅ Admin tables created successfully!
🎉 Admin database initialization completed!
```

### Step 2: Verify Configuration
```bash
npm run check-api
```

Output yang benar:
```
🔹 Service: GOOGLE_OAUTH
   Status: ✅ Active
   API Key: ✓ Set (730784592101-5htgjje...)
   Client Secret: ✓ Set (hidden)
   Callback URL: http://localhost:5005/auth/google/callback

✅ Google OAuth is fully configured!
📌 Restart server to apply: npm run dev
```

### Step 3: Restart Server
```bash
# Stop server (Ctrl+C jika masih running)
npm run dev
```

Cek console output, harusnya muncul:
```
✅ Google OAuth strategy initialized
```

### Step 4: Test Login
Akses: `http://localhost:5005/login`

Klik "Continue with Google" - seharusnya berfungsi!

---

## 🔍 Detailed Diagnosis

### Check 1: .env File Exists?
```bash
ls -la | grep .env
```

Expected output:
```
-rw-r--r--  .env
```

### Check 2: .env Has Google OAuth Credentials?
```bash
cat .env | grep -i google
```

Expected output:
```
GOOGLE_CLIENT_ID=your-client-id...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
GOOGLE_CALLBACK_URL=http://localhost:5005/auth/google/callback
```

### Check 3: Database Has Credentials?
```bash
npm run check-api
```

Expected: `✅ Google OAuth is fully configured!`

### Check 4: Server Console Logs?
When you run `npm run dev`, check for:
```
✅ Google OAuth strategy initialized    ← Good!
⚠️  Google OAuth not configured         ← Bad! Re-sync needed
```

---

## 🐛 Common Issues & Fixes

### Issue 1: "Google OAuth not found in database"
**Cause**: Database belum di-initialize dengan admin tables

**Fix**:
```bash
npm run init-admin
npm run dev
```

### Issue 2: "Client ID/Secret incomplete"
**Cause**: Credentials di `.env` kosong atau salah format

**Fix**: 
1. Edit `.env`:
```env
GOOGLE_CLIENT_ID=your-real-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-real-secret
GOOGLE_CALLBACK_URL=http://localhost:5005/auth/google/callback
```

2. Re-sync:
```bash
npm run init-admin
npm run dev
```

### Issue 3: Credentials Set but Still "Not Configured"
**Cause**: Server tidak di-restart setelah update database

**Fix**:
```bash
# Stop server (Ctrl+C)
npm run dev
```

**Note**: `passport.js` membaca config saat server start. Perubahan di database tidak otomatis apply tanpa restart.

### Issue 4: "redirect_uri_mismatch" Error
**Cause**: Callback URL di database tidak sama dengan yang di Google Cloud Console

**Fix**:
1. Check callback URL di database:
```bash
npm run check-api
```

2. Copy exact URL dari output

3. Buka [Google Cloud Console](https://console.cloud.google.com/)
   - Go to: Credentials → OAuth 2.0 Client IDs
   - Edit your client
   - Paste exact URL ke "Authorized redirect URIs"
   - Save

4. Restart server:
```bash
npm run dev
```

### Issue 5: Environment Variables Not Loading
**Cause**: `dotenv` tidak load `.env` file dengan benar

**Fix**:
1. Check if `.env` is in project root (same folder as `server.js`)
```bash
pwd
ls -la .env
```

2. Check `server.js` has dotenv config:
```javascript
const dotenv = require('dotenv');
dotenv.config();
```

3. Restart server:
```bash
npm run dev
```

---

## 🔄 How Sync Works

### Flow Diagram
```
.env file (Client ID, Secret, Callback)
    ↓
npm run init-admin (reads .env, writes to DB)
    ↓
api_configs table (stores credentials)
    ↓
passport.js (reads from DB on server start)
    ↓
Google OAuth ready!
```

### Priority Order
1. **Database First**: passport.js checks database first
2. **Fallback to .env**: If database empty, fallback to .env
3. **Error if Both Empty**: Show "not configured" warning

### Auto-Sync Feature
When you update via Admin Panel (`/admin/api-configs`):
1. Credentials saved to **database** ✓
2. Credentials synced to **.env file** ✓
3. Environment reloaded (process.env updated) ✓
4. **Server restart still needed** for passport.js to re-initialize

---

## 🛠️ Manual Sync Commands

### Sync from .env to Database
```bash
npm run init-admin
```

### Check Current Config
```bash
npm run check-api
```

### Update via SQL (Advanced)
```sql
-- Check current config
SELECT service_name, api_key, endpoint_url, is_active 
FROM api_configs 
WHERE service_name = 'GOOGLE_OAUTH';

-- Update manually
UPDATE api_configs 
SET 
  api_key = 'your-client-id',
  api_secret = 'your-client-secret',
  endpoint_url = 'http://localhost:5005/auth/google/callback',
  is_active = true
WHERE service_name = 'GOOGLE_OAUTH';
```

---

## 📋 Verification Checklist

Before reporting issues, verify:

- [ ] `.env` file exists in project root
- [ ] `.env` has `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
- [ ] Credentials are not empty strings
- [ ] `npm run init-admin` executed successfully
- [ ] `npm run check-api` shows "✅ Google OAuth is fully configured!"
- [ ] Server restarted after database update
- [ ] Console shows "✅ Google OAuth strategy initialized"
- [ ] Callback URL matches Google Cloud Console setting
- [ ] No firewall blocking port 5005

---

## 🎯 Quick Checklist

Run these commands in order:

```bash
# 1. Check .env
cat .env | grep GOOGLE

# 2. Sync to database
npm run init-admin

# 3. Verify database
npm run check-api

# 4. Restart server
npm run dev

# 5. Check logs for:
# ✅ Google OAuth strategy initialized
```

If all steps pass → Google OAuth should work! ✅

---

## 🆘 Still Not Working?

### Check Server Logs
```bash
npm run dev
```

Look for error messages:
- `⚠️  Reading Google OAuth from .env (database not configured)` → Run `npm run init-admin`
- `⚠️  Google OAuth not configured` → Check credentials in `.env`
- `Error: Cannot find module 'pg'` → Run `npm install`
- Database connection errors → Check PostgreSQL is running

### Check Admin Panel
1. Go to: `http://localhost:5005/admin/api-configs`
2. Find "GOOGLE_OAUTH" card
3. Should show:
   - ✅ Active badge (green)
   - ✓ Client ID (visible)
   - ✓ Client Secret (masked as ••••)
   - ✓ Callback URL

If any missing → Click "Configure" and fill in.

### Restart Everything
```bash
# Stop server
Ctrl+C

# Clear node cache (optional)
rm -rf node_modules/.cache

# Reinstall (if needed)
npm install

# Re-sync
npm run init-admin

# Restart
npm run dev
```

---

## 📚 Related Documentation

- **GOOGLE_OAUTH_ADMIN_CONFIG.md** - Full technical docs
- **GOOGLE_OAUTH_QUICKSTART.md** - Quick setup guide
- **GOOGLE_AUTH_SETUP.md** - Getting credentials from Google
- **ADMIN_PANEL_GUIDE.md** - Admin panel usage

---

## 💡 Pro Tips

1. **Always restart server** after changing credentials
2. **Use Admin Panel** for easier configuration (no need to edit files)
3. **Check sync status** - Admin panel shows "Synced" badge if DB and .env match
4. **Backup .env** before making changes
5. **Use npm run check-api** to verify before starting server

---

**Updated**: October 2025  
**Status**: ✅ Complete Guide

