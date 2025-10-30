# Payment Setup - PixelNest

## ✅ Yang Sudah Diperbaiki

### 1. **TripayService** (`src/services/tripayService.js`)
- ✅ Mode otomatis terdeteksi dari endpoint URL
- ✅ Support `forceReload` untuk refresh config tanpa restart server
- ✅ Membaca config dari `api_configs` database (prioritas utama)
- ✅ Fallback ke `.env` jika tidak ada di database
- ✅ Callback URL validation

### 2. **Database Schema**
- ✅ Payment channels sudah sync dari Tripay API (data real)
- ✅ Tabel `payment_transactions` sudah include `promo_code` dan `discount_amount`
- ✅ Tabel `api_configs` untuk menyimpan konfigurasi Tripay
- ✅ Callback URL: `https://ai.pixelnest.pro/api/payment/callback`
- ✅ Mode production aktif

### 3. **Data Payment Channels**
Data yang tersimpan adalah **data real dari Tripay API**, bukan dummy:
- **DANA**: Min Rp 1.000, Fee 3%
- **ShopeePay**: Min Rp 1.000, Fee 3%
- **QRIS**: Min Rp 10.000, Fee Rp 750 + 0.7%

### 4. **Configuration Priority**
TripayService membaca config dengan urutan:
1. **Database** (`api_configs` table) - Prioritas utama
2. **Environment** (`.env` file) - Fallback jika database kosong

## 🚀 Cara Menggunakan

### 1. Sync Payment Channels dari Tripay
```bash
npm run sync:tripay-channels
```

### 2. Update Database Consistency
```bash
npm run update:db-consistency
```

### 3. Verify Payment Channels
```bash
npm run verify:payment-channels
```

## 🔧 Troubleshooting

### Payment Methods Tidak Muncul
1. Cek browser console (F12)
2. Clear browser cache (Ctrl+F5)
3. Pastikan user sudah login
4. Cek Network tab untuk API errors

### Error: Invalid callback url
- Callback URL harus valid: `https://domain.com/api/payment/callback`
- Update via Admin Panel atau database

### Sync Gagal (IP Not Whitelisted)
1. Login ke Tripay dashboard
2. Buka Settings > IP Whitelist
3. Tambahkan IP server Anda

## 📊 Konfigurasi Database

### Cek Tripay Config
```sql
SELECT * FROM api_configs WHERE service_name = 'TRIPAY';
```

### Cek Payment Channels
```sql
SELECT code, name, group_channel, minimum_amount, fee_customer_percent 
FROM payment_channels 
WHERE is_active = true;
```

### Update Callback URL
```sql
UPDATE api_configs 
SET additional_config = jsonb_set(
  additional_config, 
  '{callback_url}', 
  '"https://ai.pixelnest.pro/api/payment/callback"'
) 
WHERE service_name = 'TRIPAY';
```

## ✅ Checklist Deployment

- [ ] IP server sudah di-whitelist di Tripay dashboard
- [ ] Callback URL sudah benar (https://domain/api/payment/callback)
- [ ] Payment channels sudah sync dari Tripay API
- [ ] Mode production aktif
- [ ] Test payment creation berhasil
- [ ] Payment methods muncul di UI

---

**Catatan**: Semua data payment channels adalah **data real dari Tripay API**, bukan data dummy atau sample.
