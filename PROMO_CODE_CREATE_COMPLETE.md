# ✅ Promo Code Admin Panel - UPDATED & COMPLETE

## 🎯 Update Summary

Admin panel untuk promo codes telah diupdate untuk menggunakan schema database yang baru dan benar.

---

## 📋 Perubahan Schema Database

### ❌ Field Lama (Dihapus):
- `credits_bonus` - Bonus credits tidak lagi didukung
- `max_uses` - Diganti dengan `usage_limit`

### ✅ Field Baru (Ditambahkan):
- `min_purchase` - Minimum pembelian dalam Rupiah
- `single_use` - Batasan satu kali pakai per user
- `usage_limit` - Total limit penggunaan promo (sebelumnya max_uses)

---

## 🔧 File yang Diupdate

### 1. **src/models/Admin.js**

```javascript
async createPromoCode(data) {
  const query = `
    INSERT INTO promo_codes 
    (code, description, discount_type, discount_value, 
     min_purchase, single_use, usage_limit, 
     is_active, valid_from, valid_until)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `;
  const values = [
    data.code.toUpperCase(),
    data.description,
    data.discount_type,
    data.discount_value,
    data.min_purchase || 0,         // NEW
    data.single_use || false,       // NEW
    data.usage_limit || null,       // RENAMED from max_uses
    data.is_active !== false,
    data.valid_from || null,
    data.valid_until || null
  ];
  const result = await pool.query(query, values);
  return result.rows[0];
}
```

### 2. **src/views/admin/promo-codes.ejs**

#### ✅ Form Fields Updated:

**Minimum Purchase Field:**
```html
<div class="mb-4">
  <label>
    <i class="fas fa-wallet mr-1"></i>
    Minimum Purchase (Rp)
  </label>
  <input type="number" id="minPurchase" min="0" step="1000"
         placeholder="0"
         class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg" />
  <p class="text-xs text-gray-400 mt-1">
    Minimum purchase amount to use this promo (0 = no minimum)
  </p>
</div>
```

**Single Use Field:**
```html
<div>
  <label>Single Use Per User</label>
  <select id="singleUse" class="...">
    <option value="false">Multiple Use</option>
    <option value="true">Single Use Only</option>
  </select>
  <p class="text-xs text-gray-400 mt-1">
    Can user use this promo multiple times?
  </p>
</div>
```

**Usage Limit Field:**
```html
<div>
  <label>Usage Limit</label>
  <input type="number" id="usageLimit" min="1" step="1"
         placeholder="100"
         class="..." />
  <p class="text-xs text-gray-400 mt-1">
    Total times this promo can be used (empty = unlimited)
  </p>
</div>
```

#### ✅ Table Display Updated:

```html
<td class="px-6 py-4 text-white">
  <%= promo.discount_type === 'percentage' 
      ? promo.discount_value + '%' 
      : 'Rp ' + promo.discount_value.toLocaleString('id-ID') %>
  <% if (promo.min_purchase > 0) { %>
    <div class="text-xs text-gray-400">
      Min. Rp <%= promo.min_purchase.toLocaleString('id-ID') %>
    </div>
  <% } %>
</td>
<td class="px-6 py-4 text-gray-400">
  <%= promo.uses_count %><%= promo.usage_limit ? ' / ' + promo.usage_limit : ' / ∞' %>
  <% if (promo.single_use) { %>
    <div class="text-xs text-yellow-400">Single Use</div>
  <% } %>
</td>
```

#### ✅ JavaScript Functions Updated:

**createPromoCode():**
```javascript
const data = {
  code: document.getElementById('code').value.trim().toUpperCase(),
  description: document.getElementById('description').value,
  discount_type: document.getElementById('discountType').value,
  discount_value: parseFloat(document.getElementById('discountValue').value),
  min_purchase: parseInt(document.getElementById('minPurchase').value) || 0,      // NEW
  single_use: document.getElementById('singleUse').value === 'true',             // NEW
  usage_limit: parseInt(document.getElementById('usageLimit').value) || null,    // RENAMED
  is_active: document.getElementById('isActive').value === 'true',
  valid_from: document.getElementById('validFrom').value || null,
  valid_until: document.getElementById('validUntil').value || null
};
```

**updatePreview():**
```javascript
const minPurchase = document.getElementById('minPurchase').value;
const singleUse = document.getElementById('singleUse').value === 'true';

// Show minimum purchase in preview
const minPurchaseEl = document.getElementById('previewMinPurchase');
if (minPurchase && parseInt(minPurchase) > 0) {
  minPurchaseEl.style.display = 'inline-block';
  minPurchaseEl.innerHTML = `<i class="fas fa-wallet mr-1"></i> Min. Rp ${parseInt(minPurchase).toLocaleString('id-ID')}`;
} else {
  minPurchaseEl.style.display = 'none';
}

// Show single use badge in preview
const singleUseEl = document.getElementById('previewSingleUse');
if (singleUse) {
  singleUseEl.style.display = 'inline-block';
} else {
  singleUseEl.style.display = 'none';
}
```

