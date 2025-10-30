# ⚡ Quick Fix: Auth Columns Missing

## 🔴 Problem

Error seperti ini muncul:
```
error: column "activation_code" does not exist
error: column "password_reset_code" does not exist
error: column "email_verified" does not exist
```

## ✅ Solution (1 Command)

```bash
npm run migrate:auth-columns
```

**Selesai!** ✨ Semua kolom untuk PIN verification dan password reset sudah ditambahkan.

## 📋 What Was Added

✅ **PIN Verification Columns:**
- `activation_code` - Kode PIN 6-digit
- `activation_code_expires_at` - Waktu expired
- `activation_attempts` - Jumlah percobaan
- `activated_at` - Waktu aktivasi
- `last_activation_resend` - Waktu resend terakhir

✅ **Password Reset Columns:**
- `password_reset_code` - Kode reset 6-digit
- `password_reset_expires_at` - Waktu expired
- `password_reset_attempts` - Jumlah percobaan

✅ **Email Verification Columns:**
- `email_verified` - Status verifikasi
- `email_verification_token` - Token verifikasi
- `email_verification_expires` - Waktu expired token
- `password_reset_token` - Token reset
- `password_reset_expires` - Waktu expired token reset

✅ **Performance Indexes:**
- Index untuk semua lookup columns
- Optimized for fast queries

## 🔄 Alternative: Full Database Setup

Jika database kosong atau mau setup dari awal:

```bash
npm run setup-db
```

Ini akan otomatis menjalankan migration auth columns juga.

## ✨ That's It!

Tidak perlu restart server. Migration sudah selesai dan ready to use! 🚀

---

📚 **Detailed Documentation:** `AUTH_COLUMNS_MIGRATION.md`

