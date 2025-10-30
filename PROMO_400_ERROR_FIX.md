# 🔧 Fix: 400 Bad Request pada Validate Promo

> **Solusi untuk error "POST /api/payment/validate-promo 400 (Bad Request)"**

---

## 🐛 Error Yang Terjadi

```
dashboard:873 POST http://localhost:5005/api/payment/validate-promo 400 (Bad Request)
applyPromoCode @ dashboard:873
onclick @ dashboard:648
```

---

## 🔍 Root Causes

### 1. **Belum Memilih Credits**
User klik "Terapkan" promo code sebelum memilih jumlah credits.

### 2. **Amount = 0 atau NaN**
`selectedCreditsAmount` masih 0 atau undefined.

### 3. **Missing Request Body**
Request tidak mengirim `code` atau `amount`.

### 4. **Server Error**
Backend gagal memproses request.

---

## ✅ Solution Applied

### Frontend Fixes:

#### 1. **Added Validation**
```javascript
// Check if credits selected
if (!selectedCreditsAmount || selectedCreditsAmount < 10) {
    showPromoMessage('❌ Pilih jumlah credits terlebih dahulu', 'error');
    return;
}
```

#### 2. **Added Debug Logging**
```javascript
console.log('Validating promo:', { code: promoCode, amount });
console.log('Response status:', response.status);
console.log('Response data:', data);
```

#### 3. **Better Error Handling**
```javascript
.catch(error => {
    console.error('Error validating promo:', error);
    showPromoMessage('❌ Terjadi kesalahan', 'error');
});
```

### Backend Fixes:

#### 1. **Added Logging**
```javascript
console.log('🎟️ Validating promo code:', { code, amount, userId });
```

#### 2. **Added Amount Validation**
```javascript
if (!amount || amount < 0) {
    return res.status(400).json({
        success: false,
        message: 'Jumlah pembelian tidak valid'
    });
}
```

#### 3. **Better Error Messages**
```javascript
console.log('✅ Promo valid:', promo.code);
console.error('❌ Error validating promo code:', error);
```

---

## 🧪 How to Test

### Step 1: Open Browser Console

Press `F12` to open DevTools

### Step 2: Follow Correct Flow

```
1. Open Top Up modal
2. ⚠️ IMPORTANT: Select credits first (100 or 200)
3. Then enter promo code
4. Click "Terapkan"
```

### Step 3: Check Console Logs

**Frontend logs:**
```javascript
Validating promo: { code: "TEST", amount: 420000 }
Response status: 200
Response data: { success: true, promo: {...} }
```

**Backend logs (in server terminal):**
```
🎟️ Validating promo code: { code: 'TEST', amount: 420000, userId: 1 }
✅ Promo valid: TEST
```

---

## 📋 Troubleshooting Steps

### Issue 1: "Pilih jumlah credits terlebih dahulu"

**Cause:** No credits selected
**Solution:** 
1. Click 100 or 200 credits button
2. OR enter custom amount (min 10)
3. Wait for price summary to appear
4. THEN apply promo code

### Issue 2: Still Getting 400 Error

**Check Console:**
```javascript
// Should show:
Validating promo: { code: "TEST", amount: 420000 }

// If showing:
Validating promo: { code: "TEST", amount: 0 }
// ^^ This is the problem!
```

**Solution:**
- Refresh page
- Select credits again
- Make sure `selectedCreditsAmount` is not 0

### Issue 3: Server Error (500)

**Check Server Terminal:**
```
❌ Error validating promo code: Error: connect ECONNREFUSED
```

**Solution:**
- Check database connection
- Make sure `promo_codes` table exists
- Run migration: `migrations/add_promo_codes.sql`

---

## 🎯 Expected Behavior

### ✅ SUCCESS Flow:

```
1. User selects 200 credits
   → selectedCreditsAmount = 200
   → amount = 200 * 2100 = 420000

2. User enters "TEST"
   → Validation checks:
     ✅ Code provided
     ✅ Credits selected
     ✅ Amount valid

3. Request sent:
   POST /api/payment/validate-promo
   { code: "TEST", amount: 420000 }

4. Backend validates:
   ✅ Code exists
   ✅ Is active
   ✅ Not expired
   ✅ Min purchase met

5. Response:
   { success: true, promo: {...} }

6. UI updates:
   ✅ TEST diterapkan!
   [Hapus] button shows
```

### ❌ ERROR Flow (Before Fix):

```
1. User enters "TEST" (without selecting credits)
   → selectedCreditsAmount = 0
   → amount = 0 * 2100 = 0

2. Request sent:
   { code: "TEST", amount: 0 }

3. Backend rejects:
   ❌ 400 Bad Request
   "Jumlah pembelian tidak valid"

4. Frontend shows:
   ❌ Terjadi kesalahan
```

---

## 📝 Quick Reference

### Correct Order:

1. ✅ Select credits (100, 200, or custom)
2. ✅ Enter promo code
3. ✅ Click "Terapkan"
4. ✅ See success message
5. ✅ Click "Pilih Metode Pembayaran"

### Common Mistakes:

- ❌ Enter promo BEFORE selecting credits
- ❌ Select 0 or < 10 credits
- ❌ Click "Terapkan" multiple times rapidly
- ❌ Use invalid/expired promo code

---

## 🔍 Debug Commands

### Check Variables in Console:

```javascript
// Open console (F12) and type:
console.log('Credits:', selectedCreditsAmount);
console.log('Price:', creditPriceIDR);
console.log('Amount:', selectedCreditsAmount * creditPriceIDR);
console.log('Applied promo:', appliedPromo);
```

### Expected Output:
```javascript
Credits: 200
Price: 2100
Amount: 420000
Applied promo: null (or {...} if promo applied)
```

### Check Backend:

```bash
# In server terminal
# Watch for these logs when you click "Terapkan":
🎟️ Validating promo code: { code: 'TEST', amount: 420000, userId: 1 }
✅ Promo valid: TEST
```

---

## 🎉 Summary

### Changes Made:

1. ✅ Added frontend validation (must select credits first)
2. ✅ Added debug logging (frontend & backend)
3. ✅ Added amount validation in backend
4. ✅ Better error messages
5. ✅ Improved error handling

### Files Modified:

- `src/views/auth/dashboard.ejs` - Frontend validation & logging
- `src/controllers/paymentController.js` - Backend validation & logging

### How to Use:

1. **Must select credits FIRST** (100, 200, or custom min 10)
2. Then enter promo code
3. Click "Terapkan"
4. Check console for debug info

### Status:

✅ **FIXED** - Now shows clear error if credits not selected
✅ **DEBUG READY** - Console logs help identify issues
✅ **BETTER UX** - User knows what to do

---

## 📞 Still Getting 400?

If still getting error:

### Step 1: Check Browser Console
```
F12 → Console tab
```

Look for:
- "Validating promo:" log
- "Response status:" log
- Any red errors

### Step 2: Check Server Terminal

Look for:
- "🎟️ Validating promo code:" log
- Any error stack traces

### Step 3: Check Database

```sql
-- Check if promo exists
SELECT * FROM promo_codes WHERE code = 'TEST';

-- Check if table exists
\dt promo_codes
```

### Step 4: Restart Server

```bash
# Stop server (Ctrl+C)
# Start again
npm start
```

---

**If error persists, share:**
1. Console logs (screenshot)
2. Server logs (screenshot)
3. SQL query result

This will help identify the exact issue! 🔍

