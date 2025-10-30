# ⚡ QUICK FIX: Pending Limit Tidak Bekerja

## 🎯 Langkah Cepat (5 Menit)

### 1. Restart Server
```bash
# Stop server (Ctrl+C)
# Then start again:
npm start
```

### 2. Test di Browser Console

1. **Login** ke dashboard
2. **Buka Console** (F12 → Console tab)
3. **Copy-paste command ini:**

```javascript
// Quick Test
fetch('/api/payment/check-pending')
  .then(res => res.json())
  .then(data => console.log('✅ Result:', data))
  .catch(err => console.error('❌ Error:', err));
```

**Jika berhasil, akan muncul:**
```
✅ Result: {
  success: true,
  pending_count: 0,
  can_create_new: true,
  ...
}
```

**Jika error, akan muncul:**
```
❌ Error: ...
```

---

### 3. Test dengan Klik "Top Up"

1. **Refresh halaman** dashboard (Ctrl+R atau F5)
2. **Buka Console** (F12)
3. **Klik button "Top Up"**

**Seharusnya muncul di console:**
```
🔍 Checking pending transactions...
📡 Response status: 200
📊 Pending data: {...}
✅ Opening top-up modal
```

**Jika tidak muncul sama sekali:**
- Cache browser belum clear
- Tekan **Ctrl+Shift+R** (hard refresh)

---

### 4. Test dengan 3 Transaksi Pending

**Cara membuat 3 transaksi pending:**
1. Klik "Top Up"
2. Pilih 10 credits
3. Klik "Lanjutkan"
4. Pilih payment method (misal QRIS)
5. **JANGAN bayar, tutup saja**
6. Ulangi 3x

**Setelah ada 3 transaksi pending:**
- Refresh dashboard
- Klik "Top Up" lagi
- **Seharusnya muncul modal warning merah ⚠️**
- **Modal top-up TIDAK terbuka**

---

## 🐛 Jika Masih Belum Bekerja

### Cek 1: Apakah Route Terdaftar?

```bash
grep "check-pending" src/routes/payment.js
```

**Harus ada:**
```javascript
router.get('/check-pending', ensureAuthenticated, paymentController.checkPendingTransactions);
```

### Cek 2: Apakah Function Ada?

```bash
grep "checkPendingTransactions" src/controllers/paymentController.js
```

**Harus ada:**
```javascript
async checkPendingTransactions(req, res) {
```

### Cek 3: Clear Transaksi Expired

```bash
psql -U ahwanulm -d pixelnest_db << EOF
UPDATE payment_transactions 
SET status = 'EXPIRED'
WHERE status = 'PENDING' 
  AND expired_time < NOW();

SELECT COUNT(*) FROM payment_transactions 
WHERE status = 'PENDING' AND expired_time > NOW();
EOF
```

---

## 📊 Check Status Database

```bash
psql -U ahwanulm -d pixelnest_db << EOF
SELECT 
  user_id,
  COUNT(*) as pending_count,
  MIN(expired_time) as earliest_expiry
FROM payment_transactions 
WHERE status = 'PENDING' 
  AND expired_time > NOW()
GROUP BY user_id;
EOF
```

---

## ✅ Expected Behavior

| Kondisi | Yang Terjadi |
|---------|-------------|
| **0 pending** | Modal terbuka normal, tidak ada notifikasi |
| **1-2 pending** | Toast kuning muncul (info), modal tetap terbuka |
| **3+ pending** | Modal merah muncul (warning), modal top-up TIDAK terbuka |

---

## 🚨 Laporkan Error

Jika masih tidak bekerja, laporkan:

1. **Status API:** (200, 404, 500?)
2. **Console logs:** (paste yang muncul)
3. **Server logs:** (paste error dari terminal)
4. **Database count:** (berapa pending yang ada?)

---

## 📁 Files Modified

Check apakah file-file ini sudah updated:

- [ ] `src/controllers/paymentController.js` → Has `checkPendingTransactions()`
- [ ] `src/routes/payment.js` → Has route `/check-pending`
- [ ] `src/views/auth/dashboard.ejs` → Has `showPendingWarning()`
- [ ] `src/views/auth/top-up.ejs` → Has `showPendingBanner()`

Cek dengan:
```bash
ls -lh src/controllers/paymentController.js
ls -lh src/routes/payment.js
ls -lh src/views/auth/dashboard.ejs
ls -lh src/views/auth/top-up.ejs
```

---

**Need detailed guide?** Baca: `QUICK_DEBUG_PENDING_LIMIT.md`

**Need full documentation?** Baca: `PENDING_TRANSACTION_LIMIT.md`

