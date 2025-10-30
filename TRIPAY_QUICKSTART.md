# 🚀 Tripay Integration - Quick Start

> **Panduan cepat untuk menjalankan integrasi Tripay payment gateway**

---

## ⚡ Quick Setup (5 Menit)

### 1. Run Database Migration

```bash
npm run migrate:tripay
```

**Output yang diharapkan:**
```
✅ Tripay Payment Migration completed successfully!
```

### 2. Sync Payment Channels

```bash
npm run sync:tripay-channels
```

**Output yang diharapkan:**
```
✅ Synced 15 payment channels
```

### 3. Start Server

```bash
npm run dev
```

### 4. Test Payment Flow

1. **Login sebagai user**
   - URL: `http://localhost:5005/login`

2. **Klik tombol Top Up (+)**
   - Icon kuning dengan tanda + di dashboard
   - Atau akses: `http://localhost:5005/api/payment/top-up`

3. **Pilih amount & payment method**
   - Contoh: Rp 100.000 → BRI Virtual Account

4. **Complete payment**
   - Akan muncul VA number atau QR Code
   - Di sandbox, status tidak auto-update

---

## 🔑 Kredensial yang Sudah Dikonfigurasi

**Tripay Sandbox (Testing):**
```
Merchant Code: T41400
API Key: DEV-gvVnLRQQG1drVQq3oCDm5DNmhCf6ZdwmsMc5S3BV
Private Key: UPr4R-iTY5y-Mhz7I-BfTUS-34dRC
Mode: sandbox
```

Kredensial ini sudah dikonfigurasi di:
- ✅ `src/config/migrateTripayPayment.js`
- ✅ Database table `api_configs`

**Tidak perlu setup tambahan untuk testing!**

---

## 📍 Important URLs

### User:
- **Top Up Page**: `http://localhost:5005/api/payment/top-up`
- **Payment History**: Di sidebar setelah ada transaksi

### Admin:
- **Payment Transactions**: `http://localhost:5005/admin/payment-transactions`
- **API Configs**: `http://localhost:5005/admin/api-configs` (untuk update credentials)

---

## 🎯 Test Scenarios

### Scenario 1: Create Payment

```bash
# Via UI
1. Login as user
2. Click + button in dashboard
3. Enter amount: 100000
4. Select: BRI Virtual Account
5. Click "Lanjutkan Pembayaran"
6. Note the VA number
```

### Scenario 2: Check Admin Panel

```bash
# Via UI
1. Login as admin
2. Go to: /admin/payment-transactions
3. See your created transaction
4. Click "Detail" to view full info
```

### Scenario 3: Test Callback (Manual)

Di sandbox, callback tidak otomatis. Untuk test:

```bash
# Simulate callback via curl
curl -X POST http://localhost:5005/api/payment/callback \
  -H "Content-Type: application/json" \
  -H "X-Callback-Signature: [signature]" \
  -d '{
    "reference": "T1234567890ABCDE",
    "merchant_ref": "PIXELNEST-1-1234567890",
    "status": "PAID",
    "amount": 100000,
    "payment_method": "BRIVA",
    "payment_name": "BRI Virtual Account"
  }'
```

**Note:** Signature harus valid untuk security. Di production, Tripay akan kirim otomatis.

---

## 🛠️ Admin Features

### View Transactions

**Filter by Status:**
- All
- PAID (Berhasil)
- UNPAID (Pending)
- EXPIRED (Kadaluarsa)
- FAILED (Gagal)

**Search:**
- By reference
- By user name
- By email

**Statistics:**
- Total transactions
- Total revenue
- Total credits sold

### Sync Channels

**Kapan perlu sync:**
- Tripay menambah payment method baru
- Fee berubah
- Maintenance rutin (weekly/monthly)

**Cara sync:**
1. Buka `/admin/payment-transactions`
2. Klik tombol "Sync Channels"
3. Wait for success message

---

## 📊 Database Tables

### `payment_transactions`
Semua transaksi payment tersimpan di sini dengan detail lengkap.

**Key Fields:**
- `reference` - Tripay reference (unique)
- `merchant_ref` - Our reference (unique)
- `status` - UNPAID, PAID, EXPIRED, FAILED
- `amount` - Amount in IDR
- `credits_amount` - Credits yang didapat
- `pay_code` - VA number or payment code

### `payment_channels`
Channel pembayaran yang available dari Tripay.

**Key Fields:**
- `code` - Channel code (BRIVA, QRIS, dll)
- `name` - Display name
- `group_channel` - Virtual Account, E-Wallet, dll
- `is_active` - Enable/disable channel

---

## 🔄 Payment Flow Diagram

```
User Action          System Action          Tripay API
-----------          -------------          ----------
1. Click Top Up
                  → Load channels
                                        ← Get channels
2. Select amount
   Select method
                  → Calculate fee
                                        ← Fee calculator
3. Confirm
                  → Create transaction
                                        ← Create + return VA/QR
4. Get VA number
   Complete payment
                                        → User pays
                                        → Tripay callback
                  ← Receive callback
                  → Verify signature
                  → Add credits
                  → Update status
5. Credits added! ✅
```

---

## ❓ FAQ

### Q: Apakah harus pakai ngrok untuk testing?
**A:** Tidak wajib. Di sandbox, callback bisa disimulate manual. Tapi untuk test real callback flow, pakai ngrok.

### Q: Bagaimana cara switch ke production?
**A:** 
1. Get production credentials dari Tripay.co.id
2. Login admin → API Configs → TRIPAY
3. Update API Key & Private Key
4. Change mode to "production"
5. Update callback URL ke production domain

### Q: Credits tidak bertambah setelah bayar?
**A:**
1. Check status di admin panel
2. Check `callback_received` field
3. Check server logs untuk error
4. Di sandbox, mungkin perlu manual trigger callback

### Q: Payment channel tidak muncul?
**A:**
```bash
# Re-sync channels
npm run sync:tripay-channels
```

### Q: Error "Invalid signature"?
**A:**
- Check Private Key di database
- Verify callback dari Tripay (bukan source lain)
- Check signature calculation di logs

---

## 📚 Full Documentation

Untuk dokumentasi lengkap, lihat:
- **`TRIPAY_INTEGRATION_GUIDE.md`** - Complete guide
- **Tripay Docs**: https://tripay.co.id/developer

---

## ✅ Checklist

Setup & Testing:
- [ ] ✅ Run migration (`npm run migrate:tripay`)
- [ ] ✅ Sync channels (`npm run sync:tripay-channels`)
- [ ] Test create payment as user
- [ ] Check payment in admin panel
- [ ] Test credit addition (manual callback)
- [ ] Verify database records

Production Ready:
- [ ] Get production credentials from Tripay
- [ ] Update API Key & Private Key
- [ ] Change mode to production
- [ ] Update callback URL to production domain
- [ ] Test with real payment
- [ ] Monitor transactions

---

## 🎉 You're Ready!

Integrasi Tripay sudah siap digunakan! 

**Test sekarang:**
```bash
npm run dev
# Buka http://localhost:5005
# Login → Click + → Top Up Credits
```

**Need help?** Check `TRIPAY_INTEGRATION_GUIDE.md` untuk detail lengkap.

