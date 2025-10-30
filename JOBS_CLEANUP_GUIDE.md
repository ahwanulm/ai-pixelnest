# 🧹 Generation Jobs Cleanup Guide

> **Membersihkan pending/stuck jobs di database**

---

## 📋 Timeout Recommendations

### ⏱️ Berapa Lama Job Harus Expired?

Berdasarkan rata-rata waktu generation:

| Type | Normal Duration | Recommended Timeout | Alasan |
|------|----------------|---------------------|---------|
| **Image** | 10-60 detik | **Pending: 30 menit**<br>**Processing: 15 menit** | Image cepat, tapi kasih buffer untuk queue delay |
| **Video (5s)** | 1-3 menit | **Pending: 30 menit**<br>**Processing: 15 menit** | Video short cukup cepat |
| **Video (10s)** | 3-8 menit | **Pending: 30 menit**<br>**Processing: 15 menit** | Video medium butuh waktu lebih |
| **Audio (TTS)** | 10-30 detik | **Pending: 30 menit**<br>**Processing: 15 menit** | TTS sangat cepat |
| **Audio (Music)** | 1-5 menit | **Pending: 30 menit**<br>**Processing: 15 menit** | Music generation moderate |

### ✅ Default Timeouts (Sudah Dikonfigurasi)

```javascript
TIMEOUTS = {
  PENDING: 30,      // Jobs stuck di pending > 30 menit → FAILED
  PROCESSING: 15,   // Jobs processing > 15 menit → FAILED (worker crash)
  ORPHAN: 60        // Jobs tanpa job_id > 1 jam → FAILED (invalid)
}
```

**Kenapa 30 menit untuk pending?**
- ✅ Cukup waktu untuk queue delay saat high traffic
- ✅ Cukup waktu jika worker restart
- ✅ Tidak terlalu lama hingga user frustrasi

**Kenapa 15 menit untuk processing?**
- ✅ Cukup untuk video terpanjang (10s video ~8 menit)
- ✅ Buffer untuk slow network/API
- ✅ Indikasi worker crash jika lebih lama

---

## 🚀 Quick Start

### 1. Preview Cleanup (Dry Run)
```bash
# Lihat jobs yang akan dibersihkan tanpa menghapus
npm run cleanup:jobs:dry-run
```

### 2. Cleanup Expired Jobs
```bash
# Bersihkan jobs yang sudah expired (otomatis berdasarkan timeout)
npm run cleanup:jobs
```

### 3. Clean ALL Pending Jobs (Development)
```bash
# Preview semua pending jobs
npm run cleanup:jobs:preview

# Bersihkan SEMUA pending jobs (⚠️ destructive!)
npm run cleanup:jobs:force
```

---

## 📖 Usage Examples

### Scenario 1: Server Restart / Worker Crash

**Problem:** Worker crash, ada 5 jobs stuck di `processing`

**Solution:**
```bash
# Check terlebih dahulu
npm run cleanup:jobs:dry-run

# Output akan menunjukkan:
# ⚙️  Found 5 stuck processing jobs:
#    - Job abc123 (video): 25 minutes old
#    - Job def456 (image): 18 minutes old
#    ...

# Bersihkan
npm run cleanup:jobs
```

Jobs yang `processing` > 15 menit akan di-mark sebagai `failed`.

### Scenario 2: Development/Testing Reset

**Problem:** Development mode, banyak test jobs, mau reset semua

**Solution:**
```bash
# Preview semua
npm run cleanup:jobs:preview

# Reset database (hapus SEMUA active jobs)
npm run cleanup:jobs:force
```

### Scenario 3: Check Status Saat Ini

**Problem:** Mau lihat berapa banyak pending/processing jobs sekarang

**Solution:**
```bash
# Dry run akan show statistics
npm run cleanup:jobs:dry-run
```

