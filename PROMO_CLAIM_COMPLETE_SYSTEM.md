# 🎁 Complete Promo & Claim Code System

## 📋 System Overview

Sistem lengkap untuk mengelola **Promo Codes** dan **Claim Codes** dengan validasi ketat dan tracking pengguna.

---

## 🚀 Features Implemented

### 1. ✅ Code Validation System
**Setiap kode hanya bisa digunakan sekali per user**

- ❌ Jika sudah di-CLAIM → tidak bisa pakai sebagai PROMO
- ❌ Jika sudah pakai sebagai PROMO → tidak bisa di-CLAIM lagi
- ✅ Validasi di 3 endpoint: claim, validate, apply

**Documentation**: `CODE_VALIDATION_SYSTEM.md`

### 2. ✅ Admin View Users Feature
**Admin bisa melihat siapa saja yang pakai setiap kode**

- 👥 Tombol purple dengan jumlah penggunaan
- 📊 Modal detail dengan table lengkap
- 🎨 Badge colors: Green (Claimed) / Yellow (Promo Used)

**Documentation**: `ADMIN_VIEW_CODE_USERS.md`

---

## 🎯 System Architecture

```
┌─────────────────────────────────────────────────────┐
│              PROMO & CLAIM CODE SYSTEM              │
└─────────────────────────────────────────────────────┘

┌─────────────────┐         ┌─────────────────┐
│   PROMO CODE    │         │   CLAIM CODE    │
│  (Discounts)    │         │ (Free Credits)  │
└────────┬────────┘         └────────┬────────┘
         │                           │
         └───────────┬───────────────┘
                     │
         ┌───────────▼───────────┐
         │   CODE VALIDATION     │
         │  (No Double Usage)    │
         └───────────┬───────────┘
                     │
         ┌───────────▼───────────┐
         │ CREDIT TRANSACTIONS   │
         │  (Usage Tracking)     │
         └───────────┬───────────┘
                     │
         ┌───────────▼───────────┐
         │   ADMIN VIEW USERS    │
         │   (Track & Monitor)   │
         └───────────────────────┘
```

---

## 📊 Database Schema

### Table: `promo_codes`
```sql
CREATE TABLE promo_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  
  -- Type: 'promo' or 'claim'
  code_type VARCHAR(20) DEFAULT 'promo',
  
  -- For PROMO codes
  discount_type VARCHAR(20),      -- 'percentage' or 'fixed'
  discount_value DECIMAL(10,2),
  
  -- For CLAIM codes
  credit_amount INTEGER DEFAULT 0,
  
  -- Common fields
  min_purchase DECIMAL(10,2) DEFAULT 0,
  single_use BOOLEAN DEFAULT false,
  usage_limit INTEGER,
  uses_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMP,
  valid_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Table: `credit_transactions`
```sql
CREATE TABLE credit_transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  amount DECIMAL(10,2),
  
  -- Type: 'claim_code', 'promo_bonus', etc
  transaction_type VARCHAR(50),
  
  description TEXT,
  promo_code_id INTEGER REFERENCES promo_codes(id),
  balance_after DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔒 Validation Logic

### Query untuk Check Double Usage:
```sql
SELECT 
  transaction_type, 
  description, 
  created_at 
FROM credit_transactions 
WHERE user_id = $1 
AND (
  description LIKE '%Claim code: KODE%'
  OR description LIKE '%Promo code: KODE%'
  OR promo_code_id = $2
)
ORDER BY created_at DESC
LIMIT 1;
```

**If found** → ❌ Error: "Kode sudah pernah digunakan"  
**If not found** → ✅ OK: Boleh dipakai

---

## 🎨 User Flow

### Flow 1: Claim Free Credits
```
User → /billing → Enter Claim Code → Claim Button
  ↓
Backend validates:
  ✓ Code exists & active
  ✓ Not expired
  ✓ Not reached usage limit
  ✓ User hasn't used it (claim OR promo) ← VALIDATION
  ↓
If valid:
  ✓ Add credits to user
  ✓ Log transaction (claim_code)
  ✓ Increment uses_count
  ↓
User sees: +100 credits instantly! 🎉
```

