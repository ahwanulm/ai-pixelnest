# 🎁 Referral System - Complete Documentation

## ✨ Overview

Sistem referral PixelNest memungkinkan user untuk mendapatkan penghasilan dengan mengajak user baru. Sistem ini terintegrasi penuh dengan payment system dan admin panel.

---

## 🎯 Fitur Utama

### 👥 User Features
1. **Unique Referral Link**
   - Setiap user mendapat link referral unik
   - Format: `https://pixelnest.id/register?ref=ABC123`
   - Dark themed card dengan shimmer effect

2. **Real-time Earnings Tracking**
   - Total referrals
   - Available for payout
   - Pending payout
   - Total paid out

3. **Payout Request System**
   - Minimum payout: Rp 25,000
   - Cooldown period: 7 hari
   - Multiple payment methods: Bank Transfer, E-wallet, Crypto

4. **Transaction History**
   - Signup bonus tracking
   - Purchase commission tracking
   - Payout history

5. **Referred Users List**
   - View all referred users
   - Track their registration date
   - Monitor total earnings from each referral

### 🛠️ Admin Features
1. **Dashboard Overview**
   - Total transactions
   - Total payouts
   - Pending requests
   - System statistics

2. **Payout Management**
   - Review payout requests
   - Process/Complete payouts
   - Reject with custom messages
   - Status tracking (pending, processing, completed, failed)

3. **System Settings**
   - Enable/Disable referral system
   - Set minimum payout amount
   - Configure cooldown days
   - Adjust commission rates
   - Set signup bonus

---

## 💰 Commission Structure

### Default Settings:
- **Signup Bonus**: Rp 5,000 per new user
- **Purchase Commission**: 5% dari setiap pembelian
- **Minimum Payout**: Rp 25,000
- **Payout Cooldown**: 7 hari

### How It Works:
1. User A shares referral link
2. User B registers using the link → User A earns Rp 5,000
3. User B buys credits → User A earns 5% commission
4. User A requests payout when balance ≥ Rp 25,000
5. Admin processes payout request

---

## 📊 Database Schema

### Tables Created:
1. **referral_transactions**
   - Tracks all referral earnings
   - Signup bonuses
   - Purchase commissions

2. **payout_requests**
   - Manages payout requests
   - Status tracking
   - Payment details
   - Admin notes

3. **payout_settings**
   - System configuration
   - Commission rates
   - Minimum amounts
   - Active/Inactive status

### User Table Updates:
- `referral_code` (unique)
- `referred_by` (FK to users)
- `referral_earnings` (decimal)

---

## 🎨 UI/UX Design

### User Interface:
- **Consistent Header Navigation**
  - Menu: Dashboard → Tutorial → Billing → Gallery → **Referral**
  - Tanpa icon, clean text only
  - Active state indicator

- **Referral Dashboard**
  - Dark glassmorphism theme
  - 4 stats cards dengan gradient
  - Interactive copy & share buttons
  - Payout request form
  - Transaction history table
  - Referred users list

- **Mobile Responsive**
  - Grid adjusts dari 4 kolom → 2 kolom → 1 kolom
  - Touch-optimized buttons
  - Responsive typography

### Admin Interface:
- **Consistent Admin Layout**
  - Sidebar navigation
  - Header dengan page title
  - Data tables dengan sorting
  - Action buttons

- **Payout Management**
  - Color-coded status badges
  - Quick action buttons
  - Modal untuk complete/reject
  - Real-time status updates

---

## 🔗 Navigation Structure

### User Pages (All Have Referral Link):
1. `/dashboard` → Main dashboard
2. `/tutorial` → Tutorial page
3. `/billing` → Billing & history
4. `/gallery` → User gallery
5. `/profile` → User profile
6. `/usage` → Usage statistics
7. `/referral/dashboard` → Referral dashboard ✨

### Profile Dropdown Menu:
- Profile
- Request Model AI
- Usage
- Billing
- **Referral Program** (tanpa icon)
- Settings
- Logout

### Admin Pages:
- `/referral/admin/dashboard` → Referral overview
- `/referral/admin/payout-requests` → Manage payouts

---

## 🚀 Active/Inactive Status

### When System is Active:
- User dapat melihat referral link
- User dapat request payout
- Earnings tetap tracked
- Full functionality

### When System is Inactive:
- User melihat alert: "⚠️ Sistem referral sedang dalam maintenance"
- Referral link & stats hidden
- Payout request disabled
- Copy & share buttons disabled
- Transaction history tetap visible

### Admin Control:
Admin dapat toggle status dari:
`/referral/admin/dashboard` → Settings tab → Update Settings

---

## 🎯 Integration Points

