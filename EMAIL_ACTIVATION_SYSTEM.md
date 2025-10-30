# 📧 Sistem Aktivasi Email - PixelNest

Sistem aktivasi email dengan kode OTP (One-Time Password) untuk memverifikasi registrasi pengguna baru.

## 🎯 Fitur Utama

### ✅ Validasi Gmail Wajib
- **Registrasi hanya untuk Gmail**: Sistem memvalidasi bahwa email yang digunakan harus berakhiran `@gmail.com`
- **Validasi di frontend dan backend**: Double protection untuk memastikan hanya Gmail yang diterima
- **Error message yang jelas**: User mendapat notifikasi yang informatif jika mencoba registrasi dengan non-Gmail

### 🔐 Kode Aktivasi Sekali Pakai
- **6 digit random code**: Kode numerik acak yang mudah diingat
- **Berlaku 15 menit**: Kode otomatis kadaluarsa setelah 15 menit dikirim
- **Single-use**: Kode hanya dapat digunakan sekali dan dihapus setelah aktivasi berhasil
- **Rate limiting**: Maksimal 5 percobaan verifikasi sebelum harus request kode baru

### 📨 Email Template Professional
- **HTML email template**: Email dengan design modern dan responsive
- **Gradient theme**: Menggunakan brand colors (violet & fuchsia)
- **Informasi lengkap**: Instruksi jelas, waktu kadaluarsa, dan warning
- **Welcome email**: Email selamat datang otomatis setelah aktivasi berhasil

### 🔄 Resend Functionality
- **Kirim ulang kode**: User dapat request kode baru jika tidak menerima atau kode kadaluarsa
- **Cooldown timer**: 60 detik cooldown sebelum dapat kirim ulang
- **Reset attempts**: Counter percobaan gagal direset saat kirim ulang
- **AJAX implementation**: Kirim ulang tanpa reload halaman

## 📁 Struktur File

```
src/
├── config/
│   └── migrateEmailActivation.js      # Database migration
├── controllers/
│   └── authController.js               # Controller dengan activation logic
├── models/
│   └── User.js                         # User model dengan activation methods
├── services/
│   └── emailService.js                 # Email sending service dengan Nodemailer
├── views/
│   └── auth/
│       ├── verify-activation.ejs       # Halaman verifikasi
│       └── register.ejs                # Halaman registrasi (updated)
└── routes/
    └── auth.js                         # Routes dengan activation endpoints
```

## 🗄️ Database Schema

### Kolom Baru di Table `users`

```sql
ALTER TABLE users 
ADD COLUMN is_active BOOLEAN DEFAULT FALSE,                    -- Status aktivasi akun
ADD COLUMN activation_code VARCHAR(6),                          -- Kode aktivasi 6 digit
ADD COLUMN activation_code_expires_at TIMESTAMP,               -- Waktu kadaluarsa kode
ADD COLUMN activation_attempts INTEGER DEFAULT 0,              -- Counter percobaan verifikasi
ADD COLUMN activated_at TIMESTAMP;                             -- Timestamp aktivasi
```

### Indexes untuk Performa

```sql
CREATE INDEX idx_users_activation_code ON users(activation_code) 
WHERE activation_code IS NOT NULL;

CREATE INDEX idx_users_is_active ON users(is_active);
```

## 🚀 Setup & Installation

### 1. Install Dependencies

```bash
npm install nodemailer
```

### 2. Konfigurasi Environment Variables

Tambahkan ke file `.env`:

```env
# Email Configuration (Gmail SMTP)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Optional: Base URL untuk link di email
BASE_URL=http://localhost:3000
```

**⚠️ PENTING:** Untuk `EMAIL_PASSWORD`, gunakan **App Password** bukan password Gmail biasa.

#### Cara Generate Gmail App Password:

