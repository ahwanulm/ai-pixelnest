# Worker Error Fix - Job Data Undefined

## 🐛 Problem
Worker mengalami error ketika memproses job:
```
TypeError: Cannot destructure property 'userId' of 'jobData' as it is undefined.
```

## 🔍 Root Cause
Ada job lama di queue yang memiliki data `undefined` atau invalid, menyebabkan worker crash ketika mencoba memproses job tersebut.

## ✅ Solution Implemented

### 1. **Added Safety Checks in Queue Manager** (`src/queue/pgBossQueue.js`)
```javascript
// Safety check: Ensure job.data exists
if (!job.data || typeof job.data !== 'object') {
  console.error(`❌ Invalid job data for ${queueName} [${job.id}]:`, job.data);
  throw new Error('Job data is missing or invalid. This may be an old/corrupted job.');
}
```

### 2. **Added Safety Checks in Worker** (`src/workers/aiGenerationWorker.js`)
```javascript
// Safety check: Ensure jobData exists
if (!jobData || typeof jobData !== 'object') {
  console.error('❌ Worker received invalid jobData:', jobData);
  throw new Error('Invalid job data received. This may be an old/corrupted job.');
}
```

### 3. **Created Cleanup Scripts**

#### `src/scripts/clearInvalidJobs.js`
Menghapus job dengan data invalid (NULL, empty, atau missing required fields):
```bash
npm run cleanup:invalid-jobs
```

#### `src/scripts/clearAllFailedJobs.js`
Menghapus semua failed dan retry jobs:
```bash
npm run cleanup:failed-jobs
```

### 4. **Cleaned Queue**
```bash
npm run cleanup:invalid-jobs  # ✅ No invalid jobs found
npm run cleanup:failed-jobs   # ✅ Deleted 3 failed/retry jobs
```

## 📊 Result
- ✅ Queue is now clean (0 jobs)
- ✅ Worker has safety checks to prevent similar errors
- ✅ Better error messages for debugging
- ✅ Cleanup scripts available for future maintenance

## 🚀 Testing
1. Start worker: `npm run worker`
2. Try a new generation request
3. Worker should process job successfully without errors

## 📝 Maintenance Commands
```bash
# Check queue status (via admin panel)
/admin/jobs

# Clear invalid jobs
npm run cleanup:invalid-jobs

# Clear all failed jobs
npm run cleanup:failed-jobs

# Force clear all pending jobs (emergency)
npm run cleanup:jobs:force
```

## 🔐 Prevention
- Worker now validates job data before processing
- Queue manager validates data before passing to worker
- Better error logging for easier debugging
- Regular cleanup scripts to maintain queue health

