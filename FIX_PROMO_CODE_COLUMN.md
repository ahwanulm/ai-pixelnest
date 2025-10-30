# 🔧 Fix: Column "promo_code" Does Not Exist

> **Quick fix untuk error: column "promo_code" of relation "payment_transactions" does not exist**

---

## 🐛 Error

```
Error creating payment: error: column "promo_code" of relation "payment_transactions" does not exist
    at /Users/ahwanulm/Desktop/PROJECT/PIXELNEST/node_modules/pg/lib/client.js:545:17
    at createPayment (/Users/ahwanulm/Desktop/PROJECT/PIXELNEST/src/controllers/paymentController.js:361:28)
```

---

## 🔍 Root Cause

Kolom `promo_code` belum ditambahkan ke tabel `payment_transactions`.

Ini terjadi karena:
1. Migration `add_promo_codes.sql` belum dijalankan
2. Atau hanya tabel `promo_codes` yang dibuat, tapi kolom di `payment_transactions` terlewat

---

## ✅ Quick Fix (RECOMMENDED)

### Method 1: Run Simple Migration

```bash
# Connect to database dan jalankan migration
psql -U postgres -d pixelnest -f migrations/add_promo_code_column.sql
```

### Method 2: Manual SQL

```sql
-- Connect ke database
psql -U postgres -d pixelnest

-- Add column
ALTER TABLE payment_transactions 
ADD COLUMN IF NOT EXISTS promo_code VARCHAR(50);

-- Add index
CREATE INDEX IF NOT EXISTS idx_payment_transactions_promo_code 
ON payment_transactions(promo_code);

-- Verify
\d payment_transactions
```

### Method 3: Via Database GUI

Jika menggunakan pgAdmin atau DBeaver:

1. Connect ke database `pixelnest`
2. Navigate ke table `payment_transactions`
3. Add new column:
   - Name: `promo_code`
   - Type: `VARCHAR(50)`
   - Nullable: `Yes`
4. Save changes

---

## 🧪 Verify Installation

### Check 1: Column Exists

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'payment_transactions' 
  AND column_name = 'promo_code';
```

**Expected Result:**
```
 column_name | data_type         | is_nullable
-------------+-------------------+-------------
 promo_code  | character varying | YES
```

### Check 2: Table Structure

```sql
\d payment_transactions
```

Should include:
```
Column       | Type                  | Nullable
-------------+-----------------------+----------
...
promo_code   | character varying(50) | 
...
```

---

## 🚀 Complete Setup (Full Migration)

If you want to run the complete promo code setup:

```bash
# This will create BOTH:
# 1. promo_codes table
# 2. promo_code column in payment_transactions
psql -U postgres -d pixelnest -f migrations/add_promo_codes.sql
```

This file includes:
- ✅ Create `promo_codes` table
- ✅ Add `promo_code` column to `payment_transactions`
- ✅ Create indexes
- ✅ Insert sample promo codes

---

## 🔍 Troubleshooting

### Error: "relation payment_transactions does not exist"

**Cause:** Table belum dibuat

**Solution:**
```sql
-- Check if table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'payment_transactions'
);
```

If returns `false`, you need to create the table first.

### Error: "permission denied"

**Cause:** Database user tidak punya permission

**Solution:**
```sql
-- Grant permissions
GRANT ALL PRIVILEGES ON TABLE payment_transactions TO your_user;
```

### Error: "column already exists"

**Cause:** Column sudah ada tapi masih error

**Solution:**
```sql
-- Check column type
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'payment_transactions' 
  AND column_name = 'promo_code';

-- If wrong type, drop and recreate
ALTER TABLE payment_transactions DROP COLUMN promo_code;
ALTER TABLE payment_transactions ADD COLUMN promo_code VARCHAR(50);
```

---

## 📝 Database Credentials

Make sure you use correct credentials:

```bash
# Format:
psql -U <username> -d <database_name> -f <migration_file>

# Example:
psql -U postgres -d pixelnest -f migrations/add_promo_code_column.sql

# Or if different user:
psql -U ahwanulm -d pixelnest -f migrations/add_promo_code_column.sql
```

If you need password:
```bash
psql -U postgres -d pixelnest -W -f migrations/add_promo_code_column.sql
# -W will prompt for password
```

---

## 🎯 Test After Fix

### Step 1: Restart Server

```bash
# Stop server (Ctrl+C or Cmd+C)
# Start again
npm start
```

### Step 2: Test Promo Code Flow

1. Open dashboard
2. Click Top Up (+ button)
3. Select 200 credits
4. Enter promo code: `TEST`
5. Click "Terapkan"
6. Click "Pilih Metode Pembayaran"
7. Select payment method
8. Click "Konfirmasi Pembayaran"

**Expected:** Should work without errors!

### Step 3: Check Database

```sql
-- Check if promo_code is saved
SELECT id, reference, amount, credits_amount, promo_code, status
FROM payment_transactions
ORDER BY created_at DESC
LIMIT 5;
```

Should show promo_code if used:
```
id | reference | amount | credits | promo_code | status
---+-----------+--------+---------+------------+--------
1  | T123...   | 420000 | 200     | TEST       | UNPAID
```

---

## 📋 Quick Command Reference

```bash
# 1. Add column only (quick fix)
psql -U postgres -d pixelnest -f migrations/add_promo_code_column.sql

# 2. Full promo setup (table + column + samples)
psql -U postgres -d pixelnest -f migrations/add_promo_codes.sql

# 3. Check promo codes
psql -U postgres -d pixelnest -f check_promo_codes.sql

# 4. Connect to database
psql -U postgres -d pixelnest

# 5. Show tables
\dt

# 6. Describe table
\d payment_transactions

# 7. Exit
\q
```

---

## 🎉 Summary

### Problem:
```
❌ column "promo_code" of relation "payment_transactions" does not exist
```

### Solution:
```sql
✅ ALTER TABLE payment_transactions ADD COLUMN promo_code VARCHAR(50);
```

### How to Fix:
```bash
# Run this command:
psql -U postgres -d pixelnest -f migrations/add_promo_code_column.sql
```

### Verify:
```sql
-- Should return 1 row:
SELECT column_name FROM information_schema.columns
WHERE table_name = 'payment_transactions' AND column_name = 'promo_code';
```

### After Fix:
1. ✅ Restart server
2. ✅ Test promo code feature
3. ✅ Should work perfectly!

---

## 📞 Need Help?

If still getting errors:

1. **Check database connection:**
   ```bash
   psql -U postgres -d pixelnest -c "SELECT 1;"
   ```

2. **Check table exists:**
   ```sql
   \dt payment_transactions
   ```

3. **Check user permissions:**
   ```sql
   \du
   ```

4. **Share error message** if different from above

---

**Status:** ✅ FIXED - Run migration and restart server!

