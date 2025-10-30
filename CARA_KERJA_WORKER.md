# 🔧 Cara Kerja Worker System di PIXELNEST

Penjelasan lengkap bagaimana background worker bekerja untuk memproses AI generation.

---

## 🎯 Konsep Dasar

### Masalah Tanpa Worker

```
User klik "Generate" → Express API → FAL.AI (90 detik) → Response
                                       ↑
                              User menunggu 90 detik! ❌
                              Browser bisa timeout
                              User tidak bisa tutup browser
```

**Masalah:**
- User harus nunggu lama
- Request bisa timeout
- Server blocking (tidak bisa handle request lain)
- User tidak bisa navigate ke page lain

### Solusi dengan Worker

```
User klik "Generate" → Express API → Enqueue Job → Response (instant!) ✅
                                          ↓
                                   PostgreSQL (job disimpan)
                                          ↓
                        Background Worker (proses terpisah)
                                          ↓
                                   FAL.AI API (90 detik)
                                          ↓
                                   Download hasil
                                          ↓
                                   Save ke database
                                          ↓
                                   NOTIFY user via SSE
                                          ↓
                        User: "Generation complete!" (notification)
```

**Benefit:**
- ✅ User dapat response instant (< 1 detik)
- ✅ User bisa tutup browser / navigate ke page lain
- ✅ Job tetap jalan di background
- ✅ Hasil disimpan otomatis
- ✅ User dapat notifikasi real-time

---

## 🏗️ Arsitektur System

### Komponen Utama

