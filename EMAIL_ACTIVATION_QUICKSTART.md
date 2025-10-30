# 🚀 Quick Start - Email Activation System

Panduan cepat untuk setup dan menggunakan sistem aktivasi email.

## ⚡ Setup Cepat (5 Menit)

### 1. Konfigurasi Email (.env)

```bash
# Buka file .env dan tambahkan:
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
BASE_URL=http://localhost:3000
```

**📌 IMPORTANT:** `EMAIL_PASSWORD` harus menggunakan **Gmail App Password**

#### Cara Dapat Gmail App Password:
1. Buka https://myaccount.google.com/
2. Security → 2-Step Verification (aktifkan dulu)
3. Scroll ke App passwords
4. Generate password untuk "Mail"
5. Copy 16-digit password → paste ke .env

### 2. Jalankan Migration

```bash
npm run migrate:email-activation
```

### 3. Restart Server

```bash
npm run dev
```

### 4. Test! 🎉

```
1. Buka http://localhost:3000/login
2. Input email: test@gmail.com
3. Isi form registrasi
4. Cek email untuk kode aktivasi
5. Input kode → Aktivasi berhasil!
```

---

## 📋 Checklist Setup

- [ ] Install nodemailer: ✅ (sudah auto-installed)
- [ ] Setup EMAIL_USER di .env
- [ ] Setup EMAIL_PASSWORD di .env (App Password!)
- [ ] Run migration: `npm run migrate:email-activation`
- [ ] Restart server
- [ ] Test dengan email Gmail

---

## 🎯 Fitur Utama

✅ **Registrasi wajib Gmail** - Hanya @gmail.com yang diterima  
✅ **Kode OTP 6 digit** - Dikirim via email  
✅ **Berlaku 15 menit** - Auto-expire  
✅ **Resend kode** - Dengan 60s cooldown  
✅ **Rate limiting** - Max 5 percobaan salah  
✅ **Professional emails** - HTML template keren  
✅ **Auto-login** - Langsung masuk setelah aktivasi  

---

## 🔧 Troubleshooting

### Email Tidak Terkirim?

**Cek:**
1. EMAIL_USER dan EMAIL_PASSWORD di .env sudah benar?
2. Pakai App Password, bukan password Gmail biasa?
3. 2-Step Verification Gmail sudah aktif?
4. Cek spam/junk folder

**Test Koneksi:**
```javascript
const emailService = require('./src/services/emailService');
await emailService.verifyConnection();
```

### Kode Tidak Valid?

**Solusi:**
1. Pastikan kode di-copy exact (6 digit)
2. Cek tidak lebih dari 15 menit
3. Coba "Kirim Ulang Kode"
4. Cek attempts belum > 5

### User Belum Aktivasi Tapi Mau Login?

- Sistem otomatis redirect ke halaman verifikasi
- User bisa resend kode baru
- Admin bisa force activate via SQL

---

## 📱 User Flow

```
Login → Input Gmail → Register Form → Submit 
  → Email Sent → Check Email → Input Code 
  → Activate → Auto-Login → Dashboard ✅
```

---

## 🎨 Customization

### Ubah Durasi Kode (default 15 menit)

`src/controllers/authController.js`:
```javascript
const activationExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 menit
```

### Ubah Panjang Kode (default 6 digit)

`src/services/emailService.js`:
```javascript
generateActivationCode() {
  return Math.floor(1000 + Math.random() * 9000).toString(); // 4 digit
}
```

### Ubah Max Attempts (default 5)

`src/controllers/authController.js`:
```javascript
if (status && status.activation_attempts >= 3) { // 3 attempts
```

---

## 📊 Admin Queries

### Cek Status Aktivasi

```sql
SELECT 
  is_active, 
  COUNT(*) as total 
FROM users 
GROUP BY is_active;
```

### Pending Activations

```sql
SELECT email, name, created_at, activation_attempts
FROM users 
WHERE is_active = FALSE
ORDER BY created_at DESC;
```

### Force Activate User

```sql
UPDATE users 
SET is_active = TRUE, 
    activated_at = NOW(),
    activation_code = NULL
WHERE email = 'user@gmail.com';
```

---

## 📚 Full Documentation

Lihat **EMAIL_ACTIVATION_SYSTEM.md** untuk dokumentasi lengkap.

---

## ✅ Testing

### Test Normal Flow
1. Register dengan Gmail → ✅
2. Terima email → ✅
3. Input kode benar → ✅
4. Auto-login → ✅

### Test Validations
1. Register dengan Yahoo → ❌ Error
2. Input kode salah 5x → ❌ Blocked
3. Tunggu 15 menit → ❌ Expired
4. Resend code → ✅ New code

---

## 🎉 Done!

Sistem aktivasi email sudah siap digunakan!

**Next Steps:**
- Test dengan real Gmail account
- Customize email template sesuai brand
- Monitor activation rate
- Setup analytics

---

**Need Help?** Baca EMAIL_ACTIVATION_SYSTEM.md untuk troubleshooting lengkap.

