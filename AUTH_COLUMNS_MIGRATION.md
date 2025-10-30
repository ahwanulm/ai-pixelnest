# 🔐 Auth Columns Migration - PIN Verification & Password Reset

## 📋 Overview

Migration ini menambahkan semua kolom yang diperlukan untuk:
- **PIN Verification** - Kode 6-digit untuk aktivasi email
- **Password Reset** - Kode 6-digit untuk reset password
- **Email Verification** - Token-based verification (legacy support)

## ❓ Kenapa Perlu Migration Ini?

Sebelumnya, kolom-kolom untuk verifikasi PIN dan reset password **belum ada di database**, menyebabkan error saat:
- User registrasi baru mencoba aktivasi akun dengan PIN
- User mencoba reset password dengan kode PIN
- Sistem mencoba menyimpan activation_code atau password_reset_code

## ✅ Kolom yang Ditambahkan

### 1. **PIN Verification / Activation Columns**
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `activation_code` | VARCHAR(6) | Kode PIN 6-digit untuk aktivasi email |
| `activation_code_expires_at` | TIMESTAMP | Waktu kadaluarsa kode aktivasi |
| `activation_attempts` | INTEGER | Jumlah percobaan aktivasi gagal |
| `activated_at` | TIMESTAMP | Waktu akun diaktivasi |
| `last_activation_resend` | TIMESTAMP | Waktu terakhir kirim ulang kode |

### 2. **Password Reset Columns**
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `password_reset_code` | VARCHAR(6) | Kode PIN 6-digit untuk reset password |
| `password_reset_expires_at` | TIMESTAMP | Waktu kadaluarsa kode reset |
| `password_reset_attempts` | INTEGER | Jumlah percobaan reset gagal |

### 3. **Email Verification Columns** (Legacy Support)
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `email_verified` | BOOLEAN | Status verifikasi email |
| `email_verification_token` | VARCHAR(255) | Token untuk verifikasi email |
| `email_verification_expires` | TIMESTAMP | Waktu kadaluarsa token |
| `password_reset_token` | VARCHAR(255) | Token untuk reset password |
| `password_reset_expires` | TIMESTAMP | Waktu kadaluarsa token reset |

### 4. **Indexes untuk Performance**
- `idx_users_activation_code` - Lookup cepat activation code
- `idx_users_password_reset_code` - Lookup cepat reset code
- `idx_users_email_verification_token` - Lookup token verifikasi
- `idx_users_password_reset_token` - Lookup token reset
- `idx_users_email_verified` - Filter users terverifikasi
- `idx_users_is_active` - Filter users aktif

## 🚀 Cara Menjalankan Migration

### Opsi 1: Otomatis (Recommended)
Migration ini akan **otomatis dijalankan** saat setup database:

```bash
npm run setup-db
```

### Opsi 2: Manual (Standalone)
Jika hanya ingin menambahkan kolom auth tanpa full setup:

```bash
npm run migrate:auth-columns
```

### Opsi 3: SQL Langsung
Jalankan SQL migration file:

```bash
psql pixelnest_db -f migrations/add_pin_verification_and_password_reset.sql
```

## 📊 Verifikasi Migration

Setelah migration, cek kolom yang berhasil ditambahkan:

```bash
npm run migrate:auth-columns
```

Output yang diharapkan:

```
🔧 Starting Auth Columns Migration...

═══════════════════════════════════════════════════════════

📝 Step 1/5: Adding activation/PIN verification columns...
✅ Activation columns added

📝 Step 2/5: Adding password reset columns...
✅ Password reset columns added

📝 Step 3/5: Adding email verification columns...
✅ Email verification columns added

📝 Step 4/5: Creating indexes for performance...
✅ Indexes created

📝 Step 5/5: Updating existing users...
✅ Updated 10 existing users

📋 Auth-related columns in users table:
┌─────────┬───────────────────────────────┬──────────────────┬─────────────┬────────────┐
│ (index) │           Column              │       Type       │  Nullable   │  Default   │
├─────────┼───────────────────────────────┼──────────────────┼─────────────┼────────────┤
│    0    │    'activated_at'             │  'timestamp'     │    'YES'    │   'NULL'   │
│    1    │    'activation_attempts'      │   'integer'      │    'YES'    │     '0'    │
│    2    │    'activation_code'          │  'varchar(6)'    │    'YES'    │   'NULL'   │
│    3    │    'activation_code_expires'  │  'timestamp'     │    'YES'    │   'NULL'   │
│    4    │    'email_verified'           │   'boolean'      │    'YES'    │  'false'   │
│    5    │    'email_verification_token' │ 'varchar(255)'   │    'YES'    │   'NULL'   │
│    6    │    'email_verification_exp...'│  'timestamp'     │    'YES'    │   'NULL'   │
│    7    │    'last_activation_resend'   │  'timestamp'     │    'YES'    │   'NULL'   │
│    8    │    'password_reset_attempts'  │   'integer'      │    'YES'    │     '0'    │
│    9    │    'password_reset_code'      │  'varchar(6)'    │    'YES'    │   'NULL'   │
│   10    │    'password_reset_expires...'│  'timestamp'     │    'YES'    │   'NULL'   │
│   11    │    'password_reset_token'     │ 'varchar(255)'   │    'YES'    │   'NULL'   │
└─────────┴───────────────────────────────┴──────────────────┴─────────────┴────────────┘

═══════════════════════════════════════════════════════════
🎉 Auth Columns Migration Completed Successfully!

📊 Summary:
  ✓ Activation columns (PIN verification)
  ✓ Password reset columns (PIN-based)
  ✓ Email verification columns
  ✓ Performance indexes
  ✓ Existing users updated

🚀 Your authentication system is now fully configured!
═══════════════════════════════════════════════════════════
```

