# 🚀 Referral System - Quick Start Guide

## ✅ Installation Complete!

Migration berhasil dijalankan. Sistem referral sudah siap digunakan!

---

## 📊 What's Created:

### Database Tables
✅ `users` table updated (referral_code, referred_by, referral_earnings)
✅ `referral_transactions` table created
✅ `payout_requests` table created  
✅ `payout_settings` table created
✅ Indexes created for performance
✅ 4 existing users already have referral codes

### Default Settings
- **Minimum Payout:** Rp 50,000
- **Cooldown Period:** 7 hari
- **Signup Bonus:** Rp 5,000
- **Purchase Commission:** 5%
- **Status:** Active ✅

---

## 🎯 Quick Access URLs

### For Users:
```
📱 Referral Dashboard: http://localhost:5005/referral/dashboard
```

### For Admins:
```
👨‍💼 Admin Dashboard: http://localhost:5005/referral/admin/dashboard
📋 Payout Requests: http://localhost:5005/referral/admin/payout-requests
```

---

## 🧪 Quick Test

### Test 1: User Gets Referral Link
1. Login sebagai user
2. Buka: `http://localhost:5005/referral/dashboard`
3. Copy referral link (contoh: `http://localhost:5005/register?ref=ABC12XYZ`)

### Test 2: Register via Referral
1. Logout atau buka incognito window
2. Paste referral link di browser
3. Register account baru
4. ✅ Referrer langsung dapat bonus Rp 5,000!

### Test 3: Purchase Commission
1. Login sebagai user baru (yang direferensikan)
2. Top up credits (contoh: Rp 100,000)
3. Complete payment
4. ✅ Referrer dapat komisi 5% = Rp 5,000!

### Test 4: Request Payout
1. Login sebagai referrer
2. Buka dashboard referral
3. Request payout (min Rp 50,000)
4. ✅ Request masuk ke admin panel!

### Test 5: Admin Approve Payout
1. Login sebagai admin
2. Buka: `http://localhost:5005/referral/admin/payout-requests`
3. Click "Approve" pada request
4. Transfer dana ke user
5. Click "Mark as Completed"
6. ✅ User terima notifikasi!

---

## 📱 User Features

### Dashboard Sections:
1. **Statistics Cards**
   - Saldo tersedia
   - Total referrals
   - Payout pending
   - Total dibayarkan

2. **Referral Link Card**
   - Copy link button
   - Share ke WhatsApp, Telegram, Twitter, Facebook

3. **Request Payout Form**
   - Input amount
   - Select payment method (Bank, GoPay, OVO, DANA)
   - Input payment details

4. **History Tables**
   - Payout requests history
   - Referred users list
   - Transactions log

---

## 👨‍💼 Admin Features

### Dashboard:
- 📊 Statistics overview
- ⚙️ Configure settings
- 📖 Admin guide

### Payout Management:
- Filter by status (Pending, Processing, Completed, Rejected)
- View user details & payment info
- Approve/Reject requests
- Mark as completed
- Add admin notes

---

## ⚙️ Configuration

### Via Admin Panel:
1. Login sebagai admin
2. Buka: `http://localhost:5005/referral/admin/dashboard`
3. Scroll ke "Referral Settings"
4. Edit values:
   - Minimum Payout
   - Cooldown Days
   - Signup Bonus
   - Purchase Commission %
   - System Status (Active/Inactive)
5. Click "Simpan Pengaturan"

### Via Database:
```sql
UPDATE payout_settings SET
  minimum_payout = 100000,           -- Rp 100k
  payout_cooldown_days = 14,         -- 14 hari
  commission_per_signup = 10000,     -- Rp 10k
  commission_per_purchase = 10.00    -- 10%
WHERE id = 1;
```

---

## 🔔 Notifications

Users receive notifications for:
- 🎉 New referral signup (+Rp 5,000)
- 💰 Purchase commission earned
- ⏳ Payout request received
- ✅ Payout approved & processing
- 💸 Payout completed
- ❌ Payout rejected (dengan alasan)

Check notifications at: `/api/user/notifications`

---

## 🛠️ Troubleshooting

### Referral code not showing?
```bash
# Re-run migration
node src/config/migrateReferralSystem.js
```

### Commission not added?
1. Check `referred_by` column in users table
2. Check `referral_transactions` table
3. Check paymentController logs

### Cannot request payout?
- Ensure balance >= minimum payout (Rp 50,000)
- Check cooldown period (7 days)
- Check if previous request is still pending

---

## 📈 Monitoring

### Check Active Referrers:
```sql
SELECT 
  u.name,
  u.email,
  u.referral_code,
  u.referral_earnings,
  COUNT(DISTINCT u2.id) as total_referrals
FROM users u
LEFT JOIN users u2 ON u2.referred_by = u.id
WHERE u.referral_earnings > 0
GROUP BY u.id
ORDER BY u.referral_earnings DESC;
```

### Check Pending Payouts:
```sql
SELECT 
  pr.*,
  u.name,
  u.email
FROM payout_requests pr
JOIN users u ON u.id = pr.user_id
WHERE pr.status = 'pending'
ORDER BY pr.created_at DESC;
```

### Check Commission Stats:
```sql
SELECT 
  transaction_type,
  COUNT(*) as total_transactions,
  SUM(amount) as total_amount
FROM referral_transactions
GROUP BY transaction_type;
```

---

## 📞 Support Queries

### Get user's referral stats:
```javascript
const stats = await Referral.getReferralStats(userId);
console.log(stats);
```

### Get all pending payouts:
```javascript
const payouts = await Referral.getAllPayoutRequests('pending');
console.log(payouts);
```

### Update settings:
```javascript
await Referral.updatePayoutSettings({
  minimum_payout: 75000,
  payout_cooldown_days: 10,
  commission_rate: 10.00,
  commission_per_signup: 7500,
  commission_per_purchase: 7.50,
  is_active: true
});
```

---

## 🎨 UI Customization

### Change colors:
Edit in `src/views/auth/referral.ejs` atau `src/views/admin/referral-dashboard.ejs`

### Change text:
All text dapat diubah langsung di EJS files

### Add features:
Extend model methods di `src/models/Referral.js`

---

## 🔐 Security Checklist

✅ Routes protected dengan authentication
✅ Admin routes protected dengan authorization  
✅ SQL injection prevented (parameterized queries)
✅ XSS prevented (EJS escaping)
✅ CSRF protection (Express session)
✅ Balance validation before payout
✅ Cooldown period enforced
✅ Transaction logging

---

## 📚 Full Documentation

Untuk dokumentasi lengkap, lihat:
```
REFERRAL_SYSTEM_COMPLETE.md
```

---

## ✨ Tips & Best Practices

### For Users:
1. Share link di social media untuk reach lebih luas
2. Explain benefits ke calon referrals
3. Request payout saat sudah cukup saldo
4. Keep payment details accurate

### For Admins:
1. Process payouts dalam 1-3 hari kerja
2. Always verify payment details before transfer
3. Add clear notes for rejections
4. Monitor for suspicious activities
5. Adjust commission rates based on business goals

---

## 🎉 You're All Set!

Sistem referral sudah siap digunakan. Start promoting dan grow your user base! 🚀

**Happy Referring!** 💰

