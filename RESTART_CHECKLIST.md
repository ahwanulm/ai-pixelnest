# 🔄 SERVER RESTART CHECKLIST

## ⚠️ MASALAH: Top-Up Page Masih Menampilkan Sandbox

### **Root Cause:**
Server masih menggunakan **config lama** yang ter-cache di memory. Meskipun database sudah updated ke production, service belum di-reload.

---

## ✅ SOLUSI LENGKAP (Step-by-Step)

### **Step 1: Verify Database Configuration** ✅

Sudah verified:
```
✅ Tripay Mode: production
✅ Endpoint: https://tripay.co.id/api
✅ Payment Channels: 3 active (DANA, QRIS, ShopeePay)
✅ Credit Price: Rp 1.300/credit
✅ QRIS Minimum: Rp 1.000 (bukan Rp 10.000)
```

### **Step 2: RESTART SERVER** ⚠️ **CRITICAL!**

**Ini yang paling penting!** Server HARUS di-restart agar changes ter-apply.

#### **Option A: PM2 (Production)**

```bash
cd /Users/ahwanulm/Documents/PROJECT/PixelNest/pixelnest

# Stop server
pm2 stop pixelnest

# Start server
pm2 start pixelnest

# Check logs
pm2 logs pixelnest --lines 50
```

**Expected Log Output:**
```
✅ Connected to PostgreSQL database
✅ Tripay Service initialized from database: production mode
✅ Server started on port 5005
```

#### **Option B: Dev Mode**

```bash
cd /Users/ahwanulm/Documents/PROJECT/PixelNest/pixelnest

# Stop current process (Ctrl+C)
# Then start again:
npm run dev
```

**Expected Console Output:**
```
✅ Connected to PostgreSQL database
✅ Tripay Service initialized from database: production mode
Server running on http://localhost:5005
```

---

### **Step 3: Clear Browser Cache** ⚠️ **IMPORTANT!**

Browser cache dapat menyimpan data sandbox lama.

#### **Method 1: Hard Refresh (Recommended)**

**Windows/Linux:**
```
Ctrl + F5
```

**Mac:**
```
Cmd + Shift + R
```

#### **Method 2: Clear Cache Manual**

**Chrome/Edge:**
1. F12 → Console
2. Right-click Refresh button
3. "Empty Cache and Hard Reload"

**Firefox:**
1. Ctrl+Shift+Del
2. Check "Cache"
3. Click "Clear Now"

#### **Method 3: Incognito/Private Mode**

Open in private/incognito window untuk bypass cache.

---

### **Step 4: Verify Frontend**

Visit halaman top-up dan verify:

```
http://localhost:5005/api/payment/top-up
```

#### **✅ What to Check:**

**1. Credit Price:**
```
Minimal: Rp 1.300 (1 Credit) | 1 Credit = Rp 1.300
```
❌ SALAH jika masih: "1 Credit = Rp 2.000" atau "Rp 100"

**2. Payment Channels:**
```
✅ DANA - Min: Rp 1.000
✅ QRIS - Min: Rp 1.000  ← PENTING! Bukan Rp 10.000
✅ ShopeePay - Min: Rp 1.000
```

❌ SALAH jika:
- Channels tidak muncul (empty)
- QRIS Min masih Rp 10.000
- Ada text "sandbox" atau "testing"

**3. Credits Calculation:**

Klik button **Rp 100.000**:
```
✅ Harus show: "76 Credits"
```

❌ SALAH jika:
- 50 Credits (credit price Rp 2.000)
- 1.000 Credits (credit price Rp 100)
- 0 Credits (error)

**4. Payment Creation Test:**

1. Input: Rp 50.000
2. Select: QRIS
3. Check calculation:
   ```
   Jumlah: Rp 50.000
   Biaya Admin: Rp ~1.100
   Total Bayar: Rp ~51.100
   Credits: 38 Credits (50.000 / 1.300)
   ```

---

### **Step 5: Check Network Tab (Dev Tools)**

**If still showing wrong data:**

1. F12 → Network tab
2. Reload page (Ctrl+F5)
3. Find: `/api/payment/channels`
4. Click → Preview → Check response:

```json
{
  "success": true,
  "data": {
    "E-Wallet": [
      {
        "code": "QRIS2",
        "minimum_amount": 1000,  ← Must be 1000, not 10000
        "fee_customer_percent": 0.7,
        "fee_customer_flat": 750
      }
    ]
  }
}
```

**If response is wrong:**
- Server belum di-restart!
- Go back to Step 2

---

## 🐛 Troubleshooting

### **Problem 1: Channels Tidak Muncul (Empty)**

**Symptoms:**
```
⚠️  Gagal memuat metode pembayaran
```

**Solution:**
```bash
# 1. Check logs
pm2 logs pixelnest --lines 100

# 2. Re-sync channels
npm run sync:tripay-channels

# 3. Restart server
pm2 restart pixelnest
```

---

### **Problem 2: Masih Tampil Sandbox Data**

