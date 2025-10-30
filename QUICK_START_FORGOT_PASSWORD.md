# 🚀 Quick Start - Forgot Password

## ⚡ TL;DR

Fitur forgot password sudah **100% selesai** dan siap digunakan!

---

## 🎯 Test Sekarang (3 Langkah)

### 1️⃣ Buka Browser
```
http://localhost:5005/forgot-password
```

### 2️⃣ Masukkan Email
- Email harus sudah terdaftar di sistem
- Akun harus sudah aktif
- Harus punya password (bukan Google-only)

### 3️⃣ Cek Email & Reset
- Buka inbox email (atau spam folder)
- Copy kode 6 digit
- Input kode + password baru
- Done! ✅

---

## 📋 What's Created

### Frontend (2 Pages)
1. **Forgot Password Page** - Input email
2. **Reset Password Page** - Input kode + password baru

### Backend (Complete)
- ✅ 5 new User model methods
- ✅ 4 new controller methods  
- ✅ 5 new routes
- ✅ 1 email template
- ✅ Database migration (completed)

### Database
- ✅ `password_reset_code` column
- ✅ `password_reset_expires_at` column
- ✅ `password_reset_attempts` column

---

## 🔗 Links to Try

```
Login: http://localhost:5005/login
Forgot Password: http://localhost:5005/forgot-password
Reset Password: http://localhost:5005/reset-password?email=test@example.com
```

---

## 📧 Email Configuration

Make sure `.env` has:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
```

**Get Gmail App Password:**
1. Google Account → Security
2. 2-Step Verification → App passwords
3. Generate → Copy to .env

---

## ✅ Features

- 🔐 Secure 6-digit code
- ⏱️ 15-minute expiry
- 🚫 Max 5 attempts
- 🔄 Resend code option
- 📱 Mobile responsive
- 🎨 Beautiful UI
- 📧 Professional email template
- 🔒 Bcrypt password hashing

---

## 🎨 Screenshots

**Forgot Password Page:**
- Clean input form
- Email validation
- Error/Success messages

**Reset Password Page:**
- Code input (6 digits)
- New password input
- Password confirmation
- Resend code button

**Email Template:**
- PixelNest branding
- Clear 6-digit code
- Step-by-step instructions
- Security warnings

---

## 🐛 Common Issues

**Email tidak terkirim?**
→ Check EMAIL_USER & EMAIL_PASSWORD di .env

**Kode tidak valid?**
→ Check apakah sudah expired (> 15 menit)

**Too many attempts?**
→ Request kode baru

**Account not active?**
→ Aktivasi akun dulu

**Google account?**
→ Login pakai Google, tidak bisa reset password

---

## 📚 Full Documentation

Baca dokumentasi lengkap di:
- `FORGOT_PASSWORD_FEATURE.md` - Full documentation
- `FORGOT_PASSWORD_SUMMARY.md` - Summary & overview

---

## 🎉 That's It!

Fitur forgot password sudah siap. Happy coding! 🚀

---

*PixelNest - AI Automation Platform*

