# 🚀 Queue & Worker System - Complete Implementation

## 📁 File Structure

Sistem queue sudah diimplementasikan lengkap dengan struktur berikut:

```
PIXELNEST/
├── worker.js                           # Worker entry point
├── ecosystem.config.js                 # PM2 config untuk production
│
├── src/
│   ├── queue/
│   │   ├── pgBossQueue.js             # ✅ Opsi 1: pg-boss queue manager
│   │   └── customQueue.js             # ✅ Opsi 2: Custom queue (FOR UPDATE SKIP LOCKED)
│   │
│   ├── workers/
│   │   ├── aiGenerationWorker.js      # ✅ Worker untuk pg-boss
│   │   └── customAIGenerationWorker.js # ✅ Worker untuk custom queue
│   │
│   ├── controllers/
│   │   ├── generationQueueController.js # ✅ API controller (enqueue, status, etc)
│   │   └── sseController.js            # ✅ SSE untuk real-time updates
│   │
│   └── routes/
│       ├── queueGeneration.js         # ✅ Queue generation routes
│       └── sse.js                     # ✅ SSE routes
│
├── public/js/
│   └── queueClient.js                 # ✅ Frontend client library
│
└── Documentation/
    ├── QUEUE_WORKER_GUIDE.md          # ✅ Panduan lengkap
    ├── QUEUE_QUICKSTART.md            # ✅ Quick start 5 menit
    ├── QUEUE_COMPARISON.md            # ✅ Perbandingan opsi
    └── FRONTEND_INTEGRATION_EXAMPLE.md # ✅ Contoh frontend
```

---

## ✅ What's Implemented

### Backend (Server)

1. **✅ pg-boss Queue System**
   - Full-featured queue manager
   - Auto-retry dengan exponential backoff
   - Priority queue
   - Job scheduling
   - Built-in monitoring

2. **✅ Custom Queue System**
   - Pure Postgres implementation
   - `FOR UPDATE SKIP LOCKED` untuk concurrency
   - `LISTEN/NOTIFY` untuk real-time events
   - Custom retry logic
   - Zero dependencies

3. **✅ Worker Processes**
   - Separate worker untuk AI generation
   - Support untuk pg-boss dan custom queue
   - Graceful shutdown
   - Error handling & retry

4. **✅ API Endpoints**
   - `/api/queue-generation/create` - Enqueue job
   - `/api/queue-generation/status/:jobId` - Get status
   - `/api/queue-generation/active` - Get active jobs
   - `/api/queue-generation/cancel/:jobId` - Cancel job
   - `/api/sse/generation-updates` - SSE real-time updates

5. **✅ Real-time Updates**
   - Server-Sent Events (SSE)
   - Postgres LISTEN/NOTIFY
   - Fallback polling support

### Frontend (Client)

1. **✅ Queue Client Library** (`queueClient.js`)
   - Easy-to-use API
   - SSE support
   - Polling fallback
   - Multiple job tracking
   - Auto-resume on page load

2. **✅ Example Integrations**
   - Simple generation
   - Multiple concurrent jobs
   - Resume active jobs
   - Cancel jobs
   - Browser notifications
   - Full UI components

### Documentation

1. **✅ Complete Guides**
   - Main guide dengan semua detail
   - Quick start 5 menit
   - Opsi comparison
   - Frontend examples
   - Troubleshooting

---

## 🎯 Quick Start

### Option 1: pg-boss (Recommended)

```bash
# 1. Install
npm install pg-boss

# 2. Start API
npm run dev

# 3. Start Worker (new terminal)
npm run worker

# Done! Queue is running
```

### Option 2: Custom Queue

```bash
# 1. No installation needed!

# 2. Start API
npm run dev

# 3. Start Worker (new terminal)
npm run worker:custom

# Done!
```

---

## 📖 Documentation Quick Links

1. **🚀 Start Here**: [`QUEUE_QUICKSTART.md`](./QUEUE_QUICKSTART.md)
   - 5 menit dari zero ke running

