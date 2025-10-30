# 💳 Panduan Lengkap: Fix Metode Pembayaran

## 📚 Daftar Isi
1. [Ringkasan Masalah](#ringkasan-masalah)
2. [Solusi Cepat](#solusi-cepat)
3. [File-File yang Dibuat](#file-file-yang-dibuat)
4. [Cara Penggunaan](#cara-penggunaan)
5. [Verifikasi](#verifikasi)
6. [Troubleshooting](#troubleshooting)

---

## 🐛 Ringkasan Masalah

**Masalah:** Metode pembayaran tidak terbaca saat deployment dengan error:
```
Error getting payment channels: error: column "group_channel" does not exist
```

**Penyebab:** Mismatch antara struktur database lama (`group_name`) dengan kode baru (`group_channel`)

**Solusi:** Migration database + sync channels dari Tripay API

---

## ⚡ Solusi Cepat

### One-Line Command (Paling Mudah):
```bash
npm run fix:payment-channels
```

### Manual Steps (Jika perlu):
```bash
# 1. Migration database
bash fix-payment-channels-complete.sh

# 2. Restart aplikasi
pm2 restart pixelnest-server

# 3. Sync channels dari Tripay
npm run sync:tripay-channels

# 4. Verifikasi
npm run verify:payment-channels
```

---

## 📁 File-File yang Dibuat

Berikut adalah file-file yang telah dibuat untuk menyelesaikan masalah ini:

### 1. **SOLUSI_METODE_PEMBAYARAN_DEPLOYMENT.md**
   - 📖 Dokumentasi lengkap dalam bahasa Indonesia
   - Penjelasan detail setiap langkah
   - Troubleshooting guide lengkap
   - Contoh command dan expected output

### 2. **QUICK_FIX_PAYMENT_ID.md**
   - ⚡ Quick reference guide
   - Solusi ringkas 1-command
   - Tips troubleshooting cepat

### 3. **fix-payment-deployment.sh**
   - 🚀 Script all-in-one untuk fix deployment
   - Otomatis jalankan semua langkah
   - Include verification steps
   - **Usage:** `bash fix-payment-deployment.sh` atau `npm run fix:payment-channels`

### 4. **sync-tripay-channels.js**
   - 🔄 Script untuk sync channels dari Tripay API
   - Display results dengan format yang bagus
   - Error handling lengkap
   - **Usage:** `node sync-tripay-channels.js` atau `npm run sync:tripay-channels`

### 5. **verify-payment-channels.sh**
   - ✅ Script verifikasi setup payment channels
   - 6 test checks otomatis
   - Summary report
   - **Usage:** `bash verify-payment-channels.sh` atau `npm run verify:payment-channels`

### 6. **package.json** (Updated)
   - Tambah npm scripts:
     - `npm run fix:payment-channels` - Run complete fix
     - `npm run sync:tripay-channels` - Sync channels
     - `npm run verify:payment-channels` - Verify setup

---

## 🚀 Cara Penggunaan

### Scenario 1: Deploy di VPS untuk Pertama Kali

```bash
# 1. SSH ke server
ssh user@your-server-ip

# 2. Masuk ke directory project
cd /var/www/pixelnest

# 3. Pull latest code
git pull origin main

# 4. Jalankan fix
npm run fix:payment-channels

# 5. Verifikasi
npm run verify:payment-channels
```

### Scenario 2: Sudah Deploy, Tapi Channels Tidak Muncul

```bash
# Option A - Full fix (recommended)
npm run fix:payment-channels

# Option B - Hanya sync channels (jika struktur DB sudah benar)
npm run sync:tripay-channels

# Option C - Manual step by step
bash fix-payment-channels-complete.sh    # Migration
pm2 restart pixelnest-server              # Restart
npm run sync:tripay-channels              # Sync
```

### Scenario 3: Perlu Sync Ulang Channels

```bash
# Sync channels dari Tripay API
npm run sync:tripay-channels

# Verifikasi hasil
npm run verify:payment-channels
```

### Scenario 4: Check Status Tanpa Fix

```bash
# Hanya verifikasi, tidak mengubah apapun
npm run verify:payment-channels
```

---

## ✅ Verifikasi

Setelah menjalankan fix, verifikasi dengan cara berikut:

### 1. Via Script (Recommended)
```bash
npm run verify:payment-channels
```

Script ini akan check:
- ✓ Struktur tabel payment_channels
- ✓ Kolom-kolom yang diperlukan
- ✓ Jumlah channels aktif
- ✓ Konfigurasi Tripay API
- ✓ API endpoint response
- ✓ Sample data channels

### 2. Manual Check - Database
```bash
# Login ke PostgreSQL
psql -U your_user -d pixelnest

# Check struktur tabel
\d payment_channels

# Check data channels
SELECT 
  code, name, group_channel, 
  fee_customer_flat, minimum_amount, is_active
FROM payment_channels
WHERE is_active = true;

# Expected: Harus ada minimal 5-10 channels (BRIVA, QRIS, dll)
```

### 3. Manual Check - API
```bash
# Test API endpoint
curl http://localhost:3000/api/payment/channels | jq .

# Expected output:
# {
#   "success": true,
#   "data": {
#     "Virtual Account": [...],
#     "E-Wallet": [...],
#     ...
#   }
# }
```

### 4. Manual Check - Frontend
1. Login ke aplikasi
2. Buka page **Dashboard** atau **Top Up Credits**
3. Klik tombol **"Top Up"**
4. Pastikan metode pembayaran muncul dan dikelompokkan:
   - Virtual Account (BRI, BNI, Mandiri, dll)
   - E-Wallet (QRIS, OVO, Dana, dll)
   - Convenience Store (Alfamart, Indomaret)

---

## 🔧 Troubleshooting

### Masalah 1: "Migration failed - permission denied"

**Solusi:**
```bash
# Check file permissions
ls -la migrations/fix_payment_channels_structure_complete.sql

# Make sure you have execute permission on scripts
chmod +x fix-payment-deployment.sh
chmod +x verify-payment-channels.sh

# Try with sudo if needed (database operations)
sudo -u postgres psql -d pixelnest -f migrations/fix_payment_channels_structure_complete.sql
```

### Masalah 2: "Tripay configuration not found"

**Solusi:**
```bash
# Check konfigurasi di database
psql -U your_user -d pixelnest -c "SELECT * FROM api_configs WHERE service_name = 'TRIPAY';"

# Jika kosong, tambahkan melalui Admin Panel:
# 1. Login ke Admin Panel
# 2. Menu: API Configs
# 3. Add New Config:
#    - Service: TRIPAY
#    - API Key: [dari Tripay Dashboard]
#    - Private Key: [dari Tripay Dashboard]
#    - Endpoint: https://tripay.co.id/api-sandbox (untuk testing)
#    - Status: Active
```

### Masalah 3: "No channels synced" atau channels count = 0

**Penyebab:** API credentials salah atau network issue

**Solusi:**
```bash
# 1. Verify Tripay credentials
# Check di Tripay Dashboard: https://tripay.co.id/member/merchant

# 2. Test API connection
curl -X GET "https://tripay.co.id/api-sandbox/merchant/payment-channel" \
  -H "Authorization: Bearer YOUR_API_KEY"

# 3. Update credentials di database jika salah
psql -U your_user -d pixelnest <<EOF
UPDATE api_configs 
SET api_key = 'YOUR_CORRECT_API_KEY',
    api_secret = 'YOUR_CORRECT_PRIVATE_KEY',
    is_active = true
WHERE service_name = 'TRIPAY';
EOF

# 4. Sync ulang
npm run sync:tripay-channels
```

### Masalah 4: "Cannot connect to database"

**Solusi:**
```bash
# Check database is running
sudo systemctl status postgresql

# If not running, start it
sudo systemctl start postgresql

# Check .env file credentials
cat .env | grep DB_

# Test connection
psql -U $DB_USER -d $DB_NAME -c "SELECT version();"

# Check if database exists
psql -U $DB_USER -l | grep pixelnest
```

### Masalah 5: Frontend masih tidak menampilkan channels

**Solusi:**
```bash
# 1. Clear browser cache (Ctrl+Shift+Delete)

# 2. Check PM2 logs for errors
pm2 logs pixelnest-server --lines 100

# 3. Restart aplikasi
pm2 restart pixelnest-server

# 4. Check API response
curl http://localhost:3000/api/payment/channels

# 5. Check browser console (F12) for JavaScript errors
```

---

## 📊 Monitoring & Maintenance

### Daily Checks
```bash
# Check if payment channels are active
npm run verify:payment-channels
```

### Weekly Tasks
```bash
# Sync channels (in case Tripay updates their channels)
npm run sync:tripay-channels
```

### After Tripay Config Changes
```bash
# 1. Update config in Admin Panel
# 2. Sync channels
npm run sync:tripay-channels
# 3. Verify
npm run verify:payment-channels
```

---

## 📞 Need Help?

### Check Logs
```bash
# PM2 application logs
pm2 logs pixelnest-server --lines 200

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*.log

# System logs
journalctl -u pm2-* -f
```

### Common Log Patterns to Look For

**Success patterns:**
- `✅ Tripay Service initialized`
- `✓ Migration completed successfully`
- `Channels synced: XX`

**Error patterns:**
- `column "group_channel" does not exist` → Run migration
- `Tripay configuration not found` → Setup Tripay config
- `ECONNREFUSED` → Check network/API endpoint
- `401 Unauthorized` → Check API credentials

---

## 📝 Summary

| Task | Command | When to Use |
|------|---------|-------------|
| Complete Fix | `npm run fix:payment-channels` | First deployment, major issues |
| Sync Channels | `npm run sync:tripay-channels` | Update channels, after config change |
| Verify Setup | `npm run verify:payment-channels` | Check status, after any changes |
| Migration Only | `bash fix-payment-channels-complete.sh` | Database structure fix only |

---

## ✨ Best Practices

1. **Always backup before migration:**
   ```bash
   pg_dump -U your_user pixelnest > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Test in staging first** before production deployment

3. **Monitor logs** after deployment:
   ```bash
   pm2 logs pixelnest-server --lines 50
   ```

4. **Run verification** after any payment-related changes:
   ```bash
   npm run verify:payment-channels
   ```

5. **Keep Tripay config up-to-date** in Admin Panel

---

**Last Updated:** 2025-10-29  
**Version:** 1.0  
**Author:** Ahwanulm  
**Status:** ✅ Ready for Production