Output:
```
📊 Current Job Statistics:
┌─────────┬───────┬───────────┬──────────┐
│ status  │ count │ last_hour │ last_24h │
├─────────┼───────┼───────────┼──────────┤
│ pending │   3   │     3     │    12    │
│ processing │ 2  │     2     │     8    │
│ completed │ 150 │    20     │   150    │
│ failed  │  10   │     2     │    10    │
└─────────┴───────┴───────────┴──────────┘

🔄 Currently active jobs: 5
```

---

## 🔄 Automatic Cleanup

Worker secara otomatis run cleanup setiap **30 menit**!

**Konfigurasi di:** `/src/workers/aiGenerationWorker.js`

```javascript
// Auto-cleanup every 30 minutes
cleanupInterval = setInterval(periodicCleanup, 30 * 60 * 1000);

// Initial cleanup after 5 seconds
setTimeout(periodicCleanup, 5000);
```

**Benefits:**
- ✅ Otomatis membersihkan stuck jobs
- ✅ Tidak perlu manual cleanup
- ✅ Database tetap bersih
- ✅ User tidak lihat zombie jobs

**Jika mau disable:**
Comment out di worker:
```javascript
// cleanupInterval = setInterval(periodicCleanup, 30 * 60 * 1000);
```

---

## 🛠️ Manual Cleanup Commands

### Basic Cleanup (Safe)

```bash
# Preview (dry run)
node src/scripts/cleanupExpiredJobs.js --dry-run

# Execute
node src/scripts/cleanupExpiredJobs.js

# Quiet mode (no details)
node src/scripts/cleanupExpiredJobs.js --quiet
```

### Force Clean ALL (Destructive)

```bash
# Preview ALL pending jobs
node src/scripts/cleanAllPendingJobs.js --dry-run

# Clean ALL (requires --force)
node src/scripts/cleanAllPendingJobs.js --force

# Quiet mode
node src/scripts/cleanAllPendingJobs.js --force --quiet
```

---

## 📊 What Gets Cleaned?

### Cleanup Expired Jobs (Safe)

Membersihkan job yang:

1. **Stuck Pending** (> 30 menit)
   - Status: `pending`
   - Started > 30 menit lalu
   - Reason: Never processed, queue stuck
   - Action: Mark as `failed`

2. **Stuck Processing** (> 15 menit)
   - Status: `processing`
   - Started > 15 menit lalu
   - Reason: Worker crashed/timeout
   - Action: Mark as `failed`

3. **Orphan Jobs** (> 60 menit)
   - Missing `job_id` or `job_id = ''`
   - Status: `pending` or `processing`
   - Started > 60 menit lalu
   - Reason: Invalid job creation
   - Action: Mark as `failed`

### Clean ALL (Destructive)

Membersihkan **SEMUA** job:
- Status: `pending` OR `processing`
- Tanpa melihat waktu
- ⚠️ Use only for development/maintenance

---

## 🔍 Check Database Manually

### Via psql:

```sql
-- Count by status
SELECT status, COUNT(*) 
FROM ai_generation_history 
GROUP BY status;

-- Active jobs
SELECT id, job_id, generation_type, status, started_at,
       EXTRACT(EPOCH FROM (NOW() - started_at))/60 as minutes_old
FROM ai_generation_history
WHERE status IN ('pending', 'processing')
ORDER BY started_at ASC;

-- Jobs older than 15 minutes
SELECT id, job_id, generation_type, status, started_at,
       EXTRACT(EPOCH FROM (NOW() - started_at))/60 as minutes_old
FROM ai_generation_history
WHERE status IN ('pending', 'processing')
  AND started_at < NOW() - INTERVAL '15 minutes'
ORDER BY started_at ASC;
```

---

## ⚙️ Customize Timeouts

Edit `/src/scripts/cleanupExpiredJobs.js`:

```javascript
const TIMEOUTS = {
  PENDING: 30,      // Ganti ke 45 jika mau lebih lama
  PROCESSING: 15,   // Ganti ke 20 jika video sering timeout
  ORPHAN: 60        // Ganti sesuai kebutuhan
};
```

