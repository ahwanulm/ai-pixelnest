# 🎯 Perbedaan Promo Code vs Claim Code

## 📋 Quick Summary

| Feature | Promo Code 🏷️ | Claim Code 🎁 |
|---------|--------------|--------------|
| **Warna** | Violet/Purple | Green |
| **Icon** | `fa-ticket-alt` | `fa-gift` |
| **Fungsi** | Diskon saat pembelian | Credits gratis langsung |
| **Kapan Digunakan** | Saat TOP-UP/Checkout | Kapan saja di billing |
| **Credits Ditambahkan** | **SETELAH pembayaran berhasil** | **LANGSUNG SEKARANG** |
| **Perlu Bayar?** | ✅ YA | ❌ TIDAK |
| **Tombol Admin** | "Create Promo Code" (Violet) | "Create Claim Code" (Green) |
| **Required Fields** | discount_type, discount_value | credit_amount |
| **Transaction Type** | 'promo_bonus' | 'claim_code' |

---

## 🏷️ PROMO CODE (Violet)

### Cara Kerja:
1. User masukkan kode promo di halaman billing
2. Kode divalidasi ✓
3. User **HARUS TOP-UP/BAYAR** dulu
4. Setelah pembayaran berhasil → Bonus credits **OTOMATIS DITAMBAHKAN**

### Contoh Flow:
```
User input: WELCOME10
→ Validasi: ✓ "Valid! 10% discount + 50 bonus credits"
→ User top-up Rp 100.000
→ Pembayaran berhasil ✓
→ User dapat: 
  - Credits dari pembelian: 50 credits
  - Bonus dari promo: +50 credits
  - Total: 100 credits
```

### UI Description:
```
┌──────────────────────────────────────────┐
│ 🏷️ Promo Code                             │
├──────────────────────────────────────────┤
│ Punya kode promo?                        │
│ [WELCOME10_______] [💜 Apply]            │
│                                          │
│ ℹ️  Gunakan saat top-up/pembayaran      │
│     untuk mendapatkan diskon atau bonus │
│                                          │
│ ⏰  Bonus credits akan otomatis          │
│     ditambahkan SETELAH pembayaran      │
│     berhasil                             │
└──────────────────────────────────────────┘
```

---

## 🎁 CLAIM CODE (Green)

### Cara Kerja:
1. User masukkan kode claim di halaman billing
2. Klik tombol "Claim"
3. Credits **LANGSUNG DITAMBAHKAN SEKARANG** ✨
4. **TIDAK PERLU BAYAR APAPUN**

### Contoh Flow:
```
User input: FREECREDIT100
→ Klik "Claim" 
→ LANGSUNG dapat: +100 credits ✓
→ Balance updated instantly!
→ No payment needed!
```

### UI Description:
```
┌──────────────────────────────────────────┐
│ 🎁 Claim Free Credits                    │
├──────────────────────────────────────────┤
│ Punya kode claim?                        │
│ [FREECREDIT100___] [🎁 Claim]            │
│                                          │
│ ⚡ Claim code memberikan credits         │
│     gratis LANGSUNG tanpa perlu          │
│     pembayaran                           │
│                                          │
│ ✅ Credits akan otomatis ditambahkan     │
│     SEKARANG ke saldo Anda              │
└──────────────────────────────────────────┘
```

---

## 🎨 Admin Panel - Create Differences

### Create Promo Code (Violet Button)
```javascript
{
  code: "WELCOME10",
  code_type: "promo",           // ← TYPE: PROMO
  discount_type: "percentage",  // Required
  discount_value: 10,           // Required
  credit_amount: 0,             // Not used
  description: "10% discount untuk user baru"
}
```

### Create Claim Code (Green Button)
```javascript
{
  code: "FREECREDIT100",
  code_type: "claim",           // ← TYPE: CLAIM
  discount_type: null,          // Not used
  discount_value: null,         // Not used
  credit_amount: 100,           // ← Credits to give!
  description: "Dapatkan 100 credits gratis"
}
```

---

## 🧪 Testing Guide

