# 🔐 Google OAuth Setup Guide

## Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create New Project**
   - Click "Select a project" → "New Project"
   - Project name: `PixelNest` (or any name)
   - Click "Create"

---

## Step 2: Enable Google+ API

1. **Navigate to APIs & Services**
   - Click menu (☰) → "APIs & Services" → "Library"

2. **Search for "Google+ API"**
   - Search: "Google+ API"
   - Click on it
   - Click "Enable"

---

## Step 3: Create OAuth Credentials

1. **Go to Credentials**
   - Click menu (☰) → "APIs & Services" → "Credentials"

2. **Configure OAuth Consent Screen**
   - Click "OAuth consent screen"
   - Select "External" (for testing)
   - Click "Create"
   
   **Fill in:**
   - App name: `PixelNest AI Video Platform`
   - User support email: Your email
   - Developer contact: Your email
   - Click "Save and Continue"
   
   **Scopes:**
   - Click "Add or Remove Scopes"
   - Add: `userinfo.email` and `userinfo.profile`
   - Click "Save and Continue"
   
   **Test Users (Development Only):**
   - Add your email address
   - Click "Save and Continue"

3. **Create OAuth Client ID**
   - Go back to "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: `PixelNest Web Client`
   
   **Authorized JavaScript origins:**
   ```
   http://localhost:5005
   ```
   
   **Authorized redirect URIs:**
   ```
   http://localhost:5005/auth/google/callback
   ```
   
   - Click "Create"

4. **Copy Credentials**
   - Copy "Client ID" 
   - Copy "Client Secret"
   - **Keep these safe!**

---

## Step 4: Configure Your Application

1. **Create .env file**
   ```bash
   cp .env.example .env
   ```

2. **Add Google Credentials to .env**
   ```env
   # Google OAuth Configuration
   GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret-here
   GOOGLE_CALLBACK_URL=http://localhost:5005/auth/google/callback
   
   # Also set a strong session secret
   SESSION_SECRET=your-random-secret-key-minimum-32-characters-long
   ```

3. **Generate Session Secret**
   ```bash
   # Generate a random secret (Mac/Linux)
   openssl rand -base64 32
   
   # Or use Node.js
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

---

## Step 5: Initialize Database

1. **Run Auth Database Setup**
   ```bash
   node src/config/authDatabase.js
   ```

   This creates:
   - `users` table
   - `sessions` table

2. **Verify Tables**
   ```bash
   psql pixelnest_db
   \dt
   # Should show: users, sessions, and other tables
   ```

---

## Step 6: Test Authentication

1. **Start Server**
   ```bash
   npm run dev
   ```

2. **Visit Login Page**
   - Go to: http://localhost:5005/login

3. **Click "Continue with Google"**
   - Should redirect to Google
   - Select your account
   - Grant permissions
   - Redirected back to Dashboard

4. **Check User in Database**
   ```bash
   psql pixelnest_db
   SELECT * FROM users;
   ```

---

## Production Setup

### For Deployment (e.g., Heroku, Vercel, etc.)

1. **Update OAuth Consent Screen**
   - Change to "Internal" or complete verification
   - Add production domain

2. **Add Production Redirect URI**
   - Go to Credentials → Edit OAuth Client
   - Add: `https://yourdomain.com/auth/google/callback`

3. **Update Environment Variables**
   ```env
   NODE_ENV=production
   GOOGLE_CALLBACK_URL=https://yourdomain.com/auth/google/callback
   SESSION_SECRET=use-different-secret-in-production
   ```

4. **Enable HTTPS**
   - Ensure your domain has SSL certificate
   - Cookie secure flag will be enabled automatically

---

## Troubleshooting

### Error: "redirect_uri_mismatch"
**Solution:**
- Check if redirect URI in Google Console matches exactly
- Must include protocol (http:// or https://)
- No trailing slash

### Error: "Access blocked: This app's request is invalid"
**Solution:**
- Add your email to "Test users" in OAuth consent screen
- Make sure Google+ API is enabled

### Error: "Cannot find module passport"
**Solution:**
```bash
npm install
```

### Users not saving to database
**Solution:**
```bash
# Re-run database initialization
node src/config/authDatabase.js

# Check database connection
node -e "require('./src/config/database').query('SELECT NOW()')"
```

---

## Security Best Practices

### 1. Environment Variables
```bash
# NEVER commit .env to git
# It's already in .gitignore
```

### 2. Session Secret
```bash
# Use strong random string
# Different for development and production
# Minimum 32 characters
```

### 3. Cookie Settings
```javascript
// In production (automatically set):
cookie: {
  secure: true,      // HTTPS only
  httpOnly: true,    // No JavaScript access
  maxAge: 7 days     // Session expiry
}
```

### 4. OAuth Scopes
```javascript
// Only request what you need
scope: ['profile', 'email']
// Don't ask for unnecessary permissions
```

---

## Features Included

### ✅ User Authentication
- Google OAuth 2.0
- Session management
- Secure cookies
- CSRF protection

### ✅ User Management
- Profile data storage
- Avatar from Google
- Last login tracking
- User dashboard

### ✅ Route Protection
- `/dashboard` - Protected (login required)
- `/login` - Guest only (redirects if logged in)
- Homepage - Public

### ✅ UI Components
- Login page with Google button
- User dropdown menu
- Dashboard with stats
- Responsive mobile menu

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/login` | GET | Show login page |
| `/auth/google` | GET | Initiate Google OAuth |
| `/auth/google/callback` | GET | OAuth callback |
| `/dashboard` | GET | User dashboard (protected) |
| `/logout` | GET | Logout user |

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  google_id VARCHAR(255) UNIQUE,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);
```

### Sessions Table
```sql
CREATE TABLE sessions (
  sid VARCHAR NOT NULL PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL
);
```

---

## Next Steps

After setup, you can:

1. **Add More Features**
   - Video creation interface
   - User video library
   - Payment integration
   - Team collaboration

2. **Customize Dashboard**
   - Add actual video creation
   - Display user's videos
   - Usage statistics
   - Billing information

3. **Deploy to Production**
   - Set up production database
   - Configure environment variables
   - Enable HTTPS
   - Monitor authentication

---

**Your Google Authentication is now ready! 🎉**

Users can now:
- ✅ Login with Google
- ✅ Access protected dashboard
- ✅ Logout securely
- ✅ Have persistent sessions

