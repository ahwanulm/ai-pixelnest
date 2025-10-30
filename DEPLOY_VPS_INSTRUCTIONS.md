# 🚀 Cara Deploy di VPS - Quick Instructions

## ⚠️ Penting

Script ada 2 jenis:
1. `deploy-vps.sh` - Untuk dijalankan dari **LOCAL MACHINE** (akan SSH ke VPS)
2. `deploy-on-vps.sh` - Untuk dijalankan **LANGSUNG DI VPS** (yang Anda gunakan sekarang)

Anda sudah berada di VPS, jadi gunakan `deploy-on-vps.sh`

## 📋 Cara Deploy di VPS

### Step 1: Upload ZIP ke VPS

Dari local machine Anda, jalankan:

```bash
# Upload file ZIP ke VPS
scp pixelnest.zip root@YOUR_VPS_IP:/var/www/pixelnest/
```

### Step 2: Upload Script Deploy ke VPS

```bash
scp deploy-on-vps.sh root@YOUR_VPS_IP:/var/www/pixelnest/
```

### Step 3: SSH ke VPS dan Jalankan Script

```bash
# SSH ke VPS
ssh root@YOUR_VPS_IP

# Masuk ke directory
cd /var/www/pixelnest

# Buat executable
chmod +x deploy-on-vps.sh

# Jangan jalankan sebagai root! Buat user baru dulu:
adduser deploy
usermod -aG sudo deploy
su - deploy

# Sekarang jalankan script
bash /var/www/pixelnest/deploy-on-vps.sh
```

Script akan prompt:
- Domain name (e.g., example.com)
- Akan install semua dependencies (Node.js, PostgreSQL, PM2, Nginx, Certbot)
- Setup database
- Configure Nginx
- Setup SSL
- Start aplikasi dengan PM2

## ⚡ One-liner (Alternative)

Jika Anda sudah upload `pixelnest.zip` dan `deploy-on-vps.sh`, jalankan:

```bash
# As non-root user
bash /var/www/pixelnest/deploy-on-vps.sh
```

## 📝 Yang Harus Anda Lakukan Setelah Deploy

1. **Edit .env file** untuk menambahkan API keys:
```bash
sudo nano /var/www/pixelnest/pixelnest/.env
```

Tambahkan:
- FAL AI Key
- Tripay credentials
- Email SMTP settings
- dll.

2. **Restart aplikasi:**
```bash
pm2 restart pixelnest
```

3. **Check status:**
```bash
pm2 status
pm2 logs pixelnest
```

## 🎉 Done!

Akses aplikasi Anda di: **https://YOUR_DOMAIN**

## 🔧 Useful Commands

```bash
# PM2 Management
pm2 status              # Check status
pm2 logs pixelnest      # View logs
pm2 restart pixelnest   # Restart
pm2 monit               # Monitor

# Database
npm run verify-db       # Check database
npm run setup-db        # Setup tables
npm run populate-models # Add models

# Nginx
sudo systemctl status nginx
sudo nginx -t
tail -f /var/log/nginx/error.log

# SSL
sudo certbot certificates
sudo certbot renew
```

## 🐛 Troubleshooting

### Script tidak jalan sebagai root?
- Buat user baru: `adduser deploy && usermod -aG sudo deploy`
- Login sebagai user baru: `su - deploy`
- Jalankan script lagi

### File tidak ditemukan?
```bash
# Check file ada
ls -la /var/www/pixelnest/

# Upload ulang jika perlu
scp pixelnest.zip root@YOUR_VPS_IP:/var/www/pixelnest/
```

### Aplikasi tidak start?
```bash
# Check logs
pm2 logs pixelnest

# Check .env
cat /var/www/pixelnest/pixelnest/.env

# Check database
npm run verify-db
```

## 📚 Dokumentasi Lengkap

- **Quick Start:** [DEPLOY_VPS_QUICKSTART.md](DEPLOY_VPS_QUICKSTART.md)
- **Manual Guide:** [DEPLOY_VPS_MANUAL.md](DEPLOY_VPS_MANUAL.md)
- **Complete Overview:** [DEPLOYMENT_COMPLETE.md](DEPLOYMENT_COMPLETE.md)

