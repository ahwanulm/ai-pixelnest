# ✅ Referral System - Testing Checklist

## 🎯 Overview
Sistem referral sudah diperbaiki untuk menangani:
- ✅ Registrasi Email/Password dengan referral code
- ✅ Registrasi Google OAuth dengan referral code  
- ✅ Direct referral links (`/register?ref=CODE`)
- ✅ Tracking dan logging lengkap

---

## 📋 Pre-Testing Setup

### 1. Start Server
```bash
cd /Users/ahwanulm/Desktop/PROJECT/PIXELNEST
npm start
# atau
node server.js
```

### 2. Pastikan Database Ready
```bash
# Check PostgreSQL running
psql -U postgres -d pixelnest_db -c "SELECT COUNT(*) FROM users;"

# Generate referral codes untuk existing users (jika perlu)
psql -U postgres -d pixelnest_db -f test_referral_queries.sql
```

### 3. Get Valid Referral Code
```sql
-- Ambil referral code dari user yang sudah ada
SELECT email, referral_code FROM users WHERE referral_code IS NOT NULL LIMIT 1;
```

**Contoh hasil: `EY6QZOEO`**

---

## 🧪 Test Cases

### ✅ Test 1: Direct Link Referral - Email/Password

**Steps:**
1. ✅ Buka browser (Incognito/Private mode)
2. ✅ Navigate to: `http://localhost:5005/register?ref=EY6QZOEO`
3. ✅ **Expected:** Redirect ke `/login?ref=EY6QZOEO`
4. ✅ **Expected:** Banner hijau muncul: "Kode referral aktif! Daftar sekarang dan dapatkan bonus"
5. ✅ Masukkan email Gmail baru: `testuser1@gmail.com`
6. ✅ Click "Continue"
7. ✅ **Expected:** Form registrasi muncul dengan email pre-filled
8. ✅ Isi data:
   - Name: Test User 1
   - Password: password123
   - Confirm Password: password123
   - Check Terms & Conditions
9. ✅ Click "Create Account"
10. ✅ **Expected:** Halaman verifikasi email muncul
11. ✅ Check email untuk activation code
12. ✅ Input activation code
13. ✅ **Expected:** Account activated, redirect to dashboard

**Verify:**
```sql
SELECT 
  email, 
  referred_by, 
  is_active,
  (SELECT referral_code FROM users WHERE id = users.referred_by) as used_code
FROM users 
WHERE email = 'testuser1@gmail.com';
```

**Expected Result:**
- `referred_by`: Should be ID of referrer
- `used_code`: Should be `EY6QZOEO`
- `is_active`: Should be `true` after activation

**Console Log Expected:**
```
✅ Referral code EY6QZOEO applied to user testuser1@gmail.com (Email/Password)
```

---

### ✅ Test 2: Direct Link Referral - Google OAuth

**Steps:**
1. ✅ Buka browser baru (Incognito/Private mode)
2. ✅ Navigate to: `http://localhost:5005/register?ref=EY6QZOEO`
3. ✅ **Expected:** Redirect ke `/login?ref=EY6QZOEO`
4. ✅ **Expected:** Banner hijau muncul
5. ✅ Click "Continue with Google"
6. ✅ **Expected:** Redirect ke Google OAuth
7. ✅ Login dengan Google account baru (atau yang belum terdaftar)
8. ✅ **Expected:** Redirect kembali ke `/dashboard`

**Verify:**
```sql
SELECT 
  email, 
  google_id,
  referred_by, 
  is_active,
  (SELECT referral_code FROM users WHERE id = users.referred_by) as used_code
FROM users 
WHERE email = 'your-google-email@gmail.com';
```

**Expected Result:**
- `google_id`: Should be filled
- `referred_by`: Should be ID of referrer
- `used_code`: Should be `EY6QZOEO`
- `is_active`: Should be `true` (auto-activated)

**Console Log Expected:**
```
🔗 Referral code saved to session: EY6QZOEO
✅ New user created via Google OAuth: your-google-email@gmail.com with referral code: EY6QZOEO
✅ Referral code EY6QZOEO applied to user your-google-email@gmail.com (Google OAuth)
```

---

### ✅ Test 3: Invalid Referral Code

**Steps:**
1. ✅ Navigate to: `http://localhost:5005/register?ref=INVALID123`
2. ✅ Register dengan email baru
3. ✅ Complete registration

**Verify:**
```sql
SELECT email, referred_by FROM users WHERE email = 'testinvalid@gmail.com';
```

**Expected Result:**
- `referred_by`: Should be `NULL` (invalid code)

**Console Log Expected:**
```
⚠️ Invalid referral code INVALID123 for user testinvalid@gmail.com
```

---

### ✅ Test 4: Registration Without Referral

**Steps:**
1. ✅ Navigate to: `http://localhost:5005/login` (no ref param)
2. ✅ **Expected:** NO banner muncul
3. ✅ Register normal tanpa referral code
4. ✅ Complete registration

**Verify:**
```sql
SELECT email, referred_by FROM users WHERE email = 'nonreferral@gmail.com';
```

**Expected Result:**
- `referred_by`: Should be `NULL`

**Console Log Expected:**
```
(No referral log - normal)
```

---

### ✅ Test 5: Referral Earnings (Purchase Commission)

**Pre-requisite:**
- User A dengan referral code: `EY6QZOEO`
- User B mendaftar dengan referral code A
- User B belum melakukan purchase

