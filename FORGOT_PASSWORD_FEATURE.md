# 🔐 Forgot Password Feature - PixelNest

Fitur lengkap untuk reset password dengan verifikasi email menggunakan kode 6 digit.

## 📋 Daftar Isi

1. [Fitur Utama](#fitur-utama)
2. [Instalasi](#instalasi)
3. [Alur Kerja](#alur-kerja)
4. [File yang Dibuat/Dimodifikasi](#file-yang-dibuatdimodifikasi)
5. [Endpoint API](#endpoint-api)
6. [Database Schema](#database-schema)
7. [Cara Penggunaan](#cara-penggunaan)
8. [Testing](#testing)
9. [Keamanan](#keamanan)

---

## 🎯 Fitur Utama

✅ **Halaman Forgot Password**
- Form input email yang elegan dengan design konsisten
- Validasi email yang sudah terdaftar
- Pengecekan status akun (aktif/tidak aktif)
- Validasi untuk akun Google-only (tidak bisa reset password)

✅ **Email Notification**
- Pengiriman kode reset 6 digit ke email pengguna
- Template email yang profesional dan responsive
- Kode berlaku selama 15 menit
- Email berisi instruksi lengkap cara reset password

✅ **Reset Password Page**
- Input kode verifikasi 6 digit
- Form password baru dengan validasi
- Konfirmasi password
- Fitur "Kirim Ulang Kode" dengan cooldown
- Live validation

✅ **Security Features**
- Kode reset expire dalam 15 menit
- Maksimal 5 percobaan verifikasi kode
- Password harus minimal 8 karakter
- Password di-hash dengan bcrypt (salt rounds: 10)
- Kode reset hanya bisa digunakan sekali

---

## 🚀 Instalasi

### 1. Run Database Migration

Jalankan migration script untuk menambahkan kolom password reset di tabel users:

```bash
node src/config/migratePasswordReset.js
```

Script ini akan menambahkan 3 kolom baru:
- `password_reset_code` (VARCHAR(6))
- `password_reset_expires_at` (TIMESTAMP)
- `password_reset_attempts` (INTEGER)

### 2. Verifikasi Email Configuration

Pastikan file `.env` sudah dikonfigurasi dengan benar:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
BASE_URL=http://localhost:5005
```

**Cara mendapatkan Gmail App Password:**
1. Buka Google Account Settings
2. Security → 2-Step Verification
3. App passwords → Generate
4. Copy password ke `.env`

### 3. Restart Server

Setelah migration, restart aplikasi:

```bash
npm start
# atau
node server.js
```

---

## 🔄 Alur Kerja

### User Flow:

```
1. User klik "Lupa password?" di halaman login/password
   ↓
2. Masukkan email → Submit
   ↓
3. Sistem validasi:
   - Apakah email terdaftar?
   - Apakah akun sudah aktif?
   - Apakah punya password? (bukan Google-only)
   ↓
4. Generate kode reset 6 digit + expiry time
   ↓
5. Kirim email dengan kode reset
   ↓
6. User diarahkan ke halaman reset password
   ↓
7. User masukkan:
   - Kode verifikasi (6 digit)
   - Password baru
   - Konfirmasi password
   ↓
8. Sistem validasi:
   - Kode benar & belum expired?
   - Password match?
   - Password minimal 8 karakter?
   ↓
9. Update password (hash dengan bcrypt)
   ↓
10. Clear kode reset dari database
   ↓
11. Redirect ke login dengan success message
```

---

## 📁 File yang Dibuat/Dimodifikasi

### File Baru:

**Views:**
- `src/views/auth/forgot-password.ejs` - Halaman input email
- `src/views/auth/reset-password.ejs` - Halaman reset password dengan kode

**Config/Migration:**
- `src/config/migratePasswordReset.js` - Database migration script

**Documentation:**
- `FORGOT_PASSWORD_FEATURE.md` - Dokumentasi lengkap fitur

### File yang Dimodifikasi:

**Models:**
- `src/models/User.js`
  - `setPasswordResetCode()` - Set kode reset & expiry
  - `verifyPasswordResetCode()` - Verify kode reset
  - `resetPassword()` - Update password baru
  - `incrementPasswordResetAttempts()` - Track failed attempts
  - `getPasswordResetStatus()` - Get status reset

**Controllers:**
- `src/controllers/authController.js`
  - `showForgotPassword()` - Render forgot password page
  - `forgotPassword()` - Handle forgot password request
  - `showResetPassword()` - Render reset password page
  - `resetPassword()` - Handle reset password
  - `resendResetCode()` - Resend kode reset
  - `showLogin()` - Added success message support

**Routes:**
- `src/routes/auth.js`
  - `GET /forgot-password`
  - `POST /auth/forgot-password`
  - `GET /reset-password`
  - `POST /auth/reset-password`
  - `POST /auth/resend-reset-code`

**Services:**
- `src/services/emailService.js`
  - `sendPasswordResetCode()` - Send email with reset code

**Views:**
- `src/views/auth/login.ejs` - Added success message display
- `src/views/auth/password.ejs` - Fixed "Lupa password?" link

---

## 🌐 Endpoint API

### 1. Show Forgot Password Page
```
GET /forgot-password
Query params: ?error=... atau ?success=...
```

### 2. Request Password Reset
```
POST /auth/forgot-password
Body: { email: "user@example.com" }
Response: Redirect to reset password page
```

### 3. Show Reset Password Page
```
GET /reset-password?email=user@example.com
Response: Reset password form
```

### 4. Reset Password
```
POST /auth/reset-password
Body: {
  email: "user@example.com",
  resetCode: "123456",
  newPassword: "newpassword123",
  confirmPassword: "newpassword123"
}
Response: Redirect to /login?success=...
```

### 5. Resend Reset Code
```
POST /auth/resend-reset-code
Body: { email: "user@example.com" }
Response: JSON { success: true, message: "..." }
```

---

## 🗄️ Database Schema

### Kolom Baru di Tabel `users`:

```sql
-- Kode reset password (6 digit)
password_reset_code VARCHAR(6)

-- Waktu expiry kode reset (15 menit dari generate)
password_reset_expires_at TIMESTAMP

-- Jumlah percobaan verifikasi kode yang gagal
password_reset_attempts INTEGER DEFAULT 0
```

### Lifecycle:

1. **Request Reset:**
   - `password_reset_code` = "123456"
   - `password_reset_expires_at` = NOW() + 15 minutes
   - `password_reset_attempts` = 0

2. **Failed Verification:**
   - `password_reset_attempts` += 1
   - Jika >= 5, tampilkan error "Terlalu banyak percobaan"

3. **Success Reset:**
   - `password_hash` = bcrypt(newPassword)
   - `password_reset_code` = NULL
   - `password_reset_expires_at` = NULL
   - `password_reset_attempts` = 0

---

## 📖 Cara Penggunaan

### Untuk User:

1. **Lupa Password:**
   - Klik "Lupa password?" di halaman login
   - Masukkan email yang terdaftar
   - Klik "Kirim Kode Reset"

2. **Cek Email:**
   - Buka inbox email (atau spam folder)
   - Cari email dari PixelNest
   - Copy kode 6 digit

3. **Reset Password:**
   - Masukkan kode 6 digit
   - Buat password baru (min 8 karakter)
   - Konfirmasi password
   - Klik "Reset Password"

4. **Login:**
   - Kembali ke halaman login
   - Login dengan password baru

### Untuk Developer:

**Test Email Service:**
```javascript
const emailService = require('./src/services/emailService');

// Verify connection
emailService.verifyConnection();

// Send test reset email
emailService.sendPasswordResetCode(
  'test@example.com',
  'Test User',
  '123456'
);
```

**Test Password Reset Flow:**
```javascript
const User = require('./src/models/User');

// Set reset code
const resetCode = '123456';
const expiry = new Date(Date.now() + 15 * 60 * 1000);
await User.setPasswordResetCode('user@example.com', resetCode, expiry);

// Verify code
const user = await User.verifyPasswordResetCode('user@example.com', '123456');

// Reset password
const updated = await User.resetPassword('user@example.com', '123456', 'newpass123');
```

---

## 🧪 Testing

### Manual Testing Checklist:

**Test 1: Email Tidak Terdaftar**
- [ ] Input email yang tidak ada di database
- [ ] Harus muncul error "Email tidak terdaftar"

**Test 2: Akun Belum Diaktivasi**
- [ ] Input email user yang belum aktivasi
- [ ] Harus muncul error "Akun belum diaktivasi"

**Test 3: Google-Only Account**
- [ ] Input email user yang login via Google (no password)
- [ ] Harus muncul error "Akun terdaftar via Google"

**Test 4: Email Valid**
- [ ] Input email user dengan password
- [ ] Harus terkirim email dengan kode reset
- [ ] Redirect ke halaman reset password

**Test 5: Kode Salah**
- [ ] Masukkan kode yang salah
- [ ] Harus muncul error "Kode tidak valid"
- [ ] Attempts counter increment

**Test 6: Kode Expired**
- [ ] Tunggu > 15 menit setelah request reset
- [ ] Masukkan kode (yang sudah expired)
- [ ] Harus muncul error "Kode kadaluarsa"

**Test 7: Password Tidak Match**
- [ ] Masukkan kode yang benar
- [ ] Password dan confirm password berbeda
- [ ] Harus muncul error "Password tidak cocok"

**Test 8: Password Terlalu Pendek**
- [ ] Masukkan password < 8 karakter
- [ ] Harus muncul error "Password minimal 8 karakter"

**Test 9: Success Reset**
- [ ] Masukkan kode yang benar
- [ ] Password baru valid (>= 8 char, match)
- [ ] Harus sukses reset
- [ ] Redirect ke login dengan success message
- [ ] Bisa login dengan password baru

**Test 10: Resend Code**
- [ ] Klik "Kirim Ulang Kode"
- [ ] Harus terkirim email baru
- [ ] Kode lama tidak valid lagi

**Test 11: Max Attempts**
- [ ] Input kode salah 5x
- [ ] Harus muncul error "Terlalu banyak percobaan"
- [ ] Harus request kode baru

---

## 🔒 Keamanan

### Security Measures:

1. **Rate Limiting:**
   - Max 5 percobaan verifikasi kode
   - Setelah itu harus request kode baru

2. **Code Expiry:**
   - Kode reset expire dalam 15 menit
   - Tidak bisa digunakan setelah expired

3. **One-Time Use:**
   - Kode reset hanya bisa digunakan 1x
   - Setelah sukses reset, kode di-clear dari database

4. **Password Hashing:**
   - Password di-hash dengan bcrypt
   - Salt rounds: 10
   - Password lama tidak bisa di-recover

5. **Email Verification:**
   - Kode dikirim ke email terdaftar
   - User harus akses email untuk mendapatkan kode

6. **Input Validation:**
   - Email format validation
   - Password length validation (min 8)
   - Password match validation
   - Trim whitespace dari kode

7. **Account Status Check:**
   - Hanya akun aktif yang bisa reset password
   - Akun Google-only tidak bisa reset (redirect ke Google login)

### Best Practices:

- ✅ Jangan tampilkan apakah email terdaftar atau tidak (optional, saat ini ditampilkan untuk UX)
- ✅ Log semua aktivitas reset password
- ✅ Kirim email notifikasi setelah password berhasil direset
- ✅ Gunakan HTTPS di production
- ✅ Implement CSRF protection
- ✅ Add honeypot field untuk anti-bot

---

## 📧 Email Template

Email yang dikirim menggunakan template HTML responsive dengan:
- ✅ Logo PixelNest
- ✅ Kode reset yang jelas (font besar, monospace)
- ✅ Countdown timer (15 menit)
- ✅ Instruksi step-by-step
- ✅ Warning message (kode expired & one-time use)
- ✅ Security note (jika tidak request, abaikan)
- ✅ Footer dengan copyright

---

## 🎨 UI/UX Design

Design konsisten dengan halaman login existing:
- ✅ Dark theme dengan gradient background
- ✅ Glass morphism effect
- ✅ Smooth animations (slide-in)
- ✅ Purple/Violet gradient buttons
- ✅ Input dengan icon & glow effect
- ✅ Error/Success alerts dengan icon
- ✅ Responsive mobile-first design

---

## 🐛 Troubleshooting

### Email Tidak Terkirim

**Problem:** User tidak menerima email reset code

**Solution:**
1. Check email service configuration:
   ```bash
   node -e "require('./src/services/emailService').verifyConnection()"
   ```

2. Check `.env` file:
   - `EMAIL_USER` harus valid Gmail address
   - `EMAIL_PASSWORD` harus App Password (bukan password Gmail biasa)

3. Check spam folder

4. Check email service logs di console

### Kode Tidak Valid

**Problem:** User input kode yang benar tapi tetap error

**Solution:**
1. Check apakah kode sudah expired (> 15 menit)
2. Check apakah user sudah input kode salah >= 5x
3. Check database langsung:
   ```sql
   SELECT email, password_reset_code, password_reset_expires_at, password_reset_attempts 
   FROM users 
   WHERE email = 'user@example.com';
   ```

### Migration Error

**Problem:** Migration script gagal

**Solution:**
1. Check database connection
2. Check apakah tabel `users` exist
3. Run migration manual:
   ```sql
   ALTER TABLE users ADD COLUMN password_reset_code VARCHAR(6);
   ALTER TABLE users ADD COLUMN password_reset_expires_at TIMESTAMP;
   ALTER TABLE users ADD COLUMN password_reset_attempts INTEGER DEFAULT 0;
   ```

---

## 📝 Notes

- Fitur ini menggunakan kode 6 digit (sama seperti activation code)
- Email service menggunakan Nodemailer dengan Gmail SMTP
- Password di-hash menggunakan bcrypt (10 salt rounds)
- Kode reset expire dalam 15 menit (sama seperti activation code)
- Max 5 percobaan verifikasi kode (prevent brute force)

---

## 🚀 Future Improvements

Potensi enhancement di masa depan:

1. **SMS OTP** - Alternative verification via SMS
2. **2FA** - Two-factor authentication
3. **Password Strength Meter** - Visual password strength indicator
4. **Password History** - Prevent reuse of recent passwords
5. **IP Tracking** - Log IP address untuk security audit
6. **Email Notification** - Send email after successful password reset
7. **Rate Limiting** - Limit request per IP/user
8. **Captcha** - Add reCAPTCHA untuk prevent bot
9. **Session Invalidation** - Logout all devices after password reset
10. **Magic Link** - Alternative to code (link with token)

---

## 👨‍💻 Developer

Created by: PixelNest Development Team
Date: October 2025
Version: 1.0.0

---

## 📄 License

Copyright © 2025 PixelNest - AI Automation Platform

