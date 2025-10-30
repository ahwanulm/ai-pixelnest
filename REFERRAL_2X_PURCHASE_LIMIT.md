# 🎯 REFERRAL 2X PURCHASE LIMIT

## ✅ Feature Implemented
Sistem referral sekarang **membatasi komisi hanya untuk 2x pembelian/top-up pertama** dari setiap user yang direferensikan.

### Logic Flow:
- ✅ User A mereferensikan User B
- ✅ User B top-up #1 (Rp 100,000) → User A dapat komisi (Rp 5,000)
- ✅ User B top-up #2 (Rp 200,000) → User A dapat komisi (Rp 10,000)
- ❌ User B top-up #3+ → **TIDAK ADA KOMISI** untuk User A

---

## 📝 Changes Made

### 1. **Backend Logic - Purchase Commission**
**File:** `src/models/Referral.js`

#### A. Updated `addPurchaseCommission()` Method
```javascript
// Add commission when referred user makes a purchase
// LIMIT: Max 2 purchases per referred user
static async addPurchaseCommission(userId, purchaseAmount) {
  const result = await query('SELECT referred_by FROM users WHERE id = $1', [userId]);
  
  if (result.rows.length > 0 && result.rows[0].referred_by) {
    const referrerId = result.rows[0].referred_by;
    
    // ✅ CHECK: How many times this referred user has generated commission
    const commissionCount = await query(
      `SELECT COUNT(*) as count 
       FROM referral_transactions 
       WHERE referred_user_id = $1 AND transaction_type = 'purchase_commission'`,
      [userId]
    );
    
    const purchaseCount = parseInt(commissionCount.rows[0].count);
    
    // ⚠️ LIMIT: Only first 2 purchases are eligible for commission
    if (purchaseCount >= 2) {
      console.log(`❌ Referral commission limit reached for user ${userId} (${purchaseCount}/2 purchases)`);
      return; // Skip commission
    }
    
    // ... calculate and award commission ...
    
    // Log transaction with metadata
    await query(
      `INSERT INTO referral_transactions 
       (referrer_id, referred_user_id, transaction_type, amount, description, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        referrerId,
        userId,
        'purchase_commission',
        commissionAmount,
        `Komisi pembelian ke-${purchaseCount + 1} (Rp ${purchaseAmount.toLocaleString('id-ID')})`,
        JSON.stringify({ 
          purchase_amount: purchaseAmount,
          purchase_number: purchaseCount + 1,
          max_eligible: 2
        })
      ]
    );
    
    // Send notification with remaining eligible purchases
    const remainingPurchases = 2 - (purchaseCount + 1);
    await this.sendReferralNotification(referrerId, 'purchase', commissionAmount, remainingPurchases);
    
    console.log(`✅ Referral commission awarded: Rp ${commissionAmount.toLocaleString('id-ID')} (Purchase ${purchaseCount + 1}/2)`);
  }
}
```

**Key Points:**
1. ✅ Before awarding commission, system checks purchase count via `referral_transactions` table
2. ✅ If count >= 2, commission is **skipped**
3. ✅ Transaction metadata includes `purchase_number` and `max_eligible`
4. ✅ Console logs for debugging

---

#### B. Updated `sendReferralNotification()` Method
```javascript
// Send referral notification
static async sendReferralNotification(userId, type, amount, remainingPurchases = null) {
  let title = '';
  let message = '';
  
  if (type === 'purchase') {
    title = '💰 Komisi Referral!';
    message = `Anda mendapat komisi Rp ${amount.toLocaleString('id-ID')} dari pembelian user yang Anda referensikan.`;
    
    // ✅ Add info about remaining eligible purchases
    if (remainingPurchases !== null) {
      if (remainingPurchases > 0) {
        message += ` Tersisa ${remainingPurchases}x pembelian lagi yang eligible untuk komisi.`;
      } else {
        message += ` User ini sudah mencapai limit 2x pembelian untuk komisi referral.`;
      }
    }
  } else {
    return; // Skip other notification types
  }
  
  await query(
    `INSERT INTO notifications (user_id, title, message, type, priority)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, title, message, 'referral', 'medium']
  );
}
```

**Notification Examples:**
- Purchase #1: "Anda mendapat komisi Rp 5,000... Tersisa 1x pembelian lagi yang eligible untuk komisi."
- Purchase #2: "Anda mendapat komisi Rp 10,000... User ini sudah mencapai limit 2x pembelian untuk komisi referral."

---

#### C. Updated `getReferredUsers()` Method
```javascript
// Get referred users list with purchase count
static async getReferredUsers(userId, limit = 50, offset = 0) {
  const result = await query(
    `SELECT 
       u.id, 
       u.name, 
       u.email, 
       u.avatar_url, 
       u.created_at,
       COALESCE(COUNT(rt.id), 0) as purchase_count
     FROM users u
     LEFT JOIN referral_transactions rt 
       ON rt.referred_user_id = u.id 
       AND rt.transaction_type = 'purchase_commission'
     WHERE u.referred_by = $1
     GROUP BY u.id, u.name, u.email, u.avatar_url, u.created_at
     ORDER BY u.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  
  return result.rows.map(row => ({
    ...row,
    purchase_count: parseInt(row.purchase_count),
    is_eligible: parseInt(row.purchase_count) < 2
  }));
}
```

**Returns:**
- `purchase_count`: How many purchases generated commission (0, 1, or 2)
- `is_eligible`: Boolean - can this user still generate commission?

---

### 2. **Admin Dashboard UI**
**File:** `src/views/admin/referral-dashboard.ejs`

#### Updated Info Section:
```html
<div class="glass-strong rounded-xl p-6 mb-6">
  <h4 class="text-xl font-bold text-white mb-4">
    <i class="fas fa-info-circle"></i> Cara Kerja Referral System
  </h4>
  <ul class="text-white space-y-2">
    <li><strong>Purchase Commission:</strong> Referrer mendapat 5% komisi...</li>
    <li><strong>⚠️ Purchase Limit:</strong> Maksimal <strong>2x pembelian pertama</strong> per user yang eligible untuk komisi</li>
    <li><strong>Minimum Payout:</strong> Rp 25,000</li>
    <li><strong>Cooldown Period:</strong> 7 hari antara setiap request payout</li>
    <li><strong>💡 Note:</strong> User hanya mendapat komisi dari <strong>pembelian</strong>, BUKAN dari pendaftaran saja</li>
    <li><strong>Status:</strong> ✅ Aktif / ❌ Nonaktif</li>
  </ul>
</div>
```

---

### 3. **User Referral Dashboard UI**
**File:** `src/views/auth/referral.ejs`

#### A. Updated Info Section:
```html
<p class="text-gray-300 mb-3 text-sm">
  <i class="fas fa-info-circle"></i> 
  Bagikan link ini ke teman Anda. Anda akan mendapat:
</p>
<ul class="text-gray-300 text-sm mb-5 pl-5 space-y-1">
  <li>💸 5% komisi dari setiap pembelian/top-up yang mereka lakukan</li>
  <li>⚠️ <strong>Limit:</strong> Maksimal <strong>2x pembelian pertama</strong> per user yang eligible untuk komisi</li>
  <li>💡 <strong>Note:</strong> Komisi hanya dari <strong>pembelian</strong>, bukan dari pendaftaran</li>
</ul>
```

#### B. Updated Referred Users Table:
```html
<table class="table">
  <thead>
    <tr>
      <th>Nama</th>
      <th>Email</th>
      <th>Purchases Eligible</th>
      <th>Tanggal Daftar</th>
    </tr>
  </thead>
  <tbody>
    <% referredUsers.forEach(user => { %>
      <tr>
        <td><%= user.name %></td>
        <td><%= user.email %></td>
        <td>
          <% if (user.purchase_count >= 2) { %>
            <span class="badge" style="background: #ef4444;">2/2 (Max)</span>
          <% } else if (user.purchase_count === 1) { %>
            <span class="badge" style="background: #f59e0b;">1/2</span>
          <% } else { %>
            <span class="badge" style="background: #6b7280;">0/2</span>
          <% } %>
        </td>
        <td><%= new Date(user.created_at).toLocaleDateString('id-ID') %></td>
      </tr>
    <% }) %>
  </tbody>
</table>
```

**Badge Colors:**
- 🔴 **Red (2/2 Max)**: No more commission possible
- 🟠 **Orange (1/2)**: 1 more purchase eligible
- ⚪ **Gray (0/2)**: 2 purchases still eligible

---

## 🔄 How It Works

### Example Scenario:

**User A (Referrer)** shares link → **User B (Referred)** registers

#### Purchase #1 (Rp 100,000):
```
✅ User B makes first top-up
✅ System checks: purchase_count = 0 (< 2) → ELIGIBLE
✅ Commission calculated: Rp 100,000 × 5% = Rp 5,000
✅ User A receives: +Rp 5,000
✅ Transaction logged: "Komisi pembelian ke-1 (Rp 100,000)"
✅ Notification sent: "Anda mendapat komisi Rp 5,000... Tersisa 1x pembelian lagi..."
✅ Console: "Referral commission awarded: Rp 5,000 (Purchase 1/2)"
```

#### Purchase #2 (Rp 200,000):
```
✅ User B makes second top-up
✅ System checks: purchase_count = 1 (< 2) → ELIGIBLE
✅ Commission calculated: Rp 200,000 × 5% = Rp 10,000
✅ User A receives: +Rp 10,000
✅ Transaction logged: "Komisi pembelian ke-2 (Rp 200,000)"
✅ Notification sent: "Anda mendapat komisi Rp 10,000... User ini sudah mencapai limit..."
✅ Console: "Referral commission awarded: Rp 10,000 (Purchase 2/2)"
```

#### Purchase #3+ (Rp 150,000):
```
❌ User B makes third top-up
❌ System checks: purchase_count = 2 (>= 2) → NOT ELIGIBLE
❌ No commission given
❌ No transaction logged
❌ No notification sent
❌ Console: "Referral commission limit reached for user XXX (2/2 purchases)"
```

---

## 📊 Database Structure

### `referral_transactions` Table Metadata:
```json
{
  "purchase_amount": 100000,
  "purchase_number": 1,
  "max_eligible": 2
}
```

This metadata helps track:
- How much the referred user paid
- Which purchase number this was (1st or 2nd)
- Maximum eligible purchases allowed

---

## 🎯 Benefits

1. ✅ **Cost Control**: Limits referral expenses to maximum 2x commission per referred user
2. ✅ **Fair Distribution**: Encourages referrers to bring more users instead of relying on single high-spending users
3. ✅ **Transparency**: Users can see exactly how many purchases are left (0/2, 1/2, 2/2)
4. ✅ **Abuse Prevention**: Prevents exploitation where one user makes unlimited purchases
5. ✅ **Clear Communication**: Notifications inform users about remaining eligible purchases

---

## 🧪 Testing Checklist

### Test Case 1: First Purchase (0/2 → 1/2)
- [ ] User B (referred) makes first top-up of Rp 100,000
- [ ] User A receives commission: Rp 5,000
- [ ] User A sees notification: "Tersisa 1x pembelian lagi..."
- [ ] User A's dashboard shows User B as "1/2" (orange badge)
- [ ] Transaction appears in User A's referral history

### Test Case 2: Second Purchase (1/2 → 2/2)
- [ ] User B makes second top-up of Rp 200,000
- [ ] User A receives commission: Rp 10,000
- [ ] User A sees notification: "User ini sudah mencapai limit..."
- [ ] User A's dashboard shows User B as "2/2 (Max)" (red badge)
- [ ] Transaction appears in User A's referral history

### Test Case 3: Third Purchase (2/2 → No Commission)
- [ ] User B makes third top-up of Rp 150,000
- [ ] User A receives NO commission
- [ ] User A receives NO notification
- [ ] User B's badge remains "2/2 (Max)" (red)
- [ ] No new transaction in User A's referral history

### Test Case 4: Multiple Referred Users
- [ ] User A refers User B, C, and D
- [ ] User B: 2 purchases → 2/2 (Max)
- [ ] User C: 1 purchase → 1/2
- [ ] User D: 0 purchases → 0/2
- [ ] Dashboard correctly shows all statuses
- [ ] User A can still earn from User C and D

---

## 📌 Summary

**Files Modified:**
1. ✅ `src/models/Referral.js` - Added purchase limit logic
2. ✅ `src/views/admin/referral-dashboard.ejs` - Updated UI with limit info
3. ✅ `src/views/auth/referral.ejs` - Updated UI with purchase count badges

**Logic Change:**
- **Before**: Unlimited commission from all purchases
- **After**: Commission only from first 2 purchases per referred user

**Result:**
- More sustainable referral economics
- Clear visibility of eligible purchases
- Prevents abuse
- Encourages bringing more users instead of relying on few high-spenders

---

## 🔍 Console Logs for Debugging

When testing, watch for these logs:

**Success:**
```
✅ Referral commission awarded: Rp 5,000 (Purchase 1/2)
✅ Referral commission awarded: Rp 10,000 (Purchase 2/2)
```

**Limit Reached:**
```
❌ Referral commission limit reached for user 123 (2/2 purchases)
```

---

**Status:** ✅ **COMPLETE**

**Date:** October 26, 2025

**Next Steps:**
- Test thoroughly with different scenarios
- Monitor console logs in production
- Adjust limit (currently 2x) if needed via code
- Consider making limit configurable in admin settings (future enhancement)