### 1. Registration (authController.js)
```javascript
// Accepts referral code during registration
const { referralCode } = req.body;
if (referralCode) {
  await Referral.setReferredBy(user.id, referralCode);
}
```

### 2. Payment (paymentController.js)
```javascript
// Awards commission on successful payment
if (payment_status === 'PAID') {
  await Referral.addPurchaseCommission(userId, amount);
}
```

### 3. Routes (server.js)
```javascript
app.use('/referral', referralRouter);
```

---

## 📋 Payment Methods Available

1. **Bank Transfer**
   - Input: Bank name + account number

2. **E-wallet**
   - Options: GoPay, OVO, Dana, ShopeePay
   - Input: Phone number

3. **Cryptocurrency**
   - Options: Bitcoin (BTC), Ethereum (ETH), USDT
   - Input: Wallet address

---

## ✅ Key Features Summary

| Feature | Status |
|---------|--------|
| Unique referral codes | ✅ Active |
| Signup bonus | ✅ Rp 5,000 |
| Purchase commission | ✅ 5% |
| Minimum payout | ✅ Rp 25,000 |
| Payout cooldown | ✅ 7 days |
| Multiple payment methods | ✅ 3 types |
| Admin management | ✅ Complete |
| Real-time tracking | ✅ Active |
| Mobile responsive | ✅ Optimized |
| Dark theme UI | ✅ Consistent |
| Active/Inactive toggle | ✅ Working |
| Navigation consistency | ✅ All pages |

---

## 🔒 Security Features

1. **Referral Code Validation**
   - Unique codes only
   - Self-referral prevention
   - Code expiry (optional)

2. **Payout Protection**
   - Minimum amount enforcement
   - Cooldown period check
   - Single pending request limit
   - Admin approval required

3. **Commission Tracking**
   - Immutable transaction logs
   - Audit trail
   - Balance verification

---

## 📱 User Journey

### New User Referral Flow:
1. User A opens `/referral/dashboard`
2. Copies unique referral link
3. Shares link to User B
4. User B clicks link → redirected to `/register?ref=ABC123`
5. User B registers → User A earns Rp 5,000 instantly
6. User B purchases credits → User A earns 5% commission
7. User A requests payout when balance ≥ Rp 25,000
8. Admin reviews and processes payout
9. User A receives payment confirmation

---

## 🎨 Design Consistency

### Header Menu Structure (All Pages):
```
[Logo] PIXELNEST  /  [Page Title]

Navigation:
- Dashboard
- Tutorial  
- Billing
- Gallery
- Referral  ← (no icon, consistent everywhere)

[Credits Display] [Top-up Button] [Profile Avatar]
```

### Profile Dropdown:
```
[User Info]
---
Profile
Request Model AI
Usage  
Billing
Referral Program  ← (no icon)
---
[Admin Panel] (if admin)
---
Settings
Logout
```

---

## 🛠️ Files Modified/Created

### Backend:
- `src/config/migrateReferralSystem.js` - Database migration
- `src/models/Referral.js` - Referral model
- `src/controllers/referralController.js` - Business logic
- `src/routes/referral.js` - API routes
- `src/controllers/authController.js` - Registration integration
- `src/controllers/paymentController.js` - Payment integration

### Frontend:
- `src/views/auth/referral.ejs` - User dashboard
- `src/views/admin/referral-dashboard.ejs` - Admin overview
- `src/views/admin/payout-requests.ejs` - Payout management
- `src/views/auth/register.ejs` - Registration with referral
- `src/views/partials/header.ejs` - Profile dropdown
- `src/views/partials/admin-sidebar.ejs` - Admin navigation

### All User Pages Updated:
- `src/views/auth/dashboard.ejs` ✅
- `src/views/auth/billing.ejs` ✅
- `src/views/auth/gallery.ejs` ✅
- `src/views/auth/tutorial.ejs` ✅
- `src/views/auth/profile.ejs` ✅
- `src/views/auth/usage.ejs` ✅

---

## 🎉 Completion Status

✅ **System is 100% Functional**

- [x] Database schema created
- [x] Backend logic implemented
- [x] User dashboard with dark theme
- [x] Admin management panel
- [x] Payment integration
- [x] Registration integration
- [x] Payout request system
- [x] Transaction tracking
- [x] Active/Inactive status
- [x] Navigation consistency (all pages)
- [x] Remove icons from referral links
- [x] Mobile responsive
- [x] Security measures
- [x] Minimum payout set to Rp 25,000

---

## 📞 Support

Untuk pertanyaan atau masalah terkait referral system:
1. Check admin dashboard untuk sistem stats
2. Review payout settings di admin panel
3. Verify database migration success
4. Check user referral_earnings balance

---

**Last Updated**: October 26, 2025  
**Version**: 1.0  
**Status**: Production Ready ✅
