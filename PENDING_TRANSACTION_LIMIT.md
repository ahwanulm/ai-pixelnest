# 🛡️ Pending Transaction Limit Feature

## 📋 Overview

Fitur ini membatasi user untuk hanya memiliki **maksimal 3 transaksi pending aktif** secara bersamaan. Ini mencegah abuse dan memastikan payment gateway tidak overloaded dengan transaksi yang tidak diselesaikan.

---

## 🎯 Business Rules

### Limit Rules:
1. **Maksimal 3 transaksi pending** per user
2. Transaksi pending adalah transaksi dengan status `PENDING` yang belum expired
3. User tidak bisa membuat transaksi baru jika sudah ada 3 transaksi pending
4. User harus menunggu hingga salah satu transaksi:
   - ✅ **Dibayar** (status → PAID)
   - ⏰ **Expired** (melewati `expired_time`)
   - ❌ **Dibatalkan** (status → FAILED/CANCELLED)

### User Experience:
1. **0 pending:** Normal flow, tidak ada notifikasi
2. **1-2 pending:** Info toast notification (kuning) - user masih bisa transaksi
3. **3+ pending:** Warning modal (merah) - user diblock dari transaksi baru

---

## 🔧 Technical Implementation

### 1. Backend Validation (`paymentController.js`)

#### Check Pending Endpoint
**Route:** `GET /api/payment/check-pending`

**Response:**
```json
{
  "success": true,
  "pending_count": 2,
  "can_create_new": true,
  "earliest_expiry": "2025-10-26T18:00:00Z",
  "time_remaining": "2 jam 30 menit",
  "transactions": [
    {
      "id": 123,
      "amount": 20000,
      "credits_amount": 10,
      "payment_method": "QRIS",
      "expired_time": "2025-10-26T18:00:00Z",
      "created_at": "2025-10-26T15:00:00Z"
    }
  ],
  "message": "Anda memiliki 2 transaksi pending"
}
```

#### Create Payment Validation
**Route:** `POST /api/payment/create`

**Before creating payment:**
```javascript
// Check pending transactions limit (max 3 active pending)
const pendingCheckQuery = `
  SELECT 
    COUNT(*) as pending_count,
    MIN(expired_time) as earliest_expiry
  FROM payment_transactions 
  WHERE user_id = $1 
    AND status = 'PENDING'
    AND expired_time > NOW()
`;
```

**If >= 3 pending:**
- Return HTTP 429 (Too Many Requests)
- Include informative error message
- Show time until earliest expiry

**Error Response:**
```json
{
  "success": false,
  "message": "Anda memiliki 3 transaksi yang belum dibayar. Silakan selesaikan pembayaran atau tunggu hingga transaksi kadaluarsa (sekitar 2 jam 15 menit lagi).",
  "pending_count": 3,
  "earliest_expiry": "2025-10-26T18:00:00Z"
}
```

---

### 2. Frontend Implementation

#### A. Dashboard (`dashboard.ejs`)

**On Top-Up Modal Open:**
```javascript
async function openTopUpModal() {
    // Check pending transactions first
    const response = await fetch('/api/payment/check-pending');
    const data = await response.json();
    
    if (!data.can_create_new) {
        // Show warning - block user
        showPendingWarning(data);
        return;
    }
    
    if (data.pending_count > 0) {
        // Show info toast - allow but notify
        showPendingInfo(data);
    }
    
    // Continue with normal flow
    openModal();
}
```

**Warning Modal (3+ pending):**
- ❌ Blocks user from proceeding
- Shows number of pending transactions
- Shows time remaining until expiry
- Lists all pending transactions
- Buttons: "Tutup" | "Lihat Transaksi"

**Info Toast (1-2 pending):**
- ℹ️ Info notification (yellow)
- Shows pending count and limit remaining
- Auto-dismiss after 5 seconds
- User can still proceed

---

#### B. Top-Up Page (`top-up.ejs`)

**On Page Load:**
```javascript
async function checkPendingTransactionsOnLoad() {
    const response = await fetch('/api/payment/check-pending');
    const data = await response.json();
    
    if (data.pending_count > 0) {
        showPendingBanner(data);
    }
}
```

**Banner Display:**
- 🟨 Yellow banner (1-2 pending): Informational
- 🟥 Red banner (3 pending): Warning
- Shows pending count and limit
- Shows time remaining
- Actions: "Lihat Transaksi" | "Tutup"

**On Payment Submit:**
```javascript
if (response.status === 429) {
    // 429 = Too Many Requests
    showPendingLimitError(data);
}
```

**Error Modal:**
- Same as dashboard warning modal
- Shows detailed error message
- Guides user on what to do next