---

## 🧪 Testing Instructions

### 1. **Pastikan Database Migration Sudah Dijalankan**

```sql
-- Verify table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'promo_codes'
ORDER BY ordinal_position;
```

Harus ada kolom:
- ✅ `min_purchase` (numeric)
- ✅ `single_use` (boolean)
- ✅ `usage_limit` (integer)

### 2. **Test Create Promo Code**

1. Buka halaman admin: `http://localhost:5005/admin/promo-codes`
2. Klik **"Create Promo Code"**
3. Isi form dengan data test:

```
Code: WELCOME50
Description: Welcome bonus 50% off
Discount Type: Percentage
Discount Value: 50
Minimum Purchase: 100000
Usage Limit: 100
Single Use Per User: Single Use Only
Status: Active
```

4. Klik **"Create Promo Code"**
5. Verify:
   - ✅ Promo muncul di table
   - ✅ Menampilkan "Min. Rp 100.000"
   - ✅ Menampilkan badge "Single Use"
   - ✅ Usage count: 0 / 100

### 3. **Test Apply Promo di Dashboard**

1. Login sebagai user
2. Buka dashboard
3. Klik "Top Up Credits"
4. Pilih jumlah credits (misal: 200 credits = Rp 420.000)
5. Masukkan kode promo: **WELCOME50**
6. Klik "Terapkan"
7. Verify:
   - ✅ Diskon 50% diterapkan
   - ✅ Total menjadi Rp 210.000
   - ✅ Badge promo muncul

### 4. **Test Min Purchase Validation**

1. Pilih credits yang nilai total < Rp 100.000
2. Coba apply promo WELCOME50
3. Harusnya muncul error: **"Minimum pembelian Rp 100.000"**

### 5. **Test Single Use**

1. Apply promo dan complete payment
2. Coba apply promo yang sama lagi
3. Harusnya muncul error: **"Kode promo sudah pernah Anda gunakan"**

---

## 🔍 Troubleshooting

### Error: "Column does not exist"

**Solusi:**
```bash
cd /Users/ahwanulm/Desktop/PROJECT/PIXELNEST
psql -d pixelnest -f migrations/add_promo_codes.sql
```

### Error: Promo validation tidak bekerja

**Check:**
1. ✅ Backend `validatePromoCode()` di `paymentController.js`
2. ✅ Frontend `applyPromoCode()` di `dashboard.ejs`
3. ✅ Route `/api/payment/validate-promo` di `payment.js`

**Test API manually:**
```bash
curl -X POST http://localhost:5005/api/payment/validate-promo \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -d '{"code":"WELCOME50","amount":420000}'
```

### Promo Table kosong

**Insert sample data:**
```sql
INSERT INTO promo_codes 
(code, description, discount_type, discount_value, min_purchase, single_use, usage_limit, is_active, valid_from, valid_until)
VALUES 
('WELCOME50', 'Welcome bonus 50% off', 'percentage', 50, 100000, true, 100, true, NOW(), NOW() + INTERVAL '30 days'),
('SAVE20K', 'Hemat Rp 20.000', 'fixed', 20000, 0, false, NULL, true, NOW(), NOW() + INTERVAL '60 days'),
('NEWUSER', 'New user 30% discount', 'percentage', 30, 50000, true, 50, true, NOW(), NOW() + INTERVAL '90 days');
```

---

## ✅ Checklist Verification

- [x] Database migration selesai (`add_promo_codes.sql`)
- [x] Model `Admin.js` updated dengan field baru
- [x] Admin panel form updated
- [x] Admin panel table display updated
- [x] JavaScript functions updated
- [x] Preview card updated
- [x] No linter errors
- [ ] Test create promo via admin panel
- [ ] Test apply promo di dashboard
- [ ] Test min_purchase validation
- [ ] Test single_use validation
- [ ] Test usage_limit validation

---

## 📚 Related Documentation

- `PROMO_CODE_FEATURE.md` - Dokumentasi fitur promo code
- `PROMO_CODE_TROUBLESHOOTING.md` - Panduan troubleshooting
- `FINAL_FIX_PROMO.md` - Final fixes untuk promo code
- `migrations/add_promo_codes.sql` - Database schema

---

## 🎉 Success Criteria

✅ Admin dapat create promo code dengan:
- Minimum purchase requirement
- Single use per user option
- Usage limit (total uses)

✅ Promo codes dapat divalidasi dengan benar di:
- Frontend (dashboard)
- Backend (API)

✅ Error messages yang spesifik untuk:
- Kode tidak ditemukan
- Kode tidak aktif
- Kode kadaluarsa
- Minimum purchase tidak terpenuhi
- Sudah digunakan (single use)
- Limit penggunaan tercapai

---

**Last Updated:** October 26, 2025
**Status:** ✅ COMPLETE - Ready for Testing
