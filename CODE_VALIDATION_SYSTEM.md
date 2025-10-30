# 🔒 Code Validation System - No Double Usage

## 🎯 Aturan Utama

**SETIAP KODE HANYA BISA DIGUNAKAN SEKALI PER USER**

Tidak peduli di mana kode digunakan:
- ❌ Jika sudah di-**claim** di billing → tidak bisa dipakai sebagai **promo code**
- ❌ Jika sudah dipakai sebagai **promo code** → tidak bisa di-**claim** lagi
- ✅ Satu kode = Satu penggunaan saja

---

## 🛡️ Validasi yang Diterapkan

### 1. **Validasi di Claim Credits** (`/api/user/claim-credits`)

```javascript
// Cek apakah user sudah pernah pakai kode ini (claim ATAU promo)
SELECT transaction_type, description, created_at 
FROM credit_transactions 
WHERE user_id = $1 
AND (
  description LIKE '%Claim code: KODE%'
  OR description LIKE '%Promo code: KODE%'
)
```

**Error Message:**
```
"Kode WELCOME100 sudah pernah used as promo code sebelumnya. 
Setiap kode hanya bisa digunakan sekali."
```

### 2. **Validasi di Promo Code Validation** (`/api/user/promo/validate`)

```javascript
// Cek apakah user sudah pernah pakai kode ini (promo ATAU claim)
SELECT transaction_type, description, created_at 
FROM credit_transactions 
WHERE user_id = $1 
AND (
  description LIKE '%Promo code: KODE%'
  OR description LIKE '%Claim code: KODE%'
  OR promo_code_id = promo.id
)
```

**Error Message:**
```
"Kode FREECREDIT100 sudah pernah claimed sebagai free credits sebelumnya. 
Setiap kode hanya bisa digunakan sekali."
```

### 3. **Validasi di Apply Promo** (`/api/user/promo/apply`)

```javascript
// Same check sebelum apply promo code setelah pembayaran
// Mencegah double usage meskipun sudah lolos validation
```

---

## 📊 Scenario Testing

### Scenario 1: User Claim Dulu, Lalu Coba Pakai sebagai Promo
```bash
Step 1: User claim di billing
Input: WELCOME100
Response: ✓ +100 credits claimed!
Transaction: claim_code - "Claim code: WELCOME100 - ..."

Step 2: User coba pakai sebagai promo saat top-up
Input: WELCOME100
Response: ❌ "Kode WELCOME100 sudah pernah claimed sebagai free 
           credits sebelumnya. Setiap kode hanya bisa digunakan sekali."
```

### Scenario 2: User Pakai Promo Dulu, Lalu Coba Claim
```bash
Step 1: User pakai promo saat checkout
Input: DISKON20
Response: ✓ 20% discount applied!
Transaction: promo_bonus - "Promo code: DISKON20"

Step 2: User coba claim di billing
Input: DISKON20
Response: ❌ "Kode DISKON20 sudah pernah used as promo code sebelumnya. 
           Setiap kode hanya bisa digunakan sekali."
```

### Scenario 3: User Berbeda Bisa Pakai Kode yang Sama
```bash
User A:
- Claim FREECREDIT100 → ✓ Success

User B:
- Claim FREECREDIT100 → ✓ Success (jika not single_use)

Validasi PER USER, bukan global.
```

---

## 🔍 How It Works

### Transaction Logging:

#### Claim Code Transaction:
```sql
INSERT INTO credit_transactions (
  user_id, amount, transaction_type, description
) VALUES (
  123, 
  100, 
  'claim_code',  -- ← Identifier for claim
  'Claim code: FREECREDIT100 - Dapat 100 credits gratis'
);
```

#### Promo Code Transaction:
```sql
INSERT INTO credit_transactions (
  user_id, amount, transaction_type, description, promo_code_id
) VALUES (
  123, 
  50, 
  'promo_bonus',  -- ← Identifier for promo
  'Promo code bonus: WELCOME10',
  5  -- promo_code_id
);
```

### Validation Query:
```sql
SELECT transaction_type, description, created_at 
FROM credit_transactions 
WHERE user_id = 123 
AND (
  description LIKE '%Claim code: WELCOME10%' 
  OR description LIKE '%Promo code: WELCOME10%'
  OR promo_code_id = 5
)
ORDER BY created_at DESC
LIMIT 1;
```

**If found** → Error (sudah pernah dipakai)  
**If not found** → OK (boleh dipakai)