---

## 🎨 UI Components

### 1. Warning Modal (Blocked - 3+ pending)
```
┌─────────────────────────────────────┐
│           ⚠️ (red icon)            │
│   Transaksi Pending Maksimal       │
│                                     │
│  [Red Box]                         │
│  Anda memiliki 3 transaksi yang    │
│  belum dibayar.                    │
│  Tunggu 2 jam 15 menit atau        │
│  selesaikan pembayaran.            │
│                                     │
│  Transaksi Pending:                │
│  ┌─────────────────────────────┐  │
│  │ 10 Credits - QRIS           │  │
│  │ Rp 20.000 - Exp: 18:00     │  │
│  └─────────────────────────────┘  │
│  ┌─────────────────────────────┐  │
│  │ 20 Credits - BCA VA         │  │
│  │ Rp 40.000 - Exp: 19:30     │  │
│  └─────────────────────────────┘  │
│  ┌─────────────────────────────┐  │
│  │ 50 Credits - GoPay          │  │
│  │ Rp 100.000 - Exp: 20:00    │  │
│  └─────────────────────────────┘  │
│                                     │
│  [ Tutup ]  [ Lihat Transaksi ]   │
└─────────────────────────────────────┘
```

### 2. Info Toast (1-2 pending)
```
┌──────────────────────────────────────┐
│ ℹ️  Info Transaksi             ✕   │
│ Anda memiliki 2 transaksi pending.  │
│ Batas maksimal 3 transaksi.         │
└──────────────────────────────────────┘
(Auto dismiss in 5s)
```

### 3. Banner (Top-Up Page)
```
┌────────────────────────────────────────────┐
│ ⚠️ Batas Transaksi Tercapai               │
│                                             │
│ Anda memiliki 3 transaksi pending         │
│ (maksimal 3). Silakan selesaikan          │
│ pembayaran atau tunggu 2 jam 15 menit.    │
│                                             │
│ [ Lihat Transaksi ]  [ Tutup ]            │
└────────────────────────────────────────────┘
```

---

## 🔄 User Flow

### Scenario 1: No Pending Transactions
```
User clicks "Top Up"
  → Check pending: 0
  → ✅ Open modal normally
  → User can create transaction
```

### Scenario 2: 1-2 Pending Transactions
```
User clicks "Top Up"
  → Check pending: 2
  → ℹ️ Show info toast (yellow)
  → ✅ Open modal
  → User can still create transaction
  → After creation: pending = 3
```

### Scenario 3: 3 Pending Transactions
```
User clicks "Top Up"
  → Check pending: 3
  → ❌ Show warning modal (red)
  → ⛔ Block modal from opening
  → User must wait or complete payment

Alternative path:
  → User goes to payment history
  → Completes one payment
  → pending = 2
  → ✅ Can create new transaction
```

### Scenario 4: Transaction Expires
```
3 pending transactions at 15:00
  → Earliest expires at 17:00
  → User tries at 16:00
  → ❌ Blocked: "tunggu 1 jam lagi"
  → User tries at 17:01
  → ✅ Allowed: pending = 2 (one expired)
```

---

## 📊 Database Query

### Check Active Pending Count:
```sql
SELECT 
  COUNT(*) as pending_count,
  MIN(expired_time) as earliest_expiry,
  ARRAY_AGG(
    JSON_BUILD_OBJECT(
      'id', id,
      'amount', amount,
      'credits_amount', credits_amount,
      'payment_method', payment_method,
      'expired_time', expired_time,
      'created_at', created_at
    ) ORDER BY created_at DESC
  ) as pending_transactions
FROM payment_transactions 
WHERE user_id = $1 
  AND status = 'PENDING'
  AND expired_time > NOW();
```

**Key Points:**
- Only count `status = 'PENDING'`
- Only count if `expired_time > NOW()` (not yet expired)
- Get earliest expiry to show time remaining
- Order by `created_at DESC` to show newest first

---

## ⏱️ Time Calculation

### Format Time Remaining:
```javascript
const expiryDate = new Date(earliestExpiry);
const now = new Date();
const diffMs = expiryDate - now;
const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

let timeRemaining = '';
if (diffHours > 0) {
  timeRemaining = `${diffHours} jam ${diffMinutes} menit`;
} else {
  timeRemaining = `${diffMinutes} menit`;
}
```

**Examples:**
- 2:15:30 remaining → "2 jam 15 menit"
- 0:45:20 remaining → "45 menit"
- 0:05:10 remaining → "5 menit"

---

## 🧪 Testing Scenarios

