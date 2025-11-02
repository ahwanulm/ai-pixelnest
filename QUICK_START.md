# 🚀 Quick Start Guide - PixelNest

Panduan cepat untuk menjalankan PixelNest dalam 5 menit.

---

## ⚡ Setup Cepat (5 Menit)

### 1. Pastikan PostgreSQL Berjalan

```bash
# Check PostgreSQL status
pg_isready

# Jika tidak jalan, start PostgreSQL:
# macOS (Homebrew)
brew services start postgresql@14

# Linux
sudo systemctl start postgresql

# Windows
# Start PostgreSQL service dari Services panel
```

### 2. Buat Database

```bash
# Buat database baru
createdb pixelnest_db

# Atau via psql:
# psql -U postgres -c "CREATE DATABASE pixelnest_db;"
```

### 3. Install Dependencies

```bash
cd /Users/ahwanulm/Desktop/PROJECT/PIXELNEST
npm install
```

### 4. Setup Environment Variables

```bash
# Buat file .env (jika belum ada)
cat > .env << 'EOF'
PORT=5005
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pixelnest_db
DB_USER=ahwanulm
DB_PASSWORD=

# Session Secret
SESSION_SECRET=pixelnest-secret-key-change-in-production

# FAL AI (opsional - untuk AI generation)
FAL_KEY=

# Tripay Payment (opsional - untuk payment)
TRIPAY_MERCHANT_CODE=
TRIPAY_API_KEY=
TRIPAY_PRIVATE_KEY=
TRIPAY_MODE=sandbox
EOF
```

**PENTING:** Ganti `DB_USER` dengan username PostgreSQL Anda:
```bash
whoami  # Cek username Anda
```

### 5. Setup Database (Otomatis!)

```bash
# Buat semua tabel secara otomatis
npm run setup-db

# Verifikasi semua tabel ada
npm run verify-db
```

Anda akan melihat:
```
🎉 SUCCESS! All required tables are present.

  ✓ Found: 26/26 tables
  ✗ Missing: 0 tables

✅ Your database is ready for:
   • Development
   • Production deployment
   • Running the application
```

### 6. Start Aplikasi

```bash
# Start development server
npm run dev

# Aplikasi akan berjalan di: http://localhost:5005
```

---

## 🎯 Akses Aplikasi

### Homepage
```
http://localhost:5005
```

### Admin Panel
```
http://localhost:5005/admin/login

# Default admin (buat dulu dengan):
npm run create-admin
```

### Dashboard User
```
http://localhost:5005/dashboard
# (Setelah register/login)
```

---

## 🔧 Commands Penting

### Database Management
```bash
npm run setup-db      # Setup database baru (membuat semua tabel)
npm run verify-db     # Cek tabel yang ada/hilang
npm run reset-db      # Reset database (drop & recreate)
```

### Development
```bash
npm run dev           # Start server (auto-reload)
npm run dev:worker    # Start background worker
npm run dev:all       # Start server + worker + CSS watch
```

### Production
```bash
npm start             # Start production server
npm run worker        # Start production worker
```

### Admin
```bash
npm run init-admin    # Setup admin tables
npm run create-admin  # Buat admin user
npm run make-admin    # Promote user ke admin
```

---

## ❓ Troubleshooting

### Error: "relation 'sessions' does not exist"

**Solusi:**
```bash
npm run setup-db
```

### Error: "role postgres does not exist" (macOS)

**Solusi:** Gunakan user sistem Anda
```bash
whoami  # Misal: ahwanulm

# Edit .env:
DB_USER=ahwanulm
DB_PASSWORD=
```

### Error: "database does not exist"

**Solusi:**
```bash
createdb pixelnest_db
npm run setup-db
```

### Error: "ECONNREFUSED"

**Solusi:** PostgreSQL tidak berjalan
```bash
# macOS
brew services start postgresql@14

# Linux
sudo systemctl start postgresql

# Atau check status:
pg_isready
```

### Database Corrupted / Error Aneh

