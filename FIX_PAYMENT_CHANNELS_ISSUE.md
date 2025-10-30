# Fix untuk Error Payment Channels saat Deploy

## 🐛 Problem

Error yang terjadi:
```
Error getting payment channels: error: column "group_channel" does not exist
```

## 🔍 Root Cause

Ada mismatch nama kolom di database `payment_channels`:
- Database menggunakan: `group_name` 
- Code menggunakan: `group_channel`

Ini terjadi karena ada perbedaan antara:
- `src/config/setupDatabase.js` (menggunakan `group_name`)
- `src/config/migrateTripayPayment.js` (menggunakan `group_channel`)
- `src/services/tripayService.js` (menggunakan `group_channel`)

## ✅ Solution

### Files yang Sudah Diperbaiki:

1. **migrations/fix_payment_channels_column.sql** (NEW)
   - Migration SQL untuk rename kolom `group_name` → `group_channel`

2. **src/config/setupDatabase.js** (UPDATED)
   - Schema diupdate untuk menggunakan `group_channel`
   - Fee structure disesuaikan dengan `migrateTripayPayment.js`

3. **fix-payment-channels-deployment.sh** (NEW)
   - Script helper untuk deploy fix ini

## 🚀 Cara Deploy Fix

### Option 1: Menggunakan Script (Recommended)

```bash
# Di local machine
git add .
git commit -m "Fix payment_channels column name mismatch"
git push origin main

# Di server
cd /var/www/pixelnest
git pull origin main

# Set DATABASE_URL jika belum (sesuaikan dengan kredensial Anda)
export DATABASE_URL="postgresql://username:password@localhost:5432/pixelnest"

# Jalankan fix script
./fix-payment-channels-deployment.sh

# Restart PM2
pm2 restart pixelnest-server
```

### Option 2: Manual Migration

```bash
# Di server
cd /var/www/pixelnest
git pull origin main

# Jalankan migration SQL langsung
psql "postgresql://username:password@localhost:5432/pixelnest" \
  -f migrations/fix_payment_channels_column.sql

# Restart PM2
pm2 restart pixelnest-server
```

### Option 3: Menggunakan psql interaktif

```bash
# Login ke PostgreSQL
psql -U your_username -d pixelnest

# Jalankan migration
\i /var/www/pixelnest/migrations/fix_payment_channels_column.sql

# Keluar
\q

# Restart PM2
pm2 restart pixelnest-server
```

## 🧪 Verifikasi

Setelah deploy, cek apakah error sudah hilang:

```bash
# Cek PM2 logs
pm2 logs pixelnest-server --lines 50

# Test endpoint payment channels
curl http://localhost:3000/api/payment/channels
```

Anda seharusnya tidak lagi melihat error `column "group_channel" does not exist`.

## 📊 Schema yang Benar

Setelah fix, struktur tabel `payment_channels` seharusnya:

```sql
CREATE TABLE payment_channels (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  group_channel VARCHAR(50) NOT NULL,  -- ✅ BUKAN group_name
  
  -- Fee Info
  fee_merchant_flat INTEGER DEFAULT 0,
  fee_merchant_percent DECIMAL(5,2) DEFAULT 0,
  fee_customer_flat INTEGER DEFAULT 0,
  fee_customer_percent DECIMAL(5,2) DEFAULT 0,
  
  -- Limits
  minimum_amount INTEGER DEFAULT 10000,
  maximum_amount INTEGER DEFAULT 0,
  
  -- Icons & Display
  icon_url TEXT,
  is_active BOOLEAN DEFAULT true,
  settings JSONB,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## ⚠️ Catatan Penting

1. Migration SQL ini **safe** dan **idempotent** - bisa dijalankan beberapa kali tanpa masalah
2. Migration akan:
   - Rename `group_name` → `group_channel` jika kolom `group_name` ada
   - Buat kolom `group_channel` baru jika tidak ada sama sekali
   - Skip jika `group_channel` sudah ada

3. Tidak ada data yang hilang dalam proses ini

## 🎯 Summary

| Item | Status |
|------|--------|
| Migration SQL | ✅ Created |
| Schema Fix | ✅ Updated |
| Deploy Script | ✅ Ready |
| Backward Compatible | ✅ Yes |
| Data Loss Risk | ✅ None |

Setelah fix ini di-deploy, endpoint `/api/payment/channels` seharusnya berfungsi normal kembali.

