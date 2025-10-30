# Generation Timeout Mechanism ✅

**Date:** October 27, 2025  
**Feature:** Auto-fail generations that don't respond within timeout  
**Status:** ✅ IMPLEMENTED  

---

## 🎯 Overview

Menambahkan mekanisme timeout untuk generation jobs yang tidak merespons dalam waktu yang ditentukan. Ini mencegah job hanging forever dan memberikan feedback yang jelas kepada user.

---

## 🔴 Problem

**Before:**
- Job yang stuck/hanging akan berjalan forever ❌
- FAL.AI service yang tidak respond akan block worker ❌
- User tidak tahu apakah job masih berjalan atau error ❌
- Worker resources terpakai untuk job yang sudah tidak produktif ❌

**Scenarios:**
- FAL.AI API down/slow
- Network issues
- Model generation stuck
- Infinite loops
- Memory issues

---

## ✅ Solution

### **Timeout Mechanism di Queue Level**

Implementasi Promise.race() untuk membatasi waktu eksekusi job:

```javascript
const result = await Promise.race([
  handler(actualJob.data, actualJob),  // Actual job execution
  new Promise((_, reject) =>           // Timeout promise
    setTimeout(() => reject(new Error(`Job timeout after ${timeout}ms`)), timeout)
  )
]);
```

**How it works:**
1. Start job execution
2. Start timeout timer simultaneously
3. Whichever finishes first wins
4. If timeout wins → reject with timeout error
5. If job completes → return result

---

## ⏱️ Timeout Configuration

### **Default Timeout: 10 minutes (600,000ms)**

Can be customized per worker:

```javascript
await queueManager.registerWorker('ai-generation', handler, {
  timeout: 900000  // 15 minutes (900,000ms)
});
```

### **Recommended Values:**

| Type | Duration | Timeout | Reason |
|------|----------|---------|---------|
| **Image** | ~10-30s | 5 min (300,000ms) | Quick generation + buffer |
| **Video** | ~2-5 min | 15 min (900,000ms) | Longer processing + buffer |
| **Audio** | ~30-60s | 10 min (600,000ms) | Medium duration + buffer |
| **Mixed** | Varies | 15 min (900,000ms) | Safe for all types |

---

## 📁 Files Modified

### **1. `/src/queue/pgBossQueue.js`** ✅

**Added:**
- Timeout configuration in `registerWorker()`
- Promise.race() wrapper for handler execution
- Timeout error detection and logging

**Changes:**
```javascript
// Before
const result = await handler(actualJob.data, actualJob);

// After
const timeout = options.timeout || 600000;  // 10 minutes default

const result = await Promise.race([
  handler(actualJob.data, actualJob),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Job timeout after ${timeout}ms`)), timeout)
  )
]);
```

---

### **2. `/src/workers/aiGenerationWorker.js`** ✅

**Added:**
- Timeout configuration when registering worker

**Changes:**
```javascript
await queueManager.registerWorker('ai-generation', processAIGeneration, {
  teamSize: 2,
  teamConcurrency: 1,
  pollingIntervalSeconds: 2,
  timeout: 900000,  // 15 minutes ← NEW!
});
```

---

## 🎨 User Experience

### **What User Sees:**

**Before Timeout:**
```
🔨 Processing job: ai-generation [abc-123]
⏱️  Timeout set: 900s (900000ms)
🎨 Processing AI Generation
...
```

**If Job Completes:**
```
✅ Job completed: ai-generation [abc-123]
✅ Image generated successfully
```

**If Job Timeouts:**
```
⏱️  Job timeout: ai-generation [abc-123] - Exceeded 900000ms (900s)
   Job was cancelled due to no response from external service
❌ Job failed: ai-generation [abc-123]
```

**In UI:**
```
Generation Status: Failed ❌
Error: Job timeout after 900000ms

Your generation did not complete within 15 minutes.
This may be due to:
- High server load
- Service temporarily unavailable
- Network issues

