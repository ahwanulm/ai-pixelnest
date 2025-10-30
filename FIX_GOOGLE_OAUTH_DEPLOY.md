# 🔧 Fix: Google OAuth di Production

## 🔍 Masalah

Error saat login Google:
```
Error: Unknown authentication strategy "google"
```

**Penyebab:** Google OAuth credentials belum dikonfigurasi di `.env` production.

---

## ✅ Solusi Cepat (5 Menit)

### **Step 1: Dapatkan Google OAuth Credentials**

#### **A. Buka Google Cloud Console**
https://console.cloud.google.com/

#### **B. Create Project (jika belum ada)**
- Click "Select Project" → "New Project"
- Name: `PixelNest Production`
- Click "Create"

#### **C. Enable Google+ API**
1. Menu → "APIs & Services" → "Library"
2. Search: "Google+ API"
3. Click "Enable"

#### **D. Configure OAuth Consent Screen**
1. Menu → "APIs & Services" → "OAuth consent screen"
2. Select "External"
3. Fill in:
   - **App name:** PixelNest
   - **User support email:** Your email
   - **Developer contact:** Your email
4. Click "Save and Continue"
5. **Scopes:** Add `userinfo.email` and `userinfo.profile`
6. Click "Save and Continue"

#### **E. Create OAuth Client ID**
1. Menu → "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: "Web application"
4. Name: `PixelNest Production`

5. **Authorized JavaScript origins:**
   ```
   https://your-domain.com
   ```

6. **Authorized redirect URIs:**
   ```
   https://your-domain.com/auth/google/callback
   ```

7. Click "Create"

8. **COPY:**
   - ✅ Client ID
   - ✅ Client Secret

---

### **Step 2: Update .env di Server**

#### **A. SSH ke Server**
```bash
ssh root@your-server-ip
# atau
ssh user@your-server-ip
```

#### **B. Edit .env File**
```bash
cd /var/www/pixelnest
# atau cd /path/to/your/pixelnest

nano .env
```

#### **C. Add Google OAuth Credentials**

Cari section ini dan tambahkan credentials:
```env
# Google OAuth (Configure below)
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_CALLBACK_URL=https://your-domain.com/auth/google/callback
```

**Contoh lengkap:**
```env
# Google OAuth
GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123xyz456
GOOGLE_CALLBACK_URL=https://pixelnest.example.com/auth/google/callback
```

#### **D. Save & Exit**
- Press `Ctrl + X`
- Press `Y` to confirm
- Press `Enter` to save

---

### **Step 3: Restart PM2**

```bash
# Restart aplikasi
pm2 restart pixelnest-server

# Check logs
pm2 logs pixelnest-server --lines 50
```

**Expected output:**
```
✅ Google OAuth strategy initialized
🚀 Server is running on port 3000
```

---

### **Step 4: Test Google Login**

1. Buka browser: `https://your-domain.com/login`
2. Click "Sign in with Google"
3. Should redirect to Google login
4. After login, redirect back to dashboard

---

## 🔍 Troubleshooting

### **Problem 1: Error masih muncul setelah restart**

#### **Check 1: Verify .env**
```bash
cat .env | grep GOOGLE
```

Should show:
```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=https://...
```

#### **Check 2: Restart dengan force**
```bash
pm2 restart pixelnest-server --update-env
pm2 logs pixelnest-server
```

#### **Check 3: Verify credentials valid**
- Make sure Client ID dan Secret copied correctly
- No extra spaces or line breaks

---

### **Problem 2: redirect_uri_mismatch**

**Error message:**
```
Error 400: redirect_uri_mismatch
```

**Solution:**

1. **Check Callback URL di .env:**
   ```bash
   cat .env | grep GOOGLE_CALLBACK_URL
   ```

2. **Check di Google Cloud Console:**
   - Go to "Credentials"
   - Click your OAuth Client
   - Check "Authorized redirect URIs"