**Solusi:** Reset database dari awal
```bash
# Hapus database lama
dropdb pixelnest_db

# Buat ulang
createdb pixelnest_db

# Setup ulang semua tabel
npm run setup-db

# Verifikasi
npm run verify-db
```

### Aplikasi Jalan Tapi Error 500

1. **Check Logs:** Lihat error di terminal
2. **Check Database:** `npm run verify-db`
3. **Check .env:** Pastikan semua config benar
4. **Restart:** `npm run dev` (ulang)

---

## 🔐 Membuat Admin User

```bash
# Opsi 1: Create default admin
npm run create-admin
# Username: admin
# Password: admin123
# Email: admin@pixelnest.id

# Opsi 2: Promote existing user to admin
npm run make-admin
# Masukkan email user yang ingin dijadikan admin
```

---

## 📊 Database Info

### Tabel yang Dibuat (26 tabel)

**Authentication:**
- `users` - User accounts
- `sessions` - Session management

**Basic App:**
- `contacts` - Contact form submissions
- `services` - Services/features list
- `testimonials` - Customer testimonials
- `blog_posts` - Blog articles
- `pricing_plans` - Pricing tiers
- `newsletter_subscribers` - Newsletter emails

**Admin & Management:**
- `promo_codes` - Discount & claim codes
- `api_configs` - API keys storage
- `notifications` - User notifications
- `user_activity_logs` - Activity tracking
- `credit_transactions` - Credit history
- `admin_settings` - System settings

**AI Generation:**
- `ai_models` - Available AI models
- `ai_generation_history` - Generation history
- `pinned_models` - User favorite models
- `pricing_config` - Pricing configuration

**Payment:**
- `payment_transactions` - Payment records
- `payment_channels` - Available payment methods

**Referral:**
- `referral_transactions` - Referral earnings
- `payout_requests` - Withdrawal requests
- `payout_settings` - Referral config

**Features:**
- `feature_requests` - Feature & bug reports (with rewards)
- `feature_request_votes` - Upvotes
- `feature_request_rate_limits` - Rate limiting

### Check Database Stats

```bash
# Koneksi ke database
psql pixelnest_db

# List semua tabel
\dt

# Lihat struktur tabel
\d users

# Count rows
SELECT COUNT(*) FROM users;

# Exit
\q
```

---

## 🚀 Deploy to Production

Lihat panduan lengkap: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

**Quick Steps:**
1. Setup production database
2. Set `NODE_ENV=production` di .env
3. Ganti `SESSION_SECRET` dengan random string
4. Run `npm run setup-db`
5. Run `npm run verify-db`
6. Start dengan PM2: `pm2 start server.js`

---

## 📞 Need Help?

### Check Logs
```bash
# Development
# Lihat di terminal tempat npm run dev

# Production (dengan PM2)
pm2 logs pixelnest
```

### Verify Setup
```bash
# Cek tabel database
npm run verify-db

# Test database connection
psql pixelnest_db -c "SELECT COUNT(*) FROM users;"

# Check PostgreSQL status
pg_isready
```

### Common Issues

1. **Port already in use:**
   ```bash
   # Ganti PORT di .env
   PORT=3000
   ```

2. **Cannot find module:**
   ```bash
   npm install
   ```

3. **CSS not loading:**
   ```bash
   npm run build:css
   ```

---

## ✅ Success Checklist

- [ ] PostgreSQL installed dan running
- [ ] Database `pixelnest_db` created
- [ ] `npm install` completed
- [ ] `.env` file configured
- [ ] `npm run setup-db` success
- [ ] `npm run verify-db` passed (26/26 tables)
- [ ] Server running di http://localhost:5005
- [ ] Homepage loaded successfully
- [ ] Admin user created

---

## 🎉 Selesai!

Aplikasi PixelNest Anda sudah siap digunakan!

**Next Steps:**
- Explore admin panel: `/admin/login`
- Create your first user: `/auth/register`
- Configure AI models (jika punya FAL API key)
- Setup payment gateway (jika punya Tripay account)
- Customize content di database

**Happy coding! 🚀**

