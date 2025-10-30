# ✨ Fitur Baru: Add New API Config dari UI

## 🎯 Overview

Sekarang Anda bisa menambahkan TRIPAY dan API config lainnya **langsung dari Admin Panel UI** tanpa perlu SQL manual!

---

## 🆕 Apa yang Baru?

### 1. **Tombol "Add New API Config"**
- Tombol baru di halaman API Configs
- Berwarna ungu dengan icon plus (+)
- Posisi: Kanan atas, di samping description

### 2. **Modal Add New**
- Form lengkap untuk menambah service baru
- Support khusus untuk TRIPAY
- Validasi otomatis
- Auto-sync ke database

### 3. **Pilihan Service**
- TRIPAY (Payment Gateway) ✨
- OPENAI (AI Models)
- REPLICATE (AI Models)
- CUSTOM (Other Service)

---

## 🚀 Cara Menggunakan

### **Menambah TRIPAY Config:**

1. **Login ke Admin Panel**
   ```
   https://your-domain.com/admin/login
   ```

2. **Buka API Configs**
   - Sidebar → API Configs

3. **Klik "Add New API Config"**
   - Tombol ungu di kanan atas

4. **Isi Form TRIPAY:**
   - **Service Name:** Pilih `TRIPAY`
   - **Kode Merchant:** `T41400` (dari Tripay Dashboard)
   - **Nama Merchant:** `Merchant Sandbox` (optional)
   - **API Key:** `DEV-xxxxxxxxxxxxx` (dari Tripay)
   - **Private Key:** `xxxxx-xxxxx-xxxxx` (dari Tripay)
   - **Callback URL:** `https://your-domain.com/api/payment/callback`
   - **Endpoint URL:** Pilih `Sandbox` atau `Production`
   - **Enable:** ✅ Centang

5. **Klik "Add Configuration"**

6. **Done!** ✅
   - TRIPAY akan muncul di list
   - Status: Active & Synced
   - Siap digunakan!

---

## 📋 Langkah Lengkap Setelah Add TRIPAY

### **1. Verify TRIPAY Sudah Ada**

Refresh halaman API Configs, seharusnya muncul card TRIPAY:

```
┌─────────────────────────────┐
│ 💳 TRIPAY                   │
│ https://tripay.co.id/api... │
│ Active ✅ Synced ✅          │
│ ──────────────────────────  │
│ [Configure] [Disable]       │
└─────────────────────────────┘
```

### **2. Sync Payment Channels**

Di server, jalankan:

```bash
cd /var/www/pixelnest
npm run sync:tripay-channels
```

Expected output:
```
✅ Sync Completed Successfully!
📊 Channels synced: 15-20
```

### **3. Verify Channels di Database**

```bash
PGPASSWORD="$DB_PASSWORD" psql -h localhost -U pixelnest_user -d pixelnest_db -c "SELECT COUNT(*) FROM payment_channels WHERE is_active = true;"
```

Expected: Ada 10-20 channels

### **4. Test API**

```bash
curl http://localhost:3000/api/payment/channels
```

Expected: JSON dengan payment channels grouped

### **5. Test di Frontend**

1. Login ke aplikasi
2. Buka halaman Top Up
3. Hard refresh: `Ctrl + Shift + R`
4. **Metode pembayaran seharusnya MUNCUL!** ✅

---

## 🎨 UI Changes

### **Halaman API Configs - BEFORE:**

```
API Configuration
Configure API keys and settings for external services

┌─────┐ ┌─────┐ ┌─────┐
│FAL_AI│ │GOOGLE│ │OPENAI│
└─────┘ └─────┘ └─────┘
```

### **Halaman API Configs - AFTER:**

```
API Configuration                      [➕ Add New API Config]
Configure API keys and settings for external services

┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐
│FAL_AI│ │GOOGLE│ │OPENAI│ │TRIPAY│ ← NEW!
└─────┘ └─────┘ └─────┘ └─────┘
```

---

## 🔧 Technical Details

### **Files Updated:**

1. **src/views/admin/api-configs.ejs**
   - ✅ Added "Add New API Config" button
   - ✅ Added new modal for adding service
   - ✅ Added JavaScript functions: `openAddModal()`, `closeAddModal()`, `toggleAddServiceFields()`
   - ✅ Added form submission handler

2. **src/routes/admin.js**
   - ✅ Added POST route: `router.post('/api-configs', ...)`

3. **src/controllers/adminController.js**
   - ✅ Added `createApiConfig()` controller method
   - ✅ Validation & duplicate check
   - ✅ Auto-sync to .env

4. **src/models/Admin.js**
   - ✅ Added `createApiConfig()` model method
   - ✅ Added `getApiConfig()` helper method

### **API Endpoint:**

