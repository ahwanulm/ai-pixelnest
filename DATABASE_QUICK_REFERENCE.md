# 📚 Database Quick Reference Guide

**Last Updated:** 29 Oktober 2025  
**Database Status:** ✅ HEALTHY & CONSISTENT

---

## 🚀 Quick Commands

### Database Setup & Verification
```bash
# Setup database (create all tables)
npm run setup-db

# Verify database (check tables exist)
npm run verify-db

# Check column details
npm run check-columns

# Fix column inconsistencies
npm run fix-columns

# Soft reset (setup + populate, no delete)
npm run reset-db

# 🔴 FULL DATABASE RESET (⚠️ DELETES ALL DATA!)
npm run reset-db:full
# atau
npm run nuke-db
```

---

## 📊 Database Statistics

```
Total Tables: 26/26 ✅
Total Indexes: 116 ✅
Total Columns (key tables): 173
```

### Table Categories:
- **Authentication:** 2 tables (users, sessions)
- **Basic Application:** 6 tables
- **Admin & Management:** 7 tables
- **AI Models & Pricing:** 3 tables
- **Payment System:** 2 tables
- **Referral System:** 3 tables
- **Feature Requests:** 3 tables

---

## 🔑 Key Tables Schema

### 1. `users` (37 columns)
```sql
id, email, name, password_hash, google_id, role
credits (DECIMAL 10,2), is_active, referral_code
email_verified, activation_code, generation_count
... (+ 25 more columns)
```

### 2. `ai_models` (38 columns)
```sql
id, model_id, name, provider, description, category, type
cost (DECIMAL), fal_price, fal_verified, pricing_type
pricing_structure, price_per_megapixel, price_per_second
... (+ advanced pricing columns)
```

### 3. `ai_generation_history` (23 columns)
```sql
id, user_id, generation_type, model_name
cost_credits (DECIMAL 10,2) -- PRIMARY credit column
status, job_id, fal_request_id
result_url, prompt, settings
error_message, completed_at, viewed_at
```

**⚠️ Important:** Use `cost_credits` NOT `credits_used` or `credits_cost`

### 4. `payment_transactions` (29 columns)
```sql
id, user_id, reference, merchant_ref
amount, credits_amount, credit_price_idr
payment_method, payment_name, status
promo_code, discount_amount
paid_at, expired_time
```

### 5. `feature_requests` (20 columns)
```sql
id, user_id, request_type, title, description
status, priority, upvotes
reward_amount, reward_given
admin_response, responded_at
```

**⚠️ Important:** Use `request_type` NOT `type`

---

## 🎯 Column Naming Conventions

### Credits & Money
```
✅ cost_credits (DECIMAL 10,2) -- for generation costs
✅ credits (DECIMAL 10,2) -- for user balance
✅ amount (DECIMAL 10,2) -- for transactions
❌ credits_used -- deprecated
❌ credits_cost -- deprecated
```

### Status Fields
```
✅ is_active (BOOLEAN)
✅ is_verified (BOOLEAN)
✅ email_verified (BOOLEAN)
```

### Timestamps
```
✅ created_at (TIMESTAMP)
✅ updated_at (TIMESTAMP)
✅ completed_at (TIMESTAMP)
✅ activated_at (TIMESTAMP)
```

### IDs & References
```
✅ user_id (INTEGER FK)
✅ model_id (VARCHAR/INTEGER)
✅ job_id (VARCHAR)
✅ fal_request_id (VARCHAR) -- NEW!
```

---

## 🔍 Important Indexes

### ai_generation_history (8 indexes)
```sql
idx_generation_user_id
idx_generation_type
idx_generation_status
idx_generation_job_id
idx_generation_fal_request_id -- NEW!
```

### users (12 indexes)
```sql
idx_users_email (UNIQUE)
idx_users_activation_code
idx_users_password_reset_code
idx_users_email_verified
idx_users_is_active
```

### ai_models (8 indexes)
```sql
idx_models_type
idx_models_category
idx_models_active
idx_models_pinned
idx_pricing_structure
```

---

## ⚠️ Known Issues & Solutions

### Issue 1: Duplicate Credit Columns
**Problem:** `credits_used`, `credits_cost`, `cost_credits`  
**Solution:** ✅ FIXED - Use `cost_credits` only  
**Script:** `npm run fix-columns`

