# 📧 Email & Password Authentication Guide

Sistem autentikasi PixelNest sekarang mendukung **login dan registrasi dengan email dan password** selain Google OAuth!

## 🎯 Fitur Utama

### 1. **Alur Login Bertahap**
- User memasukkan email di halaman login
- Sistem otomatis cek apakah email sudah terdaftar
- **Jika terdaftar**: Redirect ke halaman password
- **Jika belum**: Redirect ke halaman registrasi lengkap

### 2. **Halaman Login** (`/login`)
- Google OAuth button (Continue with Google)
- Divider "Or continue with email"
- Input field untuk email
- Design modern dengan gradient background dan glass morphism effects

### 3. **Halaman Password** (untuk user terdaftar)
- Menampilkan email yang dimasukkan
- Input password dengan toggle show/hide
- Link "Forgot password"
- Validasi password
- Error handling yang informatif

### 4. **Halaman Registrasi** (untuk user baru)
- Google OAuth option
- Form registrasi lengkap dengan fields:
  - **Full Name*** (required)
  - **Email*** (required, pre-filled dari step sebelumnya)
  - **Password*** (required, min. 8 karakter)
  - **Confirm Password*** (required)
  - **Nomor Telepon** (optional)
  - **Provinsi** (optional, dropdown dengan 38 provinsi Indonesia)
  - **Kota/Kabupaten** (optional, input text)
  - **Alamat Lengkap** (optional, textarea)
- Password strength indicator (Weak/Fair/Good/Strong)
- Terms & Privacy Policy checkbox
- Form validation
- Password match validation

## 🎨 Design Features

### Visual Elements
- **Background**: Gradient blur effects (violet & fuchsia)
- **Cards**: Glass morphism dengan backdrop blur
- **Animations**: Slide-in animations untuk smooth transitions
- **Icons**: SVG icons untuk setiap input field
- **Hover Effects**: Smooth transitions dan scale transforms
- **Colors**: Violet & Fuchsia gradient theme

### UX Features
- **Auto-focus** pada input fields
- **Show/Hide password** toggle dengan icon animation
- **Real-time password strength** indicator
- **Client-side validation** sebelum submit
- **Error messages** yang jelas dan informatif dalam Bahasa Indonesia
- **Responsive design** untuk mobile dan desktop

## 🔧 Setup

### 1. Jalankan Migration Database

```bash
npm run migrate:auth
```

Migration ini akan menambahkan kolom baru ke tabel `users`:
- `password_hash` (VARCHAR 255) - untuk menyimpan password yang di-hash
- `phone` (VARCHAR 50) - nomor telepon user
- `province` (VARCHAR 100) - provinsi di Indonesia
- `city` (VARCHAR 100) - kota/kabupaten
- `address` (TEXT) - alamat lengkap

### 2. Install Dependencies

Bcrypt sudah terinstall di `package.json`:

```json
"bcrypt": "^5.1.1"
```

Jika belum terinstall, jalankan:

```bash
npm install
```

## 📁 File Structure

### Views
```
src/views/auth/
├── login.ejs          # Halaman login dengan email input
├── password.ejs       # Halaman password untuk user terdaftar
└── register.ejs       # Halaman registrasi lengkap
```

### Backend
```
src/
├── controllers/
│   └── authController.js   # Controller dengan fungsi baru
├── models/
│   └── User.js             # Model dengan password methods
├── routes/
│   └── auth.js             # Routes untuk auth
└── config/
    ├── authDatabase.js           # Schema tabel users
    └── migratePasswordAuth.js    # Migration script
```

## 🔐 Security Features

### Password Hashing
- Menggunakan **bcrypt** dengan salt rounds 10
- Password tidak pernah disimpan dalam bentuk plain text
- Hash verification saat login

### Validation
- **Server-side validation** untuk semua input
- Password minimum 8 karakter
- Email format validation
- Password confirmation match
- Terms agreement required

### Session Management
- Session-based authentication menggunakan `express-session`
- Session disimpan di PostgreSQL
- Auto-logout saat session expire

## 🔄 Authentication Flow

### Login Flow (User Terdaftar)
```
1. User masuk ke /login
2. User memasukkan email
3. POST /auth/check-email
4. Email ditemukan di database
5. Render halaman password
6. User memasukkan password
7. POST /auth/login-password
8. Verify password dengan bcrypt
9. Create session
10. Redirect ke /dashboard
```

### Registration Flow (User Baru)
```
1. User masuk ke /login
2. User memasukkan email
3. POST /auth/check-email
4. Email tidak ditemukan
5. Render halaman registrasi dengan email pre-filled
6. User mengisi form lengkap
7. POST /auth/register
8. Validate input
9. Hash password
10. Create user di database
11. Create session
12. Redirect ke /dashboard
```

### Google OAuth Flow (Tetap Tersedia)
```
1. User klik "Continue with Google"
2. Redirect ke Google OAuth
3. User authorize
4. Callback ke /auth/google/callback
5. Find or create user
6. Create session
7. Redirect ke /dashboard
```

## 🛠️ API Endpoints

### GET `/login`
- Menampilkan halaman login
- Query params: `?error=<error_message>`

### POST `/auth/check-email`
- Body: `{ email: string }`
- Response: Render password.ejs atau register.ejs

### POST `/auth/login-password`
- Body: `{ email: string, password: string }`
- Response: Redirect ke /dashboard atau error

