# 👨‍💼 Admin Jobs Management - Complete Guide

> **Admin panel untuk monitoring dan mengelola semua generation jobs**

---

## ✨ Features

### 📊 Dashboard Statistics
- **Real-time Stats** - Pending, Processing, Completed, Failed
- **Hourly & Daily Trends** - Jobs dalam 1 jam & 24 jam terakhir
- **Type Breakdown** - Image, Video, Audio statistics
- **Credits Usage** - Total credits digunakan per status
- **Stuck Jobs Alert** - Warning untuk jobs yang expired

### 🔍 Jobs Management
- **View All Jobs** - List semua generation jobs dengan detail
- **Filter** - By status (pending/processing/completed/failed)
- **Search** - By job ID atau prompt
- **Pagination** - Navigate large datasets
- **Real-time Updates** - Auto-refresh untuk active jobs

### 🛠️ Actions
- **View Details** - Full job information modal
- **Cancel Job** - Cancel pending/processing jobs
- **Delete Job** - Remove job dari database
- **Bulk Cancel** - Cancel multiple jobs sekaligus
- **Bulk Delete** - Delete multiple jobs sekaligus
- **Run Cleanup** - Manual trigger cleanup expired jobs

### 📈 Monitoring
- **Job Progress** - Real-time progress bar
- **Time Tracking** - Elapsed time untuk active jobs
- **Error Messages** - View error details untuk failed jobs
- **User Information** - Who initiated each job
- **Resource Usage** - Credits cost tracking

---

## 🚀 Quick Start

### Access Admin Panel

```
URL: https://your-domain.com/admin/jobs
```

**Requirements:**
- ✅ Admin access
- ✅ Authenticated session

### Navigation

```
Admin Panel > Sidebar > "Generation Jobs"
```

---

## 📋 Page Layout

### Header Section
```
┌─────────────────────────────────────────────┐
│ 📊 Generation Jobs Management              │
│                                 [Cleanup] [Refresh]  │
└─────────────────────────────────────────────┘
```

