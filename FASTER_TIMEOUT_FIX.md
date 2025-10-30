# ⚡ Faster Timeout & Early Failure Detection

## Masalah Sebelumnya

Ketika generation job **gagal atau stuck**, user harus menunggu sangat lama (15 menit!) untuk mengetahui bahwa job mereka failed. Ini memberikan pengalaman yang buruk:

- ❌ User menunggu 15 menit untuk job yang sebenarnya sudah gagal
- ❌ Tidak ada feedback cepat ketika FAL.AI API error
- ❌ Job stuck tidak terdeteksi
- ❌ User tidak tahu apakah job masih processing atau sudah gagal

## Solusi: Multi-Layer Timeout Detection

### 1. ⚡ FAL.AI Service Layer Timeout (LAYER 1)

**File:** `src/services/falAiService.js`

Timeout **per tipe generation** di level FAL.AI API call:

```javascript
// IMAGE GENERATION: 2 minutes
const IMAGE_TIMEOUT = 120000; // 120 seconds
const result = await Promise.race([falPromise, timeoutPromise]);

// VIDEO GENERATION: 5 minutes
const VIDEO_TIMEOUT = 300000; // 300 seconds

// AUDIO (TTS): 90 seconds
const TTS_TIMEOUT = 90000;

// MUSIC: 3 minutes
const MUSIC_TIMEOUT = 180000;

// SOUND EFFECTS: 90 seconds
const SFX_TIMEOUT = 90000;
```

**Keuntungan:**
- ✅ **Timeout spesifik per tipe** (image lebih cepat dari video)
- ✅ **Early detection** - gagal langsung terdeteksi di API call
- ✅ **Clear error message** - user tahu kenapa gagal

**Error Message:**
```
"Image generation timeout: FAL.AI tidak merespons dalam 120 detik. 
Mungkin model sedang sibuk atau error."
```

### 2. 🔍 Progress Monitoring (LAYER 2)

**File:** `src/workers/aiGenerationWorker.js`

Monitor progress setiap 30 detik, detect stuck jobs:

```javascript
// Check progress every 30 seconds
const PROGRESS_STAGNATION_TIMEOUT = 120000; // 2 minutes

const progressMonitor = setInterval(async () => {
  const currentProgress = await getJobProgress(jobId);
  
  // If progress hasn't changed in 2 minutes → job stuck!
  if (currentProgress === lastProgress && 
      timeSinceLastProgress > PROGRESS_STAGNATION_TIMEOUT) {
    console.error(`⚠️ Job stuck at ${currentProgress}%`);
  }
}, 30000);
```

**Keuntungan:**
- ✅ Detect jobs yang **stuck** (tidak ada progress update)
- ✅ Real-time monitoring
- ✅ Warning logs untuk debugging

### 3. 🛡️ Worker-Level Timeout (LAYER 3 - Safety Net)

**File:** `src/workers/aiGenerationWorker.js`

Worker timeout sebagai safety net terakhir:

```javascript
// BEFORE: 900000ms (15 minutes)
// AFTER:  360000ms (6 minutes)

timeout: 360000, // 6 minutes - Faster failure detection
```

**Keuntungan:**
- ✅ **Safety net** jika timeout layer 1 & 2 tidak jalan
- ✅ **Lebih cepat** dari sebelumnya (6 min vs 15 min)
- ✅ **Masih cukup buffer** untuk video generation (5 min max)

## Timeout Hierarchy

```
┌─────────────────────────────────────────────┐
│ LAYER 3: Worker Timeout (6 minutes)        │ ← Safety Net
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ LAYER 2: Progress Monitor (2 min)    │ │ ← Stuck Detection
│  │                                       │ │
│  │  ┌─────────────────────────────────┐ │ │
│  │  │ LAYER 1: FAL.AI Timeout        │ │ │ ← First Line
│  │  │  - Image: 2 min                │ │ │
│  │  │  - Video: 5 min                │ │ │
│  │  │  - Audio: 1.5-3 min            │ │ │
│  │  └─────────────────────────────────┘ │ │
│  └───────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

## Perbandingan Timeline

### Scenario: Image Generation Gagal (FAL.AI tidak merespons)

**SEBELUMNYA:**
```
00:00 - User klik Generate
00:01 - Job start processing
00:02 - FAL.AI API called... (no response)
...
15:00 - Worker timeout (15 minutes!) ⏰
15:00 - User finally sees "Failed" ❌

User menunggu: 15 MENIT! 😢
```

**SEKARANG:**
```
00:00 - User klik Generate
00:01 - Job start processing
00:02 - FAL.AI API called... (no response)
02:00 - FAL.AI timeout (2 minutes) ⚡
02:00 - Job marked as failed
02:01 - User sees "Failed" with clear message ✅

