# 🔧 Troubleshooting: Metode Pembayaran Tidak Muncul

## 📊 Status Konfigurasi

Berdasarkan verifikasi terakhir:

✅ **Config Tripay:**
- Endpoint: `https://tripay.co.id/api` (PRODUCTION)
- Mode: `production`
- Merchant Code: T46398
- API Connection: ✅ Berhasil

✅ **Payment Channels:**
- Total di database: 3 channels
- Channels: DANA, QRIS, ShopeePay
- Status: Active

---

## ❓ Kenapa Metode Pembayaran Tidak Muncul?

### **Penyebab #1: Server Belum Di-Restart**

Service masih menggunakan config lama yang ter-cache.

**Solusi:**
```bash
# Jika pakai PM2
pm2 restart pixelnest

# Atau jika dev mode
# Stop server (Ctrl+C) lalu:
npm run dev
```

---

### **Penyebab #2: Account Production Hanya Punya 3 Channels**

Di production, Tripay API hanya mengembalikan channels yang:
- ✅ Aktif di akun merchant Anda
- ✅ Sudah disetup di Tripay Dashboard
- ✅ Ter-verifikasi

**Cek di Tripay Dashboard:**
1. Login ke https://tripay.co.id
2. **Settings** → **Payment Channels**
3. Lihat channels mana yang active

**Channels yang mungkin tidak muncul jika:**
- Belum diaktifkan di dashboard
- Account belum verify
- Merchant belum eligible untuk channel tertentu

---

### **Penyebab #3: Browser Cache**

Frontend masih load data lama.

**Solusi:**
```
1. Hard refresh: Ctrl+F5 (Windows) atau Cmd+Shift+R (Mac)
2. Clear browser cache
3. Coba di browser incognito/private mode
4. Logout & login ulang
```

---

### **Penyebab #4: Error di Frontend**

Ada error saat fetch payment channels.

**Solusi - Cek Browser Console:**

1. Buka halaman **Top Up Credits**
2. Tekan **F12** untuk buka Developer Tools
3. Buka tab **Console**
4. Refresh halaman
5. Lihat ada error merah?

**Error yang mungkin muncul:**

**a) Error 401 Unauthorized:**
```
Failed to fetch payment channels: 401 Unauthorized
```
→ **Solusi:** Logout dan login ulang

**b) Error 500 Server Error:**
```
Failed to fetch payment channels: 500 Internal Server Error
```
→ **Solusi:** Restart server dan cek log

**c) Empty response:**
```
Payment channels: []
```
→ **Solusi:** Sync channels: `npm run sync:tripay-channels`

---

### **Penyebab #5: Callback URL Localhost di Production**

Tripay mungkin reject request karena callback URL masih localhost.

**Current Callback:** `http://localhost:5005/api/payment/callback`
**Seharusnya:** `https://domain-anda.com/api/payment/callback`

**Solusi:**
1. Update Callback URL di Admin Panel → API Configs
2. Gunakan domain public (HTTPS)
3. Save & restart server

---

## 🚀 Langkah Perbaikan (Urutan)

### **Step 1: Restart Server**

```bash
# Stop current server
pm2 stop pixelnest

# Start again
pm2 start pixelnest

# Check logs
pm2 logs pixelnest
```

Lihat log, seharusnya ada:
```
✅ Tripay Service initialized from database: production mode
```

---

### **Step 2: Verify Database**

```bash
npm run verify:tripay
```

Output expected:
```
💳 4. PAYMENT CHANNELS
   Total Channels: 3
   Active Channels: 3
```

---

### **Step 3: Test Frontend**

1. **Login** sebagai user
2. Buka halaman **Top Up Credits**
3. **F12** → Console tab
4. Refresh halaman
5. **Cek console log**, seharusnya ada:

```javascript
// Success case
Payment channels loaded: {E-Wallet: Array(3)}

// Error case
Error loading payment channels: ...
```

---

### **Step 4: Update Callback URL (Jika Production)**

Jika server Anda sudah production dengan domain public:

1. Admin Panel → API Configs → Edit TRIPAY
2. Update **Callback URL**:
   ```
   ❌ SALAH: http://localhost:5005/api/payment/callback
   ✅ BENAR: https://domain-anda.com/api/payment/callback
   ```
3. Save
4. Restart server

---

### **Step 5: Aktifkan Lebih Banyak Channels (Optional)**

Jika Anda ingin lebih banyak metode pembayaran:

1. Login ke **Tripay Dashboard**
2. **Settings** → **Payment Channels**
3. **Enable** channels yang Anda inginkan:
   - Virtual Account (BCA, BNI, Mandiri, BRI, dll)
   - Convenience Store (Alfamart, Indomaret)
   - E-Wallet lainnya (OVO, LinkAja, dll)
4. **Save**
5. Sync ulang di aplikasi Anda:
   ```bash
   npm run sync:tripay-channels
   ```