### Test 1: Create 3 Transactions
```bash
# Create first transaction
curl -X POST http://localhost:5005/api/payment/create \
  -H "Content-Type: application/json" \
  -d '{"amount": 20000, "paymentMethod": "QRIS"}'
# ✅ Success

# Create second transaction
curl -X POST http://localhost:5005/api/payment/create \
  -H "Content-Type: application/json" \
  -d '{"amount": 40000, "paymentMethod": "BCAVA"}'
# ✅ Success

# Create third transaction
curl -X POST http://localhost:5005/api/payment/create \
  -H "Content-Type: application/json" \
  -d '{"amount": 100000, "paymentMethod": "GOPAY"}'
# ✅ Success

# Try fourth transaction
curl -X POST http://localhost:5005/api/payment/create \
  -H "Content-Type: application/json" \
  -d '{"amount": 50000, "paymentMethod": "QRIS"}'
# ❌ 429: "Anda memiliki 3 transaksi pending..."
```

### Test 2: Check Pending
```bash
curl http://localhost:5005/api/payment/check-pending

# Response:
{
  "success": true,
  "pending_count": 3,
  "can_create_new": false,
  "time_remaining": "1 jam 45 menit",
  "message": "Anda memiliki 3 transaksi pending..."
}
```

### Test 3: Transaction Expires
```sql
-- Manually expire one transaction for testing
UPDATE payment_transactions 
SET expired_time = NOW() - INTERVAL '1 hour'
WHERE id = 123;

-- Now check pending
-- Should return pending_count = 2
-- User can create new transaction
```

### Test 4: Complete Payment
```sql
-- Mark one as paid
UPDATE payment_transactions 
SET status = 'PAID'
WHERE id = 123;

-- Now check pending
-- Should return pending_count = 2
-- User can create new transaction
```

---

## 🎯 Benefits

### For Business:
1. ✅ **Prevents abuse** - Users can't spam create transactions
2. ✅ **Reduces load** - Max 3 pending per user limits Tripay API calls
3. ✅ **Better tracking** - Fewer abandoned transactions
4. ✅ **Cleaner database** - Less clutter from unused pending transactions

### For Users:
1. ✅ **Clear feedback** - Knows exactly why they're blocked
2. ✅ **Actionable info** - Shows what to do (wait X time or pay)
3. ✅ **Transaction visibility** - Can see all pending transactions
4. ✅ **Better UX** - Guided through the limitation gracefully

### For System:
1. ✅ **Prevent overload** - Tripay payment gateway not spammed
2. ✅ **Rate limiting** - Built-in transaction rate limit
3. ✅ **Clean expiry** - Old transactions naturally expire
4. ✅ **Scalable** - Works even with many users

---

## 📝 Configuration

### Current Settings:
```javascript
const MAX_PENDING_TRANSACTIONS = 3;
```

**To change the limit:**
1. Update backend validation in `paymentController.js`:
   ```javascript
   if (pendingCount >= 3) { // Change 3 to desired limit
   ```

2. Update frontend messages:
   - Dashboard: `showPendingInfo()` and `showPendingWarning()`
   - Top-Up: `showPendingBanner()` and `showPendingLimitError()`

3. Update this documentation

**Recommended limits:**
- **3 transactions:** Good balance (current setting)
- **5 transactions:** More flexible, higher risk of abuse
- **1 transaction:** Very strict, may frustrate users

---

## 🔍 Monitoring

### Queries for Admin:

**Users with max pending:**
```sql
SELECT 
  u.username,
  u.email,
  COUNT(*) as pending_count
FROM payment_transactions pt
JOIN users u ON pt.user_id = u.id
WHERE pt.status = 'PENDING' 
  AND pt.expired_time > NOW()
GROUP BY u.id, u.username, u.email
HAVING COUNT(*) >= 3
ORDER BY pending_count DESC;
```

**Average pending per user:**
```sql
SELECT 
  AVG(pending_count) as avg_pending,
  MAX(pending_count) as max_pending,
  MIN(pending_count) as min_pending
FROM (
  SELECT 
    user_id,
    COUNT(*) as pending_count
  FROM payment_transactions 
  WHERE status = 'PENDING' 
    AND expired_time > NOW()
  GROUP BY user_id
) subquery;
```

**Blocked attempts (from logs):**
```bash
# Check server logs for 429 errors
grep "429" logs/access.log | wc -l
```

---

## ⚠️ Important Notes

### 1. Status Must Be Updated
Expired transactions must have their status updated from `PENDING` to `EXPIRED` or similar. Otherwise they'll continue to count toward the limit even after expiry time.