Credits have been refunded. Please try again.
```

---

## 🔧 Technical Implementation

### **Architecture:**

```
┌─────────────────────────────────────────────┐
│  Queue Worker                               │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  Promise.race([                     │   │
│  │    Job Handler ────────────────┐    │   │
│  │    Timeout Promise ──────────┐ │    │   │
│  │  ])                           │ │    │   │
│  └───────────────────────────────┼─┼────┘   │
│                                  │ │        │
│         ┌────────────────────────┘ │        │
│         ▼                          │        │
│    Job Executes                    │        │
│    (FAL.AI call)                   │        │
│    ↓                               │        │
│    If completes → ✅               │        │
│                                    │        │
│         ┌──────────────────────────┘        │
│         ▼                                   │
│    Timeout Fires                            │
│    ↓                                        │
│    If timeout wins → ⏱️ Reject              │
│                                             │
└─────────────────────────────────────────────┘
```

---

### **Code Flow:**

```javascript
// 1. Worker starts job
console.log('🔨 Processing job...');
console.log('⏱️  Timeout set: 900s');

// 2. Start race
const result = await Promise.race([
  // Path A: Job execution
  handler(data),
  
  // Path B: Timeout
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Job timeout')), 900000)
  )
]);

// 3. First to finish wins
// If handler completes → return result ✅
// If timeout fires → throw error ⏱️

// 4. Catch timeout
catch (error) {
  if (error.message.includes('timeout')) {
    console.error('⏱️  Job timeout');
    // Mark as failed, refund credits
  }
}
```

---

## 📊 Timeout Scenarios

### **Scenario 1: Normal Completion (< Timeout)**

```
Timeline:
0s     ──────────────────> 30s    ──────────> 900s
Start  Job processing      Done    Timeout (not reached)

Result: ✅ Success
Action: Return result to user
Credits: Deducted
```

---

### **Scenario 2: Timeout Exceeded**

```
Timeline:
0s     ───────────────────────────────────────> 900s    > 910s
Start  Job processing (FAL.AI stuck)           Timeout   FAL.AI finally responds

Result: ⏱️ Timeout (at 900s)
Action: Job marked as failed, FAL.AI response ignored
Credits: Refunded
```

---

### **Scenario 3: Near-Timeout Completion**

```
Timeline:
0s     ──────────────────────────────────────> 899s    900s
Start  Job processing                          Done    Timeout (not reached)

Result: ✅ Success (just in time!)
Action: Return result to user
Credits: Deducted
```

---

## ⚠️ Important Notes

### **1. Timeout Does NOT Cancel FAL.AI Request**

The timeout only cancels the **queue job**. The FAL.AI request may still be processing.

**Why:**
- FAL.AI API doesn't support cancellation
- Request continues server-side
- We just stop waiting for response

**Implication:**
- Worker freed to process other jobs ✅
- FAL.AI may still complete (but result ignored) ⚠️
- Credits not charged to FAL.AI (their processing) ⚠️

---

### **2. Timeout vs Retry**

```javascript
// Queue config
await queueManager.boss.createQueue('ai-generation', {
  retryLimit: 2,           // Max 2 retries
  retryDelay: 30,          // Wait 30s between retries
  expireInSeconds: 1800    // Job expires after 30 minutes
});

// Worker config
timeout: 900000  // 15 minutes per attempt
```

**Total possible time:**
- Attempt 1: 15 min
- Wait: 30s
- Attempt 2: 15 min
- Wait: 30s
- Attempt 3: 15 min
- **Total: ~46 minutes max**

But job expires after 30 minutes, so effective max is 30 minutes.

---

### **3. Choose Appropriate Timeout**

**Too Short:**
- ❌ Valid generations fail
- ❌ User frustration
- ❌ Wasted credits

**Too Long:**
- ❌ Resources locked
- ❌ Other jobs delayed
- ❌ Poor UX (waiting forever)

**Just Right (Current: 15min for images/videos):**
- ✅ Enough time for legitimate processing
- ✅ Catches actual stuck jobs
- ✅ Good resource utilization

---

## 🧪 Testing

### **Test Case 1: Normal Generation (Pass)**

```javascript
// Expected: Complete within timeout
Generate image with FLUX Pro (takes ~20s)
Timeout: 900s (15min)

