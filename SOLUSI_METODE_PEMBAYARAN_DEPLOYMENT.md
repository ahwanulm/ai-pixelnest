# 🔧 Solusi: Metode Pembayaran Tidak Terbaca Saat Deployment

## 🐛 Masalah

Saat deployment, metode pembayaran tidak terbaca dan muncul error:
```
Error getting payment channels: error: column "group_channel" does not exist
```

## 🔍 Penyebab

Ada **mismatch nama kolom** di tabel database `payment_channels`:
- **Database menggunakan:** `group_name` (struktur lama)
- **Code menggunakan:** `group_channel` (struktur baru)

Ini terjadi karena migration database belum dijalankan di server production.

## ✅ Solusi Lengkap

### Langkah 1: Persiapan di Server

SSH ke server Anda:
```bash
ssh user@your-server-ip
cd /var/www/pixelnest
```

### Langkah 2: Pull Latest Code

```bash
# Pull kode terbaru dari repository
git pull origin main

# Pastikan semua file migration ada
ls -la migrations/fix_payment_channels_structure_complete.sql
```

### Langkah 3: Jalankan Migration Database

**Opsi A - Menggunakan Script Otomatis (RECOMMENDED):**
```bash
# Jalankan script migration
bash fix-payment-channels-complete.sh
```

**Opsi B - Manual dengan psql:**
```bash
# Load credentials dari .env
source .env

# Jalankan migration
PGPASSWORD="$DB_PASSWORD" psql \
  -h "$DB_HOST" \
  -p "${DB_PORT:-5432}" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -f migrations/fix_payment_channels_structure_complete.sql
```

### Langkah 4: Restart Aplikasi

```bash
# Restart PM2
pm2 restart pixelnest-server

# Cek logs untuk memastikan tidak ada error
pm2 logs pixelnest-server --lines 50
```

### Langkah 5: Sync Payment Channels dari Tripay

Setelah migration berhasil, sync data channels dari Tripay:

**Opsi A - Melalui Admin Panel:**
1. Login ke Admin Panel
2. Buka menu **Payment Management**
3. Klik tombol **"Sync Channels from Tripay"**

**Opsi B - Melalui Terminal:**
```bash
# Jalankan script sync (jika ada)
npm run sync:tripay-channels

# Atau panggil API endpoint
curl -X POST http://localhost:3000/api/admin/sync-tripay-channels \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie"
```

**Opsi C - Melalui Node.js Script:**
```bash
# Buat file sync script sementara
node -e "
const tripayService = require('./src/services/tripayService');
(async () => {
  try {
    console.log('🔄 Syncing payment channels...');
    await tripayService.syncPaymentChannels();
    console.log('✅ Sync completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    process.exit(1);
  }
})();
"
```

## 🧪 Verifikasi

### 1. Check Database Structure
```bash
# Login ke PostgreSQL
psql -U your_user -d pixelnest

# Verify tabel structure
\d payment_channels

# Expected output harus menunjukkan kolom-kolom ini:
# - group_channel (VARCHAR 50) ✅
# - fee_merchant_flat (INTEGER)
# - fee_merchant_percent (DECIMAL)
# - fee_customer_flat (INTEGER)
# - fee_customer_percent (DECIMAL)
# - minimum_amount (INTEGER)
# - maximum_amount (INTEGER)
```

### 2. Check Data Channels
```sql
-- Cek apakah ada data payment channels
SELECT 
  code, name, group_channel, 
  fee_customer_flat, fee_customer_percent,
  minimum_amount, is_active
FROM payment_channels
WHERE is_active = true
ORDER BY group_channel, name;
```

Expected result: Harus ada data seperti BRIVA, QRIS, OVO, dll.

### 3. Test API Endpoint
```bash
# Test dari server
curl http://localhost:3000/api/payment/channels

# Expected response:
# {
#   "success": true,
#   "data": {
#     "Virtual Account": [...],
#     "E-Wallet": [...],
#     "Convenience Store": [...]
#   }
# }
```

### 4. Test dari Frontend
1. Login ke aplikasi
2. Buka halaman **Top Up Credits** atau **Dashboard**
3. Klik tombol **"Top Up"**
4. Pastikan metode pembayaran muncul dan dikelompokkan dengan benar

## 🔧 Troubleshooting

### Masalah 1: Migration Gagal - "table payment_channels does not exist"

