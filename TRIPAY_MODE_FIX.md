# 🔥 TRIPAY MODE FIX - Perbaikan Mode Sandbox/Production

## ❌ Masalah yang Terjadi

Ketika admin memasukkan API Tripay **production** (bukan sandbox) di halaman **API Configs**, metode pembayaran yang muncul masih **sandbox**. Ini terjadi karena:

### Root Cause:

1. **Konfigurasi tidak di-reload**: Setelah update config di database, `tripayService` tetap menggunakan konfigurasi lama yang ter-cache
2. **Deteksi mode salah**: Logika deteksi production mode salah mendeteksi `api-sandbox` sebagai production
3. **Mode tidak di-set eksplisit**: Saat update config, field `mode` di `additional_config` tidak di-set

## ✅ Yang Sudah Diperbaiki

### 1. **Force Reload TripayService** (`src/controllers/adminController.js`)

```javascript
// 🔥 CRITICAL FIX: Force reload TripayService if TRIPAY config is updated
if (apiConfig.service_name === 'TRIPAY') {
  try {
    await tripayService.initialize(true); // Force reload config
    console.log('✅ TripayService configuration reloaded successfully');
  } catch (tripayError) {
    console.error('⚠️  Failed to reload TripayService:', tripayError.message);
  }
}
```

**Apa yang dilakukan:**
- Setelah admin update config Tripay, service langsung reload config dari database
- Menggunakan parameter `forceReload = true` untuk bypass cache
- Payment channels yang di-fetch berikutnya akan menggunakan endpoint baru

---

### 2. **Perbaikan Deteksi Mode** (`src/services/tripayService.js`)

**❌ SEBELUMNYA (SALAH):**
```javascript
const isProduction = config.endpoint_url && config.endpoint_url.includes('tripay.co.id/api');
// Ini mendeteksi BOTH sandbox dan production sebagai production!
```

**✅ SETELAH DIPERBAIKI (BENAR):**
```javascript
const isProduction = config.endpoint_url && 
                     config.endpoint_url.includes('tripay.co.id/api') && 
                     !config.endpoint_url.includes('sandbox');
```

**Penjelasan:**
- Production URL: `https://tripay.co.id/api`
- Sandbox URL: `https://tripay.co.id/api-sandbox`
- Sekarang hanya production yang terdeteksi sebagai production

---

### 3. **Set Mode Eksplisit** (`src/views/admin/api-configs.ejs`)

**Saat Edit Config:**
```javascript
// 🔥 CRITICAL: Set mode based on endpoint URL
const isProduction = endpointUrl && endpointUrl.includes('tripay.co.id/api') && !endpointUrl.includes('sandbox');
data.additional_config.mode = isProduction ? 'production' : 'sandbox';
```

**Saat Add New Config:**
```javascript
const isProduction = endpointUrl && endpointUrl.includes('tripay.co.id/api') && !endpointUrl.includes('sandbox');

data.additional_config = {
  merchant_code: merchantCode,
  merchant_name: merchantName,
  callback_url: callbackUrl || window.location.origin + '/api/payment/callback',
  mode: isProduction ? 'production' : 'sandbox'
};
```

**Apa yang dilakukan:**
- Field `mode` di `additional_config` otomatis ter-set berdasarkan endpoint yang dipilih
- Sandbox: `mode = 'sandbox'`
- Production: `mode = 'production'`

---

## 🚀 Cara Menggunakan

### 1. **Update Konfigurasi Tripay ke Production**

1. Buka halaman **Admin > API Configs**
2. Klik tombol **Edit** pada card **TRIPAY**
3. Isi data berikut:
   - **API Key**: API Key production dari Tripay
   - **Private Key**: Private Key production dari Tripay
   - **Merchant Code**: Kode merchant production Anda
   - **Merchant Name**: Nama merchant Anda
   - **Callback URL**: `https://domain-anda.com/api/payment/callback`
   - **Endpoint URL**: Pilih **"Production (Live)"** → `https://tripay.co.id/api`
4. Klik **Save Changes**

### 2. **Verifikasi Mode yang Aktif**

Setelah save, cek console log server:
```
✅ TripayService configuration reloaded successfully
✅ Tripay Service initialized from database: production mode
```

