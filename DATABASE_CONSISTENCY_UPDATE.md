# Database Consistency Update

## Overview

This update ensures the database schema is consistent with the latest `setupDatabase.js` configuration. The main changes include:

1. **Added `api_configs` table** - For storing external service configurations (Tripay, etc.)
2. **Verified `payment_channels` structure** - Ensures `group_channel` column is used consistently
3. **Added proper indexes** - For better database performance

## What's Fixed

### 1. Missing `api_configs` Table
- **Problem**: The `api_configs` table was missing from `setupDatabase.js`
- **Solution**: Added table creation with proper structure and indexes
- **Impact**: Enables Tripay configuration storage and management

### 2. Database Schema Consistency
- **Problem**: Database might have inconsistent column names (`group_name` vs `group_channel`)
- **Solution**: Automatic detection and renaming of columns
- **Impact**: Ensures payment channels work correctly

### 3. Missing Indexes
- **Problem**: Performance issues due to missing indexes
- **Solution**: Added indexes for `api_configs` table
- **Impact**: Faster queries and better performance

## How to Apply

### Option 1: Run Update Script (Recommended)
```bash
# Update existing database to be consistent
npm run update:db-consistency
```

### Option 2: Fresh Database Setup
```bash
# If starting fresh, use the updated setupDatabase.js
npm run setup-db
```

## What the Update Does

### 1. Creates `api_configs` Table
```sql
CREATE TABLE IF NOT EXISTS api_configs (
  id SERIAL PRIMARY KEY,
  service_name VARCHAR(100) UNIQUE NOT NULL,
  api_key TEXT NOT NULL,
  api_secret TEXT,
  endpoint_url TEXT,
  is_active BOOLEAN DEFAULT true,
  rate_limit INTEGER DEFAULT 100,
  additional_config JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Adds Performance Indexes
```sql
-- API Configs indexes
CREATE INDEX IF NOT EXISTS idx_api_configs_service ON api_configs(service_name);
CREATE INDEX IF NOT EXISTS idx_api_configs_active ON api_configs(is_active) WHERE is_active = true;
```

### 3. Fixes Column Names
```sql
-- Renames group_name to group_channel if needed
ALTER TABLE payment_channels 
RENAME COLUMN group_name TO group_channel;
```

## Verification

After running the update, you can verify everything is working:

```bash
# Check if api_configs table exists
npm run verify:payment-channels

# Check database structure
psql -h localhost -U pixelnest_user -d pixelnest_db -c "\d api_configs"
psql -h localhost -U pixelnest_user -d pixelnest_db -c "\d payment_channels"
```

## Expected Results

After the update, you should see:

1. ✅ `api_configs` table created with proper structure
2. ✅ `payment_channels` uses `group_channel` column (not `group_name`)
3. ✅ Proper indexes for better performance
4. ✅ Database schema matches `setupDatabase.js`

## Troubleshooting

### If Update Fails
1. Check database connection in `.env` file
2. Ensure PostgreSQL is running
3. Verify database user has proper permissions
4. Check logs for specific error messages

### If Tripay Still Not Working
1. Ensure you've added Tripay config via Admin Panel
2. Restart PM2 after adding config: `pm2 restart all`
3. Check if `endpoint_url` is set to production URL

## Files Modified

- `src/config/setupDatabase.js` - Added `api_configs` table creation
- `package.json` - Added `update:db-consistency` script
- `update-database-consistency.js` - New update script (created)

## Next Steps

After running this update:

1. **Add Tripay Configuration** via Admin Panel
2. **Restart PM2** to reload configurations
3. **Test Payment Methods** to ensure they appear
4. **Verify Production Mode** is working correctly

---

**Note**: This update is safe to run multiple times. It uses `IF NOT EXISTS` and `IF NOT EXISTS` clauses to prevent errors.