**Symptoms:**
- Credit price salah (Rp 100 atau Rp 2.000)
- QRIS minimum Rp 10.000
- Channels sandbox

**Solution:**
```bash
# 1. Force reload
./force-reload-tripay.sh

# 2. HARD RESTART
pm2 delete pixelnest
pm2 start ecosystem.config.js

# 3. Clear ALL browser data
# Chrome: Settings → Privacy → Clear browsing data → All time

# 4. Test in Incognito
```

---

### **Problem 3: Server Restart Tapi Masih Salah**

**Check Database:**
```bash
npm run verify:tripay
```

**Expected:**
```
Mode: production ✅
Payment Channels: 3 ✅
Credit Price: Rp 1.300 ✅
```

**If database is wrong:**
```bash
# Re-run fixes
npm run sync:tripay-channels

# Manually update credit price
node -e "
const { pool } = require('./src/config/database');
(async () => {
  await pool.query('UPDATE pricing_config SET config_value = \$1 WHERE config_key = \$2', [1300, 'credit_price_idr']);
  console.log('✅ Updated');
  await pool.end();
})();
"
```

---

### **Problem 4: API Returns Error**

**Check Console:**
```javascript
fetch('/api/payment/channels')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

**Possible Errors:**
- 401: Not authenticated → Login ulang
- 500: Server error → Check server logs
- 404: Route not found → Check routes

---

## 📋 Quick Verification Commands

### **1. Check Tripay Config:**
```bash
npm run verify:tripay
```

### **2. Check Server Status:**
```bash
pm2 status
pm2 logs pixelnest --lines 20
```

### **3. Test API Directly:**
```bash
# Must be logged in first
curl http://localhost:5005/api/payment/channels \
  --cookie "connect.sid=YOUR_SESSION_COOKIE"
```

### **4. Check Database:**
```bash
node -e "
const { pool } = require('./src/config/database');
(async () => {
  const config = await pool.query('SELECT * FROM api_configs WHERE service_name = \$1', ['TRIPAY']);
  const channels = await pool.query('SELECT code, minimum_amount FROM payment_channels WHERE is_active = true');
  const price = await pool.query('SELECT config_value FROM pricing_config WHERE config_key = \$1', ['credit_price_idr']);
  
  console.log('Tripay Endpoint:', config.rows[0].endpoint_url);
  console.log('Payment Channels:', channels.rows.length);
  console.log('Credit Price:', price.rows[0].config_value);
  
  await pool.end();
})();
"
```

---

## ✅ Success Criteria

After restart, you should see:

### **1. Console Logs:**
```
✅ Connected to PostgreSQL database
✅ Tripay Service initialized from database: production mode
```

### **2. Top-Up Page:**
```
✅ Credit Price: Rp 1.300/credit
✅ Payment Channels: 3 channels visible
✅ QRIS Min: Rp 1.000
✅ Calculations correct
```

### **3. API Response:**
```json
{
  "success": true,
  "data": {
    "E-Wallet": [...] // 3 channels
  }
}
```

### **4. Payment Flow:**
```
Select amount → Select channel → Create payment
→ QR Code appears → Payment successful ✅
```

---

## 🚀 Final Steps After Verification

### **1. Test Complete Flow:**

1. ✅ Login as user
2. ✅ Visit /billing
3. ✅ Click "Top Up Credits"
4. ✅ Select Rp 100.000
5. ✅ Select QRIS
6. ✅ Verify: Total = Rp ~101.520
7. ✅ Create payment
8. ✅ QR Code appears
9. ✅ Payment info correct

### **2. Monitor First Transactions:**

```bash
pm2 logs pixelnest --lines 100
```

Watch for:
- ✅ Payment created
- ✅ Callback received
- ✅ Credits added
- ❌ No errors

### **3. Inform Users:**

```
📢 SYSTEM UPDATE

✅ Payment system sudah menggunakan PRODUCTION mode
✅ Credit price updated: Rp 1.300/credit
✅ QRIS minimum: Rp 1.000 (bukan Rp 10.000)

Jika masih melihat data lama, silakan:
1. Hard refresh (Ctrl+F5)
2. Atau logout & login ulang

Terima kasih! 🙏
```

---

## 📊 Summary

| Check | Status | Action |
|-------|--------|--------|
| Database Config | ✅ Correct | None |
| Server Restart | ⚠️ Required | **RESTART NOW!** |
| Browser Cache | ⚠️ Clear | **Ctrl+F5** |
| Payment Channels | ✅ Synced | None |
| Credit Price | ✅ Set | None |

---

**⚠️ MOST IMPORTANT:**
1. **RESTART SERVER** (pm2 restart pixelnest)
2. **CLEAR CACHE** (Ctrl+F5)
3. **TEST** (http://localhost:5005/api/payment/top-up)

**After these 3 steps, everything should work!** 🚀

---

**Last Updated:** 30 Oktober 2025  
**Critical Action:** RESTART SERVER ⚠️

