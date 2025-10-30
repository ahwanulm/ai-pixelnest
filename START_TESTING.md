# 🧪 START TESTING - Quick Guide

## ⚡ Quick Start (2 Steps!)

### Step 1: Start Worker

**Terminal 2 (NEW):**
```bash
npm run worker
```

**Expected Output:**
```
✅ pg-boss Queue initialized successfully
📦 Creating ai-generation queue...
✅ Queue created
👷 Worker registered: ai-generation
⏳ Waiting for jobs...
```

### Step 2: Test Generation

1. Open: http://localhost:5005/dashboard
2. Enter prompt: "A beautiful sunset"
3. Click **"Run"**

**Expected:**
- ✅ Notification: "Generation queued! You can close this page."
- ✅ Worker console: `🔨 Processing job`
- ✅ After ~45s: Image appears!

---

## ✅ It Works If...

1. **Browser Console Shows:**
```
✅ Queue client initialized
🚀 Using queue-based generation system
✅ Job queued: job_123...
```

2. **Worker Console Shows:**
```
🔨 Processing job: ai-generation [job_123...]
🎨 Calling FAL.AI...
✅ FAL.AI returned result
📥 Downloading result...
✅ Job completed: job_123
```

3. **Dashboard Shows:**
- Loading card with animation
- Progress updates (optional)
- Final result card appears
- Credits deducted correctly

---

## 🎯 Quick Tests

### Test 1: Basic Generation (30 seconds)
✅ Enter prompt → Click Run → Wait → See result

### Test 2: Close & Resume (2 minutes)
✅ Start generation → Close tab → Wait → Reopen → See result

### Test 3: Multiple Jobs (1 minute)
✅ Click Run 3x → All queue → All process → All show results

---

## 🐛 If Something Wrong

### Worker won't start?
```bash
# Install pg-boss
npm install pg-boss

# Try again
npm run worker
```

### Job not processing?
```bash
# Check database connection in .env
cat .env | grep DB_

# Restart worker
pkill -f worker.js
npm run worker
```

### Old blocking behavior?
```bash
# Clear browser cache
Ctrl+Shift+R (hard reload)

# Check console for:
"🚀 Using queue-based generation system"
```

---

## 📊 Check If Migration Worked

### Database Check:
```sql
-- Should have pending/processing jobs
SELECT * FROM ai_generation_history 
WHERE status IN ('pending', 'processing')
ORDER BY created_at DESC;

-- Should have pg-boss jobs
SELECT * FROM pgboss.job 
WHERE name = 'ai-generation'
ORDER BY createdon DESC LIMIT 5;
```

### Files Check:
```bash
# Should exist:
ls public/js/queueClient.js
ls src/workers/aiGenerationWorker.js
ls worker.js

# Should be updated:
grep "queue-based generation" public/js/dashboard-generation.js
grep "DEPRECATED" src/controllers/generationController.js
```

---

## 🎉 Success Criteria

Migration is **SUCCESSFUL** if:

- [x] ✅ Worker starts without errors
- [x] ✅ Dashboard loads with queue client
- [x] ✅ Generation completes successfully
- [x] ✅ Can close browser during generation
- [x] ✅ Result shows after resuming
- [x] ✅ Credits deducted correctly
- [x] ✅ No blocking behavior

---

## 🚀 You're Ready!

Everything is set up. Just run:

```bash
# Terminal 1 (already running)
npm run dev

# Terminal 2 (NEW)
npm run worker
```

Then test at: **http://localhost:5005/dashboard**

Good luck! 🎉