### Flow 2: Use Promo Code
```
User → Dashboard → Top-up → Enter Promo Code → Apply
  ↓
Backend validates:
  ✓ Code exists & active
  ✓ Not expired
  ✓ Meets min purchase
  ✓ User hasn't used it (promo OR claim) ← VALIDATION
  ↓
If valid:
  ✓ Apply discount
  ✓ User proceeds to payment
  ↓
After payment success:
  ✓ Add bonus credits (if any)
  ✓ Log transaction (promo_bonus)
  ✓ Increment uses_count
```

### Flow 3: Admin View Users
```
Admin → /admin/promo-codes → Click 👥 button
  ↓
Backend fetches:
  ✓ Promo code details
  ✓ All users who used it
  ✓ Transaction details
  ↓
Admin sees:
  ✓ List of users
  ✓ Usage type (Claimed / Promo Used)
  ✓ Amount & Date
```

---

## 🛠️ API Endpoints

### User Endpoints

#### 1. Validate Promo Code
```http
POST /api/user/promo/validate
Authorization: Bearer TOKEN

Body:
{
  "code": "DISKON20"
}

Response:
{
  "success": true,
  "promo": {
    "id": 5,
    "code": "DISKON20",
    "discount_type": "percentage",
    "discount_value": 20
  }
}
```

#### 2. Claim Credits
```http
POST /api/user/claim-credits
Authorization: Bearer TOKEN

Body:
{
  "code": "FREECREDIT100"
}

Response:
{
  "success": true,
  "message": "Credits claimed successfully!",
  "credits_claimed": 100,
  "new_balance": 150
}
```

### Admin Endpoints

#### 3. Get Code Usage (View Users)
```http
GET /admin/promo-codes/:id/usage
Authorization: Admin Session

Response:
{
  "success": true,
  "promo_code": {
    "id": 5,
    "code": "FREECREDIT100",
    "uses_count": 10
  },
  "users": [
    {
      "user_name": "John Doe",
      "user_email": "john@example.com",
      "usage_type": "Claimed",
      "amount": 100,
      "used_at": "2025-10-27T10:30:00Z"
    }
  ],
  "total_users": 10
}
```

---

## 🧪 Testing Scenarios

### Test 1: Double Usage Prevention (Claim → Promo)
```bash
Step 1: User claim kode "TEST100" di /billing
Result: ✓ +100 credits

Step 2: User coba pakai "TEST100" sebagai promo
Result: ❌ Error: "Kode TEST100 sudah pernah claimed 
         sebagai free credits sebelumnya"
```

### Test 2: Double Usage Prevention (Promo → Claim)
```bash
Step 1: User pakai "DISKON10" saat checkout
Result: ✓ 10% discount applied

Step 2: User coba claim "DISKON10" di /billing
Result: ❌ Error: "Kode DISKON10 sudah pernah used 
         as promo code sebelumnya"
```

### Test 3: Admin View Users
```bash
Step 1: Login as admin
Step 2: Go to /admin/promo-codes
Step 3: Click purple button (👥 5) on "FREECREDIT100"
Result: ✓ Modal shows 5 users who claimed the code
        with names, emails, dates, and amounts
```

### Test 4: Different Users Same Code
```bash
User A: Claim "WELCOME100" → ✓ Success
User B: Claim "WELCOME100" → ✓ Success (if not single_use)
User A: Claim "WELCOME100" again → ❌ Already used
```

---

## 📂 Files Modified

### Backend Files:
```
src/
├── controllers/
│   ├── userController.js         (Updated)
│   │   ├── validatePromoCode()   ← Added validation
│   │   ├── applyPromoCode()      ← Added validation
│   │   └── claimCredits()        ← Added validation
│   │
│   └── adminController.js        (Updated)
│       └── getPromoCodeUsage()   ← NEW
│
└── routes/
    ├── user.js                   (Updated)
    │   └── POST /claim-credits   ← NEW
    │
    └── admin.js                  (Updated)
        └── GET /promo-codes/:id/usage  ← NEW
```

