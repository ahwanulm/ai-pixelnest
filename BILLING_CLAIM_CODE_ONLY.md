# 💳 Billing Page - Claim Code Only

## 📋 Perubahan Terbaru

### ❌ Yang DIHAPUS dari Billing Page:
- **Promo Code Card** (violet) - sudah dipindahkan

### ✅ Yang TETAP ADA di Billing Page:
- **Claim Code Card** (green) - untuk claim free credits langsung

---

## 🗺️ Flow Baru:

### 📍 Di Halaman BILLING (`/billing`):
```
┌─────────────────────────────────────────┐
│ 💳 Billing & Transaction History       │
├─────────────────────────────────────────┤
│ ✅ Transaction History                  │
│ ✅ Statistics                           │
│ ✅ Claim Code Card (GREEN) ← ONLY THIS │
│ ✅ Help Card                            │
└─────────────────────────────────────────┘

FUNGSI:
- Lihat riwayat transaksi
- Claim FREE credits dengan kode claim
- Cek status pembayaran
```

### 📍 Di Halaman DASHBOARD / TOP-UP:
```
┌─────────────────────────────────────────┐
│ 💰 Top-Up Credits                       │
├─────────────────────────────────────────┤
│ ✅ Pilih jumlah credits                 │
│ ✅ Promo Code Input (VIOLET) ← HERE!   │
│ ✅ Payment method                       │
│ ✅ Checkout                             │
└─────────────────────────────────────────┘

FUNGSI:
- Top-up credits
- Gunakan PROMO CODE untuk diskon/bonus
- Lakukan pembayaran
```

---

## 🎯 Perbedaan Lokasi:

| Feature | Lokasi | Fungsi | Warna |
|---------|--------|--------|-------|
| **Claim Code** | `/billing` | Claim credits gratis LANGSUNG | 🟢 Green |
| **Promo Code** | `/dashboard` (saat top-up) | Diskon/bonus saat PEMBAYARAN | 🟣 Violet |

---

## 🎁 Claim Code Card di Billing

### UI Design:
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

### Features:
- ✅ Input untuk kode claim
- ✅ Tombol "Claim" (green)
- ✅ Validasi real-time
- ✅ Credits ditambahkan INSTANTLY
- ✅ Success message dengan detail
- ✅ Balance update otomatis
- ✅ Page reload setelah claim

---

## 🏷️ Promo Code (di Dashboard/Top-Up)

### Dimana?
**Dashboard → Click "Top Up Credits" → Modal Top-Up → Promo Code Section**

### Fungsi:
- Input promo code saat checkout
- Mendapatkan diskon atau bonus credits
- **Bonus diberikan SETELAH pembayaran berhasil**

### Flow:
```
1. User di dashboard
2. Click "Top Up Credits"
3. Modal terbuka
4. Pilih jumlah credits
5. Input promo code (violet section)
6. Apply promo
7. Pilih payment method
8. Bayar
9. ✓ Setelah paid → Bonus credits ditambahkan
```

---

## 📊 Contoh Use Cases:

### Scenario 1: User Punya Claim Code
```
User: "Saya punya kode FREECREDIT100"
→ Pergi ke: /billing
→ Scroll ke card hijau "Claim Free Credits"
→ Input: FREECREDIT100
→ Click: Claim
→ ✓ Langsung dapat +100 credits!
```

### Scenario 2: User Punya Promo Code
```
User: "Saya punya kode DISKON20"
→ Pergi ke: /dashboard
→ Click: "Top Up Credits"
→ Pilih jumlah: 100 credits
→ Input promo: DISKON20
→ Apply → "20% discount!"
→ Bayar dengan harga diskon
→ ✓ Setelah paid → Credits + bonus ditambahkan
```

---

## 🔧 Technical Changes

### Files Modified:
1. **`src/views/auth/billing.ejs`**
   - ❌ Removed: Promo Code Card
   - ❌ Removed: `applyPromoCode()` function
   - ❌ Removed: Promo code event listeners
   - ✅ Kept: Claim Code Card
   - ✅ Kept: `claimCredits()` function

### What Remains in Billing:
```javascript
// ONLY Claim Credits Function
async function claimCredits() {
  // Claim free credits instantly
  // No payment needed
  // Direct credit addition
}
```

### What's in Dashboard/Top-Up:
```javascript
// Promo Code (in payment modal)
async function applyPromoCode() {
  // Apply during checkout
  // Bonus after payment success
}
```

---

## 🚀 Testing Guide

### Test Claim Code in Billing:
```bash
# 1. Create claim code in admin
Admin Panel → Promo Codes → [🎁 Create Claim Code]
Code: TESTCLAIM
Credit Amount: 50

# 2. Test as user
1. Login
2. Go to: http://localhost:3000/billing
3. Find GREEN card "Claim Free Credits"
4. Enter: TESTCLAIM
5. Click: Claim
6. ✓ Instantly get +50 credits!
```

### Test Promo Code in Top-Up:
```bash
# 1. Create promo code in admin
Admin Panel → Promo Codes → [🏷️ Create Promo Code]
Code: TESTPROMO
Discount: 10%

# 2. Test as user
1. Login
2. Go to: http://localhost:3000/dashboard
3. Click: "Top Up Credits"
4. Choose amount
5. Find VIOLET section for promo code
6. Enter: TESTPROMO
7. Apply
8. Complete payment
9. ✓ After paid → bonus credits added
```

---

## 💡 User Guide

### "Dimana saya bisa claim free credits?"
👉 **Halaman Billing** (`/billing`)
- Cari card hijau "🎁 Claim Free Credits"
- Masukkan kode claim
- Click "Claim"
- Credits langsung masuk!

### "Dimana saya bisa pakai promo code untuk diskon?"
👉 **Saat Top-Up di Dashboard**
- Click "Top Up Credits" di dashboard
- Pilih jumlah credits
- Masukkan promo code di section violet
- Apply dan lanjut pembayaran
- Diskon otomatis applied!

---

## 📝 Admin Guide

### Create Claim Code (Free Credits):
```
1. Go to: /admin/promo-codes
2. Click: GREEN button "🎁 Create Claim Code"
3. Fill:
   - Code: FREECREDIT100
   - Description: Dapat 100 credits gratis
   - Credit Amount: 100
   - Single Use: Yes
   - Status: Active
4. Save
5. Share code to users!
```

### Create Promo Code (Discount):
```
1. Go to: /admin/promo-codes
2. Click: VIOLET button "🏷️ Create Promo Code"
3. Fill:
   - Code: DISKON20
   - Description: Diskon 20%
   - Discount Type: Percentage
   - Discount Value: 20
   - Status: Active
4. Save
5. Users use during checkout!
```

---

## ✅ Summary

### Billing Page (`/billing`):
- ✅ Claim Code ONLY (green card)
- ❌ NO Promo Code
- 🎯 Purpose: Claim free credits instantly

### Dashboard/Top-Up:
- ✅ Promo Code (violet section in modal)
- ❌ NO Claim Code
- 🎯 Purpose: Discount during checkout

### Clear Separation:
- **Free stuff?** → Billing page (claim code)
- **Discount shopping?** → Dashboard/Top-up (promo code)

---

**Updated**: October 27, 2025  
**Status**: ✅ Clean & Clear Separation