User menunggu: 2 MENIT! 🎉
```

**Improvement:** 87% faster failure detection! (2 min vs 15 min)

### Scenario: Job Stuck (Progress tidak berubah)

**SEBELUMNYA:**
```
00:00 - Job starts
00:30 - Progress: 30% (last update)
01:00 - Still 30%... (stuck, but no detection)
02:00 - Still 30%...
...
15:00 - Worker timeout ⏰

User menunggu: 15 MENIT tanpa tahu job stuck
```

**SEKARANG:**
```
00:00 - Job starts
00:30 - Progress: 30% (last update)
01:00 - Progress monitor: Still 30%...
02:00 - Progress monitor detects: STUCK! ⚠️
02:30 - Warning logged, admins notified
04:00 - Still stuck, FAL.AI timeout (if not recovered)
06:00 - Worker timeout (if all else fails)

Progress monitoring provides early warning!
```

## Expected Timelines per Generation Type

### Image Generation
```
✅ Normal: 20-40 seconds
⚠️  Timeout: 2 minutes (120s)
🛡️  Worker: 6 minutes (safety net)
```

### Video Generation
```
✅ Normal: 1-3 minutes
⚠️  Timeout: 5 minutes (300s)
🛡️  Worker: 6 minutes (safety net)
```

### Audio (TTS)
```
✅ Normal: 10-30 seconds
⚠️  Timeout: 90 seconds
🛡️  Worker: 6 minutes (safety net)
```

### Music Generation
```
✅ Normal: 45-90 seconds
⚠️  Timeout: 3 minutes (180s)
🛡️  Worker: 6 minutes (safety net)
```

## Error Messages - User-Friendly

### Sebelumnya:
```
❌ "Job timeout after 900000ms"
(User bingung: apa itu "900000ms"? 🤔)
```

### Sekarang:
```
❌ "Image generation timeout: FAL.AI tidak merespons dalam 120 detik. 
    Mungkin model sedang sibuk atau error."
    
✅ Clear, dalam Bahasa Indonesia, dengan context!
```

## Monitoring & Debugging

### Check Stuck Jobs:

```bash
# Monitor worker logs
pm2 logs ai-worker --lines 100

# Look for stuck job warnings:
⚠️ Job job_xxx_yyy stuck at 30% for 120s

# Check database for long-running jobs
psql pixelnest_db -c "
  SELECT 
    job_id, 
    status, 
    progress,
    EXTRACT(EPOCH FROM (NOW() - created_at)) as seconds_running
  FROM ai_generation_history 
  WHERE status = 'processing'
    AND created_at < NOW() - INTERVAL '5 minutes'
  ORDER BY created_at ASC;
"
```

### Manual Timeout Testing:

```bash
# Test dengan model yang tidak ada (akan timeout cepat)
curl -X POST http://localhost:3000/api/queue-generation/create \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "test timeout",
    "type": "text-to-image",
    "mode": "image",
    "settings": {
      "modelId": "invalid-model-id-test-timeout"
    }
  }'

# Monitor logs - should timeout in 2 minutes, not 15!
pm2 logs ai-worker --lines 50
```

## Benefits Summary

### For Users:
- ✅ **87% faster** feedback ketika job gagal (2 min vs 15 min untuk image)
- ✅ **Clear error messages** dalam bahasa Indonesia
- ✅ **No more long waiting** untuk job yang sudah gagal

### For System:
- ✅ **Free up resources** lebih cepat (failed jobs tidak stuck lama)
- ✅ **Better monitoring** dengan progress stagnation detection
- ✅ **Layered timeouts** untuk reliability

### For Developers/Admins:
- ✅ **Clear logs** dengan timestamps dan warnings
- ✅ **Easy debugging** dengan stuck job detection
- ✅ **Configurable** timeout per generation type

## Configuration

Jika ingin adjust timeout, edit di `src/services/falAiService.js`:

```javascript
// Make timeouts stricter (faster failure)
const IMAGE_TIMEOUT = 90000;  // 90s instead of 120s
const VIDEO_TIMEOUT = 240000; // 4min instead of 5min

// Make timeouts more lenient (for slow models)
const IMAGE_TIMEOUT = 180000; // 3min instead of 2min
const VIDEO_TIMEOUT = 420000; // 7min instead of 5min
```

## Restart Worker

Setelah perubahan, restart worker:

```bash
# Restart worker to apply timeout changes
pm2 restart ai-worker

# Monitor logs
pm2 logs ai-worker --lines 50

# Test with a generation job
# Should see faster timeout if FAL.AI doesn't respond
```

## Summary

✅ **3-Layer Timeout Protection:**
1. FAL.AI Service Layer (fastest, 90s-5min)
2. Progress Monitoring (detect stuck jobs, 2min)
3. Worker Level (safety net, 6min)

✅ **87% Faster Failure Detection** untuk image (2 min vs 15 min)

✅ **User-Friendly Error Messages** dalam Bahasa Indonesia

✅ **Better Resource Management** - failed jobs free up quickly

✅ **Real-time Monitoring** untuk stuck jobs

User sekarang mendapat feedback **jauh lebih cepat** ketika job gagal! 🚀