2. **📚 Full Guide**: [`QUEUE_WORKER_GUIDE.md`](./QUEUE_WORKER_GUIDE.md)
   - Complete technical documentation
   - Arsitektur detail
   - Setup production
   - Monitoring & troubleshooting

3. **⚖️ Choose Right Option**: [`QUEUE_COMPARISON.md`](./QUEUE_COMPARISON.md)
   - pg-boss vs Custom Queue
   - Feature comparison
   - Decision matrix
   - Use cases

4. **🎨 Frontend Integration**: [`FRONTEND_INTEGRATION_EXAMPLE.md`](./FRONTEND_INTEGRATION_EXAMPLE.md)
   - Code examples
   - UI components
   - Best practices

---

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start API server only
npm run worker           # Start worker (pg-boss)
npm run worker:custom    # Start worker (custom queue)
npm run dev:worker       # Start worker with auto-reload
npm run dev:all          # Start API + Worker + CSS watch

# Production
npm start                # Start API
pm2 start ecosystem.config.js  # Start all with PM2
```

---

## 🏗️ Architecture Overview

### pg-boss Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│  Frontend   │─────▶│  Express API │─────▶│  pg-boss    │
│             │      │              │      │   Queue     │
└─────────────┘      └──────────────┘      └─────────────┘
       │                                           │
       │                                           ▼
       │                                    ┌─────────────┐
       │                                    │  Postgres   │
       │                                    │  Tables     │
       │                                    └─────────────┘
       │                                           │
       │                                           ▼
       │                                    ┌─────────────┐
       │                                    │   Worker    │
       │                                    │  Process    │
       │                                    └─────────────┘
       │                                           │
       │                                           ▼
       │                                    ┌─────────────┐
       │                                    │  FAL.AI API │
       │                                    └─────────────┘
       │                                           │
       │◀──────────────────────────────────────────┘
       │            (SSE / NOTIFY)
```

### Custom Queue Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│  Frontend   │─────▶│  Express API │─────▶│ job_queue   │
│             │      │              │      │   Table     │
└─────────────┘      └──────────────┘      └─────────────┘
       │                                           │
       │                  ┌────────────────────────┤
       │                  │  FOR UPDATE            │
       │                  │  SKIP LOCKED           │
       │                  ▼                        │
       │           ┌─────────────┐                 │
       │           │   Worker    │◀────────────────┘
       │           │  Process    │
       │           └─────────────┘
       │                  │
       │                  ▼
       │           ┌─────────────┐
       │           │  FAL.AI API │
       │           └─────────────┘
       │                  │
       │◀─────────────────┘
       │   (LISTEN/NOTIFY)
```

---

## 🎯 Features Comparison

| Feature | pg-boss | Custom Queue |
|---------|---------|--------------|
| Setup Time | 5 min | 15 min |
| Dependencies | 1 package | 0 packages |
| Production Ready | ✅ Yes | ⚠️ Needs testing |
| Auto Retry | ✅ Built-in | ✅ Custom |
| Monitoring | ✅ Built-in | ⚠️ Manual |
| Real-time | ✅ Pub/Sub | ✅ LISTEN/NOTIFY |
| Flexibility | Medium | ✅ High |
| Maintenance | Low | Medium-High |

**Recommendation**: Start with **pg-boss** for faster time-to-market.

---

## 🧪 Testing

### Test Enqueue Job

```bash
curl -X POST http://localhost:5005/api/queue-generation/create \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION" \
  -d '{
    "prompt": "A beautiful sunset",
    "type": "text-to-image",
    "mode": "image",
    "settings": {"modelId": 1}
  }'
```

### Test SSE

```javascript
const eventSource = new EventSource('/api/sse/generation-updates');

eventSource.addEventListener('job-completed', (event) => {
  console.log('Completed!', JSON.parse(event.data));
});
```

### Test Polling

```bash
curl http://localhost:5005/api/queue-generation/status/job_123 \
  -H "Cookie: connect.sid=YOUR_SESSION"