### POST `/auth/register`
- Body:
  ```json
  {
    "name": "string (required)",
    "email": "string (required)",
    "password": "string (required, min 8 chars)",
    "confirmPassword": "string (required)",
    "phone": "string (optional)",
    "province": "string (optional)",
    "city": "string (optional)",
    "address": "string (optional)",
    "terms": "on (required)"
  }
  ```
- Response: Redirect ke /dashboard atau error

### GET `/auth/google`
- Initiate Google OAuth flow

### GET `/auth/google/callback`
- Google OAuth callback

### GET `/dashboard`
- Protected route (requires authentication)

### GET `/logout`
- Destroy session dan redirect ke home

## 📊 Database Schema

### Users Table

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  google_id VARCHAR(255) UNIQUE,        -- Google OAuth ID (nullable)
  email VARCHAR(255) UNIQUE NOT NULL,   -- Email (unique)
  name VARCHAR(255) NOT NULL,           -- Full name
  password_hash VARCHAR(255),           -- Hashed password (nullable)
  phone VARCHAR(50),                    -- Phone number
  province VARCHAR(100),                -- Province in Indonesia
  city VARCHAR(100),                    -- City/District
  address TEXT,                         -- Full street address
  avatar_url TEXT,                      -- Profile picture URL
  created_at TIMESTAMP DEFAULT NOW(),   -- Registration date
  last_login TIMESTAMP                  -- Last login timestamp
);
```

## 🎯 Usage Examples

### Creating a New User with Password

```javascript
const User = require('./models/User');

const newUser = await User.createWithPassword({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'securepassword123',
  phone: '0812 3456 7890',
  province: 'DKI Jakarta',
  city: 'Jakarta Selatan',
  address: 'Jl. Sudirman No. 123, RT 01/RW 02, Kelurahan Senayan, Kecamatan Kebayoran Baru, 12190'
});
```

### Verifying Password

```javascript
const user = await User.verifyPassword('john@example.com', 'securepassword123');
if (user) {
  // Password valid, login user
  req.login(user, (err) => {
    res.redirect('/dashboard');
  });
} else {
  // Invalid password
  res.render('auth/password', { error: 'Invalid password' });
}
```

## 🇮🇩 Provinsi Indonesia

Form registrasi mendukung **38 provinsi di Indonesia**:

**Sumatera:**
- Aceh, Sumatera Utara, Sumatera Barat, Riau, Kepulauan Riau, Jambi, Sumatera Selatan, Kepulauan Bangka Belitung, Bengkulu, Lampung

**Jawa:**
- DKI Jakarta, Banten, Jawa Barat, Jawa Tengah, DI Yogyakarta, Jawa Timur

**Bali & Nusa Tenggara:**
- Bali, Nusa Tenggara Barat, Nusa Tenggara Timur

**Kalimantan:**
- Kalimantan Barat, Kalimantan Tengah, Kalimantan Selatan, Kalimantan Timur, Kalimantan Utara

**Sulawesi:**
- Sulawesi Utara, Gorontalo, Sulawesi Tengah, Sulawesi Barat, Sulawesi Selatan, Sulawesi Tenggara

**Maluku:**
- Maluku, Maluku Utara

**Papua:**
- Papua, Papua Barat, Papua Tengah, Papua Pegunungan, Papua Selatan, Papua Barat Daya

## ✨ Future Enhancements

Beberapa fitur yang bisa ditambahkan:

1. **Email Verification**
   - Send verification email after registration
   - Verify email before allowing login

2. **Password Reset**
   - Forgot password functionality
   - Reset password via email link

3. **Two-Factor Authentication (2FA)**
   - SMS or Authenticator app 2FA
   - Enhanced security for sensitive operations

4. **Social Login**
   - Facebook, GitHub, LinkedIn OAuth
   - Multiple auth providers per user

5. **Account Settings**
   - Change password
   - Update profile information
   - Delete account

6. **Admin Dashboard**
   - User management
   - View all registered users
   - Ban/suspend users

## 🐛 Troubleshooting

### Migration Error

Jika migration gagal, cek:
1. Database connection di `.env`
2. Users table sudah ada (jalankan auth database init)
3. PostgreSQL service running

```bash
# Cek connection
psql -U your_username -d your_database

# Jalankan auth init jika belum
node src/config/authDatabase.js
```

### Login Issues

- **Email not found**: Email belum terdaftar, user akan diarahkan ke registrasi
- **Invalid password**: Password salah, coba lagi atau gunakan forgot password
- **Session expired**: Login ulang

### Registration Issues

- **Email already exists**: Email sudah terdaftar, gunakan login
- **Password too short**: Minimal 8 karakter
- **Passwords don't match**: Pastikan password dan confirm password sama

## 📝 Notes

- Password strength indicator hanya guideline, semua password min. 8 karakter diterima
- Provinsi menggunakan nama resmi provinsi di Indonesia
- Phone number tidak divalidasi format, user bebas input format apapun
- City/Kabupaten adalah input text bebas (tidak dropdown karena terlalu banyak)
- Alamat lengkap bisa termasuk: jalan, RT/RW, kelurahan, kecamatan, kode pos
- Avatar URL default null, bisa di-set via profile update nanti
- Google OAuth users tidak memiliki password_hash (nullable)

## 🎉 Selesai!

Sistem authentication sekarang sudah lengkap dengan:
✅ Google OAuth login
✅ Email & password login
✅ Multi-step registration
✅ Beautiful UI/UX
✅ Security best practices
✅ Comprehensive validation

Enjoy coding! 🚀