**Solusi:**
```bash
# Buat tabel dari scratch
psql -U your_user -d pixelnest <<EOF
CREATE TABLE IF NOT EXISTS payment_channels (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  group_channel VARCHAR(50) NOT NULL,
  fee_merchant_flat INTEGER DEFAULT 0,
  fee_merchant_percent DECIMAL(5,2) DEFAULT 0,
  fee_customer_flat INTEGER DEFAULT 0,
  fee_customer_percent DECIMAL(5,2) DEFAULT 0,
  minimum_amount INTEGER DEFAULT 10000,
  maximum_amount INTEGER DEFAULT 0,
  icon_url TEXT,
  is_active BOOLEAN DEFAULT true,
  settings JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
EOF

# Kemudian sync dari Tripay
node -e "require('./src/services/tripayService').syncPaymentChannels()"
```

### Masalah 2: Sync Channels Error - "Tripay configuration not found"

**Solusi:**
```bash
# Check konfigurasi Tripay di database
psql -U your_user -d pixelnest -c "SELECT * FROM api_configs WHERE service_name = 'TRIPAY';"

# Jika tidak ada, tambahkan manual:
psql -U your_user -d pixelnest <<EOF
INSERT INTO api_configs (
  service_name, api_key, api_secret, endpoint_url, is_active, additional_config
) VALUES (
  'TRIPAY',
  'YOUR_TRIPAY_API_KEY',
  'YOUR_TRIPAY_PRIVATE_KEY',
  'https://tripay.co.id/api-sandbox',
  true,
  '{"merchant_code": "T41400", "mode": "sandbox"}'::jsonb
) ON CONFLICT (service_name) DO UPDATE SET
  api_key = EXCLUDED.api_key,
  api_secret = EXCLUDED.api_secret,
  is_active = true;
EOF
```

### Masalah 3: Channels Kosong Setelah Sync

**Penyebab:** API Tripay tidak merespons atau credentials salah

**Solusi:**
```bash
# Check PM2 logs untuk detail error
pm2 logs pixelnest-server --lines 100 | grep -i tripay

# Test koneksi ke Tripay API
curl -X GET "https://tripay.co.id/api-sandbox/merchant/payment-channel" \
  -H "Authorization: Bearer YOUR_TRIPAY_API_KEY"

# Jika 401/403, berarti API key salah
# Update di database:
psql -U your_user -d pixelnest -c "
UPDATE api_configs 
SET api_key = 'CORRECT_API_KEY', 
    api_secret = 'CORRECT_PRIVATE_KEY'
WHERE service_name = 'TRIPAY';
"
```

### Masalah 4: Error "ECONNREFUSED" saat Sync

**Penyebab:** Server tidak bisa akses internet atau Tripay API down

**Solusi:**
```bash
# Test koneksi internet dari server
curl -I https://google.com

# Test akses ke Tripay
curl -I https://tripay.co.id

# Jika berhasil, coba sync lagi
# Jika gagal, check firewall/network settings
```

## 📋 Checklist Deployment

Gunakan checklist ini untuk memastikan semua langkah sudah dilakukan:

- [ ] Pull latest code dari repository
- [ ] Migration file ada di `migrations/fix_payment_channels_structure_complete.sql`
- [ ] Jalankan migration database
- [ ] Restart PM2 application
- [ ] Verify struktur tabel `payment_channels` di database
- [ ] Sync payment channels dari Tripay API
- [ ] Check data channels di database (minimal 5-10 channels)
- [ ] Test API endpoint `/api/payment/channels`
- [ ] Test dari frontend - buka modal top up
- [ ] Verify metode pembayaran muncul dan bisa dipilih
- [ ] Test create payment transaction (optional)

## 🎯 Quick Fix One-Liner

Jika Anda yakin environment sudah setup dengan benar, jalankan ini:

```bash
cd /var/www/pixelnest && \
git pull origin main && \
bash fix-payment-channels-complete.sh && \
pm2 restart pixelnest-server && \
sleep 3 && \
node -e "require('./src/services/tripayService').syncPaymentChannels().then(() => console.log('✅ Done!')).catch(e => console.error('❌', e.message))" && \
curl http://localhost:3000/api/payment/channels | jq .
```

## 📞 Bantuan Lebih Lanjut

Jika masih ada masalah:

1. **Check PM2 Logs:**
   ```bash
   pm2 logs pixelnest-server --lines 200
   ```

2. **Check Database Connection:**
   ```bash
   psql -U your_user -d pixelnest -c "SELECT version();"
   ```

3. **Check Environment Variables:**
   ```bash
   cat .env | grep -E 'DB_|TRIPAY_'
   ```

4. **Restart Everything:**
   ```bash
   pm2 restart all
   sudo systemctl restart postgresql
   ```

---

**Last Updated:** 2025-10-29  
**Version:** 1.0 - Complete Deployment Fix Guide


