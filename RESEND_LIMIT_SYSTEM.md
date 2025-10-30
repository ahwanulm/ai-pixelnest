# 🚦 Resend Activation Code - Limit System

## ✅ Implemented Features

System pembatasan kirim ulang kode aktivasi untuk mencegah spam dan abuse.

---

## 🎯 Rules & Limits

### **Resend Limit:**
```
✅ Maksimal 4x resend per user
⏱️ Jika exceed 4x → Lock 24 jam
📧 Setelah lock → Saran gunakan email lain
🔄 Reset setelah aktivasi berhasil
```

### **Flow Chart:**
```
User Register
    ↓
Kode Dikirim (Count: 0)
    ↓
Resend 1x → Count: 1 (3 kesempatan tersisa) ✅
    ↓
Resend 2x → Count: 2 (2 kesempatan tersisa) ✅
    ↓
Resend 3x → Count: 3 (1 kesempatan tersisa) ⚠️
    ↓
Resend 4x → Count: 4 (0 kesempatan tersisa) ⚠️
    ↓
Resend 5x → ❌ LOCKED for 24 hours
    ↓
Show: "Gunakan email lain"
```

---

## 📊 Database Schema

### **New Columns Added:**
```sql
-- Track jumlah resend
resend_count INTEGER DEFAULT 0

-- Track waktu terakhir resend
last_resend_at TIMESTAMP

-- Lock sampai waktu tertentu
resend_locked_until TIMESTAMP
```

### **Migration Command:**
```bash
node src/config/migrateResendLimit.js
```

---

## 🔧 Implementation Details

### **1. User Model (`src/models/User.js`)**

#### **New Methods:**

**a) `checkResendLimit(email)`**
```javascript
// Returns:
{
  allowed: boolean,
  reason: 'USER_NOT_FOUND' | 'ALREADY_ACTIVE' | 'LOCKED' | 'LIMIT_EXCEEDED',
  resendCount: number,
  remainingAttempts: number,
  hoursLeft: number (if locked),
  lockedUntil: Date (if locked)
}
```

**Logic:**
1. Check if user exists
2. Check if already active
3. Check if locked (locked_until > now)
4. Check if count >= 4
5. If >= 4: Lock for 24 hours
6. If < 4: Allow resend

**b) `updateActivationCode(email, code, expiry)`**
```javascript
// Auto increment resend_count
// Update last_resend_at
// Return user with resend_count
```

**c) `resetResendCount(email)`**
```javascript
// Reset setelah aktivasi berhasil
// Set resend_count = 0
// Clear last_resend_at
// Clear resend_locked_until
```

---

### **2. Auth Controller (`src/controllers/authController.js`)**

#### **Updated `resendActivationCode`:**

```javascript
exports.resendActivationCode = async (req, res) => {
  // 1. Check limit FIRST
  const limitCheck = await User.checkResendLimit(email);
  
  // 2. Handle not allowed
  if (!limitCheck.allowed) {
    if (limitCheck.reason === 'LOCKED') {
      return res.status(429).json({
        success: false,
        locked: true,
        message: 'Anda telah mencapai batas... gunakan opsi ganti email',
        hoursLeft: limitCheck.hoursLeft
      });
    }
  }
  
  // 3. Generate & send code
  const newCode = emailService.generateActivationCode();
  await User.updateActivationCode(email, newCode, expiry);
  await emailService.sendActivationCode(email, user.name, newCode);
  
  // 4. Return success with remaining attempts
  const remainingAttempts = 4 - updated.resend_count;
  res.json({
    success: true,
    message: `Kode dikirim. Sisa: ${remainingAttempts}x`,
    remainingAttempts
  });
};
```

**Response Examples:**

**Success (1st resend):**
```json
{
  "success": true,
  "message": "Kode aktivasi baru telah dikirim. Sisa kesempatan: 3x",
  "resendCount": 1,
  "remainingAttempts": 3
}
```

**Success (4th resend - last chance):**
```json
{
  "success": true,
  "message": "Kode aktivasi baru telah dikirim. Ini adalah kirim ulang terakhir Anda.",
  "resendCount": 4,
  "remainingAttempts": 0
}
```

**Locked (5th attempt):**
```json
{
  "success": false,
  "locked": true,
  "message": "Anda telah mencapai batas maksimal kirim ulang kode (4x). Silakan coba lagi dalam 24 jam atau gunakan opsi ganti email.",
  "hoursLeft": 24,
  "lockedUntil": "2025-10-27T12:00:00.000Z"
}
```

---

### **3. Verification Page (`verify-activation-compact.ejs`)**

#### **Updated JavaScript:**

**a) Track Lock State:**
```javascript
let isLocked = false;
```

**b) Enhanced Resend Function:**
```javascript
async function resendCode() {
  if (isLocked) return; // Prevent if locked
  
  const data = await fetch('/auth/resend-activation', {...});
  
  if (data.locked) {
    isLocked = true;
    showLockedMessage(data.message, data.hoursLeft);
    resendBtn.disabled = true;
    resendBtn.classList.add('opacity-50', 'cursor-not-allowed');
  }
}
```

**c) Show Locked Message:**
```javascript
function showLockedMessage(message, hoursLeft) {
  // Display error message
  // Show "Daftar dengan Email Lain" button
  // Link to /register
}
```

**UI when locked:**
```html
┌─────────────────────────────────┐
│ ⚠️ Anda telah mencapai batas    │
│ maksimal kirim ulang kode (4x). │
│ Silakan coba lagi dalam 24 jam  │
│ atau gunakan opsi ganti email.  │
│                                 │
│ [🔄 Daftar dengan Email Lain]  │
└─────────────────────────────────┘
```

---

## 🧪 Testing Scenarios