### Frontend Files:
```
src/views/
└── admin/
    └── promo-codes.ejs          (Updated)
        ├── View Users Button     ← NEW
        ├── View Users Modal      ← NEW
        ├── viewUsers()           ← NEW
        └── closeViewUsersModal() ← NEW
```

### Documentation Files:
```
docs/
├── CODE_VALIDATION_SYSTEM.md         ← NEW
├── ADMIN_VIEW_CODE_USERS.md          ← NEW
├── PROMO_CLAIM_COMPLETE_SYSTEM.md    ← THIS FILE
└── test-code-validation.sh           ← NEW
```

---

## 🎨 UI Screenshots (Description)

### 1. Admin Promo Codes Table
```
┌──────────────────────────────────────────────────────────────┐
│  Code          Type    Value        Usage    Status  Actions │
├──────────────────────────────────────────────────────────────┤
│  FREECREDIT100 Claim  100 Credits  5/100    Active  [👥 5]  │
│                                                       [✏️]    │
│                                                       [🗑️]    │
└──────────────────────────────────────────────────────────────┘
```

### 2. View Users Modal
```
┌──────────────────────────────────────────────────────────────┐
│  👥 Code Usage Details                                    [X]│
│  Code: FREECREDIT100                                         │
├──────────────────────────────────────────────────────────────┤
│  Total Users: 5                                              │
│                                                              │
│  User           Email              Type       Amount   Date  │
│  ─────────────────────────────────────────────────────────  │
│  👤 John Doe    john@email.com    [Claimed]  +100 cr  27 Okt│
│  👤 Jane Smith  jane@email.com    [Claimed]  +100 cr  27 Okt│
│  👤 Bob Wilson  bob@email.com     [Claimed]  +100 cr  26 Okt│
│                                                              │
│                                        [Close]               │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔍 Monitoring & Analytics

### Admin Dashboard Insights:
1. **Most Used Codes**: Track popular codes
2. **User Engagement**: See who's using codes
3. **Fraud Detection**: Identify suspicious patterns
4. **Campaign Performance**: Measure code effectiveness

### Database Queries for Analytics:

#### Total Usage per Code:
```sql
SELECT 
  pc.code,
  pc.code_type,
  COUNT(ct.id) as total_uses,
  SUM(ct.amount) as total_credits_given
FROM promo_codes pc
LEFT JOIN credit_transactions ct ON (
  ct.description LIKE CONCAT('%', pc.code, '%')
  OR ct.promo_code_id = pc.id
)
GROUP BY pc.id
ORDER BY total_uses DESC;
```

#### Active Users per Day:
```sql
SELECT 
  DATE(ct.created_at) as date,
  COUNT(DISTINCT ct.user_id) as unique_users,
  COUNT(*) as total_claims
FROM credit_transactions ct
WHERE ct.transaction_type IN ('claim_code', 'promo_bonus')
GROUP BY DATE(ct.created_at)
ORDER BY date DESC;
```

---

## 🚨 Error Messages

### User-Facing Errors:

| Scenario | Error Message |
|----------|--------------|
| Code already used as claim | `Kode "XXXX" sudah pernah claimed sebagai free credits sebelumnya. Setiap kode hanya bisa digunakan sekali.` |
| Code already used as promo | `Kode "XXXX" sudah pernah used as promo code sebelumnya. Setiap kode hanya bisa digunakan sekali.` |
| Code expired | `Invalid or expired claim code` |
| Usage limit reached | `This claim code has reached its usage limit` |

---

## 🎯 Business Benefits

### For Marketing:
- ✅ Track campaign effectiveness
- ✅ Prevent abuse and fraud
- ✅ Measure user engagement
- ✅ ROI calculation per code

### For Customer Support:
- ✅ Quick user lookup
- ✅ Verify code usage history
- ✅ Resolve disputes easily
- ✅ Audit trail for all transactions

### For Product:
- ✅ User behavior insights
- ✅ Feature usage analytics
- ✅ A/B testing capabilities
- ✅ Data-driven decisions

---

## 📈 Future Enhancements

### Planned Features:
1. 🔄 **Auto-expire codes** after certain date
2. 📊 **Usage graphs** in admin dashboard
3. 📧 **Email notifications** for new code usage
4. 🎯 **User segmentation** for targeted codes
5. 💰 **Revenue tracking** per promo code
6. 📱 **Mobile app** integration
7. 🔔 **Real-time alerts** for suspicious activity
8. 📥 **Export to CSV** for external analysis

---

## 🏁 Quick Start Guide

### For Users:

#### Claim Free Credits:
```bash
1. Login to your account
2. Go to: http://localhost:3000/billing
3. Scroll to "Claim Free Credits" section (green card)
4. Enter claim code (e.g., FREECREDIT100)
5. Click "Claim"
6. Credits added instantly! 🎉
```

#### Use Promo Code:
```bash
1. Go to Dashboard
2. Click "Top Up"
3. Select amount
4. Enter promo code
5. Click "Apply"
6. Proceed with payment
7. Get bonus credits after payment! 🎉
```

### For Admins:

#### View Code Users:
```bash
1. Login as admin
2. Go to: http://localhost:3000/admin/promo-codes
3. Find the code you want to check
4. Click purple button (👥 count)
5. View list of users! 📊
```

#### Create New Code:
```bash
# Claim Code (Free Credits)
1. Click "🎁 Create Claim Code" (green button)
2. Fill: Code, Description, Credit Amount
3. Set: Usage Limit, Valid Period
4. Click "Create Claim Code"

