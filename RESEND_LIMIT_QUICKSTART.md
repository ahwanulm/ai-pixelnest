# ⚡ Resend Limit System - Quick Reference

## 🎯 Apa yang Diimplementasikan?

System pembatasan kirim ulang kode aktivasi untuk mencegah spam dan abuse.

---

## 📊 Rules

| Batasan | Nilai |
|---------|-------|
| **Max Resend** | 4x |
| **Lock Duration** | 24 jam |
| **Reset** | Setelah aktivasi berhasil |

---

## 🔄 User Flow

```
1st Resend → ✅ Success (3 sisa)
2nd Resend → ✅ Success (2 sisa)
3rd Resend → ✅ Success (1 sisa)
4th Resend → ✅ Success (0 sisa - terakhir!)
5th Resend → ❌ LOCKED 24h

If LOCKED:
  - Show: "Anda telah mencapai batas..."
  - Button: "🔄 Daftar dengan Email Lain"
  - Link to: /register
```

---

## 💻 Cara Testing

### **Test Normal:**
```bash
1. Register user@gmail.com
2. Klik "Kirim Ulang" 1x → Berhasil
3. Masukkan kode → Aktif ✅
4. resend_count reset ke 0
```

### **Test Limit:**
```bash
1. Register test@gmail.com
2. Klik "Kirim Ulang" 4x → Berhasil semua
3. Klik "Kirim Ulang" 5x → ❌ LOCKED
4. Tampil: "Daftar dengan Email Lain" button
```

---

## 📝 Database Check

```sql
-- Cek resend count user
SELECT email, resend_count, resend_locked_until 
FROM users 
WHERE email = 'user@gmail.com';

-- Cek user yang locked
SELECT email, resend_count, 
       resend_locked_until,
       EXTRACT(HOUR FROM (resend_locked_until - NOW())) as hours_left
FROM users 
WHERE resend_locked_until > NOW();
```

---

## 🎨 UI Messages

### **Success Resend:**
```
"Kode aktivasi baru telah dikirim ke email Anda. 
Sisa kesempatan kirim ulang: 3x"
```

### **Last Chance:**
```
"Kode aktivasi baru telah dikirim ke email Anda. 
Ini adalah kirim ulang terakhir Anda."
```

### **Locked:**
```
"Anda telah mencapai batas maksimal kirim ulang kode (4x). 
Silakan coba lagi dalam 24 jam atau gunakan opsi ganti email."

[🔄 Daftar dengan Email Lain]
```

---

## 🔧 Files Modified

1. ✅ `src/models/User.js`
   - Added: `checkResendLimit()`
   - Added: `resetResendCount()`
   - Updated: `updateActivationCode()`

2. ✅ `src/controllers/authController.js`
   - Updated: `resendActivationCode()`
   - Updated: `verifyActivation()`

3. ✅ `src/views/auth/verify-activation-compact.ejs`
   - Added: Lock state handling
   - Added: `showLockedMessage()` function
   - Updated: `resendCode()` function

4. ✅ `src/config/migrateResendLimit.js`
   - New migration script

---

## 🚀 Deployment

```bash
# Run migration
node src/config/migrateResendLimit.js

# Restart server
npm run dev
```

---

## ✅ Features

```
✅ Limit 4x resend per user
✅ Auto lock 24h setelah exceed
✅ Show remaining attempts
✅ Clear error messages
✅ "Ganti Email" option when locked
✅ Auto reset after activation
✅ Auto unlock after 24h
```

---

**Status**: ✅ Production Ready  
**Last Updated**: October 26, 2025

