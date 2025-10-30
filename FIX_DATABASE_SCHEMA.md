# 🔧 Fix Database Schema - Generation Persistence

## ❌ Masalah yang Ditemukan

Database `ai_generation_history` **KURANG 4 KOLOM PENTING** untuk queue system persistence:

```
❌ job_id       - Untuk tracking job di queue
❌ started_at   - Waktu mulai generation  
❌ progress     - Progress 0-100%
❌ viewed_at    - Tracking hasil yang sudah dilihat
```

**Dampak:**
- ❌ Generation hilang saat refresh halaman
- ❌ Progress tracking tidak berfungsi
- ❌ Resume active jobs gagal
- ❌ Error: `column "job_id" does not exist`

---

## ✅ Solusi

### Opsi 1: Run Migration Script (RECOMMENDED)

```bash
# Di root project
node run-migration-fix.js
```

Script ini akan:
1. ✅ Menambahkan kolom yang hilang
2. ✅ Membuat index untuk performa
3. ✅ Memverifikasi schema
4. ✅ Menampilkan hasil

### Opsi 2: Manual SQL

```bash
# Connect ke database
psql -U postgres -d pixelnest_db

# Run migration
\i migrations/fix_generation_history_schema.sql
```

### Opsi 3: Re-run Migration Otomatis

```bash
# Akan auto-add kolom yang hilang
node src/config/migrateFalAi.js
```

---

## 📊 Schema Yang Benar

**Before (❌):**
```sql
CREATE TABLE ai_generation_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  generation_type VARCHAR(50),
  sub_type VARCHAR(50),
  prompt TEXT,
  result_url TEXT,
  settings JSONB,
  credits_cost INTEGER,
  status VARCHAR(50),
  error_message TEXT,
  created_at TIMESTAMP,
  completed_at TIMESTAMP
  -- ❌ MISSING: job_id, started_at, progress, viewed_at
);
```

**After (✅):**
```sql
CREATE TABLE ai_generation_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  generation_type VARCHAR(50),
  sub_type VARCHAR(50),
  prompt TEXT,
  result_url TEXT,
  settings JSONB,
  credits_cost INTEGER,
  status VARCHAR(50),
  error_message TEXT,
  created_at TIMESTAMP,
  completed_at TIMESTAMP,
  job_id VARCHAR(255),           -- ✅ NEW
  started_at TIMESTAMP,          -- ✅ NEW
  progress INTEGER DEFAULT 0,    -- ✅ NEW
  viewed_at TIMESTAMP            -- ✅ NEW
);
```

---

## 🔍 Verifikasi

### 1. Cek Kolom di Database

```sql
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'ai_generation_history'
ORDER BY ordinal_position;
```

**Harus ada 16 kolom:**
- ✅ id
- ✅ user_id
- ✅ generation_type
- ✅ sub_type
- ✅ prompt
- ✅ result_url
- ✅ settings
- ✅ credits_cost
- ✅ status
- ✅ error_message
- ✅ created_at
- ✅ completed_at
- ✅ **job_id** (NEW)
- ✅ **started_at** (NEW)
- ✅ **progress** (NEW)
- ✅ **viewed_at** (NEW)

### 2. Test Active Jobs Query

```sql
SELECT id, job_id, generation_type, status, progress, started_at
FROM ai_generation_history
WHERE user_id = 1 
  AND status IN ('pending', 'processing')
ORDER BY started_at DESC;
```

Tidak boleh ada error!

---

## 🚀 Testing Setelah Fix

### Test 1: Generate & Refresh
```
1. Buka dashboard
2. Generate image/video/audio
3. Refresh halaman (F5)
4. ✅ Card generation masih ada
5. ✅ Progress masih update
```

### Test 2: Generate & Pindah Tab
```
1. Start generation
2. Pindah ke tab lain
3. Kembali ke dashboard
4. ✅ Generation masih berjalan
5. ✅ Card masih muncul
```

### Test 3: Multiple Generations
```
1. Generate 3 item sekaligus
2. Refresh halaman
3. ✅ Semua 3 card restored
4. ✅ Progress tracking berjalan
```

---

## 📝 Files Updated

### 1. `/src/config/migrateFalAi.js`
- ✅ Updated CREATE TABLE untuk include kolom baru
- ✅ Added ALTER TABLE untuk upgrade path
- ✅ Added indexes untuk kolom baru

### 2. `/migrations/fix_generation_history_schema.sql`
- ✅ Migration script untuk existing databases
- ✅ Safe to run multiple times (IF NOT EXISTS)

### 3. `/run-migration-fix.js`
- ✅ Helper script untuk run migration
- ✅ Auto-verify schema
- ✅ Show results

---

## ⚠️ Important Notes

1. **Backup Database First!**
   ```bash
   pg_dump pixelnest_db > backup_before_migration.sql
   ```

2. **Zero Downtime**
   - Migration menggunakan `IF NOT EXISTS`
   - Tidak akan hapus data existing
   - Safe to run on production

3. **Kolom Baru Default Values**
   - `job_id`: NULL (akan diisi oleh new generations)
   - `started_at`: NOW() atau copied dari created_at
   - `progress`: 0
   - `viewed_at`: NULL

4. **Existing Data**
   - Data lama tetap ada
   - Hanya kolom baru yang ditambahkan
   - Old records akan di-update otomatis untuk started_at

---

## 🎯 Summary

**Before:**
```
❌ Generation hilang saat refresh
❌ Progress tidak tersimpan
❌ Active jobs tidak bisa di-resume
❌ Error: column "job_id" does not exist
```

**After:**
```
✅ Generation persistent di semua kondisi
✅ Progress tracking berfungsi sempurna
✅ Active jobs auto-resume setelah refresh
✅ Support image, video, dan audio
✅ No more column errors!
```

---

## 🔗 Related Files

- Controller: `/src/controllers/generationQueueController.js`
- Worker: `/src/workers/aiGenerationWorker.js`
- Frontend: `/public/js/dashboard-generation.js`
- Resume Logic: Line 2113-2245 in dashboard-generation.js

---

**Status:** ✅ READY TO DEPLOY

**Next Steps:**
1. Run migration: `node run-migration-fix.js`
2. Restart server
3. Restart worker
4. Test persistence

