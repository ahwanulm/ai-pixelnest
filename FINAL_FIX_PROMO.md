# 🎯 FINAL FIX - Promo Code 400 Error

> **Migration sukses tapi masih 400? Tabel promo_codes kosong!**

---

## 🔧 Step-by-Step Fix

### Step 1: Insert Promo Codes

```bash
psql -U ahwanulm -d pixelnest_db -f insert-promo-codes.sql
```

**Output yang diharapkan:**
```
DELETE 0
INSERT 0 4
 code       | discount_type | discount_value | status
------------+---------------+----------------+----------
 MEGA50     | percentage    | 50.00          | ✅ VALID
 SAVE20K    | fixed         | 20000.00       | ✅ VALID
 TEST       | percentage    | 50.00          | ✅ VALID
 WELCOME10  | percentage    | 10.00          | ✅ VALID

 total_promos
--------------
           4
```

### Step 2: Restart Server

```bash
# Stop server (Ctrl+C atau Cmd+C)
# Kemudian start lagi:
npm start
```

### Step 3: Test Promo Code

**PENTING: Ikuti urutan yang benar!**

1. ✅ **Pilih credits DULU** (100 atau 200)
2. ✅ **Tunggu price summary muncul**
3. ✅ **Masukkan kode promo**: `TEST`
4. ✅ **Klik "Terapkan"**

**Expected Result:**
```
✅ TEST diterapkan!
[Button berubah jadi "Hapus"]
```

---

## 🧪 Debug: Check Browser Console

Press `F12` → Console tab

**Saat klik "Terapkan", harus muncul:**
```javascript
Validating promo: { code: "TEST", amount: 420000 }
Response status: 200
Response data: { success: true, promo: {...} }
```

**Jika masih 400:**
```javascript
Validating promo: { code: "TEST", amount: 0 }  // ❌ SALAH!
// Amount = 0 artinya belum pilih credits!
```

---

## 🔍 Troubleshooting

### Error: "Pilih jumlah credits terlebih dahulu"

**Cause:** Belum pilih credits
**Solution:** 
1. Klik button 100 atau 200 credits
2. ATAU input custom (min 10)
3. Tunggu price summary muncul
4. BARU masukkan promo code

### Error: "Kode promo tidak ditemukan"

**Cause:** Tabel promo_codes masih kosong
**Solution:** Run command Step 1 di atas

### Error: "Jumlah pembelian tidak valid"

**Cause:** Amount = 0 atau NaN
**Solution:** 
```javascript
// Check di console:
console.log('Credits:', selectedCreditsAmount);
console.log('Price:', creditPriceIDR);
```
Refresh page dan pilih credits lagi.

---

## ✅ Checklist

Pastikan semua ini sudah dilakukan:

- [ ] Migration `add_promo_code_column.sql` berhasil
- [ ] Insert promo codes berhasil
- [ ] Server sudah restart
- [ ] Browser sudah refresh (Ctrl+Shift+R)
- [ ] Pilih credits (100/200) SEBELUM apply promo
- [ ] Console browser terbuka untuk debug

---

## 🎯 Test Cases

### Test 1: Basic Promo

1. Select 200 credits → Total: Rp 420.000
2. Enter code: `TEST` (50% off)
3. Click "Terapkan"
4. **Expected:** ✅ TEST diterapkan!
5. **New total:** Rp 210.000 (50% discount)

### Test 2: Minimum Purchase

1. Select 100 credits → Total: Rp 210.000
2. Enter code: `WELCOME10` (min Rp 50.000)
3. Click "Terapkan"
4. **Expected:** ✅ WELCOME10 diterapkan!
5. **New total:** Rp 189.000 (10% discount)

### Test 3: Fixed Discount

1. Select 200 credits → Total: Rp 420.000
2. Enter code: `SAVE20K` (Rp 20K off, min Rp 100K)
3. Click "Terapkan"
4. **Expected:** ✅ SAVE20K diterapkan!
5. **New total:** Rp 400.000 (-20.000)

---

## 🚨 If Still 400 Error

### Check Server Logs

Di terminal server, harus muncul:
```
🎟️ Validating promo code: { code: 'TEST', amount: 420000, userId: 1 }
✅ Promo valid: TEST
```

**Jika muncul error di server:**
```
❌ Error: No code provided
// Atau
❌ Error: Invalid amount
```

### Check Database

```sql
-- Connect
psql -U ahwanulm -d pixelnest_db

-- Check promos
SELECT * FROM promo_codes WHERE code = 'TEST';

-- Should return 1 row with is_active = true
```

### Check Network Tab

F12 → Network tab → Filter: XHR

**Request payload harus:**
```json
{
  "code": "TEST",
  "amount": 420000
}
```

**NOT:**
```json
{
  "code": "TEST",
  "amount": 0  // ❌ WRONG!
}
```

---

## 📋 Quick Commands

```bash
# 1. Insert promo codes
psql -U ahwanulm -d pixelnest_db -f insert-promo-codes.sql

# 2. Check if promos exist
psql -U ahwanulm -d pixelnest_db -c "SELECT code, is_active FROM promo_codes;"

# 3. Restart server
npm start

# 4. Check server logs
# Watch for: 🎟️ Validating promo code...
```

---

## 🎉 Expected Flow

```
User opens dashboard
  ↓
Click "Top Up" (+)
  ↓
SELECT 200 credits (IMPORTANT!)
  ↓
Price summary shows: Rp 420.000
  ↓
Enter promo: TEST
  ↓
Click "Terapkan"
  ↓
Frontend sends: { code: "TEST", amount: 420000 }
  ↓
Backend validates → ✅ Valid
  ↓
Frontend shows: ✅ TEST diterapkan!
  ↓
New total: Rp 210.000 (50% off)
  ↓
Click "Pilih Metode Pembayaran"
  ↓
Select payment method
  ↓
Confirm payment with promo applied ✅
```

---

## 📞 Need More Help?

Share screenshot atau paste:

1. **Browser Console logs** (F12 → Console)
2. **Server terminal logs** (the node server output)
3. **Network request payload** (F12 → Network → validate-promo)

Contoh yang bagus:
```
Console:
Validating promo: { code: "TEST", amount: 420000 }
Response status: 400
Response data: { success: false, message: "..." }

Server:
🎟️ Validating promo code: { code: 'TEST', amount: 420000, userId: 1 }
❌ Error: ...
```

---

## ✅ Summary

**Problem:** 400 Bad Request on validate-promo

**Root Causes:**
1. ❌ Tabel promo_codes kosong → **Insert promo codes**
2. ❌ Belum pilih credits → **Pilih dulu sebelum apply promo**
3. ❌ Amount = 0 → **Refresh dan pilih credits lagi**

**Solution:**
```bash
psql -U ahwanulm -d pixelnest_db -f insert-promo-codes.sql
npm start  # restart
```

**Test:** Select 200 credits → Enter "TEST" → Terapkan → ✅

---

**Status:** Ready to test! 🚀

