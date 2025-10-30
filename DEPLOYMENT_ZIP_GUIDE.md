# 📦 Deployment ZIP Creation Guide

Script untuk membuat file ZIP deployment untuk project PixelNest.

## 🎯 Overview

Script ini akan membuat file ZIP yang berisi semua file yang diperlukan untuk deployment production. **Semua file ditempatkan di dalam folder `pixelnest` di dalam archive**, bukan di root archive.

## ⚡ Optimized Size

Script telah dioptimasi untuk **exclude user-generated content** sehingga ukuran ZIP turun drastis:
- **Sebelum:** ~160MB (include videos & images)
- **Sesudah:** ~0.9MB (**99.4% reduction!** ✅)
- User-generated files akan dibuat secara dinamis di server

## 🚀 Cara Menggunakan

### Metode 1: Menggunakan npm script (Recommended)

```bash
npm run deploy:zip
```

### Metode 2: Menggunakan Node.js script langsung

```bash
node create-deployment-zip.js
```

### Metode 3: Menggunakan shell script

```bash
./create-deployment-zip.sh
```

## 📋 Yang Diinclude dalam ZIP

### ✅ Essential Files
- `package.json` dan `package-lock.json` - Dependencies
- `server.js` - Main application server
- `worker.js` - Background worker
- `ecosystem.config.js` - PM2 configuration
- `tailwind.config.js` - Tailwind CSS config
- `postcss.config.js` - PostCSS config
- `restart-worker.sh` - Worker restart script

### ✅ Directories
- `src/` - Semua source code aplikasi
- `public/` - Static assets (CSS, JS, images, uploads)
- `migrations/` - Database migration files
- `scripts/` - Utility scripts
- `examples/` - Example files

### ✅ Reference Files
- `*.sql` - SQL reference files
- `.env.example` - Template environment variables (auto-generated from .env)

### ❌ Yang TIDAK Diinclude
- `node_modules/` - Dependencies (harus diinstall di server)
- `.env` - Environment file (menggunakan .env.example)
- `logs/` - Log files
- `*.md`指定 Documentation files (kecuali DEPLOYMENT_README.md)
- `test-*.html` - Test files
- Temporary files
- **`public/videos/`** - User-generated videos (118MB+) - Directory kosong dibuat otomatis di server
- **`public/images/`** - User-generated images (59MB+) - Directory kosong dibuat otomatis di server
- **`public/uploads/`** - User uploads - Directory kosong dibuat otomatis di server
- **`public/audio/`** - User-generated audio - Directory kosong dibuat otomatis di server

**Catatan:** Directory kosong untuk user-generated content dibuat otomatis dalam ZIP sehingga aplikasi tetap berfungsi saat dideploy. File-file user akan dibuat secara dinamis saat aplikasi berjalan.

## 📁 Struktur ZIP

```
pixelnest-deployment-YYYYMMDD_HHMMSS.zip
└── pixelnest/
    ├── src/
    ├── public/
    ├── migrations/
    ├── scripts/
    ├── examples/
    ├── server.js
    ├── worker.js
    ├── package.json
    ├── package-lock.json
    ├── ecosystem.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── restart-worker.sh
    ├── run-migration-fix.js
    ├── .env.example
    ├── .gitignore
    └── DEPLOYMENT_README.md
```

## 🔧 Cara Deploy

### 1. Extract ZIP File

```bash
unzip pixelnest-deployment-YYYYMMDD_HHMMSS.zip
cd pixelnest
```

### 2. Install Dependencies

```bash
npm install --production
```

### 3. Setup Environment

```bash
cp .env.example .env
# Edit .env dengan konfigurasi yang sesuai
```

### 4. Setup Database

```bash
# Create database
createdb pixelnest_db

# Setup tables
npm run setup-db

# Populate models
npm run populate-models

# Verify
npm run verify-db
```

### 5. Build CSS

```bash
npm run build:css
```

### 6. Start Application

#### Option A: Menggunakan npm

```bash
# Terminal 1: Start server
npm start

# Terminal 2: Start worker
npm run worker
```

#### Option B: Menggunakan PM2 (Recommended)

```bash
pm2 start ecosystem.config.js
```

alliases:
```bash
pm2 status              # Check status
pm2 logs                # View logs
pm2 restart all         # Restart all
pm2 stop all            # Stop all
```

## ⚙️ Environment Variables

Pastikan file `.env` dikonfigurasi dengan benar:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pixelnest_db
DB_USER=your_user
DB_PASSWORD=your_password

# Session
SESSION_SECRET=your_secret_key

# Server
PORT=3000
NODE_ENV=production

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email
EMAIL_PASS=your_password

# API Keys
FAL_KEY=your_fal_ai_key
TRIPAY_API_KEY=your_tripay_key

# ... dan lainnya
```

## 🐛 Troubleshooting

### ZIP tidak dibuat
- Pastikan Anda punya akses write di directory project
- Check disk space yang tersedia

### Error saat extract
- Pastikan file ZIP tidak corrupt
- Gunakan unzip command yang compatible

### Dependencies tidak terinstall
- Pastikan Node.js dan npm sudah terinstall
- Gunakan `npm install --production` bukan `npm install`

### Database error
- Pastikan PostgreSQL sudah running
- Check credentials di file `.env`
- Run `npm run verify-db` untuk check database status

### Worker tidak jalan
- Pastikan worker process berjalan terpisah dari server
- Check logs: `pm2 logs` atau `npm run worker`

## 📝 Notes

- File ZIP menggunakan format: `pixelnest-deployment-YYYYMMDD_HHMMSS.zip`
- Semua file di dalam folder `pixelnest/` di archive
- Script otomatis membuat `.env.example` dari `.env` (dengan masking sensitive values)
- Script juga membuat `.gitignore` jika belum ada
- `DEPLOYMENT_README.md` sudah termasuk dalam ZIP

## ✅ Checklist Pre-Deployment

Sebelum membuat deployment ZIP:

- [ ] Database sudah siap
- [ ] Environment variables sudah dikonfigurasi
- [ ] Dependencies sudah diinstall (`npm install`)
- [ ] CSS sudah di-build (`npm run build:css`)
- [ ] Aplikasi sudah ditest dan berjalan
- [ ] Documentation sudah update

## 📞 Support

Jika ada masalah saat deployment:
1. Check error logs
2. Verify database connection
3. Check environment variables
4. Lihat `DEPLOYMENT_README.md` yang ada di dalam ZIP

## 🎉 Summary

Script deployment ini memudahkan proses deployment dengan:
- ✅ Semua file yang diperlukan sudah include
- ✅ Folder `pixelnest` sebagai root di archive
- ✅ Auto-generate `.env.example`
- ✅ Include `DEPLOYMENT_README.md` untuk panduan
- ✅ Skip file yang tidak diperlukan
- ✅ Simple command: `npm run deploy:zip`

Happy Deploying! 🚀

