# 👥 Admin View Code Users Feature

## 📋 Overview

Admin sekarang bisa melihat **siapa saja yang sudah menggunakan setiap kode** (baik promo code maupun claim code) langsung dari halaman admin promo codes.

---

## ✨ Features

### 1. **View Users Button**
- Tombol purple dengan icon `👥` dan angka penggunaan
- Muncul di kolom Actions di setiap row promo code
- Menampilkan jumlah total penggunaan kode

### 2. **Usage Details Modal**
Modal menampilkan:
- **Code Name**: Nama kode yang sedang dilihat
- **Total Users**: Total pengguna yang sudah pakai kode
- **User List Table**:
  - Avatar + Name
  - Email
  - Usage Type (Claimed / Promo Used)
  - Amount (credits yang didapat)
  - Date & Time

### 3. **Badge Colors**
- 🟢 **Green Badge**: "Claimed" (claim code)
- 🟡 **Yellow Badge**: "Promo Used" (promo code)

---

## 🎯 How to Use

### Step 1: Go to Admin Promo Codes
```
http://localhost:3000/admin/promo-codes
```

### Step 2: Click Purple Button (👥 Count)
Klik tombol purple di baris kode yang ingin dilihat.

### Step 3: View Users
Modal akan muncul dengan list semua user yang sudah pakai kode tersebut.

---

## 📊 Example Display

```
┌──────────────────────────────────────────────────┐
│  👥 Code Usage Details                           │
│  Code: FREECREDIT100                             │
├──────────────────────────────────────────────────┤
│  Total Users: 5                                  │
├──────────────────────────────────────────────────┤
│ User          Email           Type      Amount   │
├──────────────────────────────────────────────────┤
│ 👤 John Doe   john@email.com  Claimed  +100 cr  │
│ 👤 Jane Smith jane@email.com  Claimed  +100 cr  │
│ ...                                              │
└──────────────────────────────────────────────────┘
```

---

## 🔍 API Endpoint

### GET `/admin/promo-codes/:id/usage`

**Request:**
```bash
GET /admin/promo-codes/5/usage
Authorization: Admin session required
```

**Response:**
```json
{
  "success": true,
  "promo_code": {
    "id": 5,
    "code": "FREECREDIT100",
    "description": "Dapatkan 100 credits gratis",
    "code_type": "claim",
    "uses_count": 5,
    "usage_limit": 100
  },
  "users": [
    {
      "user_id": 123,
      "user_name": "John Doe",
      "user_email": "john@example.com",
      "avatar_url": "https://...",
      "usage_type": "Claimed",
      "usage_type_badge": "success",
      "amount": 100,
      "description": "Claim code: FREECREDIT100 - ...",
      "used_at": "2025-10-27T10:30:00Z"
    }
  ],
  "total_users": 5
}
```

---

## 🛡️ Security

### Validasi:
- ✅ Only admin can access this endpoint
- ✅ Checks if promo code exists
- ✅ Returns 404 if code not found
- ✅ Admin activity is logged

---

## 💾 Database Query

```sql
-- Get users who used the code
SELECT 
  u.id as user_id,
  u.name as user_name,
  u.email as user_email,
  u.avatar_url,
  ct.transaction_type,
  ct.amount,
  ct.description,
  ct.created_at as used_at
FROM credit_transactions ct
JOIN users u ON u.id = ct.user_id
WHERE 
  ct.description LIKE '%Claim code: KODE%' 
  OR ct.description LIKE '%Promo code: KODE%'
  OR ct.promo_code_id = ?
ORDER BY ct.created_at DESC;
```

**Logic:**
- Cari di `credit_transactions` berdasarkan:
  1. Description yang mengandung "Claim code: KODE"
  2. Description yang mengandung "Promo code: KODE"
  3. `promo_code_id` yang sesuai
- Join dengan `users` untuk data user
- Sort by `created_at` (terbaru di atas)

---

## 🎨 UI Components

### Button (in table row):
```html
<button onclick="viewUsers(5, 'FREECREDIT100')"
        class="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 
               text-white text-xs rounded-lg">
  <i class="fas fa-users"></i>
  <span>5</span>
</button>
```

### Modal States:
1. **Loading**: Spinner dengan text "Loading users..."
2. **Empty**: Icon + text "No users have used this code yet."
3. **List**: Table dengan data users

---

## 📱 Responsive Design

