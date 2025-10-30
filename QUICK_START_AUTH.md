# 🚀 Quick Start - Setup Google Authentication (5 Menit)

## ⚠️ PENTING: Server sekarang bisa jalan, tapi login BELUM berfungsi!

File `.env` sudah dibuat dengan **temporary values**. Login akan berfungsi setelah Anda setup Google OAuth credentials (5 menit).

---

## 🎯 Option 1: Skip Google Auth (Website Jalan Tanpa Login)

Kalau mau test website dulu tanpa fitur login:

```bash
# Website sudah bisa diakses!
http://localhost:5005

# Tapi fitur ini BELUM bisa:
❌ Login page (/login) - Error
❌ Dashboard (/dashboard) - Error
❌ Google OAuth - Error

# Yang BISA:
✅ Homepage (/)
✅ Services
✅ Pricing
✅ Contact
✅ Blog
```

**Tombol "Login" di header akan error sampai Google OAuth di-setup.**

---

## 🎯 Option 2: Setup Google OAuth (5 Menit) - RECOMMENDED

Untuk enable fitur login, ikuti langkah ini:

### **Step 1: Generate Session Secret (30 detik)**

```bash
# Generate random secret
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Copy hasilnya, paste ke .env:
# SESSION_SECRET=hasil-dari-command-diatas
```

### **Step 2: Google Cloud Console (3 menit)**

1. **Buka:** https://console.cloud.google.com/

2. **Create Project:**
   - Click "Select a project" → "New Project"
   - Name: `PixelNest`
   - Click "Create"

3. **Enable Google+ API:**
   - Menu → APIs & Services → Library
   - Search: "Google+ API"
   - Click "Enable"

4. **Configure OAuth Consent Screen:**
   - Menu → APIs & Services → OAuth consent screen
   - Select: **External**
   - Click "Create"
   - App name: `PixelNest AI Video Platform`
   - User support email: Your email
   - Developer contact: Your email
   - Click "Save and Continue" (3x)

5. **Create OAuth Client ID:**
   - Menu → APIs & Services → Credentials
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: **Web application**
   - Name: `PixelNest Web Client`
   
   **Authorized redirect URIs:**
   ```
   http://localhost:5005/auth/google/callback
   ```
   
   - Click "Create"

6. **Copy Credentials:**
   - Copy **Client ID**
   - Copy **Client Secret**

### **Step 3: Update .env File (30 detik)**

Edit file `.env`:

```env
# Replace these with your actual values:
GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-actual-client-secret

# Update session secret:
SESSION_SECRET=your-generated-secret-from-step1
```

### **Step 4: Initialize Database (30 detik)**

```bash
# Create users & sessions tables
node src/config/authDatabase.js
```

### **Step 5: Restart Server (10 detik)**

```bash
# Stop server (Ctrl+C)
# Start again
npm run dev
```

### **Step 6: Test Login! 🎉**

```bash
# Open browser
http://localhost:5005/login

# Click "Continue with Google"
# Login dengan Google account
# Done! ✨
```

---

## 📝 Current .env Status:

```
✅ PORT - OK (5005)
✅ NODE_ENV - OK (development)
✅ DB_USER - OK (ahwanulm)
✅ DB_DATABASE - OK (pixelnest_db)

⚠️ SESSION_SECRET - TEMPORARY (needs update)
❌ GOOGLE_CLIENT_ID - TEMPORARY (needs Google credentials)
❌ GOOGLE_CLIENT_SECRET - TEMPORARY (needs Google credentials)
```

---

## 🆘 Troubleshooting:

### Server masih crash?
```bash
# Check .env file exists
cat .env

# Should show the configuration
```

### Database error?
```bash
# Make sure PostgreSQL is running
brew services start postgresql

# Create database if not exists
createdb pixelnest_db

# Initialize auth tables
node src/config/authDatabase.js
```

### Google OAuth error saat login?
```
Make sure:
✅ .env has real Google credentials (not "temporary-...")
✅ Redirect URI matches exactly in Google Console
✅ Google+ API is enabled
```

---

## 📚 Dokumentasi Lengkap:

- **GOOGLE_AUTH_SETUP.md** - Tutorial lengkap dengan screenshots
- **AUTHENTICATION_OVERVIEW.md** - Technical documentation
- **AUTH_IMPLEMENTATION_SUMMARY.md** - Feature overview

---

## ✅ Checklist:

```
Server Running:
□ npm run dev works without crash
□ http://localhost:5005 loads homepage

Google OAuth (Optional for now):
□ Google Cloud project created
□ OAuth credentials obtained
□ .env updated with real credentials
□ Database initialized
□ Login page works

Database:
□ PostgreSQL running
□ pixelnest_db database exists
□ users & sessions tables created
```

---

## 🎬 What's Working Now?

**Dengan temporary credentials:**
```
✅ Server runs (no crash)
✅ Homepage accessible
✅ All public pages work
✅ Styling & animations work

❌ Login page (will error when clicked)
❌ Google OAuth (needs real credentials)
❌ Dashboard (needs authentication)
```

**Setelah setup Google OAuth:**
```
✅ Everything above
✅ Login page works perfectly
✅ Google OAuth authentication
✅ User dashboard
✅ User sessions
✅ Protected routes
```

---

**Server sekarang sudah bisa jalan! Website bisa diakses di http://localhost:5005** 🎉

**Untuk enable fitur login, follow Step 1-6 di Option 2!** 🔐

