# 🚀 PixelNest - Deployment Guide

Panduan lengkap untuk setup dan deploy aplikasi PixelNest.

---

## 📋 Pre-Deployment Checklist

Sebelum deploy, pastikan sudah memiliki:

- ✅ Node.js (v14 atau lebih tinggi)
- ✅ PostgreSQL (v12 atau lebih tinggi)
- ✅ npm atau yarn
- ✅ Git (untuk clone/pull updates)

---

## 🗄️ Database Setup (PENTING!)

### Opsi 1: Setup Database Baru (Recommended)

Untuk database baru atau setelah reset:

```bash
# 1. Buat database PostgreSQL
createdb pixelnest_db

# 2. Setup semua tabel secara otomatis
npm run setup-db

# 3. Verifikasi semua tabel sudah ada
npm run verify-db
```

Script `setup-db` akan membuat **SEMUA** tabel yang diperlukan:
- ✅ Authentication tables (users, sessions)
- ✅ Basic tables (contacts, services, blog, dll)
- ✅ Admin tables (promo codes, notifications, dll)
- ✅ AI models dan generation history
- ✅ Payment dan transaction tables
- ✅ Referral system tables
- ✅ Feature request tables

### Opsi 2: Reset Database (Clean Slate)

Jika ingin reset database dari awal:

```bash
# Hapus database lama
dropdb pixelnest_db

# Buat database baru
createdb pixelnest_db

# Setup ulang semua tabel
npm run reset-db
```

Script `reset-db` akan:
1. Menjalankan setup database lengkap
2. Verifikasi semua tabel sudah ada
3. Exit dengan error jika ada yang kurang

### Opsi 3: Update Database (Migrasi)

Jika database sudah ada dan hanya perlu update:

```bash
# Cek tabel mana yang kurang
npm run verify-db

# Jalankan migrasi spesifik jika perlu
npm run migrate:auth         # Users & sessions
npm run migrate:models       # AI models
npm run migrate:tripay       # Payment system
npm run init-admin           # Admin tables
```

---

## 🔧 Environment Configuration

### 1. Buat file `.env`

```bash
cp .env.example .env
```

### 2. Edit konfigurasi `.env`

```env
# Server
PORT=5005
NODE_ENV=production

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pixelnest_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# Atau gunakan DATABASE_URL (untuk hosting seperti Heroku/Railway)
# DATABASE_URL=postgresql://user:password@host:port/database

# Session Secret (WAJIB diganti di production!)
SESSION_SECRET=your-super-secret-key-change-this-in-production

# FAL.AI API (untuk AI generation)
FAL_KEY=your_fal_api_key

# Tripay Payment Gateway
TRIPAY_MERCHANT_CODE=your_merchant_code
TRIPAY_API_KEY=your_api_key
TRIPAY_PRIVATE_KEY=your_private_key
TRIPAY_MODE=sandbox  # atau 'production'

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5005/auth/google/callback

# Email (untuk notifikasi)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_password
```

---

## 📦 Installation Steps

### Development Environment

```bash
# 1. Install dependencies
npm install

# 2. Setup database
npm run setup-db

# 3. Verify database
npm run verify-db

# 4. Start development server
npm run dev

# 5. (Optional) Start worker untuk background jobs
npm run dev:worker
```

Aplikasi akan berjalan di: `http://localhost:5005`

### Production Environment

```bash
# 1. Clone repository
git clone <repository-url>
cd PIXELNEST

# 2. Install dependencies (production only)
npm install --production

# 3. Setup database
npm run setup-db

# 4. Build CSS (jika menggunakan Tailwind)
npm run build:css

# 5. Verify everything
npm run verify-db

# 6. Start production server
npm start

# 7. Start worker (di terminal terpisah)
npm run worker
```

---

## 🐳 Docker Deployment (Optional)

### Buat `Dockerfile`

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

RUN npm run build:css

EXPOSE 5005

CMD ["npm", "start"]
```

### Buat `docker-compose.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: pixelnest_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: yourpassword
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  app:
    build: .
    ports:
      - "5005:5005"
    environment:
      NODE_ENV: production
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: pixelnest_db
      DB_USER: postgres
      DB_PASSWORD: yourpassword
      SESSION_SECRET: your-secret-key
    depends_on:
      - postgres
    command: sh -c "npm run setup-db && npm start"

volumes:
  postgres_data:
```

### Run dengan Docker

```bash
# Build dan start
docker-compose up -d

# Check logs
docker-compose logs -f app

# Stop
docker-compose down
```

---

## 🚀 Platform-Specific Deployment

### Heroku

```bash
# 1. Login ke Heroku
heroku login

# 2. Buat aplikasi baru
heroku create pixelnest-app

# 3. Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev

# 4. Set environment variables
heroku config:set NODE_ENV=production
heroku config:set SESSION_SECRET=your-secret-key
heroku config:set FAL_KEY=your-fal-key

# 5. Deploy
git push heroku main

# 6. Setup database
heroku run npm run setup-db

# 7. Verify
heroku run npm run verify-db

# 8. Open app
heroku open
```

### Railway.app

1. Connect GitHub repository
2. Add PostgreSQL plugin
3. Set environment variables di dashboard
4. Deploy akan otomatis
5. Run setup database:
   ```bash
   railway run npm run setup-db
   ```

### Vercel (Frontend Only)

Untuk Vercel, perlu pisahkan frontend dan backend, atau gunakan Vercel dengan serverless functions.

### VPS (Ubuntu/Debian)

```bash
# 1. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# 3. Setup PostgreSQL user
sudo -u postgres createuser pixelnest
sudo -u postgres createdb pixelnest_db
sudo -u postgres psql -c "ALTER USER pixelnest WITH PASSWORD 'yourpassword';"