```http
POST /admin/api-configs
Content-Type: application/json

{
  "service_name": "TRIPAY",
  "api_key": "DEV-xxxxxxxxxxxxx",
  "api_secret": "xxxxx-xxxxx-xxxxx",
  "endpoint_url": "https://tripay.co.id/api-sandbox",
  "is_active": true,
  "additional_config": {
    "merchant_code": "T41400",
    "merchant_name": "Merchant Sandbox",
    "callback_url": "https://your-domain.com/api/payment/callback"
  }
}
```

Response:
```json
{
  "success": true,
  "message": "TRIPAY configuration added successfully",
  "apiConfig": { ... },
  "envSynced": true
}
```

---

## ⚠️ Error Handling

### **Duplicate Service Error:**

Jika TRIPAY sudah ada:
```json
{
  "success": false,
  "message": "API configuration for TRIPAY already exists. Please use update instead."
}
```

**Solution:** Gunakan tombol "Configure" di card TRIPAY yang sudah ada.

### **Missing Required Fields:**

Jika field required tidak diisi:
```json
{
  "success": false,
  "message": "Please fill all required Tripay fields"
}
```

**Solution:** Isi semua field yang ada tanda bintang (*).

### **Database Error:**

Jika ada masalah database:
```json
{
  "success": false,
  "message": "Failed to create API config",
  "error": "..."
}
```

**Solution:** Check PM2 logs: `pm2 logs pixelnest-server`

---

## 🎉 Benefits

### **Before (Manual SQL):**

```bash
# Harus login ke server
ssh user@server

# Harus tahu SQL syntax
psql -U user -d db -c "INSERT INTO api_configs ..."

# Manual typing, prone to errors
# Tidak user-friendly
```

### **After (UI Add New):**

```bash
# Cukup buka browser
# Click "Add New API Config"
# Isi form dengan guidance
# Click "Add Configuration"
# ✅ DONE!
```

**Keuntungan:**
- ✅ **User-friendly** - No need SQL knowledge
- ✅ **Validation** - Auto check required fields
- ✅ **Guidance** - Instructions & placeholders
- ✅ **Safe** - No typo in SQL
- ✅ **Fast** - Few clicks vs manual typing
- ✅ **Auto-sync** - Sync to .env automatically

---

## 📝 Usage Examples

### **Example 1: Add TRIPAY Sandbox**

```
Service: TRIPAY
Merchant Code: T41400
Merchant Name: Testing Merchant
API Key: DEV-xxxxxxxxxxxxxxxxxxxxxxxx
Private Key: xxxxx-xxxxx-xxxxx-xxxxx-xxxxx
Callback URL: https://pixelnest.example.com/api/payment/callback
Endpoint: Sandbox (Testing)
Enable: ✅
```

### **Example 2: Add OPENAI**

```
Service: OPENAI
API Key: sk-xxxxxxxxxxxxxxxxxxxxxxxx
Endpoint URL: https://api.openai.com/v1
Enable: ✅
```

### **Example 3: Add Custom Service**

```
Service: CUSTOM
API Key: your-custom-api-key
Endpoint URL: https://api.yourservice.com/v1
Enable: ✅
```

---

## 🔍 Troubleshooting

### **Modal tidak muncul saat klik "Add New":**

```bash
# Clear cache browser
Ctrl + Shift + Delete

# Hard refresh
Ctrl + Shift + R
```

### **Form submit error:**

```bash
# Check PM2 logs
pm2 logs pixelnest-server --lines 100

# Check browser console
F12 → Console tab
```

### **TRIPAY ditambah tapi payment methods tidak muncul:**

```bash
# Sync channels dari Tripay
npm run sync:tripay-channels

# Restart app
pm2 restart pixelnest-server

# Verify
npm run verify:payment-channels
```

---

## ✅ Testing Checklist

- [ ] Tombol "Add New API Config" muncul di halaman API Configs
- [ ] Click tombol, modal "Add New" muncul
- [ ] Select "TRIPAY" dari dropdown
- [ ] Form TRIPAY fields muncul
- [ ] Isi semua required fields
- [ ] Click "Add Configuration"
- [ ] Success toast muncul
- [ ] Page reload otomatis
- [ ] TRIPAY card muncul di list dengan status Active
- [ ] Run `npm run sync:tripay-channels`
- [ ] Payment channels sync berhasil
- [ ] Test di frontend - metode pembayaran muncul ✅

---

## 🎯 Next Steps

Setelah fitur ini, Anda bisa:

1. ✅ **Tambah TRIPAY dari UI** tanpa SQL
2. ✅ **Sync payment channels** dengan `npm run sync:tripay-channels`
3. ✅ **Test payment** di halaman Top Up
4. ✅ **Monitor transactions** di Admin Panel

**Metode pembayaran akan muncul dengan sempurna!** 🎉

---

**Last Updated:** 2025-10-29  
**Version:** 2.0 - Add New API Config Feature  
**Author:** Ahwanulm