```

---

## 📊 Monitoring

### pg-boss Dashboard

```sql
-- View all jobs
SELECT * FROM pgboss.job 
ORDER BY createdon DESC LIMIT 10;

-- Count by status
SELECT state, COUNT(*) 
FROM pgboss.job 
GROUP BY state;
```

### Custom Queue Dashboard

```sql
-- View all jobs
SELECT * FROM job_queue 
ORDER BY created_at DESC LIMIT 10;

-- Count by status
SELECT status, COUNT(*) 
FROM job_queue 
GROUP BY status;
```

### PM2 Monitoring

```bash
pm2 status          # View all processes
pm2 logs            # View logs
pm2 monit           # Real-time monitoring
pm2 describe worker # Detailed worker info
```

---

## 🚀 Production Deployment

### Using PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Start all processes
pm2 start ecosystem.config.js

# Save config for auto-restart on reboot
pm2 save
pm2 startup

# Monitor
pm2 monit

# View logs
pm2 logs
```

### Using Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --production

COPY . .

CMD ["node", "server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: .
    command: npm start
    ports:
      - "5005:5005"
    depends_on:
      - postgres
    environment:
      - NODE_ENV=production
  
  worker:
    build: .
    command: npm run worker
    depends_on:
      - postgres
    environment:
      - NODE_ENV=production
  
  postgres:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

---

## 🐛 Troubleshooting

### Worker tidak process jobs

```bash
# Check if worker running
ps aux | grep worker

# Check jobs in queue
# pg-boss
psql -U postgres -d pixelnest -c "SELECT COUNT(*) FROM pgboss.job WHERE state = 'created';"

# custom queue
psql -U postgres -d pixelnest -c "SELECT COUNT(*) FROM job_queue WHERE status = 'pending';"

# Restart worker
pm2 restart pixelnest-worker
```

### Jobs stuck in 'processing'

```sql
-- pg-boss: Auto-retry setelah timeout

-- Custom queue: Reset manually
UPDATE job_queue
SET status = 'pending', locked_by = NULL, locked_until = NULL
WHERE status = 'processing' AND locked_until < NOW();
```

### SSE not working

```javascript
// Check browser console for errors

// Fallback to polling
queueClient.useSSE = false;
queueClient.pollJobStatus(jobId, onUpdate, onComplete, onError);
```

---

## 📈 Performance Tips

1. **Limit concurrent workers**
   ```javascript
   { teamSize: 2, teamConcurrency: 1 }
   ```

2. **Add database indexes**
   ```sql
   CREATE INDEX idx_job_status ON job_queue(status);
   ```

3. **Clean up old jobs**
   ```sql
   DELETE FROM job_queue 
   WHERE completed_at < NOW() - INTERVAL '7 days';
   ```

4. **Monitor memory usage**
   ```bash
   pm2 monit
   ```

---

## 🎓 Next Steps

1. ✅ **Choose queue type**: pg-boss or custom
2. ✅ **Test locally**: Run worker + API
3. ✅ **Integrate frontend**: Use queueClient.js
4. ✅ **Add monitoring**: Setup PM2 or logs
5. ✅ **Deploy**: Production with PM2/Docker
6. ✅ **Scale**: Add more workers as needed

---

## 📞 Support

Jika ada pertanyaan:
1. Check documentation files
2. Review code comments
3. Check PM2/worker logs
4. Test dengan curl/Postman

**All files are ready to use!** 🚀

---

## 📝 Summary

✅ **Implemented**:
- pg-boss queue system
- Custom queue system
- Worker processes
- API endpoints
- SSE real-time updates
- Frontend client library
- Complete documentation
- Production config (PM2)

✅ **Ready for**:
- Development testing
- Production deployment
- Scaling to multiple workers
- Monitoring & debugging

**Start with**: `QUEUE_QUICKSTART.md` for 5-minute setup!