---

## 🔍 Debugging Detail

### **Cek Channels di Database:**

```sql
SELECT 
  code, 
  name, 
  group_channel,
  minimum_amount,
  fee_customer_percent,
  fee_customer_flat,
  is_active
FROM payment_channels
WHERE is_active = true
ORDER BY group_channel, name;
```

Expected:
```
code      | name       | group_channel | minimum_amount | fee_customer_percent | fee_customer_flat | is_active
----------|------------|---------------|----------------|----------------------|-------------------|----------
DANA      | DANA       | E-Wallet      | 1000           | 3.00                 | 0                 | t
QRIS2     | QRIS       | E-Wallet      | 10000          | 0.00                 | 750               | t
SHOPEEPAY | ShopeePay  | E-Wallet      | 1000           | 3.00                 | 0                 | t
```

---

### **Test API Endpoint (Dengan Cookie Auth):**

Cara 1 - Via Browser:
```
1. Login ke aplikasi Anda
2. Buka tab baru
3. Akses: http://localhost:5005/api/payment/channels
4. Seharusnya muncul JSON
```

Cara 2 - Via Code:
```javascript
// Paste di Browser Console (setelah login)
fetch('/api/payment/channels')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

Expected response:
```json
{
  "success": true,
  "data": {
    "E-Wallet": [
      {
        "code": "DANA",
        "name": "DANA",
        "group_channel": "E-Wallet",
        "minimum_amount": 1000,
        "fee_customer_percent": 3.00,
        "is_active": true
      },
      ...
    ]
  }
}
```

---

### **Cek Log Server:**

```bash
# PM2
pm2 logs pixelnest --lines 100

# atau tail
tail -f logs/error.log
tail -f logs/combined.log
```

Cari error seperti:
```
❌ Failed to get payment channels
❌ Tripay API error
❌ Database query error
```

---

## 📱 Expected Behavior (Correct)

**Di Halaman Top Up Credits:**

```
┌────────────────────────────────────────┐
│  💰 Top Up Credits                     │
├────────────────────────────────────────┤
│  Pilih Nominal:                        │
│  [ ] 10,000   [ ] 50,000  [ ] 100,000  │
├────────────────────────────────────────┤
│  Metode Pembayaran:                    │
│                                        │
│  E-Wallet                              │
│  ┌──────────────────────────────────┐ │
│  │ 🟢 DANA                     →    │ │
│  │ Min: Rp 1,000                    │ │
│  └──────────────────────────────────┘ │
│  ┌──────────────────────────────────┐ │
│  │ 📱 QRIS                     →    │ │
│  │ Min: Rp 10,000                   │ │
│  └──────────────────────────────────┘ │
│  ┌──────────────────────────────────┐ │
│  │ 🛒 ShopeePay                →    │ │
│  │ Min: Rp 1,000                    │ │
│  └──────────────────────────────────┘ │
└────────────────────────────────────────┘
```

**Jika TIDAK muncul metode pembayaran:**
```
┌────────────────────────────────────────┐
│  💰 Top Up Credits                     │
├────────────────────────────────────────┤
│  ⚠️  Gagal memuat metode pembayaran    │
│  atau                                  │
│  ⭕ Loading...                         │
└────────────────────────────────────────┘
```

---

## 🎯 Quick Fix Checklist

Jalankan command ini satu per satu:

```bash
# 1. Sync channels
npm run sync:tripay-channels

# 2. Verify config
npm run verify:tripay

# 3. Restart server
pm2 restart pixelnest

# 4. Check logs
pm2 logs pixelnest --lines 50

# 5. Test (di browser console, setelah login)
fetch('/api/payment/channels').then(r=>r.json()).then(console.log)
```

---

## 💡 Tips

1. **Production vs Sandbox:**
   - Sandbox: Biasanya 10+ channels tersedia
   - Production: Hanya channels yang Anda aktifkan di dashboard

2. **Verifikasi Account:**
   - Beberapa channels butuh verifikasi dokumen bisnis
   - Cek di Tripay Dashboard → Account Settings

3. **Minimum Fee:**
   - Setiap channel punya minimum transaction amount
   - Pastikan nominal top up Anda ≥ minimum

4. **Icon URL:**
   - Jika icon tidak muncul, cek `icon_url` di database
   - Bisa jadi URL expired atau tidak accessible

---

## 📞 Kapan Harus Contact Support

Contact **Tripay Support** jika:
- Channels tidak muncul meskipun sudah diaktifkan di dashboard
- Error 401/403 terus menerus meskipun API key benar
- IP whitelist sudah benar tapi masih reject
- Transaksi pending/stuck

Contact **Developer** jika:
- Error 500 di aplikasi
- Database error
- Frontend tidak bisa fetch API
- Server crash/restart terus

---

**Last Updated:** 30 Oktober 2025