# Promo Code (Discounts)
1. Click "🎟️ Create Promo Code" (violet button)
2. Fill: Code, Description, Discount Type/Value
3. Set: Min Purchase, Usage Limit
4. Click "Create Promo Code"
```

---

## 🛡️ Security Features

### Implemented:
- ✅ **Double usage prevention** (claim + promo)
- ✅ **Transaction logging** (audit trail)
- ✅ **Admin-only access** to usage details
- ✅ **Rate limiting** on API endpoints
- ✅ **SQL injection protection** (parameterized queries)
- ✅ **XSS protection** (sanitized inputs)

### Best Practices:
- ✅ Use `single_use: true` for one-time codes
- ✅ Set `usage_limit` to prevent abuse
- ✅ Set `valid_until` to auto-expire codes
- ✅ Monitor suspicious patterns regularly

---

## 📞 Support & Troubleshooting

### Common Issues:

#### Issue: "Code already used" but user claims they haven't
**Solution:**
```sql
-- Check transaction history
SELECT * FROM credit_transactions 
WHERE user_id = USER_ID 
AND description LIKE '%KODE%'
ORDER BY created_at DESC;
```

#### Issue: Code not working (expired?)
**Solution:**
```sql
-- Check code status
SELECT * FROM promo_codes 
WHERE code = 'KODE';

-- Check if expired
-- valid_until should be > NOW()
```

#### Issue: Admin can't see users for a code
**Solution:**
- Refresh page
- Check browser console for errors
- Verify code ID is correct
- Check server logs

---

## 📋 Checklist

### System Status:
- ✅ Database migration (add_claim_codes.sql)
- ✅ Code validation (3 endpoints)
- ✅ Admin view users (API + UI)
- ✅ Transaction logging
- ✅ Error handling
- ✅ UI/UX polish
- ✅ Documentation
- ✅ Testing scripts

---

## 🎉 Summary

Sistem lengkap untuk mengelola **Promo Codes** dan **Claim Codes** dengan:

1. ✅ **Validasi Ketat**: Setiap kode hanya bisa dipakai sekali
2. ✅ **Admin Monitoring**: Lihat siapa saja yang pakai kode
3. ✅ **User Experience**: Interface jelas dan mudah dipakai
4. ✅ **Security**: Protected dari abuse dan fraud
5. ✅ **Analytics**: Data lengkap untuk business insights

---

**Version**: 1.0  
**Last Updated**: October 27, 2025  
**Status**: ✅ Production Ready  
**Tested**: ✅ All scenarios passed

---

## 🚀 Ready to Launch!

```bash
# Start the server
npm start

# Test as user
http://localhost:3000/billing

# Test as admin
http://localhost:3000/admin/promo-codes

# View documentation
cat CODE_VALIDATION_SYSTEM.md
cat ADMIN_VIEW_CODE_USERS.md
```

---

**Made with ❤️ for PIXELNEST**

