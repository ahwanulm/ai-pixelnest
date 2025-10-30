# 🚀 Queue System - Quick Start Guide

**5 menit dari zero ke running queue system!**

---

## 📦 Opsi 1: pg-boss (Rekomendasi)

### Step 1: Install pg-boss

```bash
npm install pg-boss
```

### Step 2: Start Worker

Terminal 1 (API Server):
```bash
npm run dev
```

Terminal 2 (Worker):
```bash
npm run worker
```

### Step 3: Test!

Selesai! Queue sudah jalan. pg-boss otomatis bikin tables di Postgres.

---

## 🛠️ Opsi 2: Custom Queue

### Step 1: Initialize Tables

```bash
# Start server sekali untuk initialize tables
node -e "
const customQueue = require('./src/queue/customQueue');
customQueue.initialize().then(() => {
  console.log('✅ Tables created!');
  process.exit(0);
});
"
```

### Step 2: Start Worker

Terminal 1 (API Server):
```bash
npm run dev
```

Terminal 2 (Worker):
```bash
npm run worker:custom
```

### Step 3: Test!

Done!

---

## 🧪 Testing Queue System

### Test 1: Enqueue Job via API

```bash
# Login dan get token dulu
curl -X POST http://localhost:5005/api/queue-generation/create \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -d '{
    "prompt": "A beautiful sunset over mountains",
    "type": "text-to-image",
    "mode": "image",
    "settings": {
      "modelId": 1,
      "width": 1024,
      "height": 1024
    }
  }'
```

Response:
```json
{
  "success": true,
  "jobId": "job_1234567890_abc123",
  "id": 42
}
```

### Test 2: Check Job Status (Polling)

```bash
curl http://localhost:5005/api/queue-generation/status/job_1234567890_abc123 \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

Response:
```json
{
  "success": true,
  "job": {
    "jobId": "job_1234567890_abc123",
    "status": "processing",
    "progress": 50,
    "resultUrl": null
  }
}
```

### Test 3: Real-time Updates via SSE

```html
<!-- In your frontend -->
<script>
const eventSource = new EventSource('/api/sse/generation-updates');

eventSource.addEventListener('job-completed', (event) => {
  const data = JSON.parse(event.data);
  console.log('✅ Job completed!', data);
  alert(`Generation complete! URL: ${data.resultUrl}`);
});

eventSource.addEventListener('job-failed', (event) => {
  const data = JSON.parse(event.data);
  console.error('❌ Job failed:', data.error);
});
</script>
```

---

## 📊 Monitor Queue

### pg-boss Dashboard

**Check queue status:**
```sql
-- Connect to postgres
psql -U postgres -d pixelnest

-- View all jobs
SELECT 
  id,
  name,
  state,
  priority,
  retrylimit,
  retrycount,
  createdon,
  startedon,
  completedon
FROM pgboss.job
ORDER BY createdon DESC
LIMIT 10;

-- Count by status
SELECT state, COUNT(*) 
FROM pgboss.job 
GROUP BY state;
```

### Custom Queue Dashboard

```sql
-- View all jobs
SELECT 
  id,
  queue_name,
  job_id,
  status,
  progress,
  attempts,
  created_at,
  started_at,
  completed_at
FROM job_queue
ORDER BY created_at DESC
LIMIT 10;

-- Count by status
SELECT status, COUNT(*) 
FROM job_queue 
GROUP BY status;

-- Active jobs
SELECT * FROM job_queue
WHERE status IN ('pending', 'processing')
ORDER BY priority DESC, created_at ASC;
```

---

## 🔧 Common Commands

### Development

```bash
# Start all (API + Worker + CSS watch)
npm run dev:all

# Start API only
npm run dev

# Start Worker only (pg-boss)
npm run dev:worker

# Start Worker only (custom queue)
npm run worker:custom
```

### Production

```bash
# Using PM2 (recommended)
pm2 start ecosystem.config.js

# Or manual
npm start &          # API server
npm run worker &     # Worker

