# 🚀 Quick Fix - Payment Channels Deployment

## ⚡ Jalankan di Server (Root Access)

```bash
cd /var/www/pixelnest

# Pull latest changes
git pull origin main

# Run migration script (akan auto load dari .env)
bash fix-payment-channels-complete.sh

# Restart PM2
pm2 restart pixelnest-server

# Optional: Sync payment channels dari Tripay
npm run sync:tripay-channels
```

## ✅ Selesai!

Error `column "group_channel" does not exist` dan `column "fee_merchant_flat" does not exist` seharusnya sudah teratasi.

---

## 🔍 Jika Ada Masalah

### Manual Migration (jika script tidak jalan):

```bash
cd /var/www/pixelnest

# Load credentials
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=pixelnest_db
export DB_USER=pixelnest_user
export DB_PASSWORD=mRua5xVr0xlayFowwPuO5fqagpkKesiT

# Run migration with password
PGPASSWORD=$DB_PASSWORD psql \
  -h $DB_HOST \
  -U $DB_USER \
  -d $DB_NAME \
  -f migrations/fix_payment_channels_structure_complete.sql

# Restart
pm2 restart pixelnest-server
```

### Verify Migration Success:

```bash
# Check PM2 logs (tidak ada error lagi)
pm2 logs pixelnest-server --lines 50

# Test API endpoint
curl http://localhost:3000/api/payment/channels

# Should return: {"success":true,"data":{...}}
```

---

## 📋 Apa yang Diperbaiki?

### Kolom yang Direname:
- `group_name` → `group_channel`
- `minimum_fee` → `minimum_amount`
- `maximum_fee` → `maximum_amount`

### Kolom yang Diganti:
- `fee_merchant` (JSONB) → `fee_merchant_flat` (INTEGER) + `fee_merchant_percent` (DECIMAL)
- `fee_customer` (JSONB) → `fee_customer_flat` (INTEGER) + `fee_customer_percent` (DECIMAL)

### Kolom yang Dihapus:
- `total_fee` (tidak diperlukan)

### Kolom yang Ditambahkan:
- `settings` (JSONB) - untuk konfigurasi tambahan

---

## 📞 Support

Jika masih ada error, kirim output dari:
```bash
pm2 logs pixelnest-server --lines 100
```

