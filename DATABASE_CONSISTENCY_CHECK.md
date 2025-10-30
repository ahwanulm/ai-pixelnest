# Database Consistency Check - Payment Channels

## 🎯 Tujuan

Memastikan struktur `payment_channels` table konsisten di:
1. ✅ Database schema (actual database)
2. ✅ Code expectations (tripayService.js)
3. ✅ Setup scripts (setupDatabase.js)
4. ✅ Migration scripts

## 📋 Files yang Sudah Konsisten

### ✅ Source of Truth (Struktur yang BENAR)

1. **src/config/setupDatabase.js** (Line 640-669)
   ```javascript
   CREATE TABLE IF NOT EXISTS payment_channels (
     code, name, group_channel,
     fee_merchant_flat, fee_merchant_percent,
     fee_customer_flat, fee_customer_percent,
     minimum_amount, maximum_amount,
     icon_url, is_active, settings,
     created_at, updated_at
   )
   ```

2. **src/config/migrateTripayPayment.js** (Line 77-105)
   - Sama dengan setupDatabase.js ✅

3. **src/services/tripayService.js** (Line 337-363)
   - Query SELECT & INSERT menggunakan kolom yang sama ✅

4. **migrations/fix_payment_channels_structure_complete.sql**
   - Migration untuk fix struktur lama → baru ✅

### ⚠️ Files yang TIDAK Digunakan (Backup)

- `src/config/setupDatabase.js.bak` - OLD structure (ignore)
- `src/config/setupDatabase.js.bak2` - OLD structure (ignore)

## 🔍 Cara Memverifikasi Konsistensi Database

### Option 1: Menggunakan Verification Script

```bash
# Di server
cd /var/www/pixelnest

PGPASSWORD=your_password psql \
  -h localhost \
  -U pixelnest_user \
  -d pixelnest_db \
  -f verify-payment-channels-structure.sql
```

Script ini akan:
- ✅ Check semua kolom yang required ada
- ✅ Check tidak ada kolom lama yang deprecated
- ✅ Show struktur tabel saat ini
- ✅ Show statistik data
- ✅ Show sample data

### Option 2: Manual Check via psql

```sql
-- Login ke database
psql -h localhost -U pixelnest_user -d pixelnest_db

-- Check struktur tabel
\d payment_channels

-- Expected output:
--   code                  | character varying(50)
--   name                  | character varying(100)
--   group_channel         | character varying(50)    ← MUST EXIST
--   fee_merchant_flat     | integer                  ← MUST EXIST
--   fee_merchant_percent  | numeric(5,2)             ← MUST EXIST
--   fee_customer_flat     | integer                  ← MUST EXIST
--   fee_customer_percent  | numeric(5,2)             ← MUST EXIST
--   minimum_amount        | integer                  ← MUST EXIST
--   maximum_amount        | integer                  ← MUST EXIST
--   icon_url              | text
--   is_active             | boolean
--   settings              | jsonb
--   created_at            | timestamp
--   updated_at            | timestamp

-- Check for OLD columns (should NOT exist)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'payment_channels' 
AND column_name IN ('group_name', 'fee_merchant', 'fee_customer', 
                    'total_fee', 'minimum_fee', 'maximum_fee');

-- Expected: 0 rows (no old columns)
```

### Option 3: Test via API Endpoint

```bash
# Test payment channels endpoint
curl http://localhost:3000/api/payment/channels

# Expected: {"success":true,"data":{...}}
# Should NOT see column errors in logs
```

## 🚨 Red Flags (Tanda Ada Masalah)

### ❌ Error Messages yang Menunjukkan Inkonsistensi:

```
❌ column "group_channel" does not exist
   → Migration belum dijalankan

❌ column "fee_merchant_flat" does not exist
   → Migration belum dijalankan

❌ column "group_name" is ambiguous
   → Ada kolom duplikat (group_name & group_channel)

❌ column "fee_merchant" of relation "payment_channels" does not exist
   → Code mencoba insert ke struktur lama
```

### ✅ Success Indicators:

```
✓ No errors in PM2 logs
✓ /api/payment/channels returns data
✓ Admin can sync channels successfully
✓ Verification script passes all checks
```

## 🔧 Memperbaiki Inkonsistensi

### Jika Struktur Salah di Database:

```bash
# Run migration untuk fix struktur
cd /var/www/pixelnest
bash fix-payment-channels-complete.sh

# Atau manual
PGPASSWORD=your_password psql \
  -h localhost -U pixelnest_user -d pixelnest_db \
  -f migrations/fix_payment_channels_structure_complete.sql
```

### Jika Data Kosong:

```bash
# Sync channels dari Tripay API
npm run sync:tripay-channels

# Atau via Admin Panel:
# Login → Payment Management → Sync Channels
```

## 📊 Expected Data Format

Setelah sync dari Tripay, data seharusnya seperti:

```sql
SELECT * FROM payment_channels LIMIT 1;

-- Example result:
id              | 1
code            | BRIVA
name            | BRI Virtual Account
group_channel   | Virtual Account
fee_merchant_flat    | 4000
fee_merchant_percent | 0.00
fee_customer_flat    | 4000
fee_customer_percent | 0.00
minimum_amount  | 10000
maximum_amount  | 1000000000
icon_url        | https://tripay.co.id/images/bri.png
is_active       | t
settings        | {"active":true}
created_at      | 2025-10-29 10:00:00
updated_at      | 2025-10-29 10:00:00
```

## 🧪 Testing Checklist

- [ ] Run verification script → All checks pass
- [ ] Check PM2 logs → No column errors
- [ ] Test API endpoint → Returns success
- [ ] Admin panel sync → Works without error
- [ ] Sample data → Looks correct

## 📝 Maintenance

### Kapan Perlu Re-verify:

1. Setelah deployment baru
2. Setelah run migration
3. Setelah restore database dari backup
4. Jika ada error di logs
5. Setelah update Tripay integration

### Regular Checks:

```bash
# Weekly check (add to cron if needed)
cd /var/www/pixelnest
PGPASSWORD=$DB_PASSWORD psql -h localhost -U pixelnest_user -d pixelnest_db \
  -c "SELECT COUNT(*) as channels, COUNT(CASE WHEN is_active THEN 1 END) as active FROM payment_channels;"
```

## 🎯 Summary

| Aspek | Status | File/Location |
|-------|--------|---------------|
| Setup Script | ✅ Correct | `src/config/setupDatabase.js` |
| Migration Script | ✅ Correct | `src/config/migrateTripayPayment.js` |
| Service Code | ✅ Correct | `src/services/tripayService.js` |
| Migration SQL | ✅ Ready | `migrations/fix_payment_channels_structure_complete.sql` |
| Verification Script | ✅ Ready | `verify-payment-channels-structure.sql` |
| Documentation | ✅ Complete | This file + others |

**Status:** 🟢 **CONSISTENT & READY**

Semua file source code sudah konsisten. Tinggal run migration di database server untuk menyesuaikan struktur database dengan code.

---

**Last Updated:** 2025-10-29  
**Version:** 1.0 - Complete Consistency Check

