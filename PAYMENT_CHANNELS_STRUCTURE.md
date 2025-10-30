# Payment Channels Table - Struktur Final

## 📋 Struktur Tabel yang Benar

Ini adalah struktur **final dan benar** untuk tabel `payment_channels` yang sesuai dengan kode Tripay Service.

### Schema SQL

```sql
CREATE TABLE payment_channels (
  id SERIAL PRIMARY KEY,
  
  -- Channel Information
  code VARCHAR(50) UNIQUE NOT NULL,           -- Channel code (e.g., 'BRIVA', 'QRIS')
  name VARCHAR(100) NOT NULL,                 -- Channel name (e.g., 'BRI Virtual Account')
  group_channel VARCHAR(50) NOT NULL,         -- Channel group (e.g., 'Virtual Account', 'E-Wallet')
  
  -- Fee Information (Flat + Percent)
  fee_merchant_flat INTEGER DEFAULT 0,        -- Flat fee for merchant (IDR)
  fee_merchant_percent DECIMAL(5,2) DEFAULT 0,-- Percent fee for merchant (%)
  fee_customer_flat INTEGER DEFAULT 0,        -- Flat fee for customer (IDR)
  fee_customer_percent DECIMAL(5,2) DEFAULT 0,-- Percent fee for customer (%)
  
  -- Amount Limits
  minimum_amount INTEGER DEFAULT 10000,       -- Minimum transaction amount (IDR)
  maximum_amount INTEGER DEFAULT 0,           -- Maximum transaction amount (0 = unlimited)
  
  -- Display & Settings
  icon_url TEXT,                              -- Channel icon URL
  is_active BOOLEAN DEFAULT true,             -- Is channel active?
  settings JSONB,                             -- Additional settings (flexible)
  
  -- Audit Fields
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## ✅ Kolom yang Digunakan oleh Code

### Di `tripayService.js` - Query SELECT

```javascript
SELECT 
  code, name, group_channel,
  fee_merchant_flat, fee_merchant_percent,
  fee_customer_flat, fee_customer_percent,
  minimum_amount, maximum_amount,
  icon_url, is_active