---

## 🧪 Testing Guide

### Test 1: Normal Claim (Should Work)
```bash
1. Login as user1
2. Go to /billing
3. Enter: TESTCLAIM
4. Click "Claim"
5. Expected: ✓ Success, +credits

# Check transaction
SELECT * FROM credit_transactions 
WHERE user_id = user1_id 
AND description LIKE '%TESTCLAIM%';

# Should show: 'claim_code' type
```

### Test 2: Try to Use Same Code as Promo (Should Fail)
```bash
1. Still logged in as user1
2. Go to /dashboard
3. Click "Top Up"
4. Enter promo code: TESTCLAIM
5. Click "Apply"
6. Expected: ❌ "Kode TESTCLAIM sudah pernah claimed sebagai 
              free credits sebelumnya..."
```

### Test 3: Different User Can Use Same Code
```bash
1. Logout, login as user2
2. Go to /billing
3. Enter: TESTCLAIM
4. Click "Claim"
5. Expected: ✓ Success (if not single_use constraint)
```

### Test 4: Try Promo First, Then Claim (Should Fail)
```bash
1. Login as user3
2. Create new code "TESTPROMO" (promo type)
3. Top-up and use TESTPROMO
4. Expected: ✓ Promo applied

5. Go to /billing
6. Try to claim: TESTPROMO
7. Expected: ❌ "Kode TESTPROMO sudah pernah used as promo code..."
```

---

## 🚨 Error Messages

### Error Format:
```json
{
  "success": false,
  "message": "Kode WELCOME100 sudah pernah {usageType} sebelumnya. Setiap kode hanya bisa digunakan sekali."
}
```

### Usage Types:
- `claimed sebagai free credits` - jika sudah di-claim
- `used as promo code` - jika sudah dipakai sebagai promo
- `digunakan sebagai promo code` - variant bahasa Indonesia

---

## 📋 Admin Guidelines

### Creating Codes:

#### For Claim Codes (Free Credits):
```
Code: FREECREDIT100
Type: Claim
Credit Amount: 100
Single Use: ✓ (recommended)
Usage Limit: 1000 (optional)

Note: User yang sudah claim tidak bisa pakai kode ini 
      sebagai promo code di tempat lain.
```

#### For Promo Codes (Discounts):
```
Code: DISKON20
Type: Promo
Discount: 20%
Single Use: ✓ (recommended)

Note: User yang sudah pakai promo ini tidak bisa 
      claim kode yang sama untuk free credits.
```

### Best Practices:
1. ✅ Use different code names for promo vs claim
   - Claim: `FREECREDIT100`, `BONUS50`, `WELCOME200`
   - Promo: `DISKON20`, `SALE10`, `PROMO50`

2. ✅ Set `single_use: true` untuk mencegah abuse
3. ✅ Set `usage_limit` untuk kontrol global
4. ✅ Monitor usage di credit_transactions table

---

## 🔧 Database Schema

### Relevant Tables:

```sql
-- promo_codes table
CREATE TABLE promo_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE,
  code_type VARCHAR(20), -- 'promo' or 'claim'
  
  -- For promo codes
  discount_type VARCHAR(20),
  discount_value DECIMAL(10,2),
  
  -- For claim codes
  credit_amount INTEGER,
  
  -- Common
  single_use BOOLEAN DEFAULT false,
  usage_limit INTEGER,
  uses_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  ...
);

-- credit_transactions table (for tracking usage)
CREATE TABLE credit_transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  amount DECIMAL(10,2),
  transaction_type VARCHAR(50), -- 'claim_code', 'promo_bonus', etc
  description TEXT,
  promo_code_id INTEGER REFERENCES promo_codes(id),
  created_at TIMESTAMP DEFAULT NOW(),
  ...
);
```

---

## 🎯 Summary

### Validation Points:
1. ✅ **Claim Credits API** - Check before claim
2. ✅ **Validate Promo API** - Check before validation
3. ✅ **Apply Promo API** - Double check before apply

### What's Checked:
- ✅ User's previous usage in credit_transactions
- ✅ Both claim_code AND promo_bonus types
- ✅ Description contains code name
- ✅ promo_code_id matches

### Result:
- ✅ **One code, one use per user**
- ✅ **Clear error messages**
- ✅ **Prevents abuse**
- ✅ **Fair for all users**

---

**Implemented**: October 27, 2025  
**Status**: ✅ Fully Protected  
**Security Level**: 🔒 High

