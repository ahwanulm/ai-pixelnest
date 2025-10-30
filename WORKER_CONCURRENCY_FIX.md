# 🔧 Worker Concurrency Fix

## 🐛 Masalah yang Ditemukan

**Symptom:**
- User bisa generate 3 konten bersamaan di frontend (image + video + audio)
- Tapi setelah 2 generasi mulai, yang ketiga stuck di 0% dan tidak diproses
- Backend worker hanya configured untuk 2 concurrent jobs

**Root Cause:**
```javascript
// SEBELUM (SALAH)
Frontend: MAX_CONCURRENT_GENERATIONS = 3  ✅
Backend:  teamSize = 2                     ❌ MISMATCH!

// Jobs:
Job 1: Image → ✅ Processing
Job 2: Video → ✅ Processing  
Job 3: Audio → ⏳ Stuck in queue (no worker available)
```

---

## ✅ Solusi yang Diterapkan

### **1. Update Worker Concurrency**

**File:** `src/workers/aiGenerationWorker.js`
```javascript
// BEFORE
teamSize: 2, // Run 2 workers concurrently

// AFTER
teamSize: 3, // ✨ Run 3 workers concurrently (matches frontend limit)
```

**File:** `src/workers/customAIGenerationWorker.js`
```javascript
// BEFORE
concurrency: 2, // Process 2 jobs concurrently

// AFTER
concurrency: 3, // ✨ Process 3 jobs concurrently (matches frontend limit)
```

### **2. Update PM2 Configuration**

**File:** `ecosystem.config.js`
```javascript
// BEFORE
instances: 2,  // 2 PM2 instances × teamSize 2 = 4 workers (overkill)

// AFTER
instances: 1,  // 1 PM2 instance × teamSize 3 = 3 workers (optimal)
```

**Alasan:**
- `teamSize` di pg-boss sudah handle concurrency
- Multiple PM2 instances tidak diperlukan untuk worker
- Lebih efisien: 1 instance dengan teamSize=3

---

## 🚀 Cara Restart Worker

### **Development Mode:**
```bash
# 1. Stop current worker (Ctrl+C di terminal)

# 2. Restart worker
npm run worker

# atau dengan auto-reload
npm run dev:worker
```

### **Production Mode (PM2):**
```bash
# Restart worker untuk apply changes
pm2 restart pixelnest-worker

# Verify worker status
pm2 status

# Check logs
pm2 logs pixelnest-worker --lines 50

# Expected log output:
# ✅ AI Generation Worker is running
# 👷 Worker registered: ai-generation (team: 3, concurrency: 1)
# ⏳ Waiting for jobs...
```

### **Manual Restart (tanpa PM2):**
```bash
# 1. Find and kill worker process
pkill -f "node worker.js"

# or
ps aux | grep "node worker.js"
kill <PID>

# 2. Start worker manually
node worker.js --queue=pgboss
```

---

## 🧪 Testing Checklist

### **Test 1: Single Generation**
```
1. Open dashboard
2. Generate 1 image
   ✅ Expected: Starts immediately, completes normally
```

### **Test 2: Concurrent Generations (2)**
```
1. Generate image → Click Run
2. Switch to video tab → Click Run immediately
   ✅ Expected: Both start processing, progress updates for both
```

### **Test 3: Maximum Concurrent (3)**
```
1. Generate image → Click Run
2. Generate video → Click Run
3. Generate audio → Click Run
   
   ✅ Expected:
   - All 3 start processing
   - Badge shows "3" on button
   - Progress updates for all 3
   - Results appear as they complete
```

### **Test 4: Beyond Limit (4th job)**
```
1. Start 3 generations (image + video + audio)
2. Try to generate 4th item (any type)
   
   ✅ Expected:
   - Warning notification: "Maximum 3 concurrent generations allowed"
   - 4th generation NOT queued
```

### **Test 5: Sequential Completion**
```
1. Start 3 generations
2. Wait for 1 to complete
3. Start new generation
   
   ✅ Expected:
   - After 1 completes, badge updates (3 → 2)
   - New generation starts immediately
   - Badge updates (2 → 3)
```

---

## 📊 Configuration Summary

| Component | Before | After | Reasoning |
|-----------|--------|-------|-----------|
| **Frontend** | MAX: 3 | MAX: 3 | ✅ Unchanged |
| **pg-boss Worker** | teamSize: 2 | **teamSize: 3** | Match frontend limit |
| **Custom Worker** | concurrency: 2 | **concurrency: 3** | Match frontend limit |
| **PM2 Instances** | 2 | **1** | Reduce resource usage |
| **Total Capacity** | 2 concurrent | **3 concurrent** | ✅ Frontend/Backend match |