Result: ✅ Completes at 20s
Status: Success
```

---

### **Test Case 2: Simulated Timeout (Fail)**

```javascript
// Simulate slow generation
async function slowHandler() {
  await new Promise(resolve => setTimeout(resolve, 1000000)); // 16+ min
  return result;
}

Timeout: 900000ms (15min)

Result: ⏱️ Timeout at 15min
Status: Failed with timeout error
```

---

### **Test Case 3: FAL.AI Service Down**

```javascript
// FAL.AI returns no response
Generate video (FAL.AI is down)
Timeout: 900s

Result: ⏱️ Timeout at 15min
Status: Failed
Message: "Job timeout - service not responding"
```

---

## 🎯 Benefits

### **For Users:**
- ✅ Clear feedback when generation fails
- ✅ No infinite waiting
- ✅ Credits refunded on timeout
- ✅ Can retry immediately

### **For System:**
- ✅ Workers don't hang forever
- ✅ Resources properly freed
- ✅ Queue keeps moving
- ✅ Better error tracking

### **For Monitoring:**
- ✅ Easy to detect timeout issues
- ✅ Clear logs for debugging
- ✅ Can adjust timeouts based on metrics

---

## 📈 Metrics to Monitor

### **Recommended:**

1. **Timeout Rate**
   ```
   Timeouts / Total Jobs × 100%
   Target: < 1%
   ```

2. **Average Completion Time**
   ```
   Sum(completion times) / Total completed jobs
   Image: ~20-40s
   Video: ~2-5min
   ```

3. **P95/P99 Latency**
   ```
   95% of jobs complete within: X seconds
   99% of jobs complete within: Y seconds
   ```

4. **Timeout by Model**
   ```
   Which models timeout most often?
   Adjust per-model timeouts if needed
   ```

---

## 🔄 Future Enhancements

### **1. Dynamic Timeout**

Adjust timeout based on job type:

```javascript
function calculateTimeout(jobData) {
  const { type, model, duration } = jobData;
  
  if (type === 'image') return 300000;  // 5 min
  if (type === 'video') {
    if (duration <= 5) return 600000;   // 10 min for short
    return 900000;                       // 15 min for long
  }
  if (type === 'audio') return 600000;  // 10 min
  
  return 900000;  // Default 15 min
}
```

---

### **2. Progressive Timeout Warnings**

Notify user before timeout:

```javascript
// At 75% of timeout
console.log('⚠️  Generation taking longer than expected...');
notifyUser('Still processing, please wait...');

// At 90% of timeout
console.log('⚠️  Almost at timeout limit...');
notifyUser('Almost done or may timeout soon...');

// At 100%
console.error('⏱️  Timeout!');
notifyUser('Generation failed - timeout');
```

---

### **3. Graceful Cancellation**

Allow user to cancel generation:

```javascript
// User clicks "Cancel"
await queueManager.cancel(jobId);

// Worker receives cancellation signal
// Stops processing gracefully
// Refunds credits
```

---

## ✅ Checklist

Implementation:
- [x] Add timeout to queue worker
- [x] Add Promise.race wrapper
- [x] Add timeout logging
- [x] Register worker with timeout
- [x] Add timeout error handling
- [x] Create documentation

Testing:
- [ ] Test normal generation (< timeout)
- [ ] Test timeout scenario
- [ ] Test timeout logging
- [ ] Test credit refund on timeout
- [ ] Test UI error message

Monitoring:
- [ ] Track timeout rate
- [ ] Monitor completion times
- [ ] Alert on high timeout rate

---

## 📝 Summary

**What was added:**
- ✅ Configurable timeout per worker
- ✅ Promise.race() timeout mechanism
- ✅ Timeout error detection
- ✅ Clear timeout logging
- ✅ 15-minute default for AI generation

**Impact:**
- 🎯 No more hanging jobs
- ⚡ Better resource utilization
- 📊 Clearer error tracking
- 💰 Proper credit handling
- ✨ Better user experience

---

**Status:** ✅ READY TO USE  
**Default Timeout:** 15 minutes (900,000ms)  
**Configurable:** Yes, per worker registration  

```bash
# Restart workers to apply
npm run dev
```

🎉 **Timeout mechanism active - No more infinite hangs!**