## 🔍 Verifikasi Manual di Database

Cek kolom langsung di PostgreSQL:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN (
  'activation_code', 'activation_code_expires_at', 'activation_attempts',
  'activated_at', 'last_activation_resend',
  'password_reset_code', 'password_reset_expires_at', 'password_reset_attempts',
  'email_verified', 'email_verification_token', 'email_verification_expires',
  'password_reset_token', 'password_reset_expires'
)
ORDER BY column_name;
```

## 🔄 Update Existing Users

Migration akan otomatis:
- Set `email_verified = true` untuk user aktif
- Set `activated_at = created_at` untuk user aktif
- Tidak mengubah data user yang sudah punya nilai

## 🛡️ Keamanan & Safety

### ✅ Aman untuk Production

1. **Menggunakan `IF NOT EXISTS`**
   - Kolom tidak akan duplicate
   - Tidak akan error jika sudah ada
   - Bisa dijalankan berkali-kali

2. **Menggunakan Transaction**
   - `BEGIN` dan `COMMIT` untuk atomicity
   - Rollback otomatis jika error
   - Data consistency terjaga

3. **Tidak Menghapus Data**
   - Hanya menambahkan kolom baru
   - Tidak mengubah kolom existing
   - Existing data tetap aman

4. **Update Selektif**
   - Hanya update user yang memang perlu
   - Tidak overwrite nilai yang sudah ada
   - Conditional update dengan WHERE clause

### ⚠️ Catatan Penting

- Migration ini **SAFE** untuk production
- Tidak akan menghapus atau mengubah data existing
- Bisa dijalankan multiple times (idempotent)
- Transaction-safe dengan rollback otomatis

## 📚 File Terkait

### Migration Files
- **SQL**: `migrations/add_pin_verification_and_password_reset.sql`
- **JavaScript**: `src/config/migrateAuthColumns.js`

### Setup Integration
- **Setup Database**: `src/config/setupDatabase.js`
- **Package Script**: `package.json` → `migrate:auth-columns`

### Code yang Menggunakan Kolom Ini
- **User Model**: `src/models/User.js`
  - `verifyActivationCode()` - Menggunakan `activation_code`, `activation_code_expires_at`
  - `setPasswordResetCode()` - Menggunakan `password_reset_code`, `password_reset_expires_at`
  - `resetPassword()` - Menggunakan `password_reset_code`, `password_reset_attempts`
  
- **Auth Controller**: `src/controllers/authController.js`
  - `activateAccount()` - PIN verification
  - `forgotPassword()` - Generate reset code
  - `resetPassword()` - Verify reset code
  - `resendResetCode()` - Resend code

## 🐛 Troubleshooting

### Q: Error "column already exists"
**A:** Ini normal dan tidak masalah. Migration menggunakan `IF NOT EXISTS` jadi akan skip kolom yang sudah ada.

### Q: Migration gagal dengan error permission
**A:** Database user perlu permission `ALTER TABLE`:
```sql
GRANT ALTER ON TABLE users TO your_db_user;
```

### Q: Ingin rollback migration
**A:** Migration ini tidak bisa di-rollback otomatis karena menambahkan kolom. Untuk rollback manual:
```sql
ALTER TABLE users 
DROP COLUMN IF EXISTS activation_code,
DROP COLUMN IF EXISTS activation_code_expires_at,
DROP COLUMN IF EXISTS activation_attempts,
DROP COLUMN IF EXISTS activated_at,
DROP COLUMN IF EXISTS last_activation_resend,
DROP COLUMN IF EXISTS password_reset_code,
DROP COLUMN IF EXISTS password_reset_expires_at,
DROP COLUMN IF EXISTS password_reset_attempts,
DROP COLUMN IF EXISTS email_verified,
DROP COLUMN IF EXISTS email_verification_token,
DROP COLUMN IF EXISTS email_verification_expires,
DROP COLUMN IF EXISTS password_reset_token,
DROP COLUMN IF EXISTS password_reset_expires;
```

### Q: Error "relation users does not exist"
**A:** Users table belum dibuat. Jalankan setup database dulu:
```bash
npm run setup-db
```

## ✨ Summary

**Sebelum Migration:**
```
❌ activation_code - Column tidak ada
❌ password_reset_code - Column tidak ada
❌ Error saat registrasi/aktivasi
❌ Error saat forgot password
```

**Setelah Migration:**
```
✅ activation_code - Ready untuk PIN verification
✅ password_reset_code - Ready untuk password reset
✅ email_verified - Ready untuk email verification
✅ Indexes untuk performance
✅ Existing users updated
✅ Production-ready! 🚀
```

---

## 🎯 Next Steps

Setelah migration berhasil:

1. **Test Registrasi**
   ```bash
   # Coba registrasi user baru
   # Cek apakah activation code terkirim
   ```

2. **Test Forgot Password**
   ```bash
   # Coba forgot password flow
   # Cek apakah reset code terkirim
   ```

3. **Verify Database**
   ```bash
   npm run verify-db
   ```

4. **Deploy to Production**
   ```bash
   # Migration sudah safe untuk production
   npm run migrate:auth-columns
   ```

🎉 **Your authentication system is now fully configured!**

