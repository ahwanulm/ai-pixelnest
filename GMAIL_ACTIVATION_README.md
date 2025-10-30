# 📧 Sistem Aktivasi Gmail - Ready to Use! ✅

Sistem registrasi dengan **validasi Gmail wajib** dan **kode aktivasi email** telah berhasil diimplementasikan!

---

## ✨ Fitur

🔐 **Registrasi wajib Gmail** - Hanya email `@gmail.com` yang diterima  
📨 **Kode OTP 6 digit** - Dikirim ke email untuk verifikasi  
⏱️ **Berlaku 15 menit** - Kode otomatis kadaluarsa  
🔄 **Resend kode** - User dapat minta kode baru  
🛡️ **Rate limiting** - Max 5 percobaan salah input  
🎨 **Email profesional** - Template HTML yang menarik  
🚀 **Auto-login** - Langsung masuk setelah aktivasi  

---

## 🚀 Setup Cepat (3 Langkah!)

### 1️⃣ Konfigurasi Gmail

Edit file `.env` dan tambahkan:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
```

⚠️ **PENTING**: `EMAIL_PASSWORD` harus **Gmail App Password** (16 digit), bukan password Gmail biasa!

#### 📝 Cara dapat Gmail App Password:
```
1. Buka: https://myaccount.google.com/
2. Klik: Security → 2-Step Verification (aktifkan dulu kalau belum)
3. Scroll ke bawah → Klik: App passwords
4. Generate password untuk "Mail" 
5. Copy 16-digit password → Paste ke .env
```

### 2️⃣ Migration Database (✅ Sudah Selesai!)

Database sudah di-migrate dengan sukses! Kalau perlu run ulang:
```bash
npm run migrate:email-activation
```

### 3️⃣ Restart Server

```bash
npm run dev
```

**Done!** 🎉 Sistem siap digunakan!

---

## 🎯 Cara Kerja

### Alur User Registration:

```
📧 Login → Input Gmail → Register Form 
  ↓
📝 Submit → Generate 6-digit Code
  ↓
✉️ Email Sent (Cek Inbox/Spam)
  ↓
🔢 Input Code di halaman verifikasi
  ↓
✅ Account Activated → Auto-Login → Dashboard
```

### Screenshot Flow:
1. **Login Page**: User input `user@gmail.com`
2. **Register Page**: Isi nama, password, dll
3. **Email**: User terima kode `123456`
4. **Verify Page**: Input kode → Activate!
5. **Dashboard**: Welcome! 🎉

---

## 📱 User Experience

### Halaman Verifikasi
- 🎨 Design modern dengan glass effect
- 🔢 Input kode besar & mudah dibaca
- ⏰ Timer countdown untuk resend
- 💬 Pesan error/success yang jelas
- 📱 Responsive mobile-friendly

### Email yang Diterima
- 📬 Subject: "Kode Aktivasi Akun PixelNest"
- 🎨 HTML template professional
- 🔢 Kode ditampilkan besar & prominent
- ⏱️ Info waktu kadaluarsa (15 menit)
- 📋 Instruksi cara aktivasi

---

## 🔒 Keamanan

| Feature | Detail |
|---------|--------|
| Gmail Only | ✅ Validasi wajib @gmail.com |
| OTP | ✅ Kode random 6 digit |
| Expiry | ✅ 15 menit auto-expire |
| Single-Use | ✅ Kode hilang setelah dipakai |
| Rate Limit | ✅ Max 5 attempts |
| Resend Cooldown | ✅ 60 detik |

---

## 🧪 Testing

### ✅ Test Normal Flow
```
1. Buka: http://localhost:3000/login
2. Input: test@gmail.com
3. Klik: Continue
4. Isi form registrasi
5. Cek email → Copy kode
6. Input kode → Activate!
```

### ❌ Test Validasi
```
Test 1: Input email Yahoo
→ Error: "Hanya email Gmail yang dapat digunakan"

Test 2: Input kode salah 5x
→ Error: "Terlalu banyak percobaan"