### 3. **Sync Payment Channels**

Setelah config berhasil, sync payment channels dari Tripay:
```bash
npm run sync:tripay-channels
```

Atau via Admin Panel:
- Buka **Admin > Payment Transactions**
- Klik tombol **Sync Payment Channels**

---

## 🔍 Cara Verifikasi

### 1. **Cek Database**

```sql
SELECT 
  service_name,
  endpoint_url,
  additional_config->>'mode' as mode,
  additional_config->>'merchant_code' as merchant_code
FROM api_configs 
WHERE service_name = 'TRIPAY';
```

**Hasil yang diharapkan:**
```
service_name | endpoint_url                  | mode       | merchant_code
-------------|-------------------------------|------------|---------------
TRIPAY       | https://tripay.co.id/api      | production | YOUR_CODE
```

### 2. **Cek Payment Channels**

```sql
SELECT code, name, minimum_amount, fee_customer_percent 
FROM payment_channels 
WHERE is_active = true 
LIMIT 5;
```

**Channels production akan berbeda dengan sandbox:**
- Production: Fee real sesuai merchant Anda
- Sandbox: Fee default dari Tripay sandbox

### 3. **Test di Frontend**

1. Login sebagai user
2. Buka halaman **Top Up Credits**
3. Pilih nominal top up
4. Lihat metode pembayaran yang muncul

**Channels yang muncul harus dari production endpoint**

---

## 📊 Perbedaan Sandbox vs Production

| Aspect | Sandbox | Production |
|--------|---------|------------|
| **Endpoint** | `https://tripay.co.id/api-sandbox` | `https://tripay.co.id/api` |
| **API Key** | Test API Key | Real API Key |
| **Merchant Code** | Test Code (e.g., T41400) | Real Merchant Code |
| **Payment Channels** | Test channels | Real channels with real fees |
| **Transaksi** | Simulasi (tidak real) | Real payment |
| **Fee** | Default sandbox fee | Real merchant fee |

---

## ⚠️ Catatan Penting

### 1. **Callback URL**
- Harus valid dan accessible dari internet
- Format: `https://domain.com/api/payment/callback`
- **TIDAK BOLEH** `localhost` atau IP lokal untuk production

### 2. **IP Whitelist**
- Tambahkan IP server production Anda di Tripay Dashboard
- Settings > IP Whitelist
- Tanpa ini, API request akan ditolak

### 3. **Merchant Code**
- Sandbox: Biasanya `T41400` (test)
- Production: Kode unik dari Tripay untuk merchant Anda

### 4. **Testing**
- Selalu test di sandbox dulu sebelum production
- Verifikasi semua payment flow works correctly
- Cek callback handling

---

## 🐛 Troubleshooting

### Problem: Masih muncul sandbox channels setelah update

**Solusi:**
1. Clear browser cache (Ctrl+F5)
2. Logout dan login ulang
3. Restart Node.js server
4. Sync payment channels lagi

### Problem: Error "Invalid callback url"

**Solusi:**
1. Pastikan callback URL valid (https://)
2. Tidak boleh localhost untuk production
3. Harus bisa diakses dari internet
4. Paste URL yang sama persis ke Tripay Dashboard

### Problem: Payment channels kosong

**Solusi:**
1. Cek log server untuk error
2. Pastikan IP server sudah di-whitelist di Tripay
3. Verifikasi API Key dan Private Key benar
4. Run sync channels: `npm run sync:tripay-channels`

---

## 📝 Changes Summary

| File | Changes |
|------|---------|
| `src/controllers/adminController.js` | ✅ Added force reload TripayService after config update |
| `src/services/tripayService.js` | ✅ Fixed production mode detection logic |
| `src/views/admin/api-configs.ejs` | ✅ Auto-set mode based on endpoint URL (edit & add) |

---

## 🎯 Result

Setelah perbaikan ini:
- ✅ Admin bisa switch antara sandbox dan production dengan mudah
- ✅ Config langsung di-reload tanpa restart server
- ✅ Mode detection akurat 100%
- ✅ Payment channels langsung update sesuai endpoint
- ✅ Tidak perlu manual setting di database

---

**Tanggal Perbaikan**: 30 Oktober 2025
**Status**: ✅ **RESOLVED**