### Issue 2: Duplicate Type Columns
**Problem:** `type` and `request_type` in feature_requests  
**Solution:** ✅ FIXED - Use `request_type` only  
**Script:** `npm run fix-columns`

### Issue 3: Missing fal_request_id
**Problem:** Column missing in setupDatabase.js  
**Solution:** ✅ FIXED - Added to schema  
**Script:** Already applied

---

## 🛠️ Maintenance Scripts

### Database Health Checks
```bash
# Full verification
npm run verify-db

# Column structure check
npm run check-columns

# Fix inconsistencies
npm run fix-columns
```

### Cleanup Operations
```bash
# Clean expired jobs
npm run cleanup:jobs

# Clean failed jobs
npm run cleanup:failed-jobs

# Clean stale sessions
npm run cleanup:sessions
```

### Model & Pricing Updates
```bash
# Sync FAL models
npm run sync:models

# Update pricing
npm run update:pricing

# Verify pricing
npm run verify:pricing
```

---

## 📈 Data Consistency Rules

### 1. Credits Must Be Decimal(10,2)
```sql
-- All credit-related columns
users.credits: DECIMAL(10,2)
ai_generation_history.cost_credits: DECIMAL(10,2)
credit_transactions.amount: DECIMAL(10,2)
```

### 2. Single Source of Truth
```
✅ ONE column for ONE piece of data
❌ NO duplicate columns
```

### 3. Consistent Naming
```
cost_credits > credits_used
request_type > type
is_active > active
```

### 4. Proper Foreign Keys
```sql
user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
model_id INTEGER REFERENCES ai_models(id) ON DELETE CASCADE
```

---

## 🔐 Security Best Practices

### Sensitive Columns
```
password_hash -- bcrypt hashed
activation_code -- 6 digits, expires
password_reset_code -- 6 digits, expires
email_verification_token -- UUID
api_configs.api_key -- encrypted
```

### Access Control
```sql
users.role: 'admin' | 'user'
users.is_active: true/false
users.email_verified: true/false
```

---

## 📝 Migration Checklist

When making schema changes:

- [ ] Update setupDatabase.js (CREATE TABLE)
- [ ] Add ALTER TABLE for existing databases
- [ ] Create migration script if needed
- [ ] Add/update indexes
- [ ] Test on development database
- [ ] Update this documentation
- [ ] Run `npm run verify-db`
- [ ] Run `npm run check-columns`
- [ ] Deploy to production

---

## 🎓 Common Queries

### Get User Credits
```sql
SELECT id, name, email, credits 
FROM users 
WHERE id = $1;
```

### Get Generation History with Credits
```sql
SELECT id, generation_type, model_name, 
       cost_credits, status, created_at
FROM ai_generation_history 
WHERE user_id = $1 
ORDER BY created_at DESC;
```

### Get Active Models
```sql
SELECT id, model_id, name, type, cost, fal_price
FROM ai_models 
WHERE is_active = true
ORDER BY type, name;
```

### Check Payment Status
```sql
SELECT reference, amount, credits_amount, 
       status, paid_at
FROM payment_transactions 
WHERE user_id = $1
ORDER BY created_at DESC;
```

---

## 🆘 Troubleshooting

### Database Connection Failed
```bash
1. Check PostgreSQL is running
2. Verify .env DATABASE_URL
3. Check database exists: psql -l
4. Test connection: npm run verify-db
```

### Table Missing
```bash
1. Run: npm run setup-db
2. Verify: npm run verify-db
3. Check logs for errors
```

### Column Missing
```bash
1. Run: npm run check-columns
2. Run: npm run fix-columns
3. Verify: npm run check-columns
```

### Inconsistent Data
```bash
1. Backup database first!
2. Run: npm run fix-columns
3. Verify data integrity
4. Check application logs
```

---

## 📞 Support

For issues or questions:
1. Check this guide first
2. Review DATABASE_CONSISTENCY_FIX_SUMMARY.md
3. Check COLUMN_INCONSISTENCIES_REPORT.md
4. Review application logs
5. Contact database administrator

---

**Remember:**
- ✅ Always backup before schema changes
- ✅ Test on dev before production
- ✅ Use migration scripts for changes
- ✅ Keep documentation updated

---

*Last verified: 29 Oktober 2025*  
*Database Version: 2.0.0*  
*Status: Production Ready ✅*