```
┌─────────────────────────────────────────────────────────────┐
│                    USER BROWSER                              │
│  ┌────────────┐         ┌────────────┐                      │
│  │ Dashboard  │────────▶│ Click Run  │                      │
│  └────────────┘         └────────────┘                      │
└──────────────────────────────┼──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   EXPRESS SERVER (Port 5005)                 │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Route: POST /api/queue-generation/create           │    │
│  │  Controller: generationQueueController.createJob()  │    │
│  └────────────────────┬────────────────────────────────┘    │
│                       │                                      │
│                       ▼                                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  1. Generate unique jobId                           │    │
│  │  2. Save to ai_generation_history (status: pending) │    │
│  │  3. Enqueue to pg-boss queue                        │    │
│  │  4. Return jobId to user (instant response)         │    │
│  └────────────────────┬────────────────────────────────┘    │
└────────────────────────┼────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   POSTGRESQL DATABASE                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  pgboss.job table:                                  │    │
│  │  - Queue name: 'ai-generation'                      │    │
│  │  - Job data: { userId, prompt, settings, ... }     │    │
│  │  - Status: 'created'                                │    │
│  │  - Priority: 5                                      │    │
│  └────────────────────┬────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  ai_generation_history table:                       │    │
│  │  - job_id: 'job_123...'                            │    │
│  │  - status: 'pending'                                │    │
│  │  - progress: 0                                      │    │
│  └────────────────────────────────────────────────────┘    │
└────────────────────────┼────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              WORKER PROCESS (Separate Process)               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  worker.js → aiGenerationWorker.js                  │    │
│  │                                                      │    │
│  │  1. Connect to pg-boss                              │    │
│  │  2. Poll for jobs from 'ai-generation' queue        │    │
│  │  3. Fetch job dengan FOR UPDATE SKIP LOCKED         │    │
│  │     (prevent race condition)                        │    │
│  └────────────────────┬────────────────────────────────┘    │
│                       │                                      │
│                       ▼                                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  processAIGeneration(jobData):                      │    │
│  │                                                      │    │
│  │  Step 1: Update status → 'processing' (progress 0%) │    │
│  │  Step 2: Check user credits                         │    │
│  │  Step 3: Calculate cost                             │    │
│  │  Step 4: Update progress → 10%                      │    │
│  │  Step 5: Call FAL.AI API                           │    │
│  │          (this takes 30-90 seconds)                 │    │
│  │  Step 6: Update progress → 70%                      │    │
│  │  Step 7: Download result from FAL.AI               │    │
│  │  Step 8: Save file to /videos/userId/              │    │
│  │  Step 9: Update progress → 85%                      │    │
│  │  Step 10: Deduct user credits                       │    │
│  │  Step 11: Update status → 'completed' (100%)        │    │
│  │  Step 12: Save result_url to database              │    │
│  │  Step 13: Send NOTIFY to user's SSE connection     │    │
│  └────────────────────┬────────────────────────────────┘    │
└────────────────────────┼────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    FAL.AI API                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  1. Receive prompt & settings                       │    │
│  │  2. Generate image/video (AI processing)            │    │
│  │  3. Upload result to CDN                            │    │
│  │  4. Return result URL                               │    │
│  └────────────────────┬────────────────────────────────┘    │
└────────────────────────┼────────────────────────────────────┘
                         │
                         ▼
                    (Back to Worker)
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                 REAL-TIME NOTIFICATION                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Method 1: Server-Sent Events (SSE)                 │    │
│  │  - User browser keeps connection open               │    │
│  │  - Worker sends event: 'job-completed'              │    │
│  │  - Frontend receives & shows result                 │    │
│  │                                                      │    │
│  │  Method 2: Polling                                  │    │
│  │  - Frontend polls /status/:jobId every 2 seconds    │    │
│  │  - Check status & progress                          │    │
│  │  - Stop when status = 'completed'                   │    │
│  │                                                      │    │
│  │  Method 3: Postgres LISTEN/NOTIFY                   │    │
│  │  - Worker: NOTIFY generation_updates_123            │    │
│  │  - SSE connection: LISTEN generation_updates_123    │    │
│  │  - Instant notification via database                │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    USER BROWSER                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  EventSource receives 'job-completed' event         │    │
│  │  → Hide loading card                                │    │
│  │  → Show result image/video                          │    │
│  │  → Show browser notification                        │    │
│  │  → Play sound (optional)                            │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flow Detail Step-by-Step

### Phase 1: User Request (Frontend)

```javascript
// User clicks "Run" button
document.getElementById('runBtn').addEventListener('click', async () => {
  // 1. User input
  const prompt = "A beautiful sunset over mountains";
  const modelId = 1; // FLUX.1 Pro
  
  // 2. Send to API
  const jobId = await queueClient.createJob(prompt, 'text-to-image', 'image', {
    modelId,
    width: 1024,
    height: 1024
  });
  
  // 3. Response instant! (< 1 detik)
  console.log('Job created:', jobId); // job_1234567890_abc123
  
  // 4. Show loading card
  showLoadingCard(jobId, prompt);
  
  // 5. Connect SSE untuk real-time updates
  queueClient.connectSSE(onUpdate, onComplete, onError);
});
```

**Timeline:**
- 0ms: User click
- 200ms: API response dengan jobId
- 300ms: Loading card muncul
- 500ms: SSE connected

**User experience:**
- ✅ Instant feedback
- ✅ Bisa tutup browser
- ✅ Bisa navigate ke page lain

---

### Phase 2: API Endpoint (Backend)

```javascript
// src/controllers/generationQueueController.js
async createJob(req, res) {
  const { prompt, type, mode, settings } = req.body;
  const userId = req.user.id;
  
  // 1. Generate unique job ID
  const jobId = `job_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  // Result: job_1735311234567_a1b2c3d4e5f6
  
  // 2. Save to database (for tracking)
  await pool.query(`
    INSERT INTO ai_generation_history 
    (user_id, job_id, prompt, settings, status, progress)
    VALUES ($1, $2, $3, $4, 'pending', 0)
  `, [userId, jobId, prompt, JSON.stringify(settings)]);
  
  // 3. Enqueue to pg-boss
  await queueManager.enqueue('ai-generation', {
    userId,
    jobId,
    prompt,
    settings
  }, {
    priority: 5,        // Higher priority = processed first
    retryLimit: 2,      // Retry 2x jika gagal
    retryDelay: 30      // Wait 30s before retry
  });
  
  // 4. Return jobId ke user (INSTANT!)
  res.json({ success: true, jobId });
}
```

**Timeline:**
- 0ms: Request diterima
- 50ms: Generate jobId
- 100ms: Insert ke database
- 150ms: Enqueue ke pg-boss
- 200ms: Response dikirim

**Database state:**
```sql
-- ai_generation_history
job_id              | status  | progress | result_url
--------------------|---------|----------|------------
job_123...abc       | pending | 0        | NULL

-- pgboss.job
name          | data                    | state   | priority
--------------|-------------------------|---------|----------
ai-generation | {userId:1, prompt:...} | created | 5
```

---

### Phase 3: Worker Polling (Background)

```javascript
// worker.js running in separate process
// This is ALWAYS running, waiting for jobs

// Worker initialization
await queueManager.initialize();
await queueManager.registerWorker('ai-generation', processAIGeneration, {
  teamSize: 2,           // 2 concurrent workers
  teamConcurrency: 1,    // Each worker processes 1 job at a time
  pollingIntervalSeconds: 2  // Check for new jobs every 2 seconds
});

// Worker loop (simplified):
while (true) {
  // 1. Poll for jobs from pg-boss
  const job = await boss.fetch('ai-generation'); // Uses FOR UPDATE SKIP LOCKED
  
  if (job) {
    // 2. Process job
    await processAIGeneration(job.data);
  }
  
  // 3. Wait 2 seconds
  await sleep(2000);
}
```

**Concurrency Control:**

```sql
-- pg-boss uses this internally:
SELECT * FROM pgboss.job
WHERE name = 'ai-generation'
  AND state = 'created'
  AND startafter <= NOW()
ORDER BY priority DESC, createdon ASC
FOR UPDATE SKIP LOCKED  -- ⭐ This prevents race condition!
LIMIT 1;
```

**FOR UPDATE SKIP LOCKED** artinya:
- Lock row yang dipilih
- SKIP jika row sudah di-lock worker lain
- Prevent 2 worker ambil job yang sama

**Timeline:**
- Worker A: Fetch job 1 → LOCKED
- Worker B: Fetch job 1 → SKIPPED (karena locked)
- Worker B: Fetch job 2 → LOCKED
- Result: Each worker gets different job ✅

---

### Phase 4: Job Processing (Worker)

```javascript
async function processAIGeneration(jobData) {
  const { userId, jobId, prompt, settings } = jobData;
  
  console.log('🎨 Processing job:', jobId);
  
  try {
    // ============================================
    // Step 1: Update status to 'processing'
    // ============================================
    await pool.query(`
      UPDATE ai_generation_history
      SET status = 'processing', progress = 0
      WHERE job_id = $1
    `, [jobId]);
    
    // Database now shows:
    // status: 'processing', progress: 0
    
    // ============================================
    // Step 2: Check user credits
    // ============================================
    const user = await pool.query(
      'SELECT credits FROM users WHERE id = $1',
      [userId]
    );
    
    if (user.rows[0].credits < 10) {
      throw new Error('Insufficient credits');
    }
    
    // ============================================
    // Step 3: Update progress
    // ============================================
    await pool.query(`
      UPDATE ai_generation_history
      SET progress = 10
      WHERE job_id = $1
    `, [jobId]);
    
    // Database: progress: 10
    
    // ============================================
    // Step 4: Call FAL.AI API
    // ============================================
    console.log('🎨 Calling FAL.AI...');
    
    await pool.query(`
      UPDATE ai_generation_history
      SET progress = 30
      WHERE job_id = $1
    `, [jobId]);
    
    // This is the LONG operation (30-90 seconds)
    const result = await falAiService.generateImage(
      'fal-ai/flux-pro',
      prompt,
      settings
    );
    // Result: { images: [{ url: 'https://fal.ai/files/...jpg' }] }
    
    console.log('✅ FAL.AI returned result');
    
    await pool.query(`
      UPDATE ai_generation_history
      SET progress = 70
      WHERE job_id = $1
    `, [jobId]);
    
    // ============================================
    // Step 5: Download & Save Result
    // ============================================
    console.log('📥 Downloading result...');
    
    const imageUrl = result.images[0].url;
    const storedPath = await videoStorage.downloadAndStoreImage(
      imageUrl,
      userId
    );
    // Downloads from FAL.AI CDN → saves to /images/userId/job_123.jpg
    // Returns: '/images/1/job_123.jpg'
    
    await pool.query(`
      UPDATE ai_generation_history
      SET progress = 85
      WHERE job_id = $1
    `, [jobId]);
    
    // ============================================
    // Step 6: Deduct Credits
    // ============================================
    const creditsCost = 10;
    
    await pool.query(`
      UPDATE users
      SET credits = credits - $1
      WHERE id = $2
    `, [creditsCost, userId]);
    
    // User credits: 100 → 90
    
    // ============================================
    // Step 7: Mark as Completed
    // ============================================
    await pool.query(`
      UPDATE ai_generation_history
      SET 
        status = 'completed',
        progress = 100,
        result_url = $1,
        credits_cost = $2,
        completed_at = NOW()
      WHERE job_id = $3
    `, [storedPath, creditsCost, jobId]);
    
    console.log('✅ Job completed:', jobId);
    
    // ============================================
    // Step 8: Notify User (Real-time)
    // ============================================
    
    // Method 1: pg-boss publish
    await queueManager.publish('generation.completed', {
      userId,
      jobId,
      resultUrl: storedPath
    });
    
    // Method 2: Postgres NOTIFY
    await pool.query(
      `NOTIFY generation_updates_${userId}, $1`,
      [JSON.stringify({
        event: 'job-completed',
        data: { jobId, resultUrl: storedPath }
      })]
    );
    
    // User's browser SSE connection receives this instantly!
    
    return { success: true, jobId, resultUrl: storedPath };
    
  } catch (error) {
    // ============================================
    // Error Handling
    // ============================================
    console.error('❌ Job failed:', jobId, error.message);
    
    await pool.query(`
      UPDATE ai_generation_history
      SET 
        status = 'failed',
        error_message = $1,
        completed_at = NOW()
      WHERE job_id = $2
    `, [error.message, jobId]);
    
    // Notify user about failure
    await pool.query(
      `NOTIFY generation_updates_${userId}, $1`,
      [JSON.stringify({
        event: 'job-failed',
        data: { jobId, error: error.message }
      })]
    );
    
    // pg-boss will auto-retry if retryLimit not exceeded
    throw error;
  }
}
```

**Timeline:**
```
0s    - Job fetched from queue
0.1s  - Status: processing, Progress: 0%
0.5s  - Check credits OK
0.6s  - Progress: 10%
1s    - Calling FAL.AI API...
1.5s  - Progress: 30%
      ... (FAL.AI processing - 30-90 seconds) ...
45s   - FAL.AI returns result
45.1s - Progress: 70%
45.5s - Downloading image...
50s   - Image saved to disk
50.1s - Progress: 85%
50.2s - Credits deducted
50.3s - Status: completed, Progress: 100%
50.4s - NOTIFY sent to user
50.5s - Job done! ✅
```

---

### Phase 5: Real-time Notification (SSE)

```javascript
// User's browser has SSE connection open

// Backend: sseController.js
app.get('/api/sse/generation-updates', async (req, res) => {
  const userId = req.user.id;
  
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Create Postgres LISTEN connection
  const client = await pool.connect();
  await client.query(`LISTEN generation_updates_${userId}`);
  
  // When worker sends NOTIFY:
  client.on('notification', (msg) => {
    const payload = JSON.parse(msg.payload);
    // payload = { event: 'job-completed', data: {...} }
    
    // Send to browser via SSE
    res.write(`event: ${payload.event}\n`);
    res.write(`data: ${JSON.stringify(payload.data)}\n\n`);
  });
});

// Frontend: queueClient.js
const eventSource = new EventSource('/api/sse/generation-updates');

eventSource.addEventListener('job-completed', (event) => {
  const data = JSON.parse(event.data);
  // data = { jobId: 'job_123', resultUrl: '/images/1/job_123.jpg' }
  
  console.log('✅ Generation complete!', data);
  
  // Hide loading card
  hideLoadingCard(data.jobId);
  
  // Show result
  showResult(data.resultUrl);
  
  // Browser notification
  new Notification('Generation Complete!', {
    body: 'Your AI generation is ready',
    icon: data.resultUrl
  });
});
```

**Flow:**
```
Worker → NOTIFY generation_updates_1 → Postgres
                                            ↓
                                     SSE Connection (LISTEN)
                                            ↓
                                  res.write('event: job-completed\n...')
                                            ↓
                                  Browser EventSource
                                            ↓
                                  Event Listener
                                            ↓
                                  Update UI
```

---

## 🔁 Retry Mechanism

```javascript
// Job configuration
{
  retryLimit: 2,      // Retry max 2 kali
  retryDelay: 30,     // Wait 30 detik sebelum retry
  retryBackoff: true  // Exponential backoff (30s, 60s, 120s, ...)
}

// Attempt 1: FAILED (FAL.AI timeout)
//   ↓ Wait 30 seconds
// Attempt 2: FAILED (Network error)
//   ↓ Wait 60 seconds (exponential)
// Attempt 3: SUCCESS ✅

// If all attempts fail:
// status = 'failed', error_message = '...'
```

**pg-boss table:**
```sql
SELECT name, retrycount, retrylimit, state
FROM pgboss.job
WHERE id = '...';

-- Result:
name          | retrycount | retrylimit | state
--------------|------------|------------|--------
ai-generation | 2          | 2          | failed
```

---

## 🚦 Multiple Workers (Scaling)

```javascript
// ecosystem.config.js (PM2)
{
  name: 'pixelnest-worker',
  script: 'worker.js',
  instances: 4,  // Run 4 worker processes
}
```

**How it works:**

```
Queue:
  Job 1 (priority: 10)
  Job 2 (priority: 10)
  Job 3 (priority: 5)
  Job 4 (priority: 5)

Worker 1 → Fetch → Job 1 (LOCKED) → Processing...
Worker 2 → Fetch → Job 2 (LOCKED) → Processing...
Worker 3 → Fetch → Job 3 (LOCKED) → Processing...
Worker 4 → Fetch → Job 4 (LOCKED) → Processing...

All 4 jobs processed in parallel! ✅
```

**Database locking:**
```sql
-- Worker 1 executes:
SELECT * FROM pgboss.job WHERE ... FOR UPDATE SKIP LOCKED LIMIT 1;
-- Gets: Job 1, LOCKS it

-- Worker 2 executes (simultaneously):
SELECT * FROM pgboss.job WHERE ... FOR UPDATE SKIP LOCKED LIMIT 1;
-- Job 1 is LOCKED → SKIP
-- Gets: Job 2, LOCKS it

-- Worker 3 executes:
-- Gets: Job 3

-- Result: No race condition! Each worker gets unique job
```

---

## 📊 Monitoring

### Check Queue Status

```javascript
// pg-boss
const stats = await boss.getQueueSize('ai-generation');
console.log({
  active: 2,      // Currently processing
  created: 5,     // Waiting in queue
  completed: 100, // Done
  failed: 3       // Failed
});
```

### Check Active Jobs

```sql
-- Jobs currently being processed
SELECT 
  j.name,
  j.data->>'prompt' as prompt,
  j.state,
  j.startedon,
  h.progress
FROM pgboss.job j
JOIN ai_generation_history h ON j.data->>'jobId' = h.job_id
WHERE j.state = 'active'
ORDER BY j.startedon DESC;
```

### Worker Logs

```bash
pm2 logs pixelnest-worker --lines 100

# Output:
🔨 Processing job: ai-generation [job_123]
🎨 Calling FAL.AI...
✅ FAL.AI returned result
📥 Downloading result...
✅ Job completed: job_123
```

---

## 🎯 Kesimpulan

### Kenapa Pakai Worker?

1. **Non-blocking**: User tidak nunggu, dapat response instant
2. **Reliable**: Auto-retry jika gagal, jobs persistent di database
3. **Scalable**: Tambah worker = proses lebih banyak jobs
4. **Observable**: Track progress real-time via SSE
5. **Resilient**: Worker crash? Restart, jobs masih di queue

### Flow Singkat

```
User Click → API Enqueue → Worker Process → FAL.AI → Save Result → Notify User
   (0.2s)      (instant)      (45s)         (async)    (done!)
```

### Key Technologies

- **pg-boss**: Queue management
- **FOR UPDATE SKIP LOCKED**: Prevent race condition
- **LISTEN/NOTIFY**: Real-time events via Postgres
- **SSE**: Real-time updates ke browser
- **PM2**: Process management & auto-restart

---

Semoga jelas! 🚀 Ada pertanyaan?

