# 🐛 Queue System Troubleshooting

Panduan cepat untuk mengatasi masalah umum dengan queue system.

---

## ❌ Error: database "undefined" does not exist

### Gejala
```
❌ Failed to initialize pg-boss: error: database "undefined" does not exist
🗄️  Database: undefined
```

### Penyebab
Environment variables tidak terbaca dengan benar.

### Solusi

#### 1. Check file `.env` ada atau tidak

```bash
ls -la .env
```

Jika tidak ada, copy dari `.env.example`:

```bash
cp .env.example .env
```

#### 2. Edit `.env` dengan database config yang benar

```bash
nano .env
# atau
code .env
```

Isi minimal:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pixelnest_db
DB_USER=postgres
DB_PASSWORD=your_password
```

#### 3. Restart worker

```bash
npm run worker
```

### Alternative: Pakai default values

Jika tidak mau pakai .env, worker sudah punya fallback values:
- Host: `localhost`
- Port: `5432`
- Database: `pixelnest_db`
- User: `postgres`
- Password: `` (kosong)

Pastikan database `pixelnest_db` sudah ada:

```bash
# Create database jika belum ada
psql -U postgres -c "CREATE DATABASE pixelnest_db;"
```

---

## ❌ Error: role "postgres" does not exist

### Solusi

Ganti `DB_USER` di `.env` dengan user Postgres yang benar:

```bash
# Check user yang ada
psql -U postgres -c "\du"

# Atau pakai user lain
DB_USER=your_username
```

---

## ❌ Error: password authentication failed

### Solusi

1. Check password di `.env`
2. Atau reset password Postgres:

```bash
# macOS
psql -U postgres
ALTER USER postgres PASSWORD 'new_password';
```

3. Update `.env`:
```env
DB_PASSWORD=new_password
```

---

## ❌ Worker tidak process jobs

### Check 1: Worker running?

```bash
ps aux | grep worker
```

Jika tidak ada:
```bash
npm run worker
```

### Check 2: Jobs ada di queue?

**pg-boss:**
```bash
psql -U postgres -d pixelnest_db -c "SELECT COUNT(*) FROM pgboss.job WHERE state = 'created';"
```

**Custom queue:**
```bash
psql -U postgres -d pixelnest_db -c "SELECT COUNT(*) FROM job_queue WHERE status = 'pending';"
```

### Check 3: Database connection OK?

```bash
# Test connection
psql -U postgres -d pixelnest_db -c "SELECT 1;"
```

---

## ❌ Jobs stuck in 'processing'

### pg-boss (auto-retry)

Jobs akan auto-retry setelah timeout. Check settings:
- `retryLimit`: 3 (default)
- `expireInSeconds`: 1 hour (default)

### Custom queue (manual reset)

```sql
-- Reset stuck jobs
UPDATE job_queue
SET 
  status = 'pending',
  locked_by = NULL,
  locked_until = NULL
WHERE status = 'processing'
  AND locked_until < NOW();
```

---

## ❌ SSE not connecting

### Check 1: Browser console

```
Failed to connect to SSE endpoint
```

### Solusi

1. Check server running:
```bash
curl http://localhost:5005/api/sse/generation-updates
```

2. Check authentication (need login session)

3. Fallback to polling:
```javascript
queueClient.useSSE = false;
```

---

## ❌ Queue does not exist

### Error
```
Queue ai-generation does not exist
```

### Penyebab
Di pg-boss v11+, queue harus dibuat sebelum worker subscribe.

### Solusi

Queue sekarang otomatis dibuat oleh worker saat start. Jika masih error:

**Manual create queue:**
```javascript
// In worker or API
await boss.createQueue('ai-generation', {
  retryLimit: 3,
  retryDelay: 60,
  expireInSeconds: 1800
});
```

**Or send a test job (will auto-create):**
```javascript
await boss.send('ai-generation', { test: true });
```

---

## ❌ pg-boss schema errors

### Error: relation "pgboss.job" does not exist

### Solusi

pg-boss otomatis bikin tables. Jika error, manual create:

```bash
psql -U postgres -d pixelnest_db
```

```sql
-- Create pgboss schema
CREATE SCHEMA IF NOT EXISTS pgboss;

-- pg-boss will create tables automatically on first run
```

Atau reinstall pg-boss:
```bash
npm uninstall pg-boss
npm install pg-boss
```

---

## ❌ Memory leak / High memory usage

### Check memory

```bash
pm2 monit
# atau
top
```

### Solusi

1. **Limit concurrent jobs**

Edit worker:
```javascript
registerWorker('ai-generation', handler, {
  teamSize: 1,          // Reduce from 2 to 1
  teamConcurrency: 1    // Keep at 1
});
```

2. **Restart worker periodically**

PM2 config:
```javascript
{
  max_memory_restart: '1G',
  cron_restart: '0 3 * * *'  // Restart at 3 AM daily
}
```

3. **Clean up old jobs**

```sql
-- pg-boss
DELETE FROM pgboss.job 
WHERE completedon < NOW() - INTERVAL '7 days';

-- custom queue
DELETE FROM job_queue 
WHERE completed_at < NOW() - INTERVAL '7 days';
```

---

## ❌ Worker crashes immediately

### Check logs

```bash
npm run worker 2>&1 | tee worker.log
```

### Common causes

1. **Missing pg-boss package**
```bash
npm install pg-boss
```

2. **Database connection failed**
Check `.env` config

3. **Port already in use**
Check if worker already running:
```bash
ps aux | grep worker
pkill -f worker.js
```

---

## ❌ Jobs not being created

### Check API endpoint

```bash
curl -X POST http://localhost:5005/api/queue-generation/create \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION" \
  -d '{
    "prompt": "test",
    "type": "text-to-image",
    "mode": "image",
    "settings": {"modelId": 1}
  }'
```

Expected response:
```json
{
  "success": true,
  "jobId": "job_123...",
  "id": 1
}
```

### Check database

```sql
SELECT * FROM ai_generation_history 
ORDER BY created_at DESC LIMIT 5;
```

---

## 🔧 Useful Commands

### Check all processes
```bash
pm2 status
# atau
ps aux | grep -E 'worker|server'
```

### View logs
```bash
# PM2
pm2 logs

# Manual
tail -f logs/worker-error.log
tail -f logs/api-error.log
```

### Restart everything
```bash
pm2 restart all
# atau
pkill -f worker.js
pkill -f server.js
npm start &
npm run worker &
```

### Database inspection

```sql
-- pg-boss queue stats
SELECT state, COUNT(*) 
FROM pgboss.job 
GROUP BY state;

-- Custom queue stats
SELECT status, COUNT(*) 
FROM job_queue 
GROUP BY status;

-- Recent jobs
SELECT * FROM ai_generation_history 
ORDER BY created_at DESC LIMIT 10;
```

---

## 🆘 Still Having Issues?

### Debug mode

Enable verbose logging:

**worker.js:**
```javascript
console.log('Environment:', process.env);
```

**pgBossQueue.js:**
Already has debug logs. Check output:
```
📊 Database config: {...}
```

### Check versions

```bash
node --version   # Should be >= 16
npm --version
psql --version   # Should be >= 12
```

### Clean reinstall

```bash
rm -rf node_modules
rm package-lock.json
npm install
```

---

## 📋 Pre-flight Checklist

Before running worker:

- [ ] Database exists (`pixelnest_db`)
- [ ] Database user has permissions
- [ ] `.env` file exists with correct values
- [ ] `pg-boss` installed (`npm list pg-boss`)
- [ ] PostgreSQL running (`psql -U postgres -c "SELECT 1;"`)
- [ ] No other worker instances running (`ps aux | grep worker`)

---

## 🎯 Quick Fix Steps

1. **Stop everything**
```bash
pkill -f worker.js
pkill -f server.js
pm2 kill
```

2. **Check .env**
```bash
cat .env
# Atau copy dari example
cp .env.example .env
nano .env
```

3. **Test database**
```bash
psql -U postgres -d pixelnest_db -c "SELECT 1;"
```

4. **Install deps**
```bash
npm install pg-boss
```

5. **Start fresh**
```bash
npm run dev    # Terminal 1
npm run worker # Terminal 2
```

6. **Test**
```bash
# Check worker output for:
✅ pg-boss Queue initialized successfully
👷 Worker registered: ai-generation
⏳ Waiting for jobs...
```

---

## 📞 Need More Help?

1. Check main docs: `QUEUE_WORKER_GUIDE.md`
2. Check quick start: `QUEUE_QUICKSTART.md`
3. Enable debug logs in code
4. Check PostgreSQL logs
5. Check PM2 logs (`pm2 logs`)

Good luck! 🚀

