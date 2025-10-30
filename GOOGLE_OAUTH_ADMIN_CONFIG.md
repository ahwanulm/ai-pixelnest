# Google OAuth Configuration via Admin Panel

## Overview
Google OAuth credentials can now be configured and managed directly from the Admin Panel's API Configuration page. The system automatically reads existing credentials from `.env` file during initialization and stores them in the database for easy management.

## Features

### 1. **Automatic .env Import**
- When running `npm run init-admin`, the system automatically reads Google OAuth credentials from your `.env` file (if present)
- Credentials include:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GOOGLE_CALLBACK_URL`

### 2. **Database Priority**
- The passport configuration now checks the database first for Google OAuth credentials
- If database credentials are found and active, they will be used
- Falls back to `.env` values if database is not configured

### 3. **Admin Panel Management**
- Configure Google OAuth directly from `/admin/api-configs`
- User-friendly interface with special fields for Google OAuth:
  - **Client ID**: Your Google OAuth Client ID
  - **Client Secret**: Your Google OAuth Client Secret
  - **Callback URL**: OAuth redirect URI
- Built-in help text with step-by-step instructions to get credentials

## Setup Instructions

### Option 1: Automatic Setup (Recommended)

If you already have Google OAuth credentials in your `.env`:

```bash
# Run the admin database initialization
npm run init-admin
```

This will automatically import your existing credentials into the database.

### Option 2: Manual Configuration via Admin Panel

1. **Login to Admin Panel**
   - Go to `/admin`
   - Login with your admin account

2. **Navigate to API Configs**
   - Click on "API Configuration" in the sidebar
   - Find the "GOOGLE_OAUTH" card

3. **Click Configure**
   - Enter your Google Client ID
   - Enter your Google Client Secret
   - Set the Callback URL (e.g., `http://localhost:5005/auth/google/callback`)

4. **Enable the Service**
   - Check "Enable this API service"
   - Click "Save Configuration"

5. **Restart the Server**
   ```bash
   npm run dev
   ```

## Getting Google OAuth Credentials

### Step 1: Go to Google Cloud Console
Visit: https://console.cloud.google.com/

### Step 2: Create or Select a Project
- Click on the project dropdown (top bar)
- Create a new project or select an existing one

### Step 3: Enable Google+ API
- Go to "APIs & Services" → "Library"
- Search for "Google+ API"
- Click "Enable"

### Step 4: Create OAuth 2.0 Credentials
- Go to "APIs & Services" → "Credentials"
- Click "Create Credentials" → "OAuth 2.0 Client ID"
- Select "Web application"

### Step 5: Configure OAuth Consent Screen
- Fill in the required information
- Add test users if needed (for development)

### Step 6: Add Authorized Redirect URIs
Add these URLs:
- **Development**: `http://localhost:5005/auth/google/callback`
- **Production**: `https://yourdomain.com/auth/google/callback`

### Step 7: Copy Credentials
- Copy the **Client ID**
- Copy the **Client Secret**
- Use these in the Admin Panel or `.env` file

## Environment Variables (.env)

If you prefer to use `.env` file, add these variables:

```env
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:5005/auth/google/callback
```

## How It Works

### 1. **Initialization Process**
```javascript
// src/config/passport.js
async function getGoogleOAuthConfig() {
  // 1. Try to get from database
  const dbConfig = await getFromDatabase();
  if (dbConfig) return dbConfig;
  
  // 2. Fallback to .env
  return {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  };
}
```

### 2. **Database Schema**
```sql
-- api_configs table
service_name: 'GOOGLE_OAUTH'
api_key: Google Client ID
api_secret: Google Client Secret  
endpoint_url: Callback URL
is_active: true/false
```

### 3. **Admin Panel Update Flow**
1. User updates Google OAuth config in Admin Panel
2. Credentials saved to `api_configs` table
3. Next server restart/request uses database values
4. Falls back to `.env` if database values are empty or inactive

## Security Features