FROM payment_channels
WHERE is_active = true
ORDER BY group_channel, name
```

### Di `tripayService.js` - Query INSERT/UPDATE

```javascript
INSERT INTO payment_channels (
  code, name, group_channel,
  fee_merchant_flat, fee_merchant_percent,
  fee_customer_flat, fee_customer_percent,
  minimum_amount, maximum_amount,
  icon_url, is_active, settings
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
ON CONFLICT (code) 
DO UPDATE SET
  name = EXCLUDED.name,
  group_channel = EXCLUDED.group_channel,
  fee_merchant_flat = EXCLUDED.fee_merchant_flat,
  fee_merchant_percent = EXCLUDED.fee_merchant_percent,
  fee_customer_flat = EXCLUDED.fee_customer_flat,
  fee_customer_percent = EXCLUDED.fee_customer_percent,
  minimum_amount = EXCLUDED.minimum_amount,
  maximum_amount = EXCLUDED.maximum_amount,
  icon_url = EXCLUDED.icon_url,
  is_active = EXCLUDED.is_active,
  settings = EXCLUDED.settings,
  updated_at = CURRENT_TIMESTAMP
```

## ❌ Struktur Lama yang SALAH (Sudah Tidak Digunakan)

Struktur lama yang menyebabkan error:

```sql
-- ❌ STRUKTUR LAMA - JANGAN GUNAKAN
CREATE TABLE payment_channels (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  group_name VARCHAR(100),              -- ❌ Seharusnya: group_channel
  fee_merchant JSONB,                   -- ❌ Seharusnya: fee_merchant_flat, fee_merchant_percent
  fee_customer JSONB,                   -- ❌ Seharusnya: fee_customer_flat, fee_customer_percent
  total_fee JSONB,                      -- ❌ Tidak diperlukan
  minimum_fee INTEGER,                  -- ❌ Seharusnya: minimum_amount
  maximum_fee INTEGER,                  -- ❌ Seharusnya: maximum_amount
  icon_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔄 Perubahan Kolom

| Nama Lama | Nama Baru | Tipe Lama | Tipe Baru | Keterangan |
|-----------|-----------|-----------|-----------|------------|
| `group_name` | `group_channel` | VARCHAR(100) | VARCHAR(50) NOT NULL | Rename + NOT NULL |
| `fee_merchant` | `fee_merchant_flat` + `fee_merchant_percent` | JSONB | INTEGER + DECIMAL(5,2) | Split menjadi 2 kolom |
| `fee_customer` | `fee_customer_flat` + `fee_customer_percent` | JSONB | INTEGER + DECIMAL(5,2) | Split menjadi 2 kolom |
| `total_fee` | *(dihapus)* | JSONB | - | Tidak diperlukan |
| `minimum_fee` | `minimum_amount` | INTEGER | INTEGER | Rename saja |
| `maximum_fee` | `maximum_amount` | INTEGER | INTEGER | Rename saja |
| - | `settings` | - | JSONB | Kolom baru untuk config tambahan |

## 📊 Contoh Data

```sql
INSERT INTO payment_channels VALUES
(
  1,                            -- id
  'BRIVA',                      -- code
  'BRI Virtual Account',        -- name
  'Virtual Account',            -- group_channel
  
  4000,                         -- fee_merchant_flat (IDR 4,000)
  0.00,                         -- fee_merchant_percent (0%)
  4000,                         -- fee_customer_flat (IDR 4,000)
  0.00,                         -- fee_customer_percent (0%)
  
  10000,                        -- minimum_amount (IDR 10,000)
  1000000000,                   -- maximum_amount (IDR 1 Miliar)
  
  'https://tripay.co.id/images/bri.png', -- icon_url
  true,                         -- is_active
  '{"display_order": 1}',       -- settings
  
  NOW(),                        -- created_at
  NOW()                         -- updated_at
),
(
  2,                            -- id
  'QRIS',                       -- code
  'QRIS (All E-Wallet)',        -- name
  'E-Wallet',                   -- group_channel
  
  0,                            -- fee_merchant_flat
  0.70,                         -- fee_merchant_percent (0.7%)
  0,                            -- fee_customer_flat
  0.70,                         -- fee_customer_percent (0.7%)
  
  10000,                        -- minimum_amount
  5000000,                      -- maximum_amount (IDR 5 Juta)
  
  'https://tripay.co.id/images/qris.png', -- icon_url
  true,                         -- is_active
  '{"display_order": 2}',       -- settings
  
  NOW(),                        -- created_at
  NOW()                         -- updated_at
);
```

## 🔧 Migration Files

1. **migrations/fix_payment_channels_structure_complete.sql**
   - Migration lengkap untuk fix semua kolom
   - Aman dijalankan berulang kali (idempotent)
   - Tidak menghapus data existing

2. **fix-payment-channels-complete.sh**
   - Script untuk menjalankan migration
   - Auto-load credentials dari .env
   - Memberikan instruksi next steps

## 🚀 Cara Deploy

### Di Server:

```bash
# 1. Pull latest code
cd /var/www/pixelnest
git pull origin main

# 2. Run migration script
bash fix-payment-channels-complete.sh

# 3. Restart PM2
pm2 restart pixelnest-server

# 4. Sync channels dari Tripay API
npm run sync:tripay-channels

# 5. Verify
pm2 logs pixelnest-server --lines 50
```

## ✅ Verifikasi

### Check struktur tabel di database:

```sql
\d payment_channels
```

### Check apakah ada data:

```sql
SELECT code, name, group_channel, 
       fee_merchant_flat, fee_customer_flat,
       minimum_amount, maximum_amount, is_active
FROM payment_channels;
```

### Test API endpoint:

```bash
curl http://localhost:3000/api/payment/channels
```

Expected response:
```json
{
  "success": true,
  "data": {
    "Virtual Account": [
      {
        "code": "BRIVA",
        "name": "BRI Virtual Account",
        "group_channel": "Virtual Account",
        "fee_merchant_flat": 4000,
        "fee_merchant_percent": "0.00",
        "fee_customer_flat": 4000,
        "fee_customer_percent": "0.00",
        "minimum_amount": 10000,
        "maximum_amount": 1000000000,
        "icon_url": "...",
        "is_active": true
      }
    ],
    "E-Wallet": [...]
  }
}
```

## 📝 Files yang Sudah Konsisten

✅ All files now use the correct structure:

1. `src/services/tripayService.js` - SELECT & INSERT queries
2. `src/config/setupDatabase.js` - CREATE TABLE statement
3. `src/config/migrateTripayPayment.js` - CREATE TABLE statement
4. `migrations/fix_payment_channels_structure_complete.sql` - Migration SQL

## 🎯 Summary

| Item | Status |
|------|--------|
| Schema defined | ✅ Correct |
| Code queries | ✅ Consistent |
| Migration ready | ✅ Yes |
| Backward compatible | ✅ Yes (migration handles old structure) |
| Data loss risk | ✅ None (data preserved) |
| Ready to deploy | ✅ Yes |

---

**Last Updated:** 2025-10-29  
**Migration Version:** v1.0 - Complete Structure Fix