### Test Promo Code:
```bash
# 1. Create promo code in admin
Admin Panel → Promo Codes → [🏷️ Create Promo Code]
Code: PROMO50
Type: Promo
Discount Type: percentage
Discount Value: 50
Status: Active

# 2. Test as user
1. Login as user
2. Go to /billing
3. Enter "PROMO50" in Promo Code section (violet)
4. Click "Apply"
5. ✓ Shows: "Valid! 50% discount"
6. Go to dashboard and top-up
7. Use promo code during checkout
8. After payment success → check credits balance
```

### Test Claim Code:
```bash
# 1. Create claim code in admin
Admin Panel → Promo Codes → [🎁 Create Claim Code]
Code: BONUS200
Type: Claim
Credit Amount: 200
Status: Active

# 2. Test as user
1. Login as user
2. Go to /billing
3. Enter "BONUS200" in Claim Code section (green)
4. Click "Claim"
5. ✓ INSTANTLY get +200 credits!
6. Page reloads with new balance
7. Done! No payment needed!
```

---

## 💾 Database Structure

### promo_codes table:
```sql
CREATE TABLE promo_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE,
  
  -- Code Type (NEW!)
  code_type VARCHAR(20) DEFAULT 'promo',  -- 'promo' or 'claim'
  
  -- For PROMO codes only:
  discount_type VARCHAR(20),              -- 'percentage' or 'fixed'
  discount_value DECIMAL(10,2),
  
  -- For CLAIM codes only:
  credit_amount INTEGER DEFAULT 0,        -- Credits to give
  
  -- Common fields:
  description TEXT,
  single_use BOOLEAN DEFAULT false,
  usage_limit INTEGER,
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMP,
  valid_until TIMESTAMP,
  ...
);
```

---

## 📊 Transaction Logging

### Promo Code Transaction:
```sql
INSERT INTO credit_transactions (
  user_id, amount, transaction_type, description
) VALUES (
  123, 50, 'promo_bonus',
  'Promo code bonus: WELCOME10 - Diskon 10%'
);
```

### Claim Code Transaction:
```sql
INSERT INTO credit_transactions (
  user_id, amount, transaction_type, description
) VALUES (
  123, 100, 'claim_code',
  'Claim code: FREECREDIT100 - Dapatkan 100 credits gratis'
);
```

---

## 🚀 Quick Start

### 1. Run Migration:
```bash
./setup-claim-codes.sh
```

### 2. Start Server:
```bash
npm start
```

### 3. Create Sample Codes:

**Admin Panel** → http://localhost:3000/admin/promo-codes

Create Promo Code:
- Code: `WELCOME20`
- Type: Promo (violet button)
- Discount: 20%
- Min Purchase: Rp 50,000

Create Claim Code:
- Code: `FREECREDIT50`
- Type: Claim (green button)
- Credit Amount: 50

### 4. Test Both:

**Billing Page** → http://localhost:3000/billing

Try Claim Code first (instant):
1. Enter: `FREECREDIT50`
2. Click green "Claim"
3. ✓ Get +50 credits instantly!

Try Promo Code (requires payment):
1. Enter: `WELCOME20`
2. Click violet "Apply"
3. Go to dashboard → Top-up
4. Complete payment
5. ✓ Get bonus after payment!

---

## ✅ Checklist

- [x] Migration applied (`code_type`, `credit_amount` columns)
- [x] Admin Model updated (support both types)
- [x] Admin UI has 2 separate buttons (violet & green)
- [x] Admin modal adapts based on type
- [x] API endpoint `/api/user/claim-credits` created
- [x] Billing page has 2 separate cards
- [x] Promo Code card (violet) - for checkout
- [x] Claim Code card (green) - instant credits
- [x] JavaScript functions working
- [x] Clear UI descriptions
- [x] Transaction logging
- [x] Success notifications
- [x] Real-time balance update

---

## 🎯 Key Differences Reminder

### When User Asks "Mana kode gratis?"
👉 **CLAIM CODE** (Green card) - Langsung gratis sekarang!

### When User Asks "Mana kode diskon?"
👉 **PROMO CODE** (Violet card) - Dipakai saat checkout/top-up

### Admin Creating Codes:
- Want to give FREE credits? → **Green button** (Claim Code)
- Want to give discount? → **Violet button** (Promo Code)

---

**Created**: October 27, 2025  
**Status**: ✅ Fully Working  
**Next**: Test both features and enjoy! 🎉