# 4. Clone dan setup aplikasi
git clone <repository-url>
cd PIXELNEST
npm install --production

# 5. Setup database
npm run setup-db

# 6. Install PM2 untuk process management
sudo npm install -g pm2

# 7. Start aplikasi dengan PM2
pm2 start server.js --name pixelnest
pm2 start worker.js --name pixelnest-worker

# 8. Setup PM2 auto-start
pm2 startup
pm2 save

# 9. Setup Nginx sebagai reverse proxy
sudo apt-get install nginx
```

**Nginx config** (`/etc/nginx/sites-available/pixelnest`):

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/pixelnest /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Setup SSL dengan Let's Encrypt
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 🔍 Troubleshooting

### Error: "relation 'sessions' does not exist"

**Penyebab:** Tabel sessions belum dibuat

**Solusi:**
```bash
npm run setup-db
```

### Error: "role postgres does not exist"

**Penyebab:** Default user PostgreSQL tidak ada (umum di macOS)

**Solusi:**
```bash
# Gunakan user sistem Anda
whoami  # cek username
# Edit .env:
DB_USER=your_username  # ganti dengan hasil whoami
DB_PASSWORD=           # kosongkan jika tidak ada password
```

### Error: "database does not exist"

**Solusi:**
```bash
createdb pixelnest_db
npm run setup-db
```

### Error: "ECONNREFUSED"

**Penyebab:** PostgreSQL tidak berjalan

**Solusi:**
```bash
# macOS (Homebrew)
brew services start postgresql@14

# Linux
sudo systemctl start postgresql

# Windows
# Start PostgreSQL service dari Services
```

### Aplikasi jalan tapi ada tabel yang hilang

**Solusi:**
```bash
# Cek tabel mana yang hilang
npm run verify-db

# Jika banyak yang hilang, setup ulang
npm run setup-db
```

---

## 🔐 Security Checklist

Sebelum deploy ke production:

- [ ] Ganti `SESSION_SECRET` dengan random string yang kuat
- [ ] Set `NODE_ENV=production`
- [ ] Gunakan HTTPS (SSL certificate)
- [ ] Jangan commit file `.env` ke git
- [ ] Set proper PostgreSQL password
- [ ] Enable firewall di VPS
- [ ] Batasi akses database hanya dari aplikasi
- [ ] Backup database secara rutin
- [ ] Monitor logs dengan PM2 atau tool lainnya
- [ ] Setup rate limiting untuk API endpoints

---

## 📊 Database Backup

### Backup Manual

```bash
# Backup
pg_dump pixelnest_db > backup_$(date +%Y%m%d).sql

# Restore
psql pixelnest_db < backup_20241028.sql
```

### Automated Backup (Cron Job)

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * pg_dump pixelnest_db > /path/to/backups/backup_$(date +\%Y\%m\%d).sql
```

---

## 📈 Monitoring & Logs

### PM2 Monitoring

```bash
# View logs
pm2 logs pixelnest

# Monitor status
pm2 status

# Restart aplikasi
pm2 restart pixelnest

# View metrics
pm2 monit
```

### Check Database Size

```bash
psql pixelnest_db -c "
SELECT 
  pg_size_pretty(pg_database_size('pixelnest_db')) as db_size;
"
```

### Check Table Sizes

```bash
psql pixelnest_db -c "
SELECT 
  table_name,
  pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as size
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY pg_total_relation_size(quote_ident(table_name)) DESC;
"
```

---

## 🎯 Production Checklist

Sebelum go-live:

### Database
- [ ] Database sudah di-setup dengan `npm run setup-db`
- [ ] Semua tabel terverifikasi dengan `npm run verify-db`
- [ ] Database backup otomatis sudah disetup
- [ ] PostgreSQL performance sudah di-tune

### Application
- [ ] Environment variables sudah diset
- [ ] `NODE_ENV=production`
- [ ] SSL/HTTPS sudah aktif
- [ ] Session secret sudah diganti
- [ ] Error logging sudah disetup

### Services
- [ ] Main app berjalan (PM2 atau Docker)
- [ ] Worker berjalan untuk background jobs
- [ ] Nginx reverse proxy configured
- [ ] Firewall configured
- [ ] Monitoring tools installed

### Testing
- [ ] Test registrasi user baru
- [ ] Test login (password & Google OAuth)
- [ ] Test AI generation
- [ ] Test payment flow
- [ ] Test admin panel
- [ ] Load testing dilakukan

---

## 📞 Support

Jika ada masalah saat deployment:

1. Check logs: `pm2 logs` atau `docker-compose logs`
2. Verify database: `npm run verify-db`
3. Check environment variables
4. Review error messages di terminal

---

## 🔄 Update Aplikasi

```bash
# 1. Pull latest changes
git pull origin main

# 2. Install new dependencies
npm install

# 3. Run migrations (jika ada)
npm run verify-db
# Jika ada tabel yang kurang, run:
npm run setup-db

# 4. Restart aplikasi
pm2 restart all

# Atau dengan Docker:
docker-compose down
docker-compose up -d --build
```

---

**Good luck with your deployment! 🚀**