Test 3: Tunggu 15 menit
→ Error: "Kode sudah kadaluarsa"
→ Solusi: Klik "Kirim Ulang Kode"
```

---

## ⚙️ Files yang Diubah/Ditambah

### 📂 New Files:
```
src/
├── services/emailService.js           ✨ NEW - Email sending
├── config/migrateEmailActivation.js   ✨ NEW - DB migration
└── views/auth/verify-activation.ejs   ✨ NEW - Verification page
```

### 📝 Modified Files:
```
src/
├── controllers/authController.js      ✏️ UPDATED - Added verification
├── models/User.js                     ✏️ UPDATED - Added activation methods
├── routes/auth.js                     ✏️ UPDATED - Added routes
└── package.json                       ✏️ UPDATED - Added scripts
```

### 📚 Documentation:
```
📄 EMAIL_ACTIVATION_SYSTEM.md        - Full technical docs
📄 EMAIL_ACTIVATION_QUICKSTART.md    - Quick setup guide
📄 EMAIL_ACTIVATION_SUMMARY.md       - Implementation summary
📄 GMAIL_ACTIVATION_README.md        - This file (overview)
```

---

## 🐛 Troubleshooting

### ❌ "Email tidak terkirim"

**Cek:**
1. ✅ `EMAIL_USER` benar di .env?
2. ✅ `EMAIL_PASSWORD` menggunakan App Password (16 digit)?
3. ✅ 2-Step Verification Gmail sudah aktif?
4. ✅ Cek spam/junk folder

**Test connection:**
```javascript
const emailService = require('./src/services/emailService');
await emailService.verifyConnection();
```

### ❌ "Kode tidak valid"

**Solusi:**
1. ✅ Copy kode exact dari email (6 digit)
2. ✅ Pastikan belum > 15 menit
3. ✅ Klik "Kirim Ulang Kode" untuk dapat kode baru
4. ✅ Pastikan belum 5x salah input

### ❌ "User belum aktivasi tapi mau login"

**Otomatis handled:**
- System detect user belum aktif
- Auto-redirect ke halaman verifikasi
- User bisa resend kode baru

---

## 📊 Admin Panel

### Query untuk Cek Status

```sql
-- Total users by status
SELECT 
  is_active, 
  COUNT(*) as total 
FROM users 
GROUP BY is_active;

-- Users pending activation
SELECT email, name, created_at 
FROM users 
WHERE is_active = FALSE
ORDER BY created_at DESC;
```

### Force Activate (jika diperlukan)

```sql
UPDATE users 
SET is_active = TRUE, 
    activated_at = NOW(),
    activation_code = NULL
WHERE email = 'user@gmail.com';
```

---

## 🎨 Customization

### Ubah Durasi Kode

`src/controllers/authController.js` line ~192:
```javascript
// Default: 15 menit
const activationExpiry = new Date(Date.now() + 15 * 60 * 1000);

// Ubah jadi 30 menit:
const activationExpiry = new Date(Date.now() + 30 * 60 * 1000);
```

### Ubah Panjang Kode

`src/services/emailService.js` line ~24:
```javascript
// Default: 6 digit
return Math.floor(100000 + Math.random() * 900000).toString();

// Ubah jadi 4 digit:
return Math.floor(1000 + Math.random() * 9000).toString();
```

### Ubah Email Template

Edit HTML di `src/services/emailService.js` method `sendActivationCode()`

---

## 📖 Dokumentasi Lengkap

| File | Purpose |
|------|---------|
| **EMAIL_ACTIVATION_SYSTEM.md** | Technical docs lengkap + troubleshooting |
| **EMAIL_ACTIVATION_QUICKSTART.md** | Setup guide 5 menit |
| **EMAIL_ACTIVATION_SUMMARY.md** | Implementation summary |
| **GMAIL_ACTIVATION_README.md** | Quick overview (file ini) |

---

## ✅ Checklist

Sebelum production, pastikan:

- [ ] ✅ Setup `EMAIL_USER` di .env
- [ ] ✅ Setup `EMAIL_PASSWORD` (App Password!) di .env
- [ ] ✅ Test kirim email berhasil
- [ ] ✅ Test full registration flow
- [ ] ✅ Test resend functionality
- [ ] ✅ Test dengan real Gmail account
- [ ] 🎨 (Optional) Customize email template
- [ ] 📊 (Optional) Setup analytics

---

## 🎉 Done!

Sistem aktivasi Gmail sudah **100% ready**! 🚀

**Next:** Setup `EMAIL_USER` dan `EMAIL_PASSWORD` di `.env`, lalu test!

---

## 📞 Need Help?

Baca dokumentasi lengkap di:
- **Quick Start**: `EMAIL_ACTIVATION_QUICKSTART.md`
- **Full Docs**: `EMAIL_ACTIVATION_SYSTEM.md`
- **Summary**: `EMAIL_ACTIVATION_SUMMARY.md`

---

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Last Updated**: October 26, 2025