### 1. **Password Protection**
- Client Secret input uses `type="password"`
- Existing secrets are never displayed (only `••••••••`)
- Leave secret field empty to keep current value

### 2. **Admin-Only Access**
- Only users with `role = 'admin'` can access API configs
- Protected by `ensureAdmin` middleware
- All changes are logged in activity logs

### 3. **Encrypted Storage**
- Credentials stored securely in PostgreSQL database
- No credentials exposed in client-side JavaScript
- API endpoints require authentication

## API Endpoints

### Get All API Configs
```
GET /admin/api-configs
```
Returns list of all configured APIs including Google OAuth

### Get Specific Config
```
GET /admin/api-configs/GOOGLE_OAUTH
```
Returns Google OAuth configuration (with keys for admin)

### Update Config
```
PUT /admin/api-configs/GOOGLE_OAUTH
Content-Type: application/json

{
  "api_key": "new-client-id",
  "api_secret": "new-client-secret",
  "endpoint_url": "http://localhost:5005/auth/google/callback",
  "is_active": true
}
```

### Toggle Active Status
```
PUT /admin/api-configs/GOOGLE_OAUTH
Content-Type: application/json

{
  "is_active": false
}
```

## Troubleshooting

### Google OAuth Not Working

1. **Check if credentials are configured**
   ```bash
   # In PostgreSQL
   SELECT service_name, is_active FROM api_configs WHERE service_name = 'GOOGLE_OAUTH';
   ```

2. **Verify callback URL matches**
   - Admin Panel callback URL must match Google Cloud Console
   - Check for `http` vs `https`
   - Check port numbers

3. **Check server logs**
   ```bash
   npm run dev
   # Look for:
   # ✅ Google OAuth strategy initialized
   # ⚠️  Google OAuth not configured...
   ```

4. **Restart server after changes**
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

### Callback URL Mismatch Error

If you see `redirect_uri_mismatch`:
1. Go to Admin Panel → API Configs → Google OAuth
2. Copy the exact callback URL
3. Go to Google Cloud Console → Credentials
4. Add the exact URL to "Authorized redirect URIs"
5. Save and wait a few minutes for Google to update

### "Not Configured" Warning

If server shows: `⚠️  Google OAuth not configured`
1. Check Admin Panel API Configs page
2. Ensure Google OAuth is marked as "Active"
3. Verify Client ID and Secret are not empty
4. Run `npm run init-admin` to sync from `.env`

## Benefits

### 1. **Centralized Management**
- All API configurations in one place
- Easy to update without editing files
- Visual interface for non-technical admins

### 2. **No Server Restart for Some Changes**
- Toggle API on/off without restart
- Update rate limits on the fly
- Disable services temporarily

### 3. **Audit Trail**
- All API config changes logged
- Track who changed what and when
- Admin activity history

### 4. **Multi-Environment Support**
- Different configs for dev/staging/production
- Easy to switch between environments
- No need to manage multiple `.env` files

## Best Practices

1. **Initial Setup**: Use `.env` for initial setup, then run `npm run init-admin`
2. **Production**: Configure via Admin Panel for easy updates
3. **Security**: Never commit `.env` or expose credentials
4. **Backups**: Backup your database (includes all API configs)
5. **Testing**: Always test OAuth login after updating credentials

## Files Modified

1. **`src/config/adminDatabase.js`**
   - Reads Google OAuth from `.env` during init
   - Inserts into `api_configs` table

2. **`src/config/passport.js`**
   - Checks database first for credentials
   - Falls back to `.env` if not found
   - Initializes Google Strategy asynchronously

3. **`src/views/admin/api-configs.ejs`**
   - Special UI for Google OAuth configuration
   - Help text and instructions
   - Secure password inputs

4. **`src/models/Admin.js`**
   - Support for service_name lookup
   - Update by service_name or ID

## Summary

Google OAuth can now be easily configured from the Admin Panel without editing code or configuration files. The system maintains backward compatibility with `.env` while providing a modern, user-friendly interface for credential management. All changes are logged and secured with admin-only access.

