# 🚀 Cara Update Tripay dari Sandbox ke Production

## 📋 Langkah-Langkah Update

### **Step 1: Cek Konfigurasi Saat Ini**

1. **Buka Admin Panel** → **API Configs**
2. **Lihat card TRIPAY**, sekarang ada badge **Mode** yang menampilkan:
   - 🧪 **SANDBOX** (orange) = Mode Testing
   - ✅ **PRODUCTION** (green) = Mode Live

**Jika masih SANDBOX**, lanjut ke Step 2.

---

### **Step 2: Siapkan Credentials Production**

Anda perlu data berikut dari Tripay Dashboard Production:

```
✅ API Key Production
✅ Private Key Production  
✅ Merchant Code Production
✅ Callback URL (harus public domain, bukan localhost)
```

**Cara mendapatkan credentials:**

1. Login ke **Tripay Dashboard** (https://tripay.co.id)
2. Pastikan sudah dalam **Mode Production** (bukan sandbox)
3. Buka **Settings** → **API Keys**
4. Copy **API Key** dan **Private Key**
5. Copy juga **Merchant Code** Anda

---

### **Step 3: Whitelist IP Server (PENTING!)**

Sebelum update, pastikan IP server Anda sudah di-whitelist:

1. Di Tripay Dashboard → **Settings** → **IP Whitelist**
2. Tambahkan IP server production Anda
3. Klik **Save**

**Tanpa ini, API request akan ditolak!**

---

### **Step 4: Update Config di Admin Panel**

1. Buka **Admin Panel** → **API Configs**
2. Klik tombol **Edit** pada card **TRIPAY**
3. Isi form dengan data production:

```
Kode Merchant: [Merchant Code Production Anda]
Nama Merchant: [Nama Bisnis Anda]
API Key: [API Key Production]
Private Key: [Private Key Production]
Callback URL: https://domain-anda.com/api/payment/callback
Endpoint URL: Production (Live) ← PILIH INI!
```

4. Klik **Save Changes**

**✨ Yang Terjadi Setelah Save:**
- ✅ Config tersimpan ke database
- ✅ TripayService otomatis reload (no restart!)
- ✅ Mode berubah ke PRODUCTION
- ✅ Badge di card berubah jadi hijau

---

### **Step 5: Refresh Halaman & Verifikasi**

1. **Refresh halaman** (Ctrl+F5 atau Cmd+R)
2. **Cek card TRIPAY**, badge seharusnya sekarang:
   ```
   ✅ PRODUCTION
   Mode Live - Transaksi real
   ```
3. **Cek Endpoint**, seharusnya:
   ```
   https://tripay.co.id/api
   ```

---

### **Step 6: Sync Payment Channels**

Setelah config production aktif, sync payment channels:

**Via Terminal:**
```bash
npm run sync:tripay-channels
```

**Atau via Admin Panel:**
1. Buka **Admin** → **Payment Transactions**
2. Klik tombol **Sync Payment Channels**

**Output yang diharapkan:**
```
✅ Synced 15 payment channels from Tripay API
✅ Production mode
```

---

### **Step 7: Verifikasi Lengkap**

Jalankan script verifikasi untuk memastikan semua benar:

```bash
npm run verify:tripay
```

**Output yang diharapkan:**
```
📊 1. DATABASE CONFIGURATION
✅ Config found in database
   Endpoint URL: https://tripay.co.id/api
   Mode (from DB): production

🎯 2. MODE DETECTION
   Detected Mode: production
   Configured Mode: production
   ✅ Mode configuration is correct

⚙️  3. SERVICE INITIALIZATION
✅ TripayService initialized successfully
   Service Mode: production

💳 4. PAYMENT CHANNELS
   Total Channels: 15
   Active Channels: 15

🌐 5. API CONNECTION TEST
✅ Successfully fetched 15 channels from Tripay API
   Mode: production

📋 6. SUMMARY & RECOMMENDATIONS
✅ ALL CHECKS PASSED!
```

---

### **Step 8: Test di Frontend**

1. **Logout** dari admin
2. **Login** sebagai user biasa
3. Buka halaman **Top Up Credits**
4. Pilih nominal top up
5. **Cek metode pembayaran** yang muncul

**Channels production akan berbeda dengan sandbox:**
- Fee sesuai dengan merchant Anda
- Minimum amount sesuai production
- Channels yang available sesuai akun production Anda

---

## 🔍 Troubleshooting

### ❌ Problem: Badge masih SANDBOX setelah update

**Solusi:**
```bash
# 1. Cek database
npm run verify:tripay

# 2. Clear browser cache
Ctrl+F5 (Windows) atau Cmd+Shift+R (Mac)

# 3. Restart browser

# 4. Jika masih gagal, restart server
pm2 restart pixelnest
# atau
npm run dev
```

---

### ❌ Problem: Error "Invalid callback url"

**Penyebab:**
- Callback URL masih localhost
- Format URL salah
- Tidak pakai HTTPS

**Solusi:**
```
❌ SALAH:
http://localhost:5005/api/payment/callback
192.168.1.1/api/payment/callback

✅ BENAR:
https://domain-anda.com/api/payment/callback
https://api.domain-anda.com/api/payment/callback
```

---

### ❌ Problem: Payment channels kosong atau error

**Solusi:**
```bash
# 1. Verifikasi IP sudah di-whitelist
# Cek di Tripay Dashboard → Settings → IP Whitelist

# 2. Test API connection
npm run verify:tripay

# 3. Sync channels
npm run sync:tripay-channels

# 4. Cek log untuk error detail
tail -f logs/error.log
```

---

### ❌ Problem: Transaksi gagal

**Checklist:**
- ✅ Mode sudah PRODUCTION?
- ✅ API credentials benar?
- ✅ IP server sudah di-whitelist?
- ✅ Callback URL accessible dari internet?
- ✅ Payment channels sudah di-sync?

---

## 📊 Cara Cek Database Langsung

Jika Anda ingin cek langsung di database:

```sql
-- Cek config Tripay
SELECT 
  endpoint_url,
  additional_config->>'mode' as mode,
  additional_config->>'merchant_code' as merchant_code,
  additional_config->>'callback_url' as callback_url,
  is_active
FROM api_configs 
WHERE service_name = 'TRIPAY';
```

**Expected Result (Production):**
```
endpoint_url             | mode       | merchant_code | callback_url              | is_active
-------------------------|------------|---------------|---------------------------|----------
https://tripay.co.id/api | production | YOUR_CODE     | https://domain.com/...    | t
```

---

## 🎯 Checklist Lengkap

Sebelum Go Live Production:

- [ ] API credentials production sudah benar
- [ ] IP server sudah di-whitelist di Tripay
- [ ] Callback URL menggunakan HTTPS public domain
- [ ] Badge di Admin Panel menunjukkan **PRODUCTION**
- [ ] Endpoint: `https://tripay.co.id/api`
- [ ] Payment channels sudah di-sync
- [ ] Test transaksi berhasil
- [ ] Callback handling bekerja

---

## 💡 Tips

1. **Testing Dulu**: Test di sandbox sampai perfect sebelum production
2. **Backup Database**: Sebelum switch ke production
3. **Monitor Log**: Pantau log saat pertama kali go live
4. **Small Test**: Test dengan nominal kecil dulu
5. **Document**: Simpan credentials production di tempat aman

---

## 📞 Support

Jika masih ada masalah:

1. **Jalankan verifikasi**:
   ```bash
   npm run verify:tripay
   ```

2. **Cek log error**:
   ```bash
   tail -f logs/error.log
   ```

3. **Contact Tripay Support** jika ada masalah dengan API mereka

---

**Last Updated**: 30 Oktober 2025
**Status**: ✅ TESTED & WORKING