**Steps:**
1. ✅ Login sebagai User B
2. ✅ Beli credits (via payment)
3. ✅ Complete payment

**Verify:**
```sql
-- Check User A earnings
SELECT 
  email,
  referral_earnings
FROM users 
WHERE referral_code = 'EY6QZOEO';

-- Check transaction log
SELECT 
  rt.transaction_type,
  rt.amount,
  rt.description,
  referred_user.email as from_user
FROM referral_transactions rt
JOIN users referrer ON referrer.id = rt.referrer_id
JOIN users referred_user ON referred_user.id = rt.referred_user_id
WHERE referrer.referral_code = 'EY6QZOEO'
ORDER BY rt.created_at DESC;
```

**Expected Result:**
- User A `referral_earnings` increased
- Transaction log shows commission (5% of purchase)

**Console Log Expected:**
```
✅ Referral commission awarded: Rp 5,000 (Purchase 1/2)
```

---

## 🔍 Console Monitoring

### Saat Server Start:
```
✅ Queue manager initialized
✅ Google OAuth strategy initialized
🚀 PixelNest AI Automation Server running on http://localhost:5005
```

### Saat User Access Referral Link:
```
[Login Page Render]
(No specific log yet - normal)
```

### Saat User Click Google OAuth:
```
🔗 Referral code saved to session: EY6QZOEO
```

### Saat Google Callback (New User):
```
✅ New user created via Google OAuth: user@gmail.com with referral code: EY6QZOEO
✅ Referral code EY6QZOEO applied to user user@gmail.com (Google OAuth)
```

### Saat Email/Password Registration:
```
✅ Activation email sent to user@gmail.com with code: 123456
✅ Referral code EY6QZOEO applied to user user@gmail.com (Email/Password)
```

---

## 📊 Database Verification Queries

### Check All Referral Users
```sql
SELECT 
  u.email,
  u.name,
  CASE 
    WHEN u.google_id IS NOT NULL THEN 'Google OAuth'
    ELSE 'Email/Password'
  END as registration_method,
  referrer.email as referrer_email,
  referrer.referral_code as used_code,
  u.is_active,
  u.created_at
FROM users u
JOIN users referrer ON u.referred_by = referrer.id
ORDER BY u.created_at DESC;
```

### Check Referral Stats
```sql
SELECT 
  u.email,
  u.referral_code,
  COUNT(referred.id) as total_referrals,
  u.referral_earnings,
  COUNT(CASE WHEN referred.google_id IS NOT NULL THEN 1 END) as google_referrals,
  COUNT(CASE WHEN referred.password_hash IS NOT NULL THEN 1 END) as email_referrals
FROM users u
LEFT JOIN users referred ON referred.referred_by = u.id
WHERE u.referral_code IS NOT NULL
GROUP BY u.id
ORDER BY total_referrals DESC;
```

---

## ❌ Common Issues & Solutions

### Issue 1: Session not saving referral code
**Symptom:** Google OAuth users tidak ter-track referral

**Check:**
```sql
-- Check session table
SELECT * FROM sessions ORDER BY expire DESC LIMIT 5;
```

**Solution:**
- Pastikan `express-session` dan `connect-pg-simple` installed
- Restart server
- Clear browser cookies

---

### Issue 2: Invalid referral code accepted
**Symptom:** referred_by filled dengan ID yang salah

**Check:**
```sql
SELECT * FROM users WHERE referral_code = 'SUSPECTED_CODE';
```

**Solution:**
- Validate code exists sebelum set referred_by
- Check `Referral.getReferrerByCode()` function

---

### Issue 3: Referral earnings not calculated
**Symptom:** Commission tidak masuk setelah purchase

**Check:**
```sql
SELECT * FROM payout_settings;
SELECT * FROM referral_transactions ORDER BY created_at DESC LIMIT 10;
```

**Solution:**
- Pastikan `commission_per_purchase` di `payout_settings` ada value (default 5%)
- Check payment callback memanggil `Referral.addPurchaseCommission()`

---

## ✅ Sign-off Checklist

Sebelum mark as DONE:

- [ ] ✅ Test 1 passed (Email/Password with referral)
- [ ] ✅ Test 2 passed (Google OAuth with referral)
- [ ] ✅ Test 3 passed (Invalid referral code)
- [ ] ✅ Test 4 passed (No referral)
- [ ] ✅ Test 5 passed (Referral earnings)
- [ ] ✅ Console logs sesuai expected
- [ ] ✅ Database queries menunjukkan data benar
- [ ] ✅ No errors di console
- [ ] ✅ No linter errors
- [ ] ✅ Documentation lengkap

---

## 🚀 Production Deployment

Setelah semua test pass:

```bash
# 1. Commit changes
git add .
git commit -m "✅ Fix: Complete referral system - support Email/Password and Google OAuth"

# 2. Push to repository
git push origin main

# 3. Deploy ke production
# (Sesuaikan dengan deployment process Anda)

# 4. Monitor logs di production
pm2 logs pixelnest-api

# 5. Verify di production database
psql -U your_user -d production_db -f test_referral_queries.sql
```

---

**🎉 Sistem referral sekarang fully functional!**

**📊 Track metrics:**
- Total referrals
- Conversion rate (referral → active user)
- Referral earnings
- Top referrers

**🔗 Share referral links:**
```
https://yourdomain.com/register?ref=YOUR_CODE
```

