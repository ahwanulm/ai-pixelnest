# PixelNest Deployment Guide

## 🚀 Quick Deployment

### 1. Create Deployment ZIP

```bash
# Option 1: Using npm script
npm run deploy:zip

# Option 2: Direct script
bash create-zip.sh
```

Script akan membuat `pixelnest.zip` dengan struktur:
```
pixelnest.zip
└── pixelnest/
    ├── src/
    ├── public/
    ├── migrations/
    ├── scripts/
    ├── server.js
    ├── worker.js
    ├── package.json
    ├── deploy-pixelnest.sh
    ├── post-deploy.sh
    └── ...semua file yang dibutuhkan
```

### 2. Upload ke Server

```bash
# Upload via SCP
scp pixelnest.zip user@server:/var/www/

# Atau via SFTP/FTP client
```

### 3. Extract dan Deploy di Server

```bash
# SSH ke server
ssh user@server

# Extract ZIP
cd /var/www
unzip pixelnest.zip

# Masuk ke folder
cd pixelnest

# Jalankan deployment
bash deploy-pixelnest.sh
```

## 📋 Yang Termasuk dalam ZIP

### ✅ Essential Files:
- **src/** - Source code aplikasi
- **public/** - Static files (CSS, JS, images)
- **migrations/** - Database migrations
- **scripts/** - Helper scripts
- **server.js** - Main server file
- **worker.js** - Background worker
- **package.json** - Dependencies

### ✅ Deployment Scripts:
- **deploy-pixelnest.sh** - Main deployment script
- **post-deploy.sh** - Post-deployment tasks
- **sync-tripay-channels.js** - Sync payment channels
- **update-database-consistency.js** - Database consistency check

### ✅ Documentation:
- **README.md** - Project documentation
- **PAYMENT_SETUP.md** - Payment setup guide
- **DATABASE_CONSISTENCY_UPDATE.md** - Database update guide

### ❌ Yang TIDAK Termasuk (untuk keamanan):
- `.env` - Environment variables (buat manual di server)
- `node_modules/` - Install via npm
- `uploads/` - User uploaded files
- `generations/` - Generated content
- `.git/` - Git history

## 🔧 Setelah Deployment

### 1. Setup Environment
```bash
# Copy .env.example
cp .env.example .env

# Edit .env dengan config production
nano .env
```

### 2. Install Dependencies
```bash
npm install --production
```

### 3. Setup Database
```bash
# Update database consistency
npm run update:db-consistency

# Sync payment channels
npm run sync:tripay-channels
```

### 4. Start Application
```bash
# Using PM2 (recommended)
pm2 start server.js --name pixelnest-server
pm2 start worker.js --name pixelnest-worker

# Save PM2 configuration
pm2 save
pm2 startup
```

## 🎯 Checklist Deployment

- [ ] Upload `pixelnest.zip` ke server
- [ ] Extract ZIP: `unzip pixelnest.zip`
- [ ] Masuk folder: `cd pixelnest`
- [ ] Setup `.env` file dengan config production
- [ ] Install dependencies: `npm install --production`
- [ ] Update database: `npm run update:db-consistency`
- [ ] Sync payment channels: `npm run sync:tripay-channels`
- [ ] Start dengan PM2: `pm2 start server.js`
- [ ] Verify aplikasi running: `pm2 status`
- [ ] Test di browser

## 📊 File Summary

```bash
# Check ZIP contents
unzip -l pixelnest.zip

# Check ZIP size
ls -lh pixelnest.zip
```

Typical size: ~40-50MB (tanpa node_modules dan user content)

---

**Ready to deploy!** 🎉
