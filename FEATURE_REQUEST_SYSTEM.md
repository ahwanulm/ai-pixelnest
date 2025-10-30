# 🚀 Feature Request System - Complete Documentation

## 📋 Overview

Sistem Feature Request memungkinkan user untuk mengajukan request AI model baru atau fitur tambahan. Admin dapat mengelola, meninjau, dan merespons semua request dari dashboard admin.

**Features:**
- ✅ User-facing request form with validation
- ✅ Rate limiting (5 requests per 24 hours)
- ✅ Admin management dashboard
- ✅ Status tracking (Pending → Under Review → Approved/Rejected → Implemented)
- ✅ Priority levels (Low, Normal, High, Urgent)
- ✅ Admin response system
- ✅ Mobile responsive design

---

## 🎯 User Features

### Accessing the Feature Request Page

**Desktop:**
- Header menu → Profile dropdown → "Request Fitur/AI Model"

**Mobile:**
- Bottom navigation → Profile → "Request Fitur/Model"

**Direct URL:** `/feature-request`

### Creating a Request

1. **Navigate to Feature Request Page**
2. **Fill out the form:**
   - **Request Type** (Required):
     - 🤖 AI Model (Image, Video, Audio, etc.)
     - ⚡ Feature (UI/UX, Tools, etc.)
     - 📝 Other
   
   - **Title** (Required):
     - Min: 5 characters
     - Max: 255 characters
     - Example: "Model AI untuk Generate Logo"
   
   - **Description** (Required):
     - Min: 20 characters
     - Jelaskan detail kebutuhan Anda
   
   - **Use Case** (Optional):
     - Contoh penggunaan konkret
     - Membantu admin memahami kebutuhan

3. **Submit Request**
   - Jika berhasil: Request masuk ke dashboard admin
   - Jika limit tercapai: Tunggu hingga reset (24 jam)

### Rate Limiting

**Rules:**
- **Limit:** 5 requests per 24 hours
- **Window:** Rolling 24-hour window
- **Reset:** Otomatis setelah 24 jam dari request pertama

**Status Badge:**
- 🟢 **Green:** Masih bisa request (3-5 sisa)
- 🟡 **Yellow:** Hampir limit (1-2 sisa)
- 🔴 **Red:** Limit tercapai (0 sisa)

### Viewing Your Requests

Di halaman Feature Request, bagian kanan menampilkan semua request Anda dengan informasi:
- Title & Description
- Request Type badge
- Status (Pending, Under Review, Approved, Rejected, Implemented)
- Created date
- Admin response (jika ada)

---

## 👨‍💼 Admin Features

### Accessing Admin Dashboard

**Via Sidebar:**
- Admin Panel → Feature Requests

**Direct URL:** `/feature-request/admin`

### Dashboard Overview

#### Statistics Cards
- **Total Requests:** Semua request yang masuk
- **Pending:** Request yang belum ditinjau
- **Under Review:** Request yang sedang ditinjau
- **Approved:** Request yang disetujui
- **Implemented:** Request yang sudah diimplementasi
- **Unique Users:** Jumlah user yang membuat request

#### Filters
- **Status Filter:**
  - All Status
  - Pending
  - Under Review
  - Approved
  - Rejected
  - Implemented

- **Type Filter:**
  - All Types
  - AI Model
  - Feature
  - Other

### Managing Requests

#### View Details
1. Click "**View**" button on any request
2. Modal akan terbuka dengan:
   - User information
   - Request type & title
   - Full description
   - Use case (jika ada)
   - Current status & priority
   - Previous admin response (jika ada)

#### Update Request
Di dalam modal, admin dapat:

1. **Update Status:**
   - ⏳ Pending (default)
   - 🔍 Under Review
   - ✅ Approved
   - ❌ Rejected
   - 🎉 Implemented

2. **Update Priority:**
   - Low
   - Normal (default)
   - High
   - Urgent

3. **Add Admin Response:**
   - Berikan feedback ke user
   - Jelaskan keputusan (approved/rejected)
   - Update progress

4. **Save Changes:**
   - Click "**Save Changes**" button
   - User akan melihat response di dashboard mereka

#### Delete Request
- Click "**Delete**" button in modal
- Confirmation dialog akan muncul
- Request akan dihapus permanent

### Pagination
- Default: 20 requests per page
- Navigate: Prev/Next buttons
- Shows: Current range & total results

---

## 🗄️ Database Schema

### Table: `feature_requests`

```sql
CREATE TABLE feature_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Request Details
    request_type VARCHAR(50) NOT NULL CHECK (request_type IN ('ai_model', 'feature', 'other')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    use_case TEXT,
    
    -- Request Status
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'implemented')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    -- Admin Response
    admin_response TEXT,
    admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    
    -- Votes/Popularity (future)
    upvotes INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT check_title_length CHECK (char_length(title) >= 5),
    CONSTRAINT check_description_length CHECK (char_length(description) >= 20)
);
```

### Table: `feature_request_rate_limits`

```sql
CREATE TABLE feature_request_rate_limits (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMP DEFAULT NOW(),
    last_request_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT unique_user_rate_limit UNIQUE (user_id)
);
```