# Check status
pm2 status
pm2 logs
```

---

## 🐛 Troubleshooting

### Worker tidak process jobs

**Check 1: Worker running?**
```bash
ps aux | grep worker
```

**Check 2: Jobs in queue?**
```sql
-- pg-boss
SELECT COUNT(*) FROM pgboss.job WHERE state = 'created';

-- custom queue
SELECT COUNT(*) FROM job_queue WHERE status = 'pending';
```

**Check 3: Database connection?**
```bash
# Check .env
cat .env | grep DB_
```

**Solution:**
```bash
# Restart worker
pkill -f worker.js
npm run worker
```

### Jobs stuck in 'processing'

**pg-boss:**
```sql
-- View stuck jobs
SELECT * FROM pgboss.job
WHERE state = 'active'
  AND startedon < NOW() - INTERVAL '30 minutes';

-- They will auto-retry based on retryLimit
```

**Custom Queue:**
```sql
-- Reset stuck jobs
UPDATE job_queue
SET status = 'pending',
    locked_by = NULL,
    locked_until = NULL
WHERE status = 'processing'
  AND locked_until < NOW();
```

### Memory leak

**Check memory:**
```bash
pm2 monit
# or
top
```

**Solution:**
```javascript
// In worker config
{
  teamSize: 2,        // Reduce concurrent workers
  teamConcurrency: 1  // 1 job per worker
}
```

**Restart periodically:**
```bash
# Add to crontab
0 3 * * * pm2 restart pixelnest-worker
```

---

## 🎯 Integration with Existing Routes

### Update your generation route

**Before (blocking):**
```javascript
router.post('/generate', async (req, res) => {
  const result = await falAiService.generate(prompt);  // Blocks 90s!
  res.json({ result });
});
```

**After (queue-based):**
```javascript
const queueManager = require('../queue/pgBossQueue');

router.post('/generate', async (req, res) => {
  const jobId = await queueManager.enqueue('ai-generation', {
    userId: req.user.id,
    prompt: req.body.prompt,
    settings: req.body.settings
  });
  
  res.json({ 
    success: true, 
    jobId,
    message: 'Job queued! Check status with /status/:jobId'
  });
});
```

---

## 📈 Scaling

### Single Server (Small)

```
┌──────────────────────┐
│   Server (1 VPS)     │
│                      │
│  API (2 processes)   │
│  Worker (2 processes)│
│  Postgres            │
└──────────────────────┘
```

**PM2 Config:**
```javascript
{
  apps: [
    { name: 'api', instances: 2 },
    { name: 'worker', instances: 2 }
  ]
}
```

### Separate Servers (Medium)

```
┌──────────────┐    ┌──────────────┐
│  API Server  │───▶│  PostgreSQL  │
│ (4 instances)│    │              │
└──────────────┘    └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │Worker Server │
                    │(4 instances) │
                    └──────────────┘
```

### Kubernetes (Large)

```yaml
# api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pixelnest-api
spec:
  replicas: 4
  
---
# worker-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pixelnest-worker
spec:
  replicas: 4
```

---

## ✅ Checklist

Setup:
- [ ] Install pg-boss atau initialize custom queue
- [ ] Update routes untuk pakai queue
- [ ] Add SSE endpoint untuk real-time updates
- [ ] Test enqueue & process job
- [ ] Monitor logs

Production:
- [ ] Setup PM2 atau process manager
- [ ] Configure graceful shutdown
- [ ] Add error monitoring (Sentry, etc)
- [ ] Setup log rotation
- [ ] Add health check endpoints
- [ ] Configure auto-restart on failure

---

## 🎓 Next Steps

1. ✅ **Read full guide**: `QUEUE_WORKER_GUIDE.md`
2. ✅ **Choose queue type**: pg-boss vs custom
3. ✅ **Test locally**: Run worker + API
4. ✅ **Integrate to routes**: Replace blocking calls
5. ✅ **Add SSE**: Real-time updates
6. ✅ **Deploy**: Use PM2 or Docker
7. ✅ **Monitor**: Check logs & database

**Questions?** Check the main guide or logs!

