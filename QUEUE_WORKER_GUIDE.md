# 🚀 Queue & Worker System Guide

Dokumentasi lengkap untuk sistem Queue & Worker berbasis Postgres di PIXELNEST.

## 📋 Daftar Isi

1. [Overview](#overview)
2. [Opsi 1: pg-boss (Rekomendasi)](#opsi-1-pg-boss-rekomendasi)
3. [Opsi 2: Custom Queue](#opsi-2-custom-queue-roll-your-own)
4. [Perbandingan Opsi](#perbandingan-opsi)
5. [Setup & Installation](#setup--installation)
6. [Usage Examples](#usage-examples)
7. [Monitoring & Troubleshooting](#monitoring--troubleshooting)

---

## Overview

### Mengapa Queue & Worker?

**Masalah tanpa Queue:**
```
User Request → Express Route → FAL.AI API (90s) → Response
                                ↑
                        User menunggu 90 detik!
```

**Solusi dengan Queue:**
```
User Request → Enqueue Job → Response (instant!)
                    ↓
              Background Worker → FAL.AI API (90s) → Update DB
                                                      ↓
                                                  NOTIFY User via SSE
```

### Benefit:
- ✅ **Non-blocking**: User tidak perlu menunggu
- ✅ **Scalable**: Tambah worker sesuai kebutuhan
- ✅ **Reliable**: Auto-retry jika gagal
- ✅ **Persistent**: Job tetap jalan meski server restart
- ✅ **Observable**: Track progress real-time

---

## Opsi 1: pg-boss (Rekomendasi)

### ✅ Kelebihan

- 🎯 **Production-ready** - Sudah dipakai di banyak production apps
- 🔧 **Feature-rich** - Retry, scheduling, priority, dll
- 📊 **Built-in monitoring** - Dashboard & metrics
- 🛡️ **Battle-tested** - Stable & reliable
- 📦 **Easy to use** - Simple API

### ❌ Kekurangan

- 📦 Dependency eksternal (npm package)
- 🗄️ Bikin schema/tables sendiri di Postgres

### 🏗️ Arsitektur

```
┌─────────────────────────────────────────────────────────┐
│                    Express Server                        │
│                                                           │
│  ┌─────────────────┐         ┌────────────────────┐     │
│  │  API Endpoint   │────────▶│   pg-boss Queue    │     │
│  │  /api/generate  │         │  (enqueue job)     │     │
│  └─────────────────┘         └────────────────────┘     │
│                                       │                  │
│                                       ▼                  │
│                              ┌─────────────────┐         │
│                              │ Postgres Tables │         │
│                              │  pgboss.job     │         │
│                              │  pgboss.archive │         │
│                              └─────────────────┘         │
└─────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────┐
│                    Worker Process                        │
│                                                           │
│  ┌──────────────────┐       ┌─────────────────────┐     │
│  │  pg-boss Worker  │──────▶│   Job Handler       │     │
│  │   (poll jobs)    │       │  processGeneration  │     │
│  └──────────────────┘       └─────────────────────┘     │
│                                       │                  │
│                                       ▼                  │
│                              ┌─────────────────┐         │
│                              │   FAL.AI API    │         │
│                              │   (generate)    │         │
│                              └─────────────────┘         │
│                                       │                  │
│                                       ▼                  │
│                              ┌─────────────────┐         │
│                              │   Update DB     │         │
│                              │   + NOTIFY      │         │
│                              └─────────────────┘         │
└─────────────────────────────────────────────────────────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │  SSE to User    │
                              │  (real-time)    │
                              └─────────────────┘
```

### 📦 Installation

```bash
npm install pg-boss
```

### 🚀 Quick Start

**1. Start Worker (in separate terminal):**
```bash
node src/workers/aiGenerationWorker.js
```

**2. Enqueue Job (from your route):**
```javascript
const queueManager = require('./src/queue/pgBossQueue');

// Initialize once on server startup
await queueManager.initialize();

// Enqueue job
app.post('/api/generate', async (req, res) => {
  const jobId = await queueManager.enqueue('ai-generation', {
    userId: req.user.id,
    prompt: req.body.prompt,
    settings: req.body.settings,
  });
  
  res.json({ success: true, jobId });
});
```

**3. Check Status:**
```javascript
const status = await queueManager.getJobStatus(jobId);
console.log(status.state); // 'created', 'active', 'completed', 'failed'
```

---

## Opsi 2: Custom Queue (Roll-Your-Own)

### ✅ Kelebihan

- 🚀 **No dependencies** - Pure Postgres
- 🎛️ **Full control** - Customize sesuai kebutuhan
- 🔍 **Transparent** - Semua di database Anda
- 💰 **Free** - Tidak perlu library eksternal

### ❌ Kekurangan

- 🛠️ Perlu maintain sendiri
- 🐛 Potential bugs (belum battle-tested)
- ⚙️ Feature terbatas (harus build sendiri)

### 🏗️ Arsitektur

```
┌─────────────────────────────────────────────────────────┐
│                Express Server + Worker                   │
│                                                           │
│  ┌─────────────────┐         ┌────────────────────┐     │
│  │  API Endpoint   │────────▶│  Custom Queue      │     │
│  │  /api/generate  │         │  INSERT INTO       │     │
│  └─────────────────┘         │  job_queue         │     │
│                               └────────────────────┘     │
│                                       │                  │
│                                       ▼                  │
│                              ┌─────────────────┐         │
│                              │ Postgres        │         │
│                              │ NOTIFY new_job  │         │
│                              └─────────────────┘         │
│                                       │                  │
│                                       ▼                  │
│  ┌──────────────────┐       ┌─────────────────────┐     │
│  │  Worker (LISTEN) │──────▶│ SELECT ... FOR      │     │
│  │  new_job channel │       │ UPDATE SKIP LOCKED  │     │
│  └──────────────────┘       └─────────────────────┘     │
│                                       │                  │
│                                       ▼                  │
│                              ┌─────────────────┐         │
│                              │   Job Handler   │         │
│                              │  (process job)  │         │
│                              └─────────────────┘         │
│                                       │                  │
│                                       ▼                  │
│                              ┌─────────────────┐         │
│                              │  Update status  │         │
│                              │  NOTIFY user_X  │         │
│                              └─────────────────┘         │
└─────────────────────────────────────────────────────────┘
```

### 🔑 Key Technologies

#### 1. **FOR UPDATE SKIP LOCKED**
Mencegah race condition saat multiple workers ambil job yang sama:

```sql
SELECT * FROM job_queue
WHERE status = 'pending'
ORDER BY priority DESC
FOR UPDATE SKIP LOCKED  -- Skip jobs yang sudah di-lock worker lain
LIMIT 1;
```

#### 2. **LISTEN/NOTIFY**
Real-time event notification tanpa polling:

```javascript
// Worker listens
await client.query('LISTEN new_job');

// Server notifies
await pool.query("NOTIFY new_job, 'ai-generation'");

// Worker receives instantly
client.on('notification', (msg) => {
  console.log('New job:', msg.payload);
  fetchAndProcess();
});
```

### 🚀 Quick Start

**1. Initialize (creates tables):**
```javascript
const customQueue = require('./src/queue/customQueue');
await customQueue.initialize();
```

**2. Start Worker:**
```bash
node src/workers/customAIGenerationWorker.js
```

**3. Enqueue Job:**
```javascript
const jobId = await customQueue.enqueue('ai-generation', {
  userId: req.user.id,
  prompt: req.body.prompt,
  settings: req.body.settings,
}, {
  priority: 10,
  maxAttempts: 3,
});
```

**4. Check Status:**
```javascript
const status = await customQueue.getJobStatus(jobId);
console.log(status.status); // 'pending', 'processing', 'completed', 'failed'
console.log(status.progress); // 0-100
```

---

## Perbandingan Opsi

| Feature                  | pg-boss ⭐      | Custom Queue    |
|-------------------------|----------------|-----------------|
| **Setup Complexity**    | Easy           | Medium          |
| **External Deps**       | Yes (pg-boss)  | No              |
| **Production Ready**    | ✅ Yes         | ⚠️ Needs testing |
| **Retry Mechanism**     | ✅ Built-in    | ✅ Custom       |
| **Priority Queue**      | ✅ Built-in    | ✅ Custom       |
| **Scheduled Jobs**      | ✅ Built-in    | ✅ Custom       |
| **Job Expiration**      | ✅ Built-in    | ⚠️ Manual       |
| **Monitoring**          | ✅ Built-in    | ⚠️ Manual       |
| **Concurrency Control** | ✅ Built-in    | ✅ SKIP LOCKED  |
| **Real-time Events**    | ✅ Pub/Sub     | ✅ LISTEN/NOTIFY |
| **Maintenance**         | Low            | Medium-High     |
| **Flexibility**         | Medium         | ✅ High         |
| **Learning Curve**      | Low            | Medium          |

### 🎯 Rekomendasi

**Pilih pg-boss jika:**
- ✅ Ingin production-ready solution
- ✅ Tidak ingin maintain queue logic sendiri
- ✅ Butuh monitoring & observability built-in
- ✅ Team kecil / tidak ada dedicated devops

**Pilih Custom Queue jika:**
- ✅ Ingin full control
- ✅ Tidak ingin tambah dependencies
- ✅ Punya requirements khusus
- ✅ Team besar dengan resources untuk maintain

---

## Setup & Installation

### Setup pg-boss

**1. Install package:**
```bash
npm install pg-boss
```

**2. Tambahkan ke `package.json` scripts:**
```json
{
  "scripts": {
    "worker": "node src/workers/aiGenerationWorker.js",
    "dev:worker": "nodemon src/workers/aiGenerationWorker.js"
  }
}
```

**3. Update `server.js`:**
```javascript
const queueManager = require('./src/queue/pgBossQueue');

// Initialize on startup
queueManager.initialize().catch(console.error);

// Graceful shutdown
process.on('SIGTERM', async () => {
  await queueManager.shutdown();
  process.exit(0);
});
```

**4. Start worker:**
```bash
npm run worker
```

### Setup Custom Queue

**1. No installation needed!** (Pure Postgres)

**2. Tambahkan ke `package.json`:**
```json
{
  "scripts": {
    "worker:custom": "node src/workers/customAIGenerationWorker.js"
  }
}
```

**3. Update `server.js`:**
```javascript
const customQueue = require('./src/queue/customQueue');

// Initialize
customQueue.initialize().catch(console.error);

// Shutdown
process.on('SIGTERM', async () => {
  await customQueue.shutdown();
  process.exit(0);
});
```

**4. Start worker:**
```bash
npm run worker:custom
```

---

## Usage Examples

### Example 1: Enqueue Generation Job

**Using pg-boss:**
```javascript
// src/routes/generation.js
const queueManager = require('../queue/pgBossQueue');

router.post('/generate', ensureAuthenticated, async (req, res) => {
  const { prompt, modelId, settings } = req.body;
  
  const jobId = await queueManager.enqueue('ai-generation', {
    userId: req.user.id,
    jobId: `gen_${Date.now()}`,
    generationType: 'image',
    prompt,
    settings: { modelId, ...settings }
  }, {
    priority: 5,
    retryLimit: 2,
  });
  
  res.json({ success: true, jobId });
});
```

**Using Custom Queue:**
```javascript
const customQueue = require('../queue/customQueue');

router.post('/generate', ensureAuthenticated, async (req, res) => {
  const jobId = await customQueue.enqueue('ai-generation', {
    userId: req.user.id,
    prompt: req.body.prompt,
    settings: req.body.settings
  }, {
    priority: 10,
    maxAttempts: 3,
  });
  
  res.json({ success: true, jobId });
});
```

### Example 2: Check Job Status (Polling)

```javascript
router.get('/status/:jobId', ensureAuthenticated, async (req, res) => {
  // From database (both options use same table)
  const result = await pool.query(`
    SELECT status, progress, result_url, error_message
    FROM ai_generation_history
    WHERE job_id = $1 AND user_id = $2
  `, [req.params.jobId, req.user.id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  res.json(result.rows[0]);
});
```

### Example 3: SSE Real-time Updates

**Backend:**
```javascript
// src/routes/sse.js
const express = require('express');
const router = express.Router();
const sseController = require('../controllers/sseController');

router.get('/generation-updates', 
  ensureAuthenticated, 
  sseController.generationUpdatesWithNotify
);

module.exports = router;
```

**Frontend:**
```html
<script>
// Connect to SSE
const eventSource = new EventSource('/api/sse/generation-updates');

eventSource.addEventListener('job-completed', (event) => {
  const data = JSON.parse(event.data);
  console.log('Job completed!', data);
  
  // Update UI
  showResult(data.resultUrl);
  hideLoadingCard(data.jobId);
});

eventSource.addEventListener('job-failed', (event) => {
  const data = JSON.parse(event.data);
  console.error('Job failed:', data.error);
  showError(data.error);
});

// Fallback: Close after 5 minutes
setTimeout(() => {
  eventSource.close();
}, 5 * 60 * 1000);
</script>
```

### Example 4: Scheduled Job

**pg-boss:**
```javascript
// Schedule job to start in 1 hour
await queueManager.enqueue('ai-generation', payload, {
  startAfter: 60 * 60, // seconds
});
```

**Custom Queue:**
```javascript
await customQueue.enqueue('ai-generation', payload, {
  scheduledFor: new Date(Date.now() + 60 * 60 * 1000), // timestamp
});
```

### Example 5: High Priority Job

**pg-boss:**
```javascript
await queueManager.enqueue('ai-generation', payload, {
  priority: 100, // Higher = processed first
});
```

**Custom Queue:**
```javascript
await customQueue.enqueue('ai-generation', payload, {
  priority: 100,
});
```

---

## Monitoring & Troubleshooting

### Monitor Queue (pg-boss)

**Check queue stats:**
```javascript
// In admin panel
const states = await queueManager.boss.getQueueSize('ai-generation');
console.log({
  active: states.active,
  created: states.created,
  completed: states.completed,
  failed: states.failed
});
```

**Monitor failed jobs:**
```sql
SELECT * FROM pgboss.job
WHERE state = 'failed'
ORDER BY completedon DESC
LIMIT 10;
```

### Monitor Queue (Custom)

**Check queue stats:**
```sql
SELECT 
  status,
  COUNT(*) as count,
  AVG(progress) as avg_progress
FROM job_queue
WHERE queue_name = 'ai-generation'
GROUP BY status;
```

**Find stuck jobs:**
```sql
SELECT * FROM job_queue
WHERE status = 'processing'
  AND started_at < NOW() - INTERVAL '30 minutes';
```

**Retry failed jobs manually:**
```sql
UPDATE job_queue
SET status = 'pending', 
    attempts = 0,
    scheduled_for = NOW()
WHERE id = 123;
```

### Common Issues

#### Issue 1: Worker tidak process jobs

**Diagnosis:**
```bash
# Check if worker is running
ps aux | grep worker

# Check pg-boss tables
SELECT COUNT(*) FROM pgboss.job WHERE state = 'created';

# Check custom queue
SELECT COUNT(*) FROM job_queue WHERE status = 'pending';
```

**Solution:**
- Restart worker
- Check logs untuk errors
- Verify database connection

#### Issue 2: Jobs stuck in 'processing'

**pg-boss:**
```javascript
// Jobs auto-fail after timeout
// Check retryLimit and expireInSeconds settings
```

**Custom Queue:**
```sql
-- Manually reset stuck jobs
UPDATE job_queue
SET status = 'pending',
    locked_by = NULL,
    locked_until = NULL
WHERE status = 'processing'
  AND locked_until < NOW();
```

#### Issue 3: Memory leak di worker

**Solution:**
- Limit concurrent jobs (teamSize/concurrency)
- Add memory limits
- Restart worker periodically

```javascript
// Limit concurrent jobs
registerWorker('ai-generation', handler, {
  teamSize: 2,  // Only 2 concurrent jobs
  teamConcurrency: 1
});
```

---

## Production Deployment

### Option 1: Separate Worker Server

```
┌──────────────┐         ┌──────────────┐
│  Web Server  │────────▶│  PostgreSQL  │
│   (API)      │         │              │
└──────────────┘         └──────────────┘
                                │
                                ▼
                         ┌──────────────┐
                         │Worker Server │
                         │  (Process)   │
                         └──────────────┘
```

**Benefits:**
- Scale workers independently
- Isolate CPU-intensive tasks
- Better resource allocation

**PM2 Config (`ecosystem.config.js`):**
```javascript
module.exports = {
  apps: [
    {
      name: 'pixelnest-api',
      script: 'server.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5005
      }
    },
    {
      name: 'pixelnest-worker',
      script: 'src/workers/aiGenerationWorker.js',
      instances: 4,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
```

### Option 2: Combined Server (Small Scale)

```javascript
// server.js
const app = require('./app');
const worker = require('./src/workers/aiGenerationWorker');

// Start both API and worker
app.listen(PORT);
worker.startWorker();
```

---

## Next Steps

1. ✅ Pilih opsi yang sesuai (pg-boss atau custom)
2. ✅ Install dependencies jika perlu
3. ✅ Setup database tables
4. ✅ Start worker process
5. ✅ Test dengan generate image/video
6. ✅ Monitor logs & database
7. ✅ Deploy to production

**Need help?** Check:
- [pg-boss documentation](https://github.com/timgit/pg-boss)
- [Postgres FOR UPDATE SKIP LOCKED](https://www.postgresql.org/docs/current/sql-select.html#SQL-FOR-UPDATE-SHARE)
- [Postgres LISTEN/NOTIFY](https://www.postgresql.org/docs/current/sql-notify.html)