---

## 🎯 Architecture Flow

### **Before Fix:**
```
┌────────────────────────────────────────┐
│  FRONTEND (User Actions)               │
├────────────────────────────────────────┤
│  • Job 1: Image → Queue ✅            │
│  • Job 2: Video → Queue ✅            │
│  • Job 3: Audio → Queue ⏳ (stuck!)   │
└────────────────────────────────────────┘
               ↓
┌────────────────────────────────────────┐
│  BACKEND WORKER (pg-boss)              │
├────────────────────────────────────────┤
│  Worker 1: ✅ Processing Job 1        │
│  Worker 2: ✅ Processing Job 2        │
│  Worker 3: ❌ NOT EXIST!              │
└────────────────────────────────────────┘
```

### **After Fix:**
```
┌────────────────────────────────────────┐
│  FRONTEND (User Actions)               │
├────────────────────────────────────────┤
│  • Job 1: Image → Queue ✅            │
│  • Job 2: Video → Queue ✅            │
│  • Job 3: Audio → Queue ✅            │
└────────────────────────────────────────┘
               ↓
┌────────────────────────────────────────┐
│  BACKEND WORKER (pg-boss)              │
├────────────────────────────────────────┤
│  Worker 1: ✅ Processing Job 1        │
│  Worker 2: ✅ Processing Job 2        │
│  Worker 3: ✅ Processing Job 3        │ ← NOW EXISTS!
└────────────────────────────────────────┘
```

---

## 📝 Verification Commands

### **Check Worker Logs:**
```bash
# PM2
pm2 logs pixelnest-worker --lines 100

# Manual
tail -f logs/worker-out.log

# Expected output when 3 jobs running:
🎨 Processing AI Generation
   Job ID: abc123
   User ID: 1
   Type: image - text-to-image
═══════════════════════════════════════════════
🎨 Processing AI Generation
   Job ID: def456
   User ID: 1
   Type: video - text-to-video
═══════════════════════════════════════════════
🎨 Processing AI Generation
   Job ID: ghi789
   User ID: 1
   Type: audio - text-to-speech
═══════════════════════════════════════════════
```

### **Check Queue Status:**
```bash
# Development
node -e "require('./src/queue/pgBossQueue').getJobCounts('ai-generation').then(console.log)"

# Expected output:
{
  active: 3,    ← All 3 workers busy
  created: 0,   ← No jobs waiting
  completed: 10,
  failed: 0
}
```

---

## ⚠️ Important Notes

### **Resource Consideration:**
```
Each worker consumes:
- Memory: ~200-500MB (during video generation)
- CPU: Variable (depends on FAL.AI response time)
  
Total for 3 workers:
- Memory: ~600-1500MB
- CPU: Minimal (mostly I/O waiting)
```

**Recommended Server Specs:**
- RAM: 2GB minimum (4GB recommended)
- CPU: 2 cores minimum
- Network: Stable connection to FAL.AI

### **Scaling Beyond 3:**
If you need more than 3 concurrent generations:

1. **Update Frontend:**
   ```javascript
   // public/js/dashboard-generation.js
   const MAX_CONCURRENT_GENERATIONS = 5; // Increase limit
   ```

2. **Update Backend:**
   ```javascript
   // src/workers/aiGenerationWorker.js
   teamSize: 5, // Match frontend
   ```

3. **Monitor Resources:**
   ```bash
   pm2 monit
   # Watch memory/CPU usage
   ```

**⚠️ Caution:** Don't set too high (>5) to avoid:
- Memory exhaustion
- FAL.AI rate limiting
- Database connection pool exhaustion

---

## 🎉 Summary

### **Fixed:**
- ✅ Backend worker concurrency increased from 2 → 3
- ✅ Now matches frontend limit (3 concurrent generations)
- ✅ All 3 jobs process simultaneously
- ✅ No more stuck jobs at 0%

### **Actions Required:**
```bash
# MUST DO: Restart worker after this fix
pm2 restart pixelnest-worker

# or in development
npm run worker
```

### **Test Results Expected:**
- ✅ Generate image + video + audio simultaneously
- ✅ All 3 show progress updates
- ✅ Badge shows "3/3" on button
- ✅ Results appear as they complete
- ✅ No jobs stuck at 0%

---

**Last Updated:** October 28, 2025  
**Status:** ✅ Fix Applied - Restart Required  
**Impact:** HIGH - Must restart worker for changes to take effect

