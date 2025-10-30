# PixelNest Admin Panel - Complete Guide

## 🎯 Overview

The PixelNest Admin Panel is a comprehensive administration interface for managing all aspects of your AI automation platform. It provides powerful tools for user management, API configuration, promotional codes, notifications, and system monitoring.

## 📋 Table of Contents

1. [Features](#features)
2. [Installation](#installation)
3. [Setup](#setup)
4. [Access Admin Panel](#access-admin-panel)
5. [Admin Features](#admin-features)
6. [Database Schema](#database-schema)
7. [API Endpoints](#api-endpoints)
8. [Security](#security)

---

## ✨ Features

### 1. **Dashboard**
- Real-time statistics (total users, active users, credits, AI generations)
- Recent activity logs
- Quick action buttons
- Visual analytics

### 2. **User Management**
- View all users with search and filters
- Edit user details (name, email, role, status)
- Add/deduct credits with transaction logging
- View user activity history
- Check AI generation history
- View credit transaction history
- Delete users

### 3. **Promo Codes**
- Create discount codes (percentage or fixed amount)
- Add bonus credits to promo codes
- Set usage limits and expiration dates
- Track promo code usage
- Enable/disable promo codes

### 4. **API Configuration**
- Manage API keys for external services (FAL AI, OpenAI, Replicate, etc.)
- Configure endpoints and rate limits
- Store additional configuration as JSON
- Enable/disable API services

### 5. **Notifications**
- Send push notifications to users
- Broadcast to all users or specific users
- Set notification priority and type
- Add action URLs
- Set expiration dates

### 6. **Activity Logs**
- Track all user and admin activities
- View IP addresses and user agents
- Access detailed metadata
- Paginated history

### 7. **System Settings**
- Configure site-wide settings
- Set default credits for new users
- Configure credit costs per generation
- Enable/disable features
- Maintenance mode

---

## 🚀 Installation

### Step 1: Run Database Migration

Create all necessary admin tables:

```bash
node src/config/adminDatabase.js
```

This will create the following tables:
- `promo_codes` - Promotional codes management
- `api_configs` - API configuration storage
- `notifications` - User notifications
- `user_activity_logs` - Activity tracking
- `credit_transactions` - Credit transaction history
- `ai_generation_history` - AI generation records
- `admin_settings` - System configuration

It will also add columns to the `users` table:
- `role` - User role (user/admin)
- `credits` - User credit balance
- `is_active` - Account status
- `subscription_plan` - Subscription plan name
- `subscription_expires_at` - Subscription expiry date

### Step 2: Create First Admin User

First, register a regular user account through the website, then promote them to admin:

```bash
node src/scripts/makeAdmin.js
```

Enter the email address of the user you want to make an admin. The script will:
- Verify the user exists
- Update their role to 'admin'
- Display confirmation

---

## 🔧 Setup

### Environment Variables

Make sure these are set in your `.env` file:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pixelnest_db
DB_USER=postgres
DB_PASSWORD=your_password

# Session
SESSION_SECRET=your-secret-key-here

# Server
PORT=5005
NODE_ENV=development
```

### Default Settings

The system comes with these default settings (can be changed in admin panel):

- **site_name**: PixelNest AI
- **default_credits**: 100 (credits given to new users)
- **credit_per_image**: 1 (cost per image generation)
- **credit_per_video**: 5 (cost per video generation)
- **max_daily_generations**: 50
- **enable_registration**: true
- **enable_google_auth**: true
- **site_maintenance**: false

---

## 🔐 Access Admin Panel

1. **Login** with your admin account at: `http://localhost:5005/login`
2. **Access Admin Panel** at: `http://localhost:5005/admin`

If you're not an admin, you'll see an "Access Denied" error.

---

## 📱 Admin Features

### User Management

**View Users:**
- Navigate to `/admin/users`
- Search by name or email
- Filter by role (user/admin)
- Filter by status (active/inactive)

**Edit User:**
1. Click on a user to view details
2. Click "Edit" button
3. Update: name, email, role, status, phone, subscription plan
4. Save changes

**Add Credits:**
1. View user details
2. Click "Add Credits"
3. Enter amount (positive to add, negative to deduct)
4. Add description
5. Confirm

**View Activity:**
- Activity Log tab: All user actions
- Credit History tab: All credit transactions
- AI Generations tab: All AI creations

**Delete User:**
- Only possible if not deleting yourself
- Permanently removes user and related data

### Promo Code Management

**Create Promo Code:**
1. Navigate to `/admin/promo-codes`
2. Click "Create Promo Code"
3. Fill in details:
   - Code (e.g., SUMMER2024)
   - Discount type (percentage/fixed)
   - Discount value
   - Bonus credits (optional)
   - Max uses (optional - leave empty for unlimited)
   - Valid from/until dates (optional)
   - Description
4. Set active status
5. Create

**Edit/Delete Promo Code:**
- Click edit icon to modify
- Click delete icon to remove

### API Configuration

**Edit API Config:**
1. Navigate to `/admin/api-configs`
2. Click "Edit" on any service
3. Update:
   - API key (hidden for security)
   - API secret (optional)
   - Endpoint URL
   - Rate limit
   - Additional config (JSON format)
   - Active status
4. Save changes

**Enable/Disable Service:**
- Click "Enable" or "Disable" button on any service card

### Notifications

**Create Notification:**
1. Navigate to `/admin/notifications`
2. Click "Create Notification"
3. Fill in:
   - Title
   - Message
   - Type (info/success/warning/error)
   - Priority (low/normal/high)
   - Target (all users or specific user)
   - Action URL (optional)
   - Expiration date (optional)
4. Send

**Broadcast to All Users:**
- Select "All Users (Broadcast)"
- Creates individual notifications for each active user

**Delete Notification:**
- Click trash icon to remove

### Activity Logs

**View Logs:**
- Navigate to `/admin/activity-logs`
- See all activities with timestamps
- View user, activity type, description, IP address
- Click "View" to see detailed metadata

### System Settings

**Update Settings:**
1. Navigate to `/admin/settings`
2. Modify any setting
3. Click "Save All Settings"

**Available Settings:**
- Site name
- Maintenance mode
- Default credits for new users
- Credit costs per generation type
- Max daily generations
- Registration enabled
- Google auth enabled

---

## 🗄️ Database Schema

### Tables Created

#### `promo_codes`
```sql
- id (SERIAL PRIMARY KEY)
- code (VARCHAR UNIQUE)
- description (TEXT)
- discount_type (VARCHAR) - 'percentage' or 'fixed'
- discount_value (DECIMAL)
- credits_bonus (INTEGER)
- max_uses (INTEGER)
- uses_count (INTEGER)
- is_active (BOOLEAN)
- valid_from (TIMESTAMP)
- valid_until (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### `api_configs`
```sql
- id (SERIAL PRIMARY KEY)
- service_name (VARCHAR UNIQUE)
- api_key (TEXT)
- api_secret (TEXT)
- endpoint_url (TEXT)
- is_active (BOOLEAN)
- rate_limit (INTEGER)
- additional_config (JSONB)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### `notifications`
```sql
- id (SERIAL PRIMARY KEY)
- title (VARCHAR)
- message (TEXT)
- type (VARCHAR) - 'info', 'success', 'warning', 'error'
- target_users (VARCHAR) - 'all' or 'specific'
- user_id (INTEGER FK)
- is_read (BOOLEAN)
- priority (VARCHAR) - 'low', 'normal', 'high'
- action_url (VARCHAR)
- expires_at (TIMESTAMP)
- created_at (TIMESTAMP)
```

#### `user_activity_logs`
```sql
- id (SERIAL PRIMARY KEY)
- user_id (INTEGER FK)
- activity_type (VARCHAR)
- description (TEXT)
- metadata (JSONB)
- ip_address (VARCHAR)
- user_agent (TEXT)
- created_at (TIMESTAMP)
```

#### `credit_transactions`
```sql
- id (SERIAL PRIMARY KEY)
- user_id (INTEGER FK)
- amount (INTEGER)
- transaction_type (VARCHAR) - 'credit' or 'debit'
- description (TEXT)
- balance_after (INTEGER)
- admin_id (INTEGER FK)
- promo_code_id (INTEGER FK)
- metadata (JSONB)
- created_at (TIMESTAMP)
```

#### `ai_generation_history`
```sql
- id (SERIAL PRIMARY KEY)
- user_id (INTEGER FK)
- generation_type (VARCHAR)
- model_used (VARCHAR)
- prompt (TEXT)
- result_url (TEXT)
- credits_used (INTEGER)
- status (VARCHAR)
- metadata (JSONB)
- created_at (TIMESTAMP)
```

#### `admin_settings`
```sql
- id (SERIAL PRIMARY KEY)
- setting_key (VARCHAR UNIQUE)
- setting_value (TEXT)
- setting_type (VARCHAR) - 'string', 'number', 'boolean'
- description (TEXT)
- updated_by (INTEGER FK)
- updated_at (TIMESTAMP)
```

---

## 🔌 API Endpoints

### User Management
- `GET /admin/users` - List all users
- `GET /admin/users/:id` - Get user details
- `PUT /admin/users/:id` - Update user
- `POST /admin/users/:id/credits` - Add/deduct credits
- `DELETE /admin/users/:id` - Delete user

### Promo Codes
- `GET /admin/promo-codes` - List all promo codes
- `POST /admin/promo-codes` - Create promo code
- `PUT /admin/promo-codes/:id` - Update promo code
- `DELETE /admin/promo-codes/:id` - Delete promo code

### API Configs
- `GET /admin/api-configs` - List all API configs
- `GET /admin/api-configs/:id` - Get API config with keys
- `PUT /admin/api-configs/:id` - Update API config

### Notifications
- `GET /admin/notifications` - List all notifications
- `POST /admin/notifications` - Create notification
- `DELETE /admin/notifications/:id` - Delete notification

### Activity Logs
- `GET /admin/activity-logs` - List activity logs (paginated)

### Settings
- `GET /admin/settings` - Get all settings
- `PUT /admin/settings` - Update setting

---

## 🔒 Security

### Access Control
- All admin routes require authentication (`ensureAuthenticated`)
- All admin routes require admin role (`ensureAdmin`)
- Admins cannot delete their own accounts
- API keys are hidden in list views

### Activity Logging
- All admin actions are logged with:
  - User ID
  - Action type
  - IP address
  - User agent
  - Request metadata

### Data Protection
- Passwords are never returned in queries
- API secrets are optional and encrypted in storage
- Session-based authentication with secure cookies
- CSRF protection via method override

---

## 🎨 UI Features

### Modern Design
- Tailwind CSS for styling
- Font Awesome icons
- Responsive grid layouts
- Hover effects and transitions

### Interactive Elements
- Toast notifications for user feedback
- Modal dialogs for forms
- Confirmation prompts for destructive actions
- Real-time form validation

### Navigation
- Sidebar navigation with active states
- Breadcrumbs for deep navigation
- Quick action cards on dashboard

---

## 📊 Usage Examples

### Example 1: Give User 100 Credits

```javascript
// Via Admin Panel:
1. Go to /admin/users
2. Click on user
3. Click "Add Credits"
4. Enter: 100
5. Description: "Welcome bonus"
6. Submit
```

### Example 2: Create 20% Discount Code

```javascript
// Via Admin Panel:
1. Go to /admin/promo-codes
2. Click "Create Promo Code"
3. Code: WELCOME20
4. Type: percentage
5. Value: 20
6. Credits Bonus: 50
7. Max Uses: 100
8. Submit
```

### Example 3: Broadcast Notification

```javascript
// Via Admin Panel:
1. Go to /admin/notifications
2. Click "Create Notification"
3. Title: "New Feature Released!"
4. Message: "Check out our new AI video generator"
5. Type: info
6. Priority: high
7. Target: All Users
8. Send
```

---

## 🐛 Troubleshooting

### Cannot Access Admin Panel
- Ensure you're logged in
- Verify your user has `role = 'admin'` in database
- Check if admin routes are registered in `server.js`

### Database Errors
- Run: `node src/config/adminDatabase.js`
- Check database connection in `.env`
- Verify PostgreSQL is running

### Missing Features
- Clear browser cache
- Restart server
- Check console for JavaScript errors

---

## 🚀 Next Steps

1. **Integrate with Payment System** - Add payment processing for subscriptions
2. **Email Integration** - Send email notifications to users
3. **Advanced Analytics** - Add charts and graphs
4. **Bulk Operations** - Add bulk user actions
5. **Export Data** - Add CSV/JSON export functionality
6. **Audit Trail** - Enhanced logging with rollback capability

---

## 📞 Support

For issues or questions:
- Check the logs: `npm run dev`
- Review database schema
- Verify environment variables
- Check admin access permissions

---

**Built with ❤️ for PixelNest AI Automation Platform**