- ✅ Modal adapts to screen size (max-w-4xl)
- ✅ Table is scrollable on mobile
- ✅ Close on ESC key
- ✅ Close on outside click
- ✅ Close button (X) di corner

---

## 🧪 Testing Guide

### Test 1: View Users for Code with Usage
```bash
1. Login sebagai admin
2. Go to /admin/promo-codes
3. Cari kode yang sudah dipakai (uses_count > 0)
4. Klik tombol purple (👥 count)
5. Expected: Modal muncul dengan list users
```

### Test 2: View Users for Unused Code
```bash
1. Cari kode yang belum pernah dipakai (uses_count = 0)
2. Klik tombol purple (👥 0)
3. Expected: Modal muncul dengan "No users have used this code yet."
```

### Test 3: Different Usage Types
```bash
1. Create test claim code "TESTCLAIM"
2. User A: Claim di /billing
3. Admin: View users → Should show "Claimed" badge (green)

4. Create test promo code "TESTPROMO"
5. User B: Use at checkout
6. Admin: View users → Should show "Promo Used" badge (yellow)
```

### Test 4: Modal Close Functions
```bash
1. Open modal
2. Test close dengan:
   - ESC key → Should close
   - Click outside modal → Should close
   - Click X button → Should close
   - Click "Close" button → Should close
```

---

## 📂 Files Modified

### Backend:
1. **`src/controllers/adminController.js`**
   - Added: `getPromoCodeUsage()`
   - Query untuk get users yang pakai kode

2. **`src/routes/admin.js`**
   - Added: `GET /admin/promo-codes/:id/usage`

### Frontend:
3. **`src/views/admin/promo-codes.ejs`**
   - Added: View Users button (purple)
   - Added: View Users Modal
   - Added: JavaScript functions:
     - `viewUsers(promoId, code)`
     - `closeViewUsersModal()`
   - Updated: ESC key listener
   - Updated: Outside click listener

---

## 🔧 Troubleshooting

### Issue: Modal tidak muncul
**Solution:**
```javascript
// Check console for errors
// Ensure promo code ID is valid
console.log('Opening modal for code:', code);
```

### Issue: Users tidak muncul tapi uses_count > 0
**Solution:**
```sql
-- Check credit_transactions
SELECT * FROM credit_transactions 
WHERE description LIKE '%KODE%'
ORDER BY created_at DESC;

-- Verify promo_code_id
SELECT * FROM credit_transactions 
WHERE promo_code_id = 5;
```

### Issue: Badge color tidak sesuai
**Solution:**
```javascript
// Check transaction_type in database
// claim_code → green badge
// promo_bonus → yellow badge
```

---

## 🎯 Benefits

### For Admin:
1. ✅ **Track Usage**: Lihat siapa saja yang pakai kode
2. ✅ **Detect Abuse**: Identify suspicious patterns
3. ✅ **User Insights**: Understand popular codes
4. ✅ **Support**: Help users with code issues

### For Business:
1. ✅ **Analytics**: Track code effectiveness
2. ✅ **Marketing**: Identify successful campaigns
3. ✅ **Customer Service**: Quick lookup for support
4. ✅ **Audit Trail**: Complete usage history

---

## 📊 Usage Statistics Display

Modal juga menampilkan:
- Total users yang sudah pakai kode
- Breakdown antara claim vs promo usage
- Timeline penggunaan (sorted by date)

---

## 🚀 Future Enhancements

### Potential Improvements:
1. **Export to CSV**: Download usage data
2. **Filter by Date**: View usage in specific period
3. **User Details Link**: Click to view full user profile
4. **Usage Graph**: Visual representation of usage over time
5. **Search/Filter**: Search users in the modal
6. **Pagination**: For codes with many users

---

## 📝 Summary

| Feature | Status |
|---------|--------|
| View Users Button | ✅ Implemented |
| Usage Details Modal | ✅ Implemented |
| API Endpoint | ✅ Implemented |
| Empty State | ✅ Implemented |
| Loading State | ✅ Implemented |
| Badge Colors | ✅ Implemented |
| Responsive Design | ✅ Implemented |
| Close Handlers | ✅ Implemented |

---

**Implemented**: October 27, 2025  
**Status**: ✅ Ready to Use  
**Location**: `/admin/promo-codes`

---

## 🎉 Quick Start

```bash
1. Start server: npm start
2. Login as admin
3. Go to: http://localhost:3000/admin/promo-codes
4. Click purple button (👥) on any code
5. View list of users who used that code!
```

Done! 🚀

