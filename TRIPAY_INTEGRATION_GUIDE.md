# 💳 Tripay Payment Gateway Integration - Complete Guide

> **Integrasi pembayaran Tripay.co.id untuk sistem top-up credits di PixelNest AI**

---

## 📋 Daftar Isi

1. [Overview](#overview)
2. [Fitur](#fitur)
3. [Kredensial Tripay](#kredensial-tripay)
4. [Setup & Instalasi](#setup--instalasi)
5. [Database Schema](#database-schema)
6. [API Flow](#api-flow)
7. [User Flow](#user-flow)
8. [Admin Panel](#admin-panel)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

Integrasi Tripay payment gateway memungkinkan user untuk melakukan top-up credits menggunakan berbagai metode pembayaran Indonesia:
- **Virtual Account** (BCA, BNI, BRI, Mandiri, dll)
- **E-Wallet** (OVO, DANA, ShopeePay, LinkAja, dll)
- **QRIS** (Scan QR Code)
- **Retail** (Alfamart, Indomaret)

### Sandbox vs Production

Aplikasi ini menggunakan **Tripay Sandbox** untuk development/testing:
- Endpoint: `https://tripay.co.id/api-sandbox`
- Transaksi tidak menggunakan uang real
- Cocok untuk testing dan development

Untuk production, ganti ke:
- Endpoint: `https://tripay.co.id/api`
- Gunakan API Key dan Private Key production dari dashboard Tripay

---

## ✨ Fitur

### User Features:
- ✅ Pilih jumlah top-up (Quick buttons: 50k, 100k, 250k, 500k)
- ✅ Input custom amount (min Rp 10.000)
- ✅ Pilih metode pembayaran (grouped by type)
- ✅ Real-time fee calculation
- ✅ QR Code payment (untuk QRIS)
- ✅ Virtual Account number
- ✅ Payment instructions
- ✅ Auto-credit after payment
- ✅ Payment history
- ✅ Status tracking

### Admin Features:
- ✅ View all payment transactions
- ✅ Filter by status (PAID, UNPAID, EXPIRED, FAILED)
- ✅ Search by reference, user, email
- ✅ Payment statistics & revenue tracking
- ✅ Sync payment channels from Tripay API
- ✅ Transaction detail view

---

## 🔑 Kredensial Tripay

### Sandbox (Development):
```
Merchant Code: T41400
Merchant Name: Merchant Sandbox
API Key: DEV-gvVnLRQQG1drVQq3oCDm5DNmhCf6ZdwmsMc5S3BV
Private Key: UPr4R-iTY5y-Mhz7I-BfTUS-34dRC
Mode: sandbox
```

### Dimana Kredensial Disimpan:
1. **Database** (`api_configs` table):
   - Service Name: `TRIPAY`
   - API Key: Sandbox/Production API Key
   - API Secret: Private Key
   - Additional Config: Merchant code, callback URL, mode

2. **Environment Variables** (optional backup):
   ```env
   TRIPAY_API_KEY=DEV-gvVnLRQQG1drVQq3oCDm5DNmhCf6ZdwmsMc5S3BV
   TRIPAY_PRIVATE_KEY=UPr4R-iTY5y-Mhz7I-BfTUS-34dRC
   TRIPAY_MERCHANT_CODE=T41400
   TRIPAY_CALLBACK_URL=http://localhost:5005/api/payment/callback
   ```

---

## 🚀 Setup & Instalasi

### 1. Install Dependencies

Semua dependencies sudah terinstall di `package.json`:
```bash
npm install
```

Dependencies yang digunakan:
- `axios` - HTTP client untuk API calls
- `crypto` - Signature generation

### 2. Run Database Migration

Membuat tabel `payment_transactions` dan `payment_channels`:

```bash
npm run migrate:tripay
```

**Output:**
```
🚀 Starting Tripay Payment Migration...
📦 Creating payment_transactions table...
📇 Creating indexes...
📦 Creating payment_channels table...
🔑 Setting up Tripay API configuration...
⚙️ Creating payment status update function...
✅ Tripay Payment Migration completed successfully!
```

### 3. Sync Payment Channels

Sync payment channels dari Tripay API ke database:

```bash
npm run sync:tripay-channels
```

**Output:**
```
🚀 Starting Tripay Payment Channels Sync...
✅ Synced 15 payment channels
✅ Sync completed successfully!
```

### 4. Konfigurasi API (via Admin Panel)

1. Login sebagai admin
2. Buka **Admin Panel → API Configs**
3. Cari service **TRIPAY**
4. Update credentials jika diperlukan
5. Set mode: `sandbox` atau `production`

### 5. Test Payment Flow

1. Login sebagai user
2. Klik icon **+** (Top Up) di dashboard
3. Pilih amount dan payment method
4. Create payment dan test flow

---

## 🗄️ Database Schema

### Table: `payment_transactions`

Menyimpan semua transaksi pembayaran:

```sql
CREATE TABLE payment_transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  
  -- Tripay Transaction Info
  reference VARCHAR(100) UNIQUE NOT NULL,         -- Tripay reference
  merchant_ref VARCHAR(100) UNIQUE,               -- Our unique reference
  payment_method VARCHAR(50) NOT NULL,            -- 'BRIVA', 'QRIS', dll
  payment_name VARCHAR(100) NOT NULL,             -- 'BRI Virtual Account'
  
  -- Amount Info
  amount INTEGER NOT NULL,                        -- User input amount
  fee_merchant INTEGER DEFAULT 0,                 -- Fee ke merchant
  fee_customer INTEGER DEFAULT 0,                 -- Fee ke customer
  total_fee INTEGER DEFAULT 0,                    -- Total fee
  amount_received INTEGER NOT NULL,               -- Amount + fee
  
  -- Credits Info
  credits_amount INTEGER NOT NULL,                -- Credits yang didapat
  credit_price_idr INTEGER NOT NULL,              -- Harga per credit saat transaksi
  
  -- Payment Details
  pay_code VARCHAR(100),                          -- VA number / payment code
  pay_url TEXT,                                   -- Payment URL
  checkout_url TEXT,                              -- Tripay checkout URL
  qr_url TEXT,                                    -- QR Code image URL
  qr_string TEXT,                                 -- QR Code string
  
  -- Status & Timestamps
  status VARCHAR(50) DEFAULT 'UNPAID',            -- UNPAID, PAID, EXPIRED, FAILED
  paid_at TIMESTAMP,
  expired_time TIMESTAMP,
  
  -- Instructions & Callback
  payment_instructions JSONB,                     -- Step-by-step payment instructions
  callback_received BOOLEAN DEFAULT false,
  callback_data JSONB,
  metadata JSONB,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Table: `payment_channels`

Menyimpan channel pembayaran yang tersedia dari Tripay:

```sql
CREATE TABLE payment_channels (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,              -- 'BRIVA', 'QRIS', dll
  name VARCHAR(100) NOT NULL,                    -- 'BRI Virtual Account'
  group_channel VARCHAR(50) NOT NULL,            -- 'Virtual Account', 'E-Wallet'
  
  -- Fee Info
  fee_merchant_flat INTEGER DEFAULT 0,
  fee_merchant_percent DECIMAL(5,2) DEFAULT 0,
  fee_customer_flat INTEGER DEFAULT 0,
  fee_customer_percent DECIMAL(5,2) DEFAULT 0,
  
  -- Limits
  minimum_amount INTEGER DEFAULT 10000,
  maximum_amount INTEGER DEFAULT 0,
  
  -- Icons & Display
  icon_url TEXT,
  is_active BOOLEAN DEFAULT true,
  settings JSONB,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔄 API Flow

### 1. Create Payment Transaction

**Endpoint:** `POST /api/payment/create`

**Request:**
```json
{
  "amount": 100000,
  "paymentMethod": "BRIVA"
}
```

**Process:**
1. Validate amount (min 10,000)
2. Calculate credits (amount / credit_price_idr)
3. Generate unique merchant_ref
4. Call Tripay API to create transaction
5. Save to database
6. Return payment details (VA number, QR, instructions)

**Response:**
```json
{
  "success": true,
  "message": "Payment created successfully",
  "data": {
    "reference": "T1234567890ABCDE",
    "paymentMethod": "BRIVA",
    "paymentName": "BRI Virtual Account",
    "amount": 100000,
    "creditsAmount": 76,
    "payCode": "70018123456789012",
    "checkoutUrl": "https://tripay.co.id/checkout/...",
    "instructions": [...],
    "expiredTime": 1234567890
  }
}
```

### 2. Payment Callback (dari Tripay)

**Endpoint:** `POST /api/payment/callback`

**Headers:**
```
X-Callback-Signature: [signature_dari_tripay]
```

**Body:**
```json
{
  "reference": "T1234567890ABCDE",
  "merchant_ref": "PIXELNEST-123-1234567890",
  "status": "PAID",
  "amount": 100000,
  "payment_method": "BRIVA",
  "payment_name": "BRI Virtual Account",
  ...
}
```

**Process:**
1. Verify callback signature (security)
2. Get transaction from database
3. Update transaction status
4. If PAID:
   - Add credits to user
   - Log credit transaction
   - Log activity
5. Return success response

### 3. Check Payment Status

**Endpoint:** `GET /api/payment/:reference/status`

**Process:**
1. Get from database
2. If not PAID, check with Tripay API
3. Update database if status changed
4. Return current status

---

## 👤 User Flow

### Step 1: Access Top-Up Page

User klik icon **+** di dashboard atau akses `/api/payment/top-up`

### Step 2: Pilih Jumlah

**Quick Buttons:**
- Rp 50.000 → 38 Credits
- Rp 100.000 → 76 Credits
- Rp 250.000 → 192 Credits
- Rp 500.000 → 384 Credits

**Custom Input:**
- Min: Rp 10.000
- Max: Unlimited
- Auto calculate credits

### Step 3: Pilih Payment Method

Payment channels grouped by type:
- **Virtual Account**: BCA, BNI, BRI, Mandiri, Permata, dll
- **E-Wallet**: OVO, DANA, ShopeePay, LinkAja
- **QRIS**: Scan QR Code
- **Retail**: Alfamart, Indomaret

### Step 4: Review & Confirm

Summary shows:
- Amount
- Credits
- Admin Fee
- Total Payment

### Step 5: Payment Instructions

After creating payment, user gets:
- **Virtual Account**: VA number + instructions
- **QRIS**: QR Code image + instructions
- **E-Wallet**: Redirect to e-wallet app
- **Retail**: Payment code + store locations

### Step 6: Complete Payment

User complete payment via chosen method

### Step 7: Auto Credit

- Tripay sends callback to our server
- System verifies and adds credits automatically
- User sees updated balance immediately

---

## 🛠️ Admin Panel

### Access Payment Transactions

**URL:** `/admin/payment-transactions`

**Features:**
- View all transactions
- Filter by status (PAID, UNPAID, EXPIRED, FAILED)
- Search by reference, user, email
- Pagination

### Statistics Dashboard

**Metrics:**
- Total Transactions
- Successful Payments (PAID)
- Pending Payments (UNPAID)
- Total Revenue (Rp)
- Total Credits Sold

### Transaction Detail

Click "Detail" to view:
- Full transaction info
- User details
- Payment method & code
- Amount breakdown
- Status & timestamps
- Payment instructions
- Checkout URL (if available)

### Sync Payment Channels

**Button:** "Sync Channels"

**Action:**
- Fetch latest channels from Tripay API
- Update database
- Add new channels
- Update existing channels

**When to Sync:**
- After Tripay adds new payment methods
- After fee structure changes
- Periodically (e.g., weekly)

---

## 🧪 Testing

### Test Payment (Sandbox)

**Sandbox Limitations:**
- Tidak menggunakan uang real
- Status tidak berubah otomatis
- Harus manual update via Tripay dashboard

**Test Flow:**

1. **Create Payment**
   ```bash
   POST /api/payment/create
   {
     "amount": 50000,
     "paymentMethod": "BRIVA"
   }
   ```

2. **Get Payment Reference**
   - Copy reference dari response
   - Example: `T1234567890ABCDE`

3. **Manual Update (Sandbox)**
   - Login ke Tripay Dashboard Sandbox
   - Cari transaksi by reference
   - Update status ke "PAID"
   - Atau gunakan simulator di Tripay

4. **Verify Credits**
   - Check user balance
   - Check credit_transactions table
   - Check activity logs

### Test Callback Locally

**Using ngrok:**

1. Install ngrok:
   ```bash
   npm install -g ngrok
   ```

2. Start ngrok:
   ```bash
   ngrok http 5005
   ```

3. Update callback URL di Tripay dashboard:
   ```
   https://your-ngrok-url.ngrok.io/api/payment/callback
   ```

4. Create payment dan test

---

## 🔧 Troubleshooting

### Problem: "Tripay configuration not found in database"

**Solution:**
```bash
# Re-run migration
npm run migrate:tripay

# Verify in database
SELECT * FROM api_configs WHERE service_name = 'TRIPAY';
```

### Problem: "Failed to sync payment channels"

**Possible Causes:**
- Invalid API Key
- Network issues
- Tripay API down

**Solution:**
1. Verify API Key:
   ```sql
   SELECT api_key, is_active FROM api_configs WHERE service_name = 'TRIPAY';
   ```

2. Check logs for error details

3. Test API Key manually:
   ```bash
   curl -H "Authorization: Bearer YOUR_API_KEY" \
        https://tripay.co.id/api-sandbox/merchant/payment-channel
   ```

### Problem: "Invalid callback signature"

**Possible Causes:**
- Wrong Private Key
- Callback from unauthorized source

**Solution:**
1. Verify Private Key in database
2. Check callback source IP (should be from Tripay)
3. Enable debug logging to see signature calculation

### Problem: "Credits not added after payment"

**Possible Causes:**
- Callback not received
- Callback failed
- Database error

**Solution:**
1. Check `payment_transactions` table:
   ```sql
   SELECT callback_received, callback_data, status 
   FROM payment_transactions 
   WHERE reference = 'T1234567890ABCDE';
   ```

2. If `callback_received = false`:
   - Check Tripay dashboard for callback history
   - Verify callback URL configuration
   - Check server logs

3. If callback received but credits not added:
   - Check credit_transactions table
   - Check user credits balance
   - Check error logs

### Problem: "Payment expired but status not updated"

**Solution:**
- Tripay automatically marks expired payments
- Callback will be sent with status "EXPIRED"
- If not updated, manually check status:
  ```bash
  GET /api/payment/:reference/status
  ```

---

## 📝 Environment Variables

Add to `.env` file (optional, sudah di database):

```env
# Tripay Payment Gateway
TRIPAY_API_KEY=DEV-gvVnLRQQG1drVQq3oCDm5DNmhCf6ZdwmsMc5S3BV
TRIPAY_PRIVATE_KEY=UPr4R-iTY5y-Mhz7I-BfTUS-34dRC
TRIPAY_MERCHANT_CODE=T41400
TRIPAY_CALLBACK_URL=http://localhost:5005/api/payment/callback

# For production, change to:
# TRIPAY_API_KEY=your-production-api-key
# TRIPAY_PRIVATE_KEY=your-production-private-key
# TRIPAY_CALLBACK_URL=https://yourdomain.com/api/payment/callback
```

---

## 🔗 API Documentation References

- [Tripay Developer Docs](https://tripay.co.id/developer)
- [Payment Channels](https://tripay.co.id/developer?tab=merchant-payment-channel)
- [Fee Calculator](https://tripay.co.id/developer?tab=merchant-fee-calculator)
- [Create Transaction](https://tripay.co.id/developer?tab=transaction-create)
- [Callback](https://tripay.co.id/developer?tab=callback)

---

## ✅ Checklist Setup

- [ ] Run `npm run migrate:tripay`
- [ ] Run `npm run sync:tripay-channels`
- [ ] Verify Tripay config in Admin Panel
- [ ] Test create payment
- [ ] Test payment callback
- [ ] Test credit addition
- [ ] Check payment history
- [ ] Test admin panel views
- [ ] Configure callback URL for production
- [ ] Switch to production credentials when ready

---

## 🎉 Summary

**Integrasi Tripay telah selesai!**

### Files Created:
1. `src/config/migrateTripayPayment.js` - Database migration
2. `src/services/tripayService.js` - Tripay API service
3. `src/controllers/paymentController.js` - Payment logic
4. `src/routes/payment.js` - Payment routes
5. `src/views/auth/top-up.ejs` - Top-up UI
6. `src/views/admin/payment-transactions.ejs` - Admin panel
7. `src/scripts/syncTripayChannels.js` - Sync channels script

### NPM Scripts:
- `npm run migrate:tripay` - Run migration
- `npm run sync:tripay-channels` - Sync payment channels

### Routes:
- `GET /api/payment/top-up` - Top-up page
- `POST /api/payment/create` - Create payment
- `POST /api/payment/callback` - Payment callback (from Tripay)
- `GET /api/payment/:reference` - Get payment detail
- `GET /api/payment/:reference/status` - Check payment status
- `GET /admin/payment-transactions` - Admin panel

**Sistem siap digunakan!** 🚀