### Statistics Cards (Top Row)
```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Pending  │ │Processing│ │Completed │ │ Failed   │
│   12     │ │    5     │ │  1,234   │ │   23     │
│ +3 (1h)  │ │ +2 (1h)  │ │ +145(24h)│ │ +5 (24h) │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

### Type Statistics
```
┌─────────────────────────────────────────────┐
│ Jobs by Type                                │
│ ┌───────────┬───────────┬───────────┐      │
│ │  Image    │  Video    │  Audio    │      │
│ │  500      │  400      │  200      │      │
│ │  ✓ 480    │  ✓ 380   │  ✓ 190   │      │
│ │  ✗ 20     │  ✗ 20    │  ✗ 10    │      │
│ └───────────┴───────────┴───────────┘      │
└─────────────────────────────────────────────┘
```

### Filters
```
┌─────────────────────────────────────────────┐
│ [Status: All ▼] [Type: All ▼] [Search...]  │
│                         [Filter] [Reset]    │
└─────────────────────────────────────────────┘
```

### Jobs Table
```
┌──┬────────┬──────┬──────┬────────┬────────┬─────────┬──────┬────────┬─────────┐
│☑ │Job ID  │ User │ Type │ Prompt │ Status │Progress │ Time │Credits │ Actions │
├──┼────────┼──────┼──────┼────────┼────────┼─────────┼──────┼────────┼─────────┤
│☑ │job_123 │ john │image │ "cat"  │Pending │ 0%      │ 2m   │  5     │ 👁️ ❌ 🗑️ │
│☑ │job_456 │ jane │video │ "dog"  │Process │ 45%     │ 5m   │  10    │ 👁️ ❌ 🗑️ │
└──┴────────┴──────┴──────┴────────┴────────┴─────────┴──────┴────────┴─────────┘
```

---

## 🎯 Use Cases

### Scenario 1: Monitor Active Jobs

**Goal:** Check berapa jobs yang sedang berjalan

**Steps:**
1. Go to Admin Panel → Jobs
2. Look at statistics cards (top row)
3. See "Processing" count
4. Filter by status "processing" for details

**Result:**
```
✅ See all active jobs
✅ Monitor progress in real-time
✅ Identify slow/stuck jobs
```

### Scenario 2: Handle Stuck Jobs

**Goal:** Worker crash, ada jobs stuck di processing

**Steps:**
1. Notice alert banner: "⚠️ 5 processing jobs stuck > 15 min"
2. Click "Run cleanup now"
3. Confirm cleanup
4. Jobs marked as failed automatically

**Result:**
```
✅ Stuck jobs cleaned up
✅ Database clean
✅ Credits refunded (if applicable)
```

### Scenario 3: Investigate Failed Jobs

**Goal:** User complain generation failed, cari tau kenapa

**Steps:**
1. Filter by status: "Failed"
2. Search user's email or prompt
3. Click "View Details" icon (👁️)
4. See error message in modal

**Result:**
```
✅ Found specific failed job
✅ Read error message
✅ Identify root cause
✅ Take corrective action
```

### Scenario 4: Bulk Cleanup

**Goal:** Remove test jobs dari development

**Steps:**
1. Filter by user (test account)
2. Select multiple jobs (checkbox)
3. Click "Delete Selected"
4. Confirm deletion

**Result:**
```
✅ Multiple jobs deleted at once
✅ Database cleaned
✅ Efficient cleanup
```

---

## 🛠️ API Endpoints

### GET /admin/jobs
Show jobs management page

**Query Params:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)
- `status` - Filter by status (all/pending/processing/completed/failed)
- `type` - Filter by type (all/image/video/audio)
- `search` - Search by job ID or prompt

**Example:**
```
GET /admin/jobs?page=1&status=pending&type=image&search=cat
```

### GET /admin/api/jobs/:id
Get job details (AJAX)

**Response:**
```json
{
  "success": true,
  "job": {
    "id": 123,
    "job_id": "job_1234567890_abc",
    "user_id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "generation_type": "image",
    "sub_type": "text-to-image",
    "prompt": "a cute cat",
    "status": "completed",
    "progress": 100,
    "result_url": "/images/user_1/abc123.png",
    "credits_cost": 5,
    "started_at": "2025-10-27T10:00:00Z",
    "completed_at": "2025-10-27T10:01:30Z",
    "minutes_elapsed": 1.5,
    "settings": {...}
  }
}
```

### POST /admin/api/jobs/:id/cancel
Cancel a job

**Response:**
```json
{
  "success": true,
  "message": "Job cancelled successfully"
}
```

### DELETE /admin/api/jobs/:id
Delete a job

**Response:**
```json
{
  "success": true,
  "message": "Job deleted successfully"
}
```

### POST /admin/api/jobs/bulk-cancel
Cancel multiple jobs

**Request:**
```json
{
  "ids": [1, 2, 3, 4, 5]
}
```

**Response:**
```json
{
  "success": true,
  "message": "5 job(s) cancelled successfully",
  "count": 5
}
```

### POST /admin/api/jobs/bulk-delete
Delete multiple jobs

**Request:**
```json
{
  "ids": [1, 2, 3, 4, 5]
}
```

**Response:**
```json
{
  "success": true,
  "message": "5 job(s) deleted successfully",
  "count": 5
}
```

### POST /admin/api/jobs/cleanup
Manual cleanup trigger

**Query Params:**
- `dryRun=true` - Preview without changes

**Response:**
```json
{
  "success": true,
  "message": "Cleanup completed successfully",
  "output": "... cleanup log output ..."
}
```

### GET /admin/api/jobs/statistics
Get statistics (AJAX)

**Response:**
```json
{
  "success": true,
  "statistics": {
    "total_jobs": 1000,
    "pending": 10,
    "processing": 5,
    "completed": 950,
    "failed": 35,
    "last_hour": 45,
    "last_24h": 234,
    "total_credits_used": 5000,
    "avg_processing_time": 45.5
  }
}
```

---

## 📊 Database Schema

### Jobs Table Query

```sql
SELECT 
  g.id,
  g.job_id,
  g.user_id,
  g.generation_type,
  g.sub_type,
  g.prompt,
  g.result_url,
  g.status,
  g.progress,
  g.credits_cost,
  g.error_message,
  g.started_at,
  g.completed_at,
  u.username,
  u.email,
  EXTRACT(EPOCH FROM (NOW() - g.started_at))/60 as minutes_elapsed
FROM ai_generation_history g
LEFT JOIN users u ON g.user_id = u.id
ORDER BY g.started_at DESC;
```

---

## 🔧 Configuration

### Auto-Refresh

Page auto-refreshes setiap 30 detik jika ada active jobs:

```javascript
// In jobs.ejs
<% if (jobs.some(j => ['pending', 'processing'].includes(j.status))) { %>
  setTimeout(() => location.reload(), 30000);
<% } %>
```

### Pagination Settings

Default: 50 jobs per page

Change in URL:
```
?limit=100  // Show 100 jobs per page
```

### Timeouts (for Cleanup)

Defined in `/src/scripts/cleanupExpiredJobs.js`:

```javascript
const TIMEOUTS = {
  PENDING: 30,      // 30 minutes
  PROCESSING: 15,   // 15 minutes
  ORPHAN: 60        // 60 minutes
};
```

---

## 🚨 Alerts & Notifications

### Stuck Jobs Alert

Muncul di top page jika ada stuck jobs:

**Conditions:**
- Pending > 30 minutes
- Processing > 15 minutes

**Alert Example:**
```
⚠️ Stuck Jobs Detected!
5 pending job(s) stuck for > 30 minutes. 
3 processing job(s) stuck for > 15 minutes.
[Run cleanup now]
```

---

## 🎨 UI Features

### Status Badges

```css
.status-pending    → Yellow (⏳ waiting)
.status-processing → Blue   (⚙️ working)
.status-completed  → Green  (✅ done)
.status-failed     → Red    (❌ error)
.status-cancelled  → Gray   (🚫 stopped)
```

### Progress Bar

For pending/processing jobs:
```html
<div class="progress-bar">
  <div style="width: 45%"></div>
