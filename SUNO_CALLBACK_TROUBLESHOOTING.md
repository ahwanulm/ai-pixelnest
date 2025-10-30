# 🔧 Troubleshooting: Suno Callback Tidak Sampai (Status Processing Terus)

## ❌ Masalah

Setelah submit music generation dengan Suno (via Grok):
- Status stuck di **"processing"** terus-menerus
- Music sudah jadi di Suno API tapi tidak muncul di PixelNest
- Callback dari Grok tidak sampai ke server

---

## 🔍 Diagnosis Checklist

### 1️⃣ **Cek Callback URL di Admin Panel**

Masuk ke: **Admin Panel → API Configs → SUNO**

Callback URL harus sesuai dengan server Anda:

```
✅ Production: https://pixelnest.app/music/callback/suno
✅ Development (dengan ngrok): https://your-ngrok-url.ngrok.io/music/callback/suno
❌ SALAH (localhost): http://localhost:5005/music/callback/suno
```

**Localhost TIDAK BISA diakses dari internet!** Grok API tidak bisa kirim callback ke localhost.

---

### 2️⃣ **Cek Callback URL di Grok/Suno API**

Di dashboard Grok/Suno API, pastikan callback URL yang terdaftar **SAMA PERSIS** dengan yang ada di Admin Panel PixelNest.

**Format:**
```
https://your-domain.com/music/callback/suno
```

**Catatan penting:**
- Harus **HTTPS** (bukan HTTP) untuk production
- Tidak boleh ada trailing slash di akhir
- Path harus `/music/callback/suno` (exact match)

---

### 3️⃣ **Cek Server Logs**

Jalankan server dengan mode verbose untuk lihat callback yang masuk:

```bash
npm start
```

Ketika callback diterima, Anda akan lihat log seperti ini:

```
📥 Suno callback received: {
  "code": 200,
  "msg": "Success",
  "data": {
    "callbackType": "first",
    "task_id": "xxx-xxx-xxx",
    "data": [...]
  }
}
📦 Processing callback:
   Type: first
   Task ID: xxx-xxx-xxx
   Tracks: 2
✅ 1 track(s) ready with audio_url
✅ Updated original generation 123
```

**Jika tidak ada log sama sekali** → Callback tidak sampai ke server!

---

### 4️⃣ **Test Callback Endpoint Manual**

Gunakan script test yang sudah dibuat:

```bash
# 1. Pastikan server running
npm start

# 2. Di terminal baru, test callback endpoint
node test-suno-callback.js
```

Output yang diharapkan:
```
🏥 Checking server health...
✅ Server is running!

🧪 Testing Suno Callback Endpoint
✅ Callback received successfully!
```

**Jika gagal:**
- Server tidak running
- Port salah
- Firewall blocking

---

## 🛠️ Solusi Berdasarkan Skenario

### Skenario A: Development (Localhost)

**Masalah:** Grok API tidak bisa akses `localhost:5005`

**Solusi:** Gunakan **ngrok** untuk expose localhost ke internet

```bash
# 1. Install ngrok (jika belum)
brew install ngrok  # macOS
# atau download dari https://ngrok.com

# 2. Run ngrok
ngrok http 5005

# 3. Copy URL yang muncul (contoh: https://abc123.ngrok.io)

# 4. Update callback URL di:
#    - Admin Panel → API Configs → SUNO → Callback URL
#      https://abc123.ngrok.io/music/callback/suno
#    
#    - Grok/Suno API Dashboard → Callback URL
#      https://abc123.ngrok.io/music/callback/suno

# 5. Test generate music lagi
```

**PENTING:** Setiap kali restart ngrok, URL berubah! Update lagi di admin panel.

---

### Skenario B: Production (Server Online)

**Masalah:** Callback URL salah atau firewall blocking

**Solusi 1: Verify Callback URL**

```bash
# Test dari luar server
curl -X POST https://pixelnest.app/music/callback/suno \
  -H "Content-Type: application/json" \
  -d '{
    "code": 200,
    "msg": "Test",
    "data": {
      "callbackType": "first",
      "task_id": "test-123",
      "data": []
    }
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Callback received",
  "timestamp": "2025-10-30T..."
}
```

**Solusi 2: Check Firewall**

```bash
# Di server, check apakah port 5005 terbuka
sudo ufw status
sudo ufw allow 5005/tcp

# Check nginx/apache config (jika pakai reverse proxy)
# Pastikan route /music/callback/suno di-forward ke backend
```

---

### Skenario C: Callback Diterima Tapi Tidak Diproses

**Gejala:**
- Log menunjukkan callback diterima
- Tapi status tetap "processing"

**Penyebab Umum:**

#### 1. Task ID Tidak Cocok

Check database:
```sql
SELECT id, metadata, status 
FROM ai_generation_history 
WHERE status = 'processing' 
AND generation_type = 'audio'
ORDER BY created_at DESC 
LIMIT 5;
```

Pastikan `task_id` dari callback ada di kolom `metadata`.

**Fix:** Regenerate music, atau update manual:
```sql
UPDATE ai_generation_history 
SET status = 'completed',
    result_url = 'https://audio-url.mp3',
    completed_at = NOW()
WHERE id = <generation_id>;
```

#### 2. Format Callback Salah

Grok API harus kirim data dengan format:

```json
{
  "code": 200,
  "msg": "Success",
  "data": {
    "callbackType": "first",  // atau "complete"
    "task_id": "xxx",
    "data": [
      {
        "id": "track-1",
        "audio_url": "https://...",
        "title": "Music Title",
        "duration": 120
      }
    ]
  }
}
```

**Jika format berbeda**, edit `/src/routes/music.js` sesuai format yang Grok kirim.

#### 3. Audio URL Kosong

Log menunjukkan:
```
⏳ No tracks ready yet, waiting for next callback
```

Artinya semua track masih `audio_url = ""` (belum siap).

**Solusi:** Tunggu callback berikutnya (tipe `complete`), atau check di Grok API apakah generation benar-benar selesai.

---

## 🔬 Debug Mode

Untuk debug lebih detail, tambahkan logging di `src/routes/music.js`:

```javascript
// Di line 22, setelah console.log callback received
console.log('🔍 Full request body:', JSON.stringify(req.body, null, 2));
console.log('🔍 Headers:', req.headers);
console.log('🔍 Source IP:', req.ip);
```

Restart server dan coba generate lagi. Ini akan show detail lengkap callback yang masuk.

---

## ✅ Verification Steps

Setelah fix, verify dengan langkah ini:

### 1. Test Callback Endpoint
```bash
node test-suno-callback.js
# Harus return: ✅ Callback received successfully!
```

### 2. Generate Music Test
```
1. Login ke PixelNest
2. Music Generation → Text to Music
3. Input prompt sederhana: "upbeat electronic music"
4. Submit
5. Watch server logs:
   - Harus ada log "📥 Suno callback received"
   - Harus ada log "✅ Updated original generation"
6. Refresh page atau wait auto-polling
7. Music card muncul dengan status "completed"
```

### 3. Check Database
```sql
SELECT 
  id, 
  status, 
  result_url, 
  metadata->>'task_id' as task_id,
  created_at,
  completed_at
FROM ai_generation_history 
WHERE generation_type = 'audio'
ORDER BY created_at DESC 
LIMIT 3;
```

Status harus `completed` dan `result_url` harus ada.

---

## 📞 Callback Flow Diagram

```
┌─────────────┐
│   User      │ Submit Music Generation
└──────┬──────┘
       │
       v
┌─────────────┐
│  PixelNest  │ 1. Save to DB (status: processing)
│   Server    │ 2. Call Grok/Suno API
└──────┬──────┘ 3. Return task_id to user
       │
       │ (API processes in background)
       │
┌──────v──────┐
│  Grok/Suno  │ 4. Generate music (~30-60s)
│     API     │ 5. Send callback to PixelNest
└──────┬──────┘
       │
       v
┌─────────────┐
│  PixelNest  │ 6. Receive callback (POST /music/callback/suno)
│   Server    │ 7. Find generation by task_id
│  (Callback) │ 8. Update status → completed
└──────┬──────┘ 9. Save audio_url
       │
       v
┌─────────────┐
│    User     │ 10. Polling gets updated status
│  Dashboard  │ 11. Music card appears ✅
└─────────────┘
```

**❌ Jika callback tidak sampai:** Step 6-9 tidak terjadi → Status tetap processing

---

## 📝 Quick Reference

### Callback URL yang Benar

| Environment | Callback URL |
|------------|--------------|
| **Production** | `https://pixelnest.app/music/callback/suno` |
| **Staging** | `https://staging.pixelnest.app/music/callback/suno` |
| **Dev (ngrok)** | `https://abc123.ngrok.io/music/callback/suno` |
| **Dev (localhost)** | ❌ TIDAK BISA! Harus pakai ngrok |

### Test Commands

```bash
# Test server health
node test-suno-callback.js --health

# Test callback dengan sample data
node test-suno-callback.js

# Test dengan real task ID
node test-suno-callback.js --task-id "xxx-xxx-xxx"

# Manual curl test
curl -X POST http://localhost:5005/music/callback/suno \
  -H "Content-Type: application/json" \
  -d '{"code":200,"msg":"Test","data":{"callbackType":"first","task_id":"test","data":[]}}'
```

### Database Queries

```sql
-- Check pending generations
SELECT * FROM ai_generation_history 
WHERE status = 'processing' 
AND generation_type = 'audio';

-- Manual complete (emergency fix)
UPDATE ai_generation_history 
SET status = 'completed', result_url = '<audio_url>', completed_at = NOW()
WHERE id = <generation_id>;

-- Check recent generations with details
SELECT 
  id, user_id, status, result_url,
  metadata->>'task_id' as task_id,
  metadata->>'taskId' as taskId_alt,
  created_at, completed_at
FROM ai_generation_history 
WHERE generation_type = 'audio'
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 🎯 Kesimpulan

**90% masalah callback disebabkan oleh:**
1. ❌ Callback URL salah (localhost instead of public URL)
2. ❌ Callback URL di Grok berbeda dengan di PixelNest
3. ❌ Ngrok URL expired/berubah

**Fix:**
1. ✅ Setup ngrok untuk development
2. ✅ Update callback URL di Admin Panel
3. ✅ Update callback URL di Grok API Dashboard
4. ✅ Pastikan keduanya SAMA PERSIS
5. ✅ Test dengan script: `node test-suno-callback.js`

---

**Butuh bantuan lebih?**
- Check server logs: `npm start` (console akan show semua callback)
- Test manual: `node test-suno-callback.js`
- Debug mode: Tambah logging di `src/routes/music.js`

---

*Last updated: 30 Oktober 2025*

