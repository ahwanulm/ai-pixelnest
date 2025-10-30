# 🔧 Promo Code Troubleshooting Guide

> **Solusi lengkap untuk masalah "Kode promo tidak valid atau sudah kadaluarsa"**

---

## 🐛 Problem

Saat memasukkan kode promo, mendapat error:
```
❌ Kode promo tidak valid atau sudah kadaluarsa
```

Padahal kode promo seharusnya masih aktif.

---

## 🔍 Possible Causes

### 1. **Tabel `promo_codes` Belum Ada**
Migration belum dijalankan.

### 2. **Tidak Ada Data Promo**
Tabel kosong, tidak ada promo code yang diinsert.

### 3. **Promo Sudah Expired**
`valid_until` sudah lewat.

### 4. **Promo Belum Aktif**
`valid_from` belum sampai atau `is_active = false`.

### 5. **Amount Terlalu Kecil**
Tidak memenuhi `min_purchase`.

### 6. **Usage Limit Tercapai**
Promo sudah digunakan maksimal.

---

## ✅ Solutions

### Solution 1: Run Migration

```bash
# Jalankan migration untuk create table
psql -U your_username -d your_database -f migrations/add_promo_codes.sql
```

### Solution 2: Check Database

```bash
# Connect to database
psql -U your_username -d your_database

# Run check queries
\i check_promo_codes.sql
```

### Solution 3: Insert Sample Promo Codes

```sql
-- Quick insert valid promos
INSERT INTO promo_codes (code, description, discount_type, discount_value, min_purchase, valid_from, valid_until, is_active)
VALUES 
('WELCOME10', 'Diskon 10%', 'percentage', 10.00, 50000, NOW(), NOW() + INTERVAL '30 days', true),
('SAVE20K', 'Diskon Rp 20.000', 'fixed', 20000.00, 100000, NOW(), NOW() + INTERVAL '30 days', true),
('TEST100', 'Test 100%', 'percentage', 100.00, 10000, NOW(), NOW() + INTERVAL '365 days', true)
ON CONFLICT (code) DO NOTHING;
```

### Solution 4: Extend Expired Promos

```sql
-- Extend all expired promos
UPDATE promo_codes 
SET valid_until = NOW() + INTERVAL '30 days',
    updated_at = NOW()
WHERE valid_until < NOW();
```

### Solution 5: Activate Promos

```sql
-- Activate all promos
UPDATE promo_codes 
SET is_active = true
WHERE is_active = false;
```

---

## 🧪 Diagnostic Steps

### Step 1: Check Table Exists

```sql
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_name = 'promo_codes'
) as table_exists;
```

**Expected:** `true`
**If false:** Run migration

### Step 2: Check Promo Codes

```sql
SELECT 
    code,
    is_active,
    valid_from,
    valid_until,
    CASE 
        WHEN valid_until < NOW() THEN '❌ EXPIRED'
        WHEN valid_from > NOW() THEN '❌ NOT STARTED'
        WHEN is_active = false THEN '❌ INACTIVE'
        ELSE '✅ VALID'
    END as status
FROM promo_codes;
```

**Expected:** At least one promo with status `✅ VALID`

### Step 3: Test Specific Promo

```sql
-- Replace 'WELCOME10' with your promo code
SELECT * FROM promo_codes WHERE code = 'WELCOME10';
```

**Check:**
- [ ] `is_active` = true
- [ ] `valid_from` <= NOW()
- [ ] `valid_until` >= NOW()
- [ ] `min_purchase` <= your amount

### Step 4: Check Usage Limit

```sql
SELECT 
    pc.code,
    pc.usage_limit,
    COUNT(pt.id) FILTER (WHERE pt.status = 'PAID') as used_count,
    CASE 
        WHEN pc.usage_limit IS NULL THEN '✅ Unlimited'
        WHEN COUNT(pt.id) FILTER (WHERE pt.status = 'PAID') >= pc.usage_limit THEN '❌ Limit Reached'
        ELSE '✅ Available'
    END as status
FROM promo_codes pc
LEFT JOIN payment_transactions pt ON pt.promo_code = pc.code
WHERE pc.code = 'WELCOME10'
GROUP BY pc.id, pc.code, pc.usage_limit;
```

---

## 🚀 Quick Fix Commands

### Fix 1: Reset Everything

```sql
-- Delete all promo codes (careful!)
DELETE FROM promo_codes;

-- Insert fresh promos
INSERT INTO promo_codes (code, description, discount_type, discount_value, min_purchase, valid_from, valid_until, is_active)
VALUES 
('WELCOME10', 'Diskon 10%', 'percentage', 10.00, 50000, NOW(), NOW() + INTERVAL '90 days', true),
('SAVE20K', 'Diskon Rp 20K', 'fixed', 20000.00, 100000, NOW(), NOW() + INTERVAL '90 days', true);
```

### Fix 2: Extend All Promos

```sql
-- Extend for 60 days
UPDATE promo_codes 
SET valid_until = NOW() + INTERVAL '60 days',
    is_active = true,
    updated_at = NOW();
```

### Fix 3: Make Test Promo

```sql
-- Create unlimited test promo
INSERT INTO promo_codes (code, description, discount_type, discount_value, min_purchase, valid_from, valid_until, is_active)
VALUES ('TEST', 'Test Promo', 'percentage', 50.00, 0, NOW(), NOW() + INTERVAL '999 days', true)
ON CONFLICT (code) DO UPDATE SET
    valid_until = NOW() + INTERVAL '999 days',
    is_active = true;
```

---

## 📊 Understanding Error Messages

### New Error Messages (After Fix)

