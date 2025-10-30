# 🎁 Referral System - README

## ✅ System Status: READY TO USE

Sistem referral lengkap sudah terimplementasi dan siap digunakan!

---

## 🚀 Quick Start

### 1. Migration (Sudah Selesai ✅)
```bash
# Already completed - 4 users have referral codes
✅ Database tables created
✅ Settings configured
✅ System ready
```

### 2. Access URLs

**For Users:**
```
📱 http://localhost:5005/referral/dashboard
```

**For Admins:**
```
👨‍💼 http://localhost:5005/referral/admin/dashboard
📋 http://localhost:5005/referral/admin/payout-requests
```

---

## 💰 How It Works

### User Flow:
```
1. User A gets referral link
   → http://localhost:5005/register?ref=ABC12XYZ

2. User B clicks link & registers
   → ✅ User A gets Rp 5,000 signup bonus

3. User B top up Rp 100,000
   → ✅ User A gets 5% commission (Rp 5,000)

4. User A requests payout (min Rp 50,000)
   → Admin approves & transfers
   → ✅ User A receives money
```

---

## ⚙️ Default Settings

- **Signup Bonus:** Rp 5,000 per user
- **Commission Rate:** 5% per purchase
- **Minimum Payout:** Rp 50,000
- **Cooldown Period:** 7 hari
- **Payment Methods:** Bank, GoPay, OVO, DANA

*Dapat diubah via admin dashboard*

---

## 📚 Documentation

- **Complete Guide:** `REFERRAL_SYSTEM_COMPLETE.md`
- **Quick Start:** `REFERRAL_QUICKSTART.md`
- **Summary:** `REFERRAL_SYSTEM_SUMMARY.md`

---

## 🔔 Features

### User Features:
- ✅ Unique referral link
- ✅ Auto commission tracking
- ✅ Beautiful dashboard
- ✅ Easy payout requests
- ✅ Real-time notifications

### Admin Features:
- ✅ Payout management
- ✅ Approve/Reject requests
- ✅ Configure settings
- ✅ Statistics overview
- ✅ Admin notes

---

## 🧪 Quick Test

```bash
# 1. Start server
npm start

# 2. Login as user
http://localhost:5005/login

# 3. Go to referral dashboard
http://localhost:5005/referral/dashboard

# 4. Copy & share your link! 🎉
```

---

## 📞 Need Help?

- Check `REFERRAL_QUICKSTART.md` for detailed guide
- Check `REFERRAL_SYSTEM_COMPLETE.md` for full documentation
- Check database tables for data verification

---

## ✨ Key Files

```
Backend:
├── src/models/Referral.js
├── src/controllers/referralController.js
└── src/routes/referral.js

Frontend:
├── src/views/auth/referral.ejs
├── src/views/admin/payout-requests.ejs
└── src/views/admin/referral-dashboard.ejs

Database:
└── src/config/migrateReferralSystem.js
```

---

**🎉 Ready to grow your business with referrals!**

Start promoting dan let users bring more users! 💰

