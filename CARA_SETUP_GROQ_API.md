# 🔧 Cara Setup Groq API di Admin Panel

## ⚠️ Penting!

Jika Anda tidak melihat **kolom input API Key Groq** di halaman Admin → API Configs, itu karena **config Groq belum ditambahkan ke database**.

---

## 📋 Langkah Setup (Lengkap)

### Step 1: Dapatkan Groq API Key (GRATIS)

1. Buka https://console.groq.com
2. Sign up / Login dengan email
3. Klik **"API Keys"** di sidebar
4. Klik **"Create API Key"**
5. Beri nama (contoh: "PixelNest")
6. **Copy API key** (dimulai dengan `gsk_...`)

> ⚠️ Simpan API key ini! Tidak akan ditampilkan lagi

---

### Step 2: Tambahkan Groq Config di Admin

#### Opsi A: Via Admin UI (Jika Belum Ada Config Groq)

1. **Login sebagai Admin** ke PixelNest
2. **Buka** Admin → API Configs
3. **Klik** "Add New API Config" (tombol hijau di kanan atas)
4. **Pilih Service:** GROQ (AI Prompt Enhancement)
5. **Isi Form:**
   ```
   API Key: gsk_xxxxxxxxxxxxxx (paste dari Groq Console)
   Default Model: llama-3.3-70b-versatile (biarkan default)
   Endpoint URL: https://api.groq.com/openai/v1 (readonly, jangan diubah)
   ```
6. **Centang** "Enable this API service" ✅
7. **Klik** "Add Configuration"
8. **Done!** ✅

#### Opsi B: Jika TIDAK ADA Opsi "GROQ" di Dropdown

Jika tidak ada opsi GROQ saat Add New API Config, insert manual ke database:

```sql
INSERT INTO api_configs (service_name, api_key, endpoint_url, is_active, additional_config, created_at, updated_at)
VALUES (
  'GROQ',
  'gsk_your_api_key_here',  -- Ganti dengan API key Anda
  'https://api.groq.com/openai/v1',
  true,
  '{"default_model": "llama-3.3-70b-versatile"}',
  NOW(),
  NOW()
);
```

**Cara jalankan SQL:**

1. **Via psql (terminal):**
   ```bash
   psql -U your_username -d pixelnest
   # Kemudian paste query SQL di atas
   ```

2. **Via pgAdmin atau database GUI:**
   - Connect ke database `pixelnest`
   - Open Query Tool
   - Paste query
   - Execute

3. **Restart server:**
   ```bash
   npm run dev
   ```

---

### Step 3: Verifikasi Setup

1. Refresh halaman **Admin → API Configs**
2. Anda seharusnya melihat card **GROQ** dengan:
   - Icon: 🪄 (wand-magic-sparkles) orange
   - API Key: `gsk_...` (tersembunyi)
   - Model: llama-3.3-70b-versatile
   - Status: Active ✅

3. Klik **"Configure"** untuk edit jika perlu

---

## 🎯 Cara Edit/Update Groq Config

1. **Buka** Admin → API Configs
2. **Cari card GROQ** (warna orange)
3. **Klik** "Configure"
4. **Update:**
   - API Key (kosongkan jika tidak mau ubah)
   - Model (pilih sesuai kebutuhan)
5. **Save Configuration**

---

## ✅ Test Auto Prompt Feature

Setelah setup:

1. **Logout dari admin**
2. **Login sebagai user biasa**
3. **Buka Dashboard**
4. **Lihat di atas kolom prompt** → Seharusnya ada toggle:
   ```
   🪄 Auto Prompt [AI]  [  OFF ]
   ```
5. **Aktifkan toggle**
6. **Ketik prompt sederhana:** `"a beautiful sunset"`
7. Prompt akan **otomatis di-enhance** jadi lebih detail!
8. **Generate** dan lihat hasilnya

---

## 🔍 Troubleshooting

### Toggle Auto Prompt Tidak Muncul

**Kemungkinan Penyebab:**
1. Groq config belum ditambahkan ke database
2. Service Groq tidak active (`is_active = false`)
3. Browser cache (hard refresh: Ctrl+Shift+R)

**Solusi:**
```sql
-- Check config exists
SELECT * FROM api_configs WHERE service_name = 'GROQ';

-- Jika tidak ada, insert:
INSERT INTO api_configs (service_name, api_key, endpoint_url, is_active, additional_config)
VALUES ('GROQ', 'gsk_your_key', 'https://api.groq.com/openai/v1', true, '{"default_model": "llama-3.3-70b-versatile"}');

-- Jika ada tapi tidak active:
UPDATE api_configs SET is_active = true WHERE service_name = 'GROQ';
```

### Error "Auto Prompt not configured"

**Penyebab:** API key salah atau expired

**Solusi:**
1. Check API key di Groq Console: https://console.groq.com
2. Create API key baru jika perlu
3. Update di Admin → API Configs → GROQ → Configure

### Enhancement Gagal

**Penyebab:** 
- API key invalid
- Rate limit tercapai (free tier)
- Network error

**Solusi:**
1. Check console browser untuk error detail (F12)
2. Verify API key masih valid
3. Tunggu beberapa saat (rate limit reset)

---

## 📊 Model Groq yang Tersedia

Pilih model di Admin → API Configs → GROQ → Default Model:

1. **llama-3.3-70b-versatile** ⭐ (Recommended)
   - Best quality
   - Balanced speed & quality
   
2. **llama-3.1-8b-instant** ⚡
   - Fastest
   - Good untuk quick enhancement
   
3. **mixtral-8x7b-32768**
   - Large context window
   - Bagus untuk prompt panjang
   
4. **gemma2-9b-it**
   - Lightweight
   - Fast inference

---

## 💡 FAQ

### Q: Apakah harus bayar?
**A:** TIDAK! Groq memiliki free tier yang sangat generous. Cocok untuk personal use.

### Q: Berapa limit free tier?
**A:** Tergantung model, tapi umumnya cukup untuk penggunaan normal. Check di Groq Console untuk detail.

### Q: Bisa ganti model?
**A:** Ya! Di Admin → API Configs → GROQ → Configure → Default Model

### Q: API key bisa di-share?
**A:** Tidak disarankan. Buat API key terpisah untuk setiap project.

### Q: Bagaimana cara disable auto prompt?
**A:** 
- Untuk disable service: Admin → API Configs → GROQ → Disable
- Untuk user: Toggle OFF di dashboard

---

## 🔐 Keamanan

✅ **DO:**
- Simpan API key dengan aman
- Gunakan .env untuk production
- Rotate API key secara berkala
- Monitor usage di Groq Console

❌ **DON'T:**
- Share API key publicly
- Commit API key ke git
- Hardcode API key di code

---

## 📞 Butuh Bantuan?

1. Check console browser (F12) untuk error
2. Check database: `SELECT * FROM api_configs WHERE service_name = 'GROQ';`
3. Restart server: `npm run dev`
4. Clear browser cache
5. Check Groq API status: https://status.groq.com

---

**Status:** Ready to Use! ✅  
**Last Updated:** October 29, 2025