1. Buka [Google Account Settings](https://myaccount.google.com/)
2. Pilih **Security** → **2-Step Verification** (aktifkan jika belum)
3. Scroll ke bawah → **App passwords**
4. Pilih **Mail** dan device Anda
5. Copy 16-digit password yang digenerate
6. Paste ke `.env` sebagai `EMAIL_PASSWORD`

### 3. Jalankan Database Migration

```bash
npm run migrate:email-activation
```

Output yang diharapkan:
```
🔄 Starting email activation migration...
📝 Adding activation columns to users table...
✅ Activating existing users...
📊 Creating indexes...
✅ Email activation migration completed successfully!
```

### 4. Restart Server

```bash
npm start
# atau untuk development
npm run dev
```

## 📖 User Flow

### Alur Registrasi Pengguna Baru

```
1. User membuka /login
   ↓
2. User memasukkan email Gmail
   ↓
3. Sistem validasi format email (@gmail.com)
   ↓
4. Sistem cek apakah email sudah terdaftar
   ↓
5. Jika belum terdaftar → Redirect ke halaman registrasi
   ↓
6. User mengisi form registrasi lengkap
   ↓
7. Submit form → Backend:
   - Validasi Gmail
   - Hash password
   - Generate 6-digit activation code
   - Set expiry 15 menit dari sekarang
   - Simpan user dengan is_active = FALSE
   ↓
8. Kirim email dengan kode aktivasi
   ↓
9. Redirect ke halaman verifikasi
   ↓
10. User cek email dan dapatkan kode
    ↓
11. User input 6-digit code di halaman verifikasi
    ↓
12. Backend verify:
    - Cek kode match
    - Cek belum kadaluarsa
    - Cek attempts < 5
    ↓
13. Jika valid:
    - Set is_active = TRUE
    - Set activated_at = NOW()
    - Hapus activation_code
    - Kirim welcome email
    - Auto-login user
    - Redirect ke /dashboard
```

### Alur Login User yang Belum Aktivasi

```
1. User masukkan email di /login
   ↓
2. Sistem cek: User exists tapi is_active = FALSE
   ↓
3. Redirect ke halaman verifikasi
   ↓
4. User dapat kirim ulang kode atau input kode yang ada
```

### Alur Resend Activation Code

```
1. User klik "Kirim Ulang Kode"
   ↓
2. AJAX POST ke /auth/resend-activation
   ↓
3. Backend:
   - Generate kode baru
   - Set expiry baru (15 menit)
   - Reset activation_attempts = 0
   - Kirim email
   ↓
4. Response JSON success
   ↓
5. Frontend show message + start 60s cooldown timer
```

## 🛠️ API Endpoints

### POST `/auth/register`

Registrasi user baru dengan validasi Gmail.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@gmail.com",
  "password": "password123",
  "confirmPassword": "password123",
  "phone": "081234567890",
  "province": "DKI Jakarta",
  "city": "Jakarta Selatan",
  "address": "Jl. Contoh No. 123",
  "terms": "on",
  "referralCode": "ABC123" // optional
}
```

**Validasi:**
- ✅ Email wajib berakhiran `@gmail.com`
- ✅ Password minimal 8 karakter
- ✅ Password harus match dengan confirmPassword
- ✅ Terms harus di-check
- ✅ Email belum terdaftar

**Response:**
- Render halaman `verify-activation.ejs` dengan message success
- Email kode aktivasi terkirim

---

### POST `/auth/verify-activation`

Verifikasi kode aktivasi yang diterima via email.

**Request Body:**
```json
{
  "email": "john@gmail.com",
  "code": "123456"
}
```

**Validasi:**
- ✅ Kode harus 6 digit
- ✅ Kode harus match dengan database
- ✅ Kode belum kadaluarsa (< 15 menit)
- ✅ Attempts < 5

**Response Success:**
- Update user: `is_active = TRUE`
- Set `activated_at = NOW()`
- Hapus `activation_code`
- Auto-login user
- Redirect ke `/dashboard?welcome=true`

**Response Error:**
- Increment `activation_attempts`
- Render error message
- Tetap di halaman verifikasi

---

### POST `/auth/resend-activation`

Kirim ulang kode aktivasi ke email.

**Request Body:**
```json
{
  "email": "john@gmail.com"
}
```

**Response Success:**
```json
{
  "success": true,
  "message": "Kode aktivasi baru telah dikirim ke email Anda"
}
```

**Response Error:**
```json
{
  "success": false,
  "message": "Email tidak ditemukan"
}
```

---

## 💻 Frontend Implementation

### Halaman Verifikasi (`verify-activation.ejs`)

#### Fitur UI/UX:

1. **Code Input dengan Styling Khusus**
   - Font monospace
   - Letter spacing lebar
   - Auto-format (hanya angka)
   - Maxlength 6
   - Auto-focus

2. **Timer Cooldown**
   - Countdown 60 detik setelah resend
   - Button disabled selama cooldown
   - Visual feedback dengan animated spinner

3. **Real-time Validation**
   - Input hanya menerima angka
   - Validasi 6 digit sebelum submit
   - Error message inline

4. **AJAX Resend**
   - Kirim ulang tanpa reload
   - Loading state dengan spinner
   - Success/error toast messages

5. **Responsive Design**
   - Mobile-friendly
   - Glass morphism effects
   - Gradient backgrounds

#### JavaScript Functions:

```javascript
// Resend activation code
async function resendCode() {
  const email = document.querySelector('input[name="email"]').value;
  
  const response = await fetch('/auth/resend-activation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  
  const data = await response.json();
  
  if (data.success) {
    showMessage(data.message, 'success');
    startCooldownTimer(60);
  }
}
```

---

## 📧 Email Service Details

### Email Templates

#### 1. Activation Code Email

**Subject:** Kode Aktivasi Akun PixelNest

**Content:**
- Welcome message dengan nama user
- Kode aktivasi 6 digit (besar, bold, highlighted)
- Instruksi cara aktivasi (4 steps)
- Warning expiry (15 menit)
- Security notice
- Footer dengan branding

**Design:**
- HTML responsive
- Gradient header (violet to fuchsia)
- Dashed border box untuk kode
- Icons untuk visual clarity
- Professional typography

#### 2. Welcome Email (After Activation)

**Subject:** Selamat Datang di PixelNest! 🎉

**Content:**
- Congratulations message
- Quick feature overview
- CTA button ke dashboard
- Support information

---

### Email Service Methods

```javascript
// Generate 6-digit code
emailService.generateActivationCode()
// Returns: "123456"

// Send activation email
await emailService.sendActivationCode(email, name, code)
// Sends HTML email dengan kode

// Send welcome email
await emailService.sendWelcomeEmail(email, name)
// Sends welcome email setelah aktivasi

// Verify email service
await emailService.verifyConnection()
// Test SMTP connection
```

---

## 🔒 Security Features

### 1. Rate Limiting
- **Max 5 attempts**: User hanya bisa salah input 5x
- **Blocked after 5**: Harus request kode baru
- **Counter reset**: Direset saat resend code

### 2. Code Expiration
- **15 menit lifetime**: Kode otomatis invalid setelah 15 menit
- **Database validation**: Cek `activation_code_expires_at > NOW()`
- **Auto-cleanup**: Kode dihapus setelah aktivasi sukses

### 3. Single-Use Code
- **One-time only**: Kode tidak bisa dipakai lagi setelah aktivasi
- **Immediate deletion**: Kode dihapus dari database setelah verify

### 4. Gmail Validation
- **Double check**: Validasi di frontend dan backend
- **Prevents bypass**: User tidak bisa skip validasi dengan inspect element
- **Clear error messages**: User tau kenapa ditolak

### 5. Password Security
- **Bcrypt hashing**: Password di-hash dengan bcrypt salt 10
- **Min 8 chars**: Enforced minimum length
- **Match validation**: Confirm password must match

---

## 🧪 Testing Guide

### 1. Test Normal Registration Flow

```bash
# 1. Buka browser ke /login
# 2. Input email: test@gmail.com
# 3. Klik continue
# 4. Isi form registrasi
# 5. Submit
# 6. Cek email untuk kode
# 7. Input kode di halaman verifikasi
# 8. Verify berhasil → auto-login → dashboard
```

### 2. Test Gmail Validation

```bash
# Test dengan email non-Gmail
# Email: test@yahoo.com
# Expected: Error "Hanya email Gmail yang dapat digunakan"

# Test dengan Gmail
# Email: test@gmail.com
# Expected: Proceed to registration
```

### 3. Test Code Expiration

```bash
# 1. Registrasi dengan email baru
# 2. Tunggu > 15 menit
# 3. Coba input kode lama
# Expected: Error "Kode tidak valid atau sudah kadaluarsa"
# 4. Klik "Kirim Ulang Kode"
# 5. Input kode baru
# Expected: Aktivasi berhasil
```

### 4. Test Rate Limiting

```bash
# 1. Registrasi
# 2. Input kode salah 5 kali
# Expected: Error "Terlalu banyak percobaan"
# 3. Request kode baru
# 4. Counter direset
# Expected: Bisa coba lagi
```

### 5. Test Resend Cooldown

```bash
# 1. Di halaman verifikasi
# 2. Klik "Kirim Ulang Kode"
# 3. Coba klik lagi immediately
# Expected: Button disabled, countdown showing
# 4. Tunggu 60 detik
# Expected: Button enabled lagi
```

### 6. Test Duplicate Activation

```bash
# 1. Aktivasi akun dengan kode
# 2. Coba akses halaman verifikasi lagi
# 3. Coba input kode yang sama
# Expected: "Akun sudah aktif"
```

---

## 🐛 Troubleshooting

### Email Tidak Terkirim

**Problem:** User tidak menerima email kode aktivasi

**Solutions:**

1. **Cek Gmail App Password**
   ```env
   # Pastikan di .env menggunakan App Password, bukan password biasa
   EMAIL_PASSWORD=xxxx xxxx xxxx xxxx  # 16 digit
   ```

2. **Verify Email Service**
   ```javascript
   // Test di Node.js console
   const emailService = require('./src/services/emailService');
   await emailService.verifyConnection();
   ```

3. **Cek Spam Folder**
   - User harus cek spam/junk folder
   - Gmail kadang mark automated emails as spam

4. **Check Server Logs**
   ```bash
   # Look for email errors
   tail -f logs/server.log | grep "email"
   ```

5. **Test dengan Gmail Lain**
   - Coba kirim ke Gmail lain untuk test

---

### Kode Tidak Valid

**Problem:** User input kode tapi error "tidak valid"

**Debug Steps:**

1. **Cek di database:**
   ```sql
   SELECT email, activation_code, activation_code_expires_at, 
          is_active, activation_attempts
   FROM users 
   WHERE email = 'user@gmail.com';
   ```

2. **Cek expiry:**
   ```sql
   -- Pastikan belum kadaluarsa
   SELECT activation_code_expires_at > NOW() as is_valid
   FROM users 
   WHERE email = 'user@gmail.com';
   ```

3. **Cek attempts:**
   ```sql
   -- Pastikan attempts < 5
   SELECT activation_attempts FROM users 
   WHERE email = 'user@gmail.com';
   ```

4. **Manual reset jika perlu:**
   ```sql
   UPDATE users 
   SET activation_attempts = 0
   WHERE email = 'user@gmail.com';
   ```

---

### User Sudah Registrasi Tapi Belum Aktivasi

**Problem:** User sudah pernah registrasi, tapi lupa aktivasi

**Solution:**

1. User login dengan email yang sama
2. Sistem otomatis detect `is_active = FALSE`
3. Redirect ke halaman verifikasi
4. User bisa resend kode baru

**Manual Fix:**

```sql
-- Jika perlu force activate (admin only)
UPDATE users 
SET is_active = TRUE, 
    activated_at = NOW(),
    activation_code = NULL
WHERE email = 'user@gmail.com';
```

---

### Migration Error

**Problem:** Error saat jalankan migration

**Solution:**

1. **Cek koneksi database:**
   ```bash
   psql -U postgres -d pixelnest
   ```

2. **Rollback jika perlu:**
   ```sql
   -- Remove activation columns
   ALTER TABLE users 
   DROP COLUMN IF EXISTS is_active,
   DROP COLUMN IF EXISTS activation_code,
   DROP COLUMN IF EXISTS activation_code_expires_at,
   DROP COLUMN IF EXISTS activation_attempts,
   DROP COLUMN IF EXISTS activated_at;
   ```

3. **Run migration lagi:**
   ```bash
   npm run migrate:email-activation
   ```

---

## 📊 Database Queries untuk Admin

### Check Aktivasi Status

```sql
-- Total users by activation status
SELECT 
  is_active,
  COUNT(*) as total,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM users
GROUP BY is_active;
```

### Pending Activations

```sql
-- Users yang belum aktivasi
SELECT 
  email, 
  name, 
  created_at,
  activation_attempts,
  CASE 
    WHEN activation_code_expires_at > NOW() THEN 'Valid'
    ELSE 'Expired'
  END as code_status
FROM users
WHERE is_active = FALSE
ORDER BY created_at DESC;
```

### Recent Activations

```sql
-- Users yang baru aktivasi (24 jam terakhir)
SELECT 
  email,
  name,
  activated_at,
  EXTRACT(EPOCH FROM (activated_at - created_at)) / 60 as minutes_to_activate
FROM users
WHERE activated_at > NOW() - INTERVAL '24 hours'
ORDER BY activated_at DESC;
```

### Failed Activation Attempts

```sql
-- Users dengan banyak failed attempts
SELECT 
  email,
  name,
  activation_attempts,
  activation_code_expires_at,
  created_at
FROM users
WHERE is_active = FALSE 
  AND activation_attempts >= 3
ORDER BY activation_attempts DESC;
```

---

## 🎨 Customization

### Ubah Durasi Kode

Di `authController.js`:

```javascript
// Default: 15 menit
const activationExpiry = new Date(Date.now() + 15 * 60 * 1000);

// Ubah jadi 30 menit:
const activationExpiry = new Date(Date.now() + 30 * 60 * 1000);

// Ubah jadi 1 jam:
const activationExpiry = new Date(Date.now() + 60 * 60 * 1000);
```

### Ubah Panjang Kode

Di `emailService.js`:

```javascript
// Default: 6 digit
generateActivationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Ubah jadi 4 digit:
generateActivationCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Ubah jadi 8 digit:
generateActivationCode() {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}
```

### Ubah Max Attempts

Di `authController.js`:

```javascript
// Default: 5 attempts
if (status && status.activation_attempts >= 5) {
  // error
}

// Ubah jadi 3 attempts:
if (status && status.activation_attempts >= 3) {
  // error
}
```

### Ubah Cooldown Timer

Di `verify-activation.ejs`:

```javascript
// Default: 60 detik
cooldownTime = 60;

// Ubah jadi 120 detik:
cooldownTime = 120;

// Ubah jadi 30 detik:
cooldownTime = 30;
```

### Custom Email Template

Di `emailService.js`, edit HTML di method `sendActivationCode()`:

```javascript
html: `
  <!DOCTYPE html>
  <html>
  <!-- Your custom HTML template here -->
  </html>
`
```

---

## 📈 Analytics & Monitoring

### Metrics to Track

1. **Activation Rate**
   - % users yang berhasil aktivasi
   - Time to activate (rata-rata waktu dari registrasi ke aktivasi)

2. **Email Delivery**
   - Success rate email terkirim
   - Bounce rate
   - Spam rate

3. **Failed Attempts**
   - Rata-rata failed attempts per user
   - % users yang butuh resend code

4. **Conversion Funnel**
   - Registrasi started
   - Email sent
   - Code entered
   - Activation success

### Sample Analytics Queries

```sql
-- Activation rate (last 30 days)
SELECT 
  COUNT(*) FILTER (WHERE is_active = TRUE) as activated,
  COUNT(*) FILTER (WHERE is_active = FALSE) as pending,
  ROUND(
    COUNT(*) FILTER (WHERE is_active = TRUE) * 100.0 / COUNT(*), 
    2
  ) as activation_rate
FROM users
WHERE created_at > NOW() - INTERVAL '30 days';

-- Average time to activate
SELECT 
  AVG(EXTRACT(EPOCH FROM (activated_at - created_at)) / 60) as avg_minutes
FROM users
WHERE activated_at IS NOT NULL
  AND created_at > NOW() - INTERVAL '30 days';

-- Activation attempts distribution
SELECT 
  activation_attempts,
  COUNT(*) as user_count
FROM users
WHERE is_active = FALSE
GROUP BY activation_attempts
ORDER BY activation_attempts;
```

---

## ✅ Checklist Setup

- [x] Install nodemailer
- [x] Create migration file
- [x] Update User model
- [x] Create email service
- [x] Update authController
- [x] Create verification page
- [x] Add routes
- [x] Add npm script for migration
- [ ] Setup Gmail App Password di .env
- [ ] Run migration
- [ ] Test email sending
- [ ] Test full registration flow
- [ ] Test resend functionality
- [ ] Test edge cases

---

## 🤝 Support

Jika ada pertanyaan atau masalah:

1. Cek troubleshooting section di atas
2. Review server logs untuk errors
3. Test email service connection
4. Verify database migration berhasil
5. Hubungi development team

---

## 📝 Changelog

### Version 1.0.0 (Initial Release)
- ✅ Gmail-only registration validation
- ✅ 6-digit activation code generation
- ✅ Email sending with Nodemailer
- ✅ Professional HTML email templates
- ✅ Verification page with resend functionality
- ✅ Rate limiting (5 attempts)
- ✅ 15-minute code expiration
- ✅ 60-second resend cooldown
- ✅ Welcome email after activation
- ✅ Auto-login after successful activation
- ✅ Database migration script
- ✅ Complete documentation

---

**© 2025 PixelNest - AI Automation Platform**