| Error Message | Cause | Solution |
|--------------|-------|----------|
| `Kode promo tidak ditemukan` | Code doesn't exist in DB | Insert the promo code |
| `Kode promo tidak aktif` | `is_active = false` | `UPDATE ... SET is_active = true` |
| `Kode promo belum dapat digunakan` | `valid_from > NOW()` | Update `valid_from` or wait |
| `Kode promo sudah kadaluarsa` | `valid_until < NOW()` | Extend `valid_until` |
| `Minimum pembelian Rp X` | Amount < min_purchase | Increase purchase amount |
| `Sudah menggunakan kode ini` | single_use = true & used | Use different promo |
| `Sudah mencapai batas penggunaan` | Usage limit reached | Increase limit or create new promo |

---

## 🎯 Testing

### Test Case 1: Valid Promo

```javascript
// Frontend test
const testPromo = async () => {
    const response = await fetch('/api/payment/validate-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            code: 'WELCOME10',
            amount: 200000 
        })
    });
    const data = await response.json();
    console.log(data);
};
testPromo();
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Kode promo valid",
  "promo": {
    "code": "WELCOME10",
    "type": "percentage",
    "value": 10,
    "description": "Diskon 10%"
  }
}
```

### Test Case 2: Expired Promo

```sql
-- Set promo to expired
UPDATE promo_codes 
SET valid_until = NOW() - INTERVAL '1 day'
WHERE code = 'TEST';

-- Test validation (should fail)
```

**Expected:** `Kode promo sudah kadaluarsa`

### Test Case 3: Minimum Purchase

```javascript
// Test with amount below minimum
const testMinPurchase = async () => {
    const response = await fetch('/api/payment/validate-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            code: 'WELCOME10', // min_purchase: 50000
            amount: 40000  // Below minimum
        })
    });
    const data = await response.json();
    console.log(data);
};
```

**Expected:** `Minimum pembelian Rp 50.000 untuk menggunakan kode promo ini`

---

## 📝 Promo Code Examples

### Example 1: Percentage Discount

```sql
INSERT INTO promo_codes (code, description, discount_type, discount_value, min_purchase, valid_from, valid_until, is_active)
VALUES ('DISC10', 'Diskon 10%', 'percentage', 10.00, 0, NOW(), NOW() + INTERVAL '30 days', true);
```

- Code: `DISC10`
- Type: Percentage
- Value: 10%
- Min Purchase: Rp 0 (no minimum)
- Valid: 30 days

### Example 2: Fixed Discount

```sql
INSERT INTO promo_codes (code, description, discount_type, discount_value, min_purchase, valid_from, valid_until, is_active)
VALUES ('HEMAT50K', 'Hemat Rp 50.000', 'fixed', 50000.00, 200000, NOW(), NOW() + INTERVAL '7 days', true);
```

- Code: `HEMAT50K`
- Type: Fixed amount
- Value: Rp 50.000
- Min Purchase: Rp 200.000
- Valid: 7 days

### Example 3: Limited Use Promo

```sql
INSERT INTO promo_codes (code, description, discount_type, discount_value, min_purchase, single_use, usage_limit, valid_from, valid_until, is_active)
VALUES ('FLASH100', 'Flash Sale 100%', 'percentage', 100.00, 100000, true, 50, NOW(), NOW() + INTERVAL '1 day', true);
```

- Code: `FLASH100`
- Type: Percentage
- Value: 100% (FREE!)
- Min Purchase: Rp 100.000
- Single Use: true (one per user)
- Usage Limit: 50 total uses
- Valid: 1 day only

---

## 🔧 Backend Changes Summary

### Improved Validation

The validation now gives specific error messages:

```javascript
// Old (generic error)
if (promoResult.rows.length === 0) {
    return 'Kode promo tidak valid atau sudah kadaluarsa';
}

// New (specific errors)
if (checkResult.rows.length === 0) {
    return 'Kode promo tidak ditemukan';
}
if (!promo.is_active) {
    return 'Kode promo tidak aktif';
}
if (valid_from > NOW) {
    return 'Kode promo belum dapat digunakan';
}
if (valid_until < NOW) {
    return 'Kode promo sudah kadaluarsa';
}
```

---

## ✅ Checklist

Before using promo codes, verify:

- [ ] Migration `add_promo_codes.sql` has been run
- [ ] Table `promo_codes` exists
- [ ] At least one promo code inserted
- [ ] Promo code `is_active = true`
- [ ] Promo code `valid_from <= NOW()`
- [ ] Promo code `valid_until >= NOW()`
- [ ] Purchase amount >= `min_purchase`
- [ ] Usage limit not reached
- [ ] Backend endpoint `/api/payment/validate-promo` working
- [ ] Frontend function `applyPromoCode()` working

---

## 🎉 Summary

**Problem:** Kode promo tidak valid atau sudah kadaluarsa

**Root Cause:** 
1. Tabel belum ada / kosong
2. Promo expired / not active
3. Validation logic terlalu generic

**Solution:**
1. ✅ Run migration
2. ✅ Insert sample promos
3. ✅ Improved validation with specific errors
4. ✅ Debug tools (check_promo_codes.sql)

**Files Modified:**
- `src/controllers/paymentController.js` - Better error messages
- `check_promo_codes.sql` - Debug & management queries
- `PROMO_CODE_TROUBLESHOOTING.md` - This guide

**Status:** ✅ FIXED - Better debugging & clearer errors

---

## 📞 Still Having Issues?

If still getting errors:

1. **Check browser console** (F12) for detailed error
2. **Check server logs** for backend errors
3. **Run `check_promo_codes.sql`** to verify database state
4. **Try test promo** `TEST` (should always work)

Debug query:
```sql
\i check_promo_codes.sql
```

This will show all promo codes and their current status.