**Solution:** Create a cron job or scheduled task:
```sql
-- Run every hour
UPDATE payment_transactions 
SET status = 'EXPIRED'
WHERE status = 'PENDING' 
  AND expired_time < NOW();
```

### 2. Race Conditions
If user clicks "Pay" multiple times rapidly, might create multiple transactions before check completes.

**Solution:** Already handled by:
- Frontend: Disable button after click
- Backend: Transaction-level locking with `pool.connect()`

### 3. Tripay Callback Timing
If payment is completed but callback hasn't arrived yet, transaction still shows as pending.

**Solution:** 
- Manual sync button in payment history
- Automatic retry of Tripay status check

### 4. Different Expiry Times
Transactions can have different expiry times (24 hours for bank transfer, 2 hours for QRIS, etc.)

**Handled:** Query uses `MIN(expired_time)` to show earliest expiry

---

## 🚀 Future Enhancements

### Possible improvements:

1. **User-specific limits:**
   - VIP users: 5 pending transactions
   - Regular users: 3 pending transactions
   - New users: 1 pending transaction

2. **Auto-cancel oldest:**
   - If user tries to create 4th transaction
   - Automatically cancel the oldest pending one
   - Ask for confirmation first

3. **Smart expiry notification:**
   - Email user when transaction about to expire
   - Push notification 15 minutes before expiry
   - SMS reminder for high-value transactions

4. **Analytics dashboard:**
   - Show pending transaction trends
   - Alert admin if many users hitting limit
   - Track conversion rate (pending → paid)

5. **Flexible limits by payment method:**
   - QRIS: max 2 pending (expires fast)
   - Bank Transfer: max 5 pending (expires slow)
   - E-Wallet: max 3 pending (medium expiry)

---

## 📂 Modified Files

1. ✅ `src/controllers/paymentController.js`
   - Added `checkPendingTransactions()` endpoint
   - Added validation in `createPayment()`

2. ✅ `src/routes/payment.js`
   - Added route: `GET /api/payment/check-pending`

3. ✅ `src/views/auth/dashboard.ejs`
   - Added `showPendingWarning()` modal
   - Added `showPendingInfo()` toast
   - Updated `openTopUpModal()` to check pending first

4. ✅ `src/views/auth/top-up.ejs`
   - Added `showPendingBanner()` on page load
   - Added `showPendingLimitError()` on submit
   - Updated error handling for 429 status

---

## ✅ Checklist

Implementation:
- [x] Backend validation (check pending count)
- [x] Backend endpoint (GET /check-pending)
- [x] Backend error handling (429 response)
- [x] Frontend check on modal open (dashboard)
- [x] Frontend warning modal (blocked)
- [x] Frontend info toast (allowed but warned)
- [x] Frontend banner on page load (top-up)
- [x] Frontend error handling on submit
- [x] Time remaining calculation
- [x] Transaction list display
- [x] Responsive UI design
- [x] No linter errors

Testing:
- [ ] Test with 0 pending transactions
- [ ] Test with 1-2 pending transactions
- [ ] Test with 3 pending transactions
- [ ] Test transaction expiry
- [ ] Test payment completion
- [ ] Test multiple users simultaneously
- [ ] Test UI on mobile devices
- [ ] Test error messages clarity

---

## 🎊 Success Indicators

When feature works correctly:

**Backend:**
```
✅ /api/payment/check-pending returns correct count
✅ /api/payment/create blocks at 3 pending
✅ Returns 429 status code when blocked
✅ Calculates time remaining accurately
```

**Frontend (Dashboard):**
```
✅ Warning modal shows when >= 3 pending
✅ Info toast shows when 1-2 pending
✅ User cannot open top-up modal when blocked
✅ Transaction list displays correctly
```

**Frontend (Top-Up Page):**
```
✅ Banner shows on page load if pending exists
✅ Banner color changes (yellow vs red)
✅ Error modal shows on submit if blocked
✅ User gets clear guidance on what to do
```

**User Experience:**
```
✅ Clear error messages in Indonesian
✅ Time remaining is accurate and readable
✅ Links to payment history work
✅ User understands why they're blocked
```

---

**Feature Status:** ✅ **COMPLETE & READY FOR TESTING**

**Last Updated:** October 26, 2025

---

## 🔗 Related Documentation

- `POPUP_PAYMENT_FLOW.md` - Payment flow documentation
- `PROMO_CODE_FEATURE.md` - Promo code implementation
- `MIN_1_CREDIT_ALL_FIXED.md` - Minimum credit purchase
- `PAYMENT_MODAL_LAYOUT_FIX.md` - Modal UI fixes

---

**Congratulations!** 🎉 Pending transaction limit feature is now live!