---

## 🔌 API Endpoints

### User Endpoints

#### Get Feature Request Page
```
GET /feature-request
Auth: Required
Returns: HTML page with user's requests
```

#### Create Request
```
POST /feature-request/api/create
Auth: Required
Content-Type: application/json

Body:
{
  "request_type": "ai_model" | "feature" | "other",
  "title": "string (5-255 chars)",
  "description": "string (min 20 chars)",
  "use_case": "string (optional)"
}

Response (Success):
{
  "success": true,
  "message": "Request berhasil dibuat!",
  "request": { ... },
  "rateLimit": {
    "allowed": true,
    "count": 1,
    "remaining": 4,
    "resetTime": "2025-10-28T12:00:00Z"
  }
}

Response (Rate Limited):
{
  "success": false,
  "message": "Anda sudah mencapai batas maksimal request (5 per 24 jam). Coba lagi dalam 12 jam.",
  "rateLimit": {
    "limit": 5,
    "current": 5,
    "resetTime": "2025-10-28T12:00:00Z"
  }
}
```

#### Get My Requests
```
GET /feature-request/api/my-requests
Auth: Required

Response:
{
  "success": true,
  "requests": [ ... ]
}
```

#### Check Rate Limit
```
GET /feature-request/api/rate-limit
Auth: Required

Response:
{
  "success": true,
  "rateLimit": {
    "allowed": true,
    "count": 2,
    "remaining": 3,
    "resetTime": "2025-10-28T12:00:00Z"
  }
}
```

### Admin Endpoints

#### Get Admin Page
```
GET /feature-request/admin
Auth: Admin required
Query Params:
  - status: string (optional)
  - type: string (optional)
  - page: number (default: 1)

Returns: HTML admin dashboard
```

#### Get All Requests (API)
```
GET /feature-request/admin/api
Auth: Admin required
Query Params:
  - status: string (optional)
  - type: string (optional)
  - limit: number (default: 50)
  - offset: number (default: 0)

Response:
{
  "success": true,
  "requests": [ ... ],
  "total": 123,
  "limit": 50,
  "offset": 0
}
```

#### Get Request by ID
```
GET /feature-request/admin/api/:id
Auth: Admin required

Response:
{
  "success": true,
  "request": { ... }
}
```

#### Update Request
```
PUT /feature-request/admin/api/:id
Auth: Admin required
Content-Type: application/json

Body:
{
  "status": "pending" | "under_review" | "approved" | "rejected" | "implemented",
  "priority": "low" | "normal" | "high" | "urgent",
  "admin_response": "string"
}

Response:
{
  "success": true,
  "message": "Request berhasil diupdate",
  "request": { ... }
}
```

#### Delete Request
```
DELETE /feature-request/admin/api/:id
Auth: Admin required

Response:
{
  "success": true,
  "message": "Request berhasil dihapus"
}
```

#### Get Statistics
```
GET /feature-request/admin/api/stats
Auth: Admin required

Response:
{
  "success": true,
  "stats": {
    "total_requests": 150,
    "pending_count": 45,
    "under_review_count": 20,
    "approved_count": 50,
    "implemented_count": 25,
    "rejected_count": 10,
    "ai_model_count": 80,
    "feature_count": 60,
    "other_count": 10,
    "unique_users": 75
  }
}
```

---

## 🚦 Rate Limiting Implementation

### How It Works

1. **User creates first request:**
   - Record created in `feature_request_rate_limits`
   - `request_count = 1`
   - `window_start = NOW()`

2. **User creates subsequent requests:**
   - Check if window expired (`window_start + 24 hours < NOW()`)
   - If expired: Reset counter to 0
   - If not expired: Check if `request_count < 5`
   - If under limit: Allow & increment counter
   - If at limit: Return 429 error

3. **Window resets:**
   - Automatically after 24 hours
   - Counter resets to 0
   - User can make new requests

### Configuration

**Current Settings:**
```javascript
const MAX_REQUESTS_PER_DAY = 5;
const WINDOW_HOURS = 24;
```

**To Change Limit:**
Edit `/src/models/FeatureRequest.js`:
```javascript
async checkRateLimit(userId) {
  const MAX_REQUESTS_PER_DAY = 10; // Change here
  const WINDOW_HOURS = 24;
  // ...
}
```

---

## 📂 File Structure

```
PIXELNEST/
├── migrations/
│   └── 20251027_create_feature_requests.sql    # Database migration
├── src/
│   ├── models/
│   │   └── FeatureRequest.js                   # Model with rate limiting
│   ├── controllers/
│   │   └── featureRequestController.js         # User & admin endpoints
│   ├── routes/
│   │   └── featureRequest.js                   # Route definitions
│   └── views/
│       ├── auth/
│       │   └── feature-request.ejs             # User page
│       └── admin/
│           └── feature-requests.ejs            # Admin page
├── server.js                                    # Route registration
└── FEATURE_REQUEST_SYSTEM.md                   # This file
```

---

## 🚀 Setup Instructions

### 1. Run Database Migration

```bash
psql -U your_username -d pixelnest_db -f migrations/20251027_create_feature_requests.sql
```