3. **Must match exactly:**
   - ✅ `https://pixelnest.example.com/auth/google/callback`
   - ❌ `http://pixelnest.example.com/auth/google/callback` (http vs https)
   - ❌ `https://pixelnest.example.com/auth/google/callback/` (trailing slash)
   - ❌ `https://www.pixelnest.example.com/auth/google/callback` (www subdomain)

---

### **Problem 3: Access blocked: This app's request is invalid**

**Solution:**

1. **Check OAuth Consent Screen:**
   - Go to "OAuth consent screen"
   - Make sure status is "Testing" or "Published"

2. **Add Test Users (if in Testing mode):**
   - Go to "OAuth consent screen"
   - Scroll to "Test users"
   - Click "Add Users"
   - Add your email

---

### **Problem 4: Google OAuth masih tidak muncul**

#### **Check passport.js initialization:**
```bash
cd /var/www/pixelnest
pm2 logs pixelnest-server | grep -i google
```

Should show:
```
✅ Google OAuth strategy initialized
```

#### **Check database (alternative method):**
```bash
# Connect to database
PGPASSWORD="your-db-password" psql -h localhost -U pixelnest_user -d pixelnest_db

# Check api_configs table
SELECT * FROM api_configs WHERE service_name = 'GOOGLE_OAUTH';
```

If exists, you can configure via **Admin Panel** instead:
1. Login: `https://your-domain.com/admin`
2. Go to "API Configuration"
3. Find "GOOGLE_OAUTH"
4. Add credentials
5. Enable service

---

## 🎯 Alternative: Disable Google Login

Jika tidak ingin menggunakan Google OAuth, Anda bisa hide button:

### **Option 1: Hide via CSS (Quick)**

```bash
nano public/css/style.css
```

Add at the end:
```css
/* Hide Google login button */
.google-login-btn,
.btn-google,
[href*="auth/google"] {
  display: none !important;
}
```

### **Option 2: Remove from Template**

```bash
nano src/views/auth/login.ejs
```

Find and comment out Google button section.

---

## 📋 Summary Commands

```bash
# 1. Edit .env
nano .env

# 2. Add Google OAuth credentials
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=https://your-domain.com/auth/google/callback

# 3. Save (Ctrl+X, Y, Enter)

# 4. Restart PM2
pm2 restart pixelnest-server

# 5. Check logs
pm2 logs pixelnest-server --lines 50

# 6. Test
# Open: https://your-domain.com/login
```

---

## ✅ Expected Result

After fix:

1. ✅ No more "Unknown authentication strategy" error
2. ✅ Google login button works
3. ✅ Redirects to Google login page
4. ✅ After Google login, returns to dashboard
5. ✅ User created in database

---

## 🔐 Security Notes

### **Production Settings:**

1. **OAuth Consent Screen:**
   - Should be "Published" (not Testing) for public use
   - Or keep "Testing" and add specific test users

2. **Authorized Domains:**
   - Add your domain to authorized domains list
   - Both apex domain and www (if applicable)

3. **Credentials Security:**
   - ✅ `.env` file has chmod 600 (only owner can read)
   - ✅ Never commit credentials to git
   - ✅ Use different credentials for dev/production

### **Check .env permissions:**
```bash
ls -la .env
# Should show: -rw------- (600)

# If not, fix it:
chmod 600 .env
```

---

## 📞 Need Help?

If still having issues, provide:

1. **PM2 logs:**
   ```bash
   pm2 logs pixelnest-server --lines 100 > logs.txt
   ```

2. **Environment check:**
   ```bash
   cat .env | grep GOOGLE
   ```

3. **Google Cloud Console screenshot:**
   - Authorized redirect URIs
   - OAuth consent screen status

4. **Browser console errors:**
   - Chrome DevTools → Console
   - Try Google login and copy any errors

---

**Last Updated:** 2025-10-29  
**Status:** ✅ Ready - Follow steps above to enable Google OAuth