**Recommendations:**
- **High Traffic:** Increase `PENDING` to 45-60 minutes
- **Slow Network:** Increase `PROCESSING` to 20-25 minutes
- **Fast Hardware:** Decrease `PROCESSING` to 10 minutes
- **Low Traffic:** Decrease `PENDING` to 15-20 minutes

---

## 📋 Monitoring

### Check Worker Logs

Worker akan log cleanup otomatis:

```
🧹 Running periodic cleanup of expired jobs...
📋 Checking for pending jobs older than 30 minutes...
   ✅ No stuck pending jobs found

⚙️  Checking for processing jobs older than 15 minutes...
   ✅ No stuck processing jobs found

🔍 Checking for orphan jobs (no job_id)...
   ✅ No orphan jobs found

📊 Current Job Statistics:
[Table of statistics]

✅ Cleanup completed successfully!
```

### Alert Conditions

⚠️ **Perhatian jika:**
- Banyak stuck processing jobs → Worker sering crash
- Banyak stuck pending jobs → Queue not working
- Banyak orphan jobs → Bug di job creation

---

## 🎯 Best Practices

### Development:
```bash
# Sebelum testing, reset database
npm run cleanup:jobs:force

# Test generation
# ...

# Setelah testing, cleanup
npm run cleanup:jobs
```

### Production:
```bash
# Let automatic cleanup handle it (every 30 min)
# Only manual cleanup if emergency

# Emergency cleanup (check first!)
npm run cleanup:jobs:dry-run
npm run cleanup:jobs
```

### Maintenance:
```bash
# Weekly check
npm run cleanup:jobs:dry-run

# Monthly deep clean (if needed)
npm run cleanup:jobs:force
```

---

## 📈 Performance Impact

### Cleanup Script Performance:
- **Duration:** < 1 second untuk < 100 jobs
- **Database Impact:** Minimal (simple UPDATE query)
- **Locking:** Row-level locks only
- **Safe:** Can run during production

### Auto-Cleanup Impact:
- **Frequency:** Every 30 minutes
- **Duration:** < 1 second
- **CPU:** Negligible
- **Memory:** < 1 MB

---

## 🚨 Troubleshooting

### Problem: Cleanup tidak jalan otomatis

**Solution:**
```bash
# Check worker logs
# Harusnya ada log setiap 30 menit

# Manual test
node src/scripts/cleanupExpiredJobs.js --dry-run
```

### Problem: Jobs tetap stuck setelah cleanup

**Solution:**
```bash
# Force clean ALL
npm run cleanup:jobs:force

# Check worker status
ps aux | grep "node worker.js"

# Restart worker
npm run worker
```

### Problem: Terlalu banyak failed jobs

**Cause:** Timeouts terlalu pendek atau worker sering crash

**Solution:**
1. Increase timeouts di `cleanupExpiredJobs.js`
2. Check worker logs untuk crash
3. Increase worker resources

---

## 📝 Summary

**Recommended Settings:**
- ✅ Auto-cleanup: **Enabled** (every 30 min)
- ✅ Pending timeout: **30 minutes**
- ✅ Processing timeout: **15 minutes**
- ✅ Orphan timeout: **60 minutes**

**Commands:**
```bash
npm run cleanup:jobs:dry-run   # Preview (safe)
npm run cleanup:jobs           # Cleanup expired (safe)
npm run cleanup:jobs:force     # Clean ALL (destructive)
```

**When to Run:**
- Development: Before/after testing
- Production: Let auto-cleanup handle it
- Emergency: Manual cleanup if stuck jobs

---

**Status:** ✅ IMPLEMENTED & AUTO-RUNNING

**Files:**
- Script: `/src/scripts/cleanupExpiredJobs.js`
- Force Clean: `/src/scripts/cleanAllPendingJobs.js`
- Worker: `/src/workers/aiGenerationWorker.js` (auto-cleanup)
- Config: `TIMEOUTS` object in cleanup scripts