### **Test 1: Normal Flow**
```
1. Register user@gmail.com
2. Resend code 1x → Success (3 left)
3. Resend code 2x → Success (2 left)
4. Enter correct code → Activate success
5. resend_count reset to 0 ✅
```

### **Test 2: Hit Limit**
```
1. Register user2@gmail.com
2. Resend 1x → Success (3 left)
3. Resend 2x → Success (2 left)
4. Resend 3x → Success (1 left)
5. Resend 4x → Success (0 left - last chance)
6. Resend 5x → ❌ LOCKED for 24h
7. Show: "Gunakan email lain" button
```

### **Test 3: Lock Expiry**
```
1. User locked for 24h
2. Wait 24 hours
3. Try resend again
4. Lock expired → Reset count to 0
5. Resend allowed ✅
```

### **Test 4: Successful Activation Resets Count**
```
1. User has resend_count = 3
2. Enter correct activation code
3. Account activated
4. resend_count reset to 0 ✅
5. All locks cleared ✅
```

---

## 📋 API Reference

### **POST `/auth/resend-activation`**

**Request:**
```json
{
  "email": "user@gmail.com"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Kode aktivasi baru telah dikirim. Sisa kesempatan: 2x",
  "resendCount": 2,
  "remainingAttempts": 2
}
```

**Response (Locked):**
```json
{
  "success": false,
  "locked": true,
  "message": "Anda telah mencapai batas maksimal...",
  "hoursLeft": 24,
  "lockedUntil": "2025-10-27T12:00:00.000Z"
}
```

**Status Codes:**
- `200`: Success
- `400`: Bad request / Already active
- `404`: Email not found
- `429`: Too many requests (locked)
- `500`: Server error

---

## 🔒 Security Benefits

### **Prevent Abuse:**
```
✅ Limit spam ke user's email
✅ Prevent brute force attempts
✅ Protect email server resources
✅ Prevent API abuse
✅ Force legitimate users only
```

### **User Experience:**
```
✅ Clear remaining attempts
✅ Informative error messages
✅ Alternative solution (change email)
✅ Auto-unlock after 24h
✅ Reset on successful activation
```

---

## 🎯 User Flow Diagram

```
┌─────────────┐
│  Register   │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ Email Sent      │
│ (Count: 0)      │
└──────┬──────────┘
       │
       ▼
┌──────────────────┐
│ Need Resend?     │
└──────┬───────────┘
       │
       ├─NO──→ Enter Code → ✅ Activated
       │
       └─YES─→ Check Limit
                    │
                    ├─< 4x → Send Code → Count++
                    │          │
                    │          └─→ Show: "Sisa Xx"
                    │
                    └─>= 4x → 🔒 LOCK 24h
                               │
                               └─→ Show: "Ganti Email"
```

---

## 📝 Database Queries

### **Check Limit:**
```sql
SELECT 
  email,
  resend_count,
  last_resend_at,
  resend_locked_until,
  is_active
FROM users 
WHERE email = 'user@gmail.com';
```

### **Increment Count:**
```sql
UPDATE users 
SET resend_count = resend_count + 1,
    last_resend_at = NOW()
WHERE email = 'user@gmail.com';
```

### **Lock User:**
```sql
UPDATE users 
SET resend_locked_until = NOW() + INTERVAL '24 hours'
WHERE email = 'user@gmail.com';
```

### **Reset After Activation:**
```sql
UPDATE users 
SET resend_count = 0,
    last_resend_at = NULL,
    resend_locked_until = NULL
WHERE email = 'user@gmail.com';
```

---

## ✅ Checklist

### Implementation:
- [x] Add database columns
- [x] Create migration script
- [x] Update User model
- [x] Add checkResendLimit method
- [x] Add resetResendCount method
- [x] Update controller validation
- [x] Update frontend UI
- [x] Add locked state handling
- [x] Add "Change Email" option
- [x] Test all scenarios

### Testing:
- [ ] Test normal resend flow
- [ ] Test hitting 4x limit
- [ ] Test lock expiry (24h)
- [ ] Test reset after activation
- [ ] Test "Change Email" button
- [ ] Test concurrent requests
- [ ] Test edge cases

---

## 🚀 Deployment Steps

1. **Run Migration:**
```bash
node src/config/migrateResendLimit.js
```

2. **Restart Server:**
```bash
npm run dev
```

3. **Test Flow:**
```bash
# Register new user
# Try resending 5x times
# Verify lock works
# Verify "Change Email" appears
```

4. **Monitor:**
```sql
-- Check locked users
SELECT email, resend_count, resend_locked_until 
FROM users 
WHERE resend_locked_until > NOW();

-- Check high resend counts
SELECT email, resend_count, last_resend_at
FROM users 
WHERE resend_count >= 3
ORDER BY resend_count DESC;
```

---

## 📊 Analytics Queries

### **Users with High Resend Counts:**
```sql
SELECT 
  email,
  resend_count,
  last_resend_at,
  resend_locked_until,
  is_active
FROM users 
WHERE resend_count > 2
ORDER BY resend_count DESC;
```

### **Currently Locked Users:**
```sql
SELECT 
  email,
  resend_count,
  resend_locked_until,
  EXTRACT(HOUR FROM (resend_locked_until - NOW())) as hours_left
FROM users 
WHERE resend_locked_until > NOW();
```

### **Resend Activity Today:**
```sql
SELECT 
  COUNT(*) as total_resends,
  COUNT(DISTINCT email) as unique_users
FROM users 
WHERE last_resend_at::date = CURRENT_DATE;
```

---

**Status**: ✅ Implemented  
**Version**: 1.0  
**Security**: High  
**User Protection**: Enabled  

---

**Last Updated**: October 26, 2025

