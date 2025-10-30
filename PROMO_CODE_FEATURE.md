# 🎟️ Promo Code Feature - Complete Guide

> **Sistem kode promo untuk pembayaran dengan validasi lengkap dan UI yang user-friendly**

---

## ✅ Fitur yang Ditambahkan

### 1. **Input Promo Code di Modal Top-Up**
- ✅ Input field untuk memasukkan kode promo
- ✅ Tombol "Terapkan" untuk validasi
- ✅ Auto-uppercase untuk kode promo
- ✅ Pesan sukses/error yang jelas
- ✅ Tombol "Hapus" untuk menghapus promo yang diterapkan

### 2. **Validasi Promo Code**
- ✅ Validasi kode promo aktif
- ✅ Validasi periode berlaku (valid_from & valid_until)
- ✅ Validasi minimum pembelian
- ✅ Validasi penggunaan per user (single_use)
- ✅ Validasi batas penggunaan total (usage_limit)
- ✅ Real-time validation via API

### 3. **Perhitungan Diskon**
- ✅ Support 2 tipe diskon:
  - **Percentage**: Diskon persentase (misal: 10%)
  - **Fixed**: Diskon nominal (misal: Rp 20.000)
- ✅ Tampilan harga awal dan harga setelah diskon
- ✅ Update otomatis di summary pembayaran

### 4. **Database Schema**
- ✅ Tabel `promo_codes` untuk menyimpan kode promo
- ✅ Kolom `promo_code` di tabel `payment_transactions`
- ✅ Index untuk performa optimal

---

## 🗄️ Database Schema

### Tabel `promo_codes`
```sql
CREATE TABLE promo_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  
  -- Discount configuration
  discount_type VARCHAR(20) NOT NULL, -- 'percentage' or 'fixed'
  discount_value DECIMAL(10,2) NOT NULL,
  
  -- Usage restrictions
  min_purchase INTEGER DEFAULT 0,
  max_discount INTEGER,
  single_use BOOLEAN DEFAULT false,
  usage_limit INTEGER,
  
  -- Validity period
  valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  valid_until TIMESTAMP,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id)
);
```

### Kolom Baru di `payment_transactions`
```sql
ALTER TABLE payment_transactions 
ADD COLUMN promo_code VARCHAR(50);
```

---

## 🚀 Setup & Installation

### 1. Jalankan Migration
```bash
psql -U your_username -d your_database -f migrations/add_promo_codes.sql
```

### 2. Sample Promo Codes
Migration otomatis membuat 3 kode promo untuk testing:

| Kode | Tipe | Diskon | Min Purchase | Deskripsi |
|------|------|--------|--------------|-----------|
| `WELCOME10` | Percentage | 10% | Rp 50.000 | Diskon 10% untuk pengguna baru |
| `SAVE20K` | Fixed | Rp 20.000 | Rp 100.000 | Diskon Rp 20.000 |
| `MEGA50` | Percentage | 50% | - | Diskon 50% (max Rp 100.000) |

---

## 📝 User Flow

### Step 1: Input Credits
1. User membuka modal top-up
2. Pilih atau input jumlah credits
3. **[NEW]** User memasukkan kode promo (opsional)
4. Klik tombol "Terapkan"

### Step 2: Validasi Promo
```javascript
POST /api/payment/validate-promo
{
  "code": "WELCOME10",
  "amount": 200000
}
```

**Response Success:**
```json
{
  "success": true,
  "message": "Kode promo valid",
  "promo": {
    "code": "WELCOME10",
    "type": "percentage",
    "value": 10,
    "description": "Diskon 10% untuk pengguna baru"
  }
}
```

**Response Error:**
```json
{
  "success": false,
  "message": "Kode promo tidak valid atau sudah kadaluarsa"
}
```

### Step 3: Lihat Diskon di Summary
```
┌─────────── PRICE SUMMARY ───────────┐
│ Harga Awal:        Rp 200.000       │
│ Diskon (WELCOME10): -Rp 20.000      │
│ ─────────────────────────────────── │
│ Total Pembayaran:  Rp 180.000       │
└─────────────────────────────────────┘
```

### Step 4: Create Payment
```javascript
POST /api/payment/create
{
  "amount": 180000,
  "credits": 100,
  "paymentMethod": "BRIVA",
  "promoCode": "WELCOME10"
}
```

---

## 🎨 UI Components

### Input Promo Code
```html
<!-- Promo Code Input -->
<div>
  <label class="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
    <i class="fas fa-tag text-purple-400"></i>
    Kode Promo (Opsional)
  </label>
  <div class="flex gap-2">
    <div class="relative flex-1">
      <input 
        type="text" 
        id="promoCode" 
        placeholder="Masukkan kode promo"
        class="w-full px-4 py-3 bg-white/5 border-2 border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all uppercase"
      >
      <div class="absolute right-4 top-1/2 transform -translate-y-1/2">
        <i class="fas fa-gift text-gray-400 text-sm"></i>
      </div>
    </div>
    <button 
      id="applyPromoBtn"
      onclick="applyPromoCode()" 
      class="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white rounded-xl transition-all duration-300 font-semibold"
    >
      Terapkan
    </button>
  </div>
  <!-- Promo Status Message -->
  <div id="promoMessage" class="mt-2 text-sm hidden"></div>
</div>
```

### Pesan Status
```javascript
// Success
showPromoMessage('Promo "WELCOME10" berhasil diterapkan! 🎉', 'success');

// Error
showPromoMessage('Kode promo tidak valid', 'error');

// Info
showPromoMessage('Kode promo dihapus', 'info');
```

---

## 🔧 API Endpoints

### 1. Validate Promo Code
```
POST /api/payment/validate-promo
```

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "code": "WELCOME10",
  "amount": 200000
}
```

**Validations:**
- ✅ Kode promo exists & active
- ✅ Valid period (valid_from - valid_until)
- ✅ Minimum purchase requirement
- ✅ Single use per user
- ✅ Total usage limit

### 2. Create Payment (Updated)
```
POST /api/payment/create
```

**Request Body:**
```json
{
  "amount": 180000,
  "credits": 100,
  "paymentMethod": "BRIVA",
  "promoCode": "WELCOME10"  // Optional
}
```

---

## 💻 JavaScript Functions

### Apply Promo Code
```javascript
async function applyPromoCode() {
  const promoInput = document.getElementById('promoCode');
  const promoCode = promoInput.value.trim();
  
  const response = await fetch('/api/payment/validate-promo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      code: promoCode,
      amount: selectedCreditsAmount * creditPriceIDR
    })
  });
  
  const data = await response.json();
  
  if (data.success) {
    appliedPromo = {
      code: promoCode,
      type: data.promo.type,
      value: data.promo.value
    };
    updateSummary();
  }
}
```

### Remove Promo Code
```javascript
function removePromoCode() {
  appliedPromo = null;
  document.getElementById('promoCode').value = '';
  updateSummary();
}
```

### Calculate Discount
```javascript
function updateSummary() {
  let total = selectedCreditsAmount * creditPriceIDR;
  let discount = 0;
  
  if (appliedPromo) {
    if (appliedPromo.type === 'percentage') {
      discount = total * (appliedPromo.value / 100);
    } else if (appliedPromo.type === 'fixed') {
      discount = appliedPromo.value;
    }
    total = Math.max(0, total - discount);
  }
  
  // Update display
  document.getElementById('summaryTotal').textContent = 
    `Rp ${total.toLocaleString('id-ID')}`;
}
```

---

## 📊 Promo Code Management

### Create New Promo Code
```sql
INSERT INTO promo_codes (
  code, description, discount_type, discount_value, 
  min_purchase, single_use, usage_limit, 
  valid_from, valid_until, is_active
) VALUES (
  'NEWYEAR25', 
  'Diskon Tahun Baru 25%', 
  'percentage', 
  25.00,
  100000,
  false,
  1000,
  '2025-01-01 00:00:00',
  '2025-01-31 23:59:59',
  true
);
```

### Deactivate Promo Code
```sql
UPDATE promo_codes 
SET is_active = false 
WHERE code = 'WELCOME10';
```

### Check Promo Usage
```sql
SELECT 
  pc.code,
  pc.description,
  COUNT(pt.id) as total_usage,
  pc.usage_limit,
  SUM(CASE WHEN pt.status = 'PAID' THEN 1 ELSE 0 END) as paid_usage
FROM promo_codes pc
LEFT JOIN payment_transactions pt ON pt.promo_code = pc.code
WHERE pc.code = 'WELCOME10'
GROUP BY pc.id;
```

---

## 🎯 Features Summary

### ✅ Completed
- [x] Promo code input UI dengan icon dan styling yang menarik
- [x] Validasi promo code real-time via API
- [x] Support 2 tipe diskon (percentage & fixed)
- [x] Validasi minimum purchase
- [x] Validasi single use per user
- [x] Validasi usage limit
- [x] Validasi periode berlaku
- [x] Display harga awal dan diskon
- [x] Tombol hapus promo code
- [x] Integrasi dengan payment flow
- [x] Database schema & migrations
- [x] API endpoint untuk validasi
- [x] Save promo code di payment transaction

### 🔄 Optional Enhancements
- [ ] Admin panel untuk CRUD promo codes
- [ ] Promo code analytics dashboard
- [ ] Email notification dengan promo code
- [ ] Auto-apply promo code dari URL parameter
- [ ] Stacking multiple promo codes
- [ ] Category/user-specific promo codes

---

## 🐛 Troubleshooting

### Error: "Kode promo tidak valid"
**Causes:**
1. Kode salah atau tidak ada di database
2. Promo sudah expired (valid_until < NOW())
3. Promo belum aktif (valid_from > NOW())
4. Promo di-deactivate (is_active = false)

**Solution:**
```sql
-- Check promo status
SELECT * FROM promo_codes WHERE code = 'YOUR_CODE';
```

### Error: "Minimum pembelian tidak terpenuhi"
**Cause:** Amount < min_purchase

**Solution:** Tambah jumlah credits atau gunakan promo lain

### Error: "Anda sudah menggunakan kode promo ini"
**Cause:** Promo has `single_use = true` and user already used it

**Solution:** Gunakan kode promo yang berbeda

---

## 📖 Related Files

### Frontend
- `src/views/auth/dashboard.ejs` - UI & JavaScript logic

### Backend
- `src/controllers/paymentController.js` - Validation & payment logic
- `src/routes/payment.js` - API routes

### Database
- `migrations/add_promo_codes.sql` - Database schema

---

## 🎉 Success!

Sistem promo code berhasil diterapkan dengan fitur lengkap:
✅ Input UI yang user-friendly
✅ Validasi lengkap
✅ Perhitungan diskon otomatis
✅ Integrasi dengan payment flow
✅ Database schema yang terstruktur

**Selamat menggunakan! 🎊**