Or via migration script if you have one.

### 2. Verify Tables Created

```sql
-- Check tables exist
SELECT tablename FROM pg_tables 
WHERE tablename IN ('feature_requests', 'feature_request_rate_limits');

-- Check structure
\d feature_requests
\d feature_request_rate_limits
```

### 3. Restart Server

```bash
npm start
# or
pm2 restart pixelnest
```

### 4. Test User Flow

1. Login sebagai user
2. Navigate to `/feature-request`
3. Create a test request
4. Verify rate limit badge updates
5. Create 5 requests to test limit

### 5. Test Admin Flow

1. Login sebagai admin
2. Navigate to `/feature-request/admin`
3. View statistics
4. Click "View" on a request
5. Update status & add response
6. Verify changes saved

---

## 🎨 UI/UX Design

### User Page

- **Color Scheme:**
  - Background: Dark (#0a0a0a)
  - Cards: Glass morphism effect
  - Accents: Purple/Pink gradient

- **Layout:**
  - Desktop: 2-column grid (Form | Request List)
  - Mobile: Single column, stacked

- **Rate Limit Badge:**
  - Green: 3-5 remaining
  - Yellow: 1-2 remaining
  - Red: 0 remaining (blocked)

### Admin Page

- **Color Scheme:**
  - Matches admin panel theme
  - Status badges: Color-coded

- **Layout:**
  - Statistics cards at top
  - Filters bar
  - Table with pagination

- **Modal:**
  - Overlay with backdrop blur
  - Full request details
  - Inline editing

---

## 🔒 Security

### Authentication
- All routes require authentication
- Admin routes require `is_admin = true`
- Middleware: `ensureAuthenticated`, `ensureAdmin`

### Authorization
- Users can only view their own requests
- Admin can view all requests
- Rate limiting prevents abuse

### Validation
- Input sanitization
- Length constraints (database level)
- Type validation (ENUM constraints)

### SQL Injection Prevention
- Parameterized queries only
- No string concatenation
- PostgreSQL prepared statements

---

## 📊 Monitoring

### Admin Queries

**Users hitting rate limit:**
```sql
SELECT 
  u.name,
  u.email,
  frl.request_count,
  frl.window_start,
  frl.last_request_at
FROM feature_request_rate_limits frl
JOIN users u ON frl.user_id = u.id
WHERE frl.request_count >= 5
  AND frl.window_start + INTERVAL '24 hours' > NOW()
ORDER BY frl.last_request_at DESC;
```

**Most requested types:**
```sql
SELECT 
  request_type,
  COUNT(*) as count
FROM feature_requests
GROUP BY request_type
ORDER BY count DESC;
```

**Requests by status:**
```sql
SELECT 
  status,
  COUNT(*) as count
FROM feature_requests
GROUP BY status
ORDER BY count DESC;
```

**Top users by requests:**
```sql
SELECT 
  u.name,
  u.email,
  COUNT(fr.id) as request_count
FROM users u
JOIN feature_requests fr ON u.id = fr.user_id
GROUP BY u.id, u.name, u.email
ORDER BY request_count DESC
LIMIT 10;
```

---

## 🆕 Future Enhancements

### Planned Features

1. **Voting System:**
   - Users can upvote requests
   - Sort by popularity
   - Trending requests section

2. **Request Comments:**
   - Discussion thread per request
   - Admin can ask for clarification
   - User can provide updates

3. **Email Notifications:**
   - Status change notifications
   - Admin response alerts
   - Weekly digest for admins

4. **Public Request Board:**
   - View all approved requests (public)
   - Roadmap page
   - Community voting

5. **Integration with GitHub:**
   - Auto-create GitHub issues
   - Sync status updates
   - Link to commits/PRs

6. **Analytics:**
   - Request trends over time
   - User engagement metrics
   - Implementation time tracking

---

## 🐛 Troubleshooting

### Request Creation Fails

**Symptom:** "Terjadi kesalahan saat membuat request"

**Solutions:**
1. Check database connection
2. Verify tables exist
3. Check server logs for errors
4. Ensure user is authenticated

### Rate Limit Not Working

**Symptom:** User can create more than 5 requests

**Solutions:**
1. Check `feature_request_rate_limits` table exists
2. Verify `checkRateLimit()` is called before creation
3. Check for race conditions (multiple simultaneous requests)
4. Review rate limit logic in model

### Admin Page Not Loading

**Symptom:** 403 or 500 error

**Solutions:**
1. Verify user has `is_admin = true`
2. Check route registration in `server.js`
3. Ensure middleware order is correct
4. Check database query syntax

---

## 📞 Support

For issues or questions:
- Check this documentation
- Review server logs
- Test in development environment
- Contact system administrator

---

## ✅ Checklist for Deployment

- [ ] Database migration executed
- [ ] Tables created and verified
- [ ] Server restarted
- [ ] User flow tested
- [ ] Admin flow tested
- [ ] Rate limiting verified
- [ ] Mobile responsiveness checked
- [ ] Navigation links working
- [ ] API endpoints tested
- [ ] Error handling verified

---

**Last Updated:** October 27, 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready

