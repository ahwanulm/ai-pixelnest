# 🔍 Quick Debug: Pending Transaction Limit

## ❓ Problem: "Pending limit masih belum bekerja"

### 🧪 Step 1: Check if Server is Running

```bash
# Make sure server is running
npm start

# Or check if process exists
ps aux | grep node
```

**Expected:** Server should be running on port 5005

---

### 🧪 Step 2: Test API Endpoint Directly

Open your browser and:

1. **Login to dashboard** first
2. **Open DevTools** (F12 or right-click -> Inspect)
3. **Go to Console tab**
4. **Run this command:**

```javascript
// Test the API endpoint
fetch('/api/payment/check-pending')
  .then(res => res.json())
  .then(data => {
    console.log('✅ API Response:', data);
    console.log('Pending Count:', data.pending_count);
    console.log('Can Create New:', data.can_create_new);
  })
  .catch(err => console.error('❌ API Error:', err));
```

**Expected response:**
```json
{
  "success": true,
  "pending_count": 0,
  "can_create_new": true,
  "earliest_expiry": null,
  "time_remaining": "",
  "transactions": [],
  "message": "Tidak ada transaksi pending"
}
```

---

### 🧪 Step 3: Check Database for Pending Transactions

```bash
# Run the check script
psql -U ahwanulm -d pixelnest_db -f check-pending-transactions.sql
```

Or manually:

```sql
-- Check pending transactions count
SELECT 
  COUNT(*) as pending_count,
  user_id
FROM payment_transactions 
WHERE status = 'PENDING'
  AND expired_time > NOW()
GROUP BY user_id;
```

---

### 🧪 Step 4: Test the Feature Manually

#### Test 4A: With 0 Pending Transactions

1. Login to dashboard
2. Open browser console (F12)
3. Click "Top Up" button
4. **Check console logs:**
   ```
   🔍 Checking pending transactions...
   📡 Response status: 200
   📊 Pending data: {pending_count: 0, can_create_new: true, ...}
   ✅ Opening top-up modal
   ```
5. **Result:** Modal should open normally ✅

---

#### Test 4B: With 1-2 Pending Transactions

**First, create 2 pending transactions:**
1. Top up Rp 20.000 (don't pay)
2. Top up Rp 40.000 (don't pay)

**Then test:**
1. Refresh dashboard
2. Click "Top Up" button
3. **Check console logs:**
   ```
   🔍 Checking pending transactions...
   📡 Response status: 200
   📊 Pending data: {pending_count: 2, can_create_new: true, ...}
   ℹ️ User has pending, showing info: 2
   ✅ Opening top-up modal
   ```
4. **Result:** Should see yellow toast notification ℹ️ AND modal opens ✅

---

#### Test 4C: With 3 Pending Transactions (BLOCKED)

**First, create 3 pending transactions:**
1. Top up Rp 20.000 (don't pay)
2. Top up Rp 40.000 (don't pay)
3. Top up Rp 100.000 (don't pay)

**Then test:**
1. Refresh dashboard
2. Click "Top Up" button
3. **Check console logs:**
   ```
   🔍 Checking pending transactions...
   📡 Response status: 200
   📊 Pending data: {pending_count: 3, can_create_new: false, ...}
   ⛔ User blocked - showing warning
   ```
4. **Result:** Should see RED warning modal ⚠️ Modal should NOT open ❌

---

### 🐛 Common Issues & Fixes

#### Issue 1: API Returns 404 (Not Found)

**Symptom:**
```
❌ API error: 404 Not Found
```

**Fix:**
```bash
# 1. Check if route is registered
grep "check-pending" src/routes/payment.js

# Should see:
# router.get('/check-pending', ensureAuthenticated, paymentController.checkPendingTransactions);

# 2. Restart server
npm start
```

---

#### Issue 2: API Returns 500 (Server Error)

**Symptom:**
```
❌ API error: 500 Internal Server Error
```

**Fix:**
```bash
# 1. Check server logs for error details
# Look for errors in terminal where npm start is running

# 2. Check if function exists in controller
grep "checkPendingTransactions" src/controllers/paymentController.js

# 3. Check database connection
psql -U ahwanulm -d pixelnest_db -c "SELECT 1"
```

---

#### Issue 3: Function Not Defined

**Symptom:**
```
dashboard:xxx Uncaught ReferenceError: openTopUpModal is not defined
```

**Fix:**
- Hard refresh browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Clear browser cache
- Check if `openTopUpModal` is defined in dashboard.ejs

---

#### Issue 4: Modal Opens But No Check Happens

**Symptom:**
- No console logs appear
- Modal opens immediately

**Fix:**
```javascript
// Check if openTopUpModal is async
// It should be: async function openTopUpModal() {

// If not, update it to async:
async function openTopUpModal() {
  // ... check pending logic
}
```

---

#### Issue 5: Database Shows Pending But API Says 0

**Symptom:**
```sql
SELECT COUNT(*) FROM payment_transactions WHERE status = 'PENDING';
-- Returns: 5

But API says: pending_count: 0
```

**Cause:** Transactions are expired but status not updated

**Fix:**
```sql
-- Update expired transactions
UPDATE payment_transactions 
SET status = 'EXPIRED'
WHERE status = 'PENDING' 
  AND expired_time < NOW();

-- Check again
SELECT COUNT(*) 
FROM payment_transactions 
WHERE status = 'PENDING' 
  AND expired_time > NOW();
-- Should match API now
```

---

### 🔧 Quick Fixes Collection

#### Fix 1: Force Clean Expired Transactions
```sql
UPDATE payment_transactions 
SET status = 'EXPIRED'
WHERE status = 'PENDING' 
  AND expired_time < NOW();
```

#### Fix 2: Manually Test with User ID
```sql
-- Check specific user's pending count
SELECT COUNT(*) 
FROM payment_transactions 
WHERE user_id = 1  -- Replace with your user ID
  AND status = 'PENDING' 
  AND expired_time > NOW();
```

#### Fix 3: Create Test Pending Transaction
```sql
-- Insert test pending transaction (expires in 1 hour)
INSERT INTO payment_transactions (
  user_id, reference, merchant_ref, payment_method, payment_name,
  amount, credits_amount, status, expired_time, created_at
) VALUES (
  1,  -- Replace with your user ID
  'TEST-' || floor(random() * 1000000),
  'MERCH-' || floor(random() * 1000000),
  'QRIS',
  'QRIS',
  20000,
  10,
  'PENDING',
  NOW() + INTERVAL '1 hour',
  NOW()
);
```

---

### ✅ Success Checklist

When everything works correctly:

- [ ] API endpoint `/api/payment/check-pending` returns 200
- [ ] Response includes `pending_count`, `can_create_new`, etc.
- [ ] Console shows debug logs when clicking "Top Up"
- [ ] With 0 pending: Modal opens normally
- [ ] With 1-2 pending: Yellow toast shows, modal opens
- [ ] With 3 pending: Red warning modal shows, no top-up modal
- [ ] Database query matches API response
- [ ] Time remaining is calculated correctly

---

### 📞 Still Not Working?

If you've tried all the above and it still doesn't work:

1. **Check the files were actually modified:**
   ```bash
   # Check if checkPendingTransactions exists
   grep -n "checkPendingTransactions" src/controllers/paymentController.js
   
   # Check if route exists
   grep -n "check-pending" src/routes/payment.js
   
   # Check if frontend updated
   grep -n "showPendingWarning" src/views/auth/dashboard.ejs
   ```

2. **Restart everything:**
   ```bash
   # Kill server
   pkill -f node
   
   # Clear cache
   rm -rf node_modules/.cache
   
   # Restart
   npm start
   ```

3. **Check browser:**
   - Clear all cookies and cache
   - Hard refresh: `Ctrl+Shift+R` or `Cmd+Shift+R`
   - Try incognito/private mode

4. **Check what error you're seeing:**
   - Browser console errors?
   - Server terminal errors?
   - Database errors?
   - Network errors in DevTools Network tab?

---

### 🎯 Quick Test Command

Run this in browser console after login:

```javascript
// Quick test function
async function testPendingLimit() {
  console.log('🧪 Testing Pending Limit Feature...');
  
  // Test 1: Check API
  const res = await fetch('/api/payment/check-pending');
  const data = await res.json();
  
  console.log('📊 Status:', res.status);
  console.log('📊 Data:', data);
  
  if (res.status === 200) {
    console.log('✅ API Works!');
    console.log(`   Pending: ${data.pending_count}`);
    console.log(`   Can create: ${data.can_create_new}`);
    
    if (data.pending_count >= 3) {
      console.log('⛔ User should be BLOCKED');
    } else {
      console.log('✅ User can create transactions');
    }
  } else {
    console.log('❌ API Failed!');
  }
}

// Run it
testPendingLimit();
```

---

**Last Updated:** October 26, 2025  
**Status:** Debugging Guide Ready

---

## 📝 Report Back

After testing, report what you see:

1. **What's the API response status?** (200, 404, 500, etc.)
2. **What's the pending_count?**
3. **Do you see console logs?**
4. **What happens when you click Top Up?**
5. **Any errors in browser console?**
6. **Any errors in server terminal?**

This will help diagnose the exact issue! 🎯