</div>
```

### Interactive Elements

- **Hover Effect** - Rows highlight on hover
- **Click Actions** - View, Cancel, Delete buttons
- **Checkboxes** - Bulk selection
- **Modal** - Job details popup
- **Copy Button** - Copy job ID to clipboard

---

## 📝 Activity Logging

All actions logged ke admin_activity_logs:

```sql
INSERT INTO admin_activity_logs (
  admin_id,
  action_type,
  action_details,
  ip_address,
  created_at
) VALUES (
  1,
  'cancel_job',
  '{"job_id": "job_123", "user_id": 5}',
  '127.0.0.1',
  NOW()
);
```

**Action Types:**
- `cancel_job` - Single job cancelled
- `delete_job` - Single job deleted
- `bulk_cancel_jobs` - Multiple jobs cancelled
- `bulk_delete_jobs` - Multiple jobs deleted
- `run_cleanup` - Manual cleanup triggered

---

## 🔐 Security

### Access Control

```javascript
// Middleware: ensureAdmin
router.use(ensureAdmin);
```

Only admins can access jobs management.

### CSRF Protection

Forms use Express session protection.

### Activity Logging

All actions logged with:
- Admin ID
- Timestamp
- IP Address
- Action details

---

## 📈 Performance

### Query Optimization

- **Indexes** - job_id, status, user_id, started_at
- **Pagination** - LIMIT/OFFSET queries
- **Filtering** - WHERE clauses untuk reduce dataset

### Caching

- **Static Assets** - CSS/JS cached
- **Auto-Refresh** - Only when needed (active jobs)

### Database Impact

- **Read-heavy** - SELECT queries only
- **No Locks** - Read operations don't block writes
- **Fast Queries** - < 100ms avg

---

## 🐛 Troubleshooting

### Problem: Jobs tidak muncul

**Check:**
1. Database connection OK?
2. User has jobs?
3. Filter settings correct?
4. Migration run (job_id column exists)?

**Solution:**
```bash
# Check database
psql -U postgres -d pixelnest_db
SELECT COUNT(*) FROM ai_generation_history;

# Run migration if needed
npm run migrate:fix-schema
```

### Problem: Cleanup tidak jalan

**Check:**
1. Worker running?
2. Cleanup script exists?
3. Database permissions OK?

**Solution:**
```bash
# Manual cleanup
npm run cleanup:jobs

# Check worker status
ps aux | grep worker
```

### Problem: Bulk actions tidak work

**Check:**
1. JavaScript errors in console?
2. Jobs selected (checkbox)?
3. Network requests OK?

**Solution:**
```javascript
// Check browser console
// Should see: "POST /admin/api/jobs/bulk-cancel"
```

---

## 📚 Related Documentation

- **Cleanup Guide:** `/JOBS_CLEANUP_GUIDE.md`
- **Persistence Fix:** `/PERSISTENCE_FIX_SUMMARY.md`
- **Database Schema:** `/FIX_DATABASE_SCHEMA.md`
- **Worker Guide:** `/QUEUE_WORKER_GUIDE.md`

---

## ✅ Summary

**Features:**
- ✅ Complete jobs monitoring
- ✅ Filter & search
- ✅ Bulk operations
- ✅ Real-time updates
- ✅ Manual cleanup
- ✅ Detailed statistics
- ✅ Activity logging
- ✅ Mobile responsive

**Benefits:**
- 👁️ **Visibility** - See all generation jobs
- ⚙️ **Control** - Cancel, delete, cleanup
- 📊 **Insights** - Statistics & trends
- 🛡️ **Safety** - Activity logs & permissions
- 🚀 **Performance** - Optimized queries
- 🎯 **User-friendly** - Intuitive UI

---

**Status:** ✅ READY FOR PRODUCTION

**Files:**
- Controller: `/src/controllers/adminJobsController.js`
- Routes: `/src/routes/admin.js` (lines 99-108)
- View: `/src/views/admin/jobs.ejs`
- Sidebar: `/src/views/partials/admin-sidebar.ejs` (line 37-39)

**Access:**
```
https://your-domain.com/admin/jobs
```

