# 🚀 PixelNest PM2 Deployment Guide

Script deployment lengkap untuk PixelNest dengan PM2, PostgreSQL, Nginx, dan SSL.

## 📋 Overview

Script `deploy-pixelnest.sh` adalah script **comprehensive** yang akan:
- ✅ Install Node.js 20.x LTS
- ✅ Install PM2 dengan auto-startup
- ✅ Install PostgreSQL 15
- ✅ Install Nginx sebagai reverse proxy
- ✅ Install Certbot untuk SSL
- ✅ Setup firewall (UFW)
- ✅ Create database dan user
- ✅ Configure environment (.env)
- ✅ Install dependencies
- ✅ Build CSS
- ✅ Setup database tables
- ✅ Populate AI models
- ✅ Create admin user
- ✅ Obtain SSL certificate
- ✅ Configure Nginx
- ✅ Start aplikasi dengan PM2
- ✅ Setup SSL auto-renewal
- ✅ Create management scripts
- ✅ Security hardening

## 🚀 Cara Menggunakan

### Di VPS (Jalankan sebagai root/sudo)

```bash
# Clone atau upload project ke VPS
cd /var/www
git clone YOUR_REPO_URL pixelnest
# atau
# Upload project ke VPS

cd pixelnest

# Jalankan deployment script
sudo bash deploy-pixelnest.sh
```

Script akan:
1. Prompt untuk domain name
2. Install semua dependencies
3. Setup database
4. Configure aplikasi
5. Install SSL
6. Start aplikasi

### Atau dari Local Machine (via SSH)

```bash
# Upload script ke VPS
scp deploy-pixelnest.sh root@YOUR_VPS_IP:/root/

# SSH dan jalankan
ssh root@YOUR_VPS_IP
cd /root
bash deploy-pixelnest.sh
```

## ⚙️ Yang Dibuat Otomatis

### 1. Database
- Database: `pixelnest_db`
- User: `pixelnest_user`
- Password: Auto-generated (saved di .env)

### 2. Admin User
- Username: `admin`
- Password: `PixelNest@2025`
- Email: `admin@YOUR_DOMAIN`

### 3. PM2 Processes
- `pixelnest-server` - Main server
- `pixelnest-worker` - Background worker

### 4. Nginx Configuration
- SSL certificate
- Reverse proxy ke port 3000
- Direct serving untuk static files
- Security headers

### 5. Management Scripts
- `pixelnest-start.sh` - Start aplikasi
- `pixelnest-stop.sh` - Stop aplikasi
- `pixelnest-restart.sh` - Restart aplikasi
- `pixelnest-logs.sh` - View logs
- `pixelnest-status.sh` - Check status
- `pixelnest-backup.sh` - Backup database
- `pixelnest-update.sh` - Update aplikasi

## 📝 Post-Deployment

### 1. Configure API Keys

```bash
# Edit .env file
nano .env

# Tambahkan:
FAL_KEY=your_fal_key_here
TRIPAY_API_KEY=your_tripay_api_key
TRIPAY_PRIVATE_KEY=your_private_key
TRIPAY_MERCHANT_CODE=your_merchant_code
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Save dan restart
pm2 restart all
```

### 2. Verify Deployment

```bash
# Check PM2 status
pm2 list

# View logs
pm2 logs pixelnest-server
pm2 logs pixelnest-worker

# Check Nginx
systemctl status nginx
nginx -t

# Check PostgreSQL
systemctl status postgresql

# Check database
npm run verify-db
```

## 🔧 Management Commands

### Start/Stop/Restart
```bash
./pixelnest-start.sh      # Start
./pixelnest-stop.sh       # Stop
./pixelnest-restart.sh    # Restart dengan zero-downtime
```

### View Logs
```bash
./pixelnest-logs.sh       # View semua logs
pm2 logs pixelnest-server # View server logs
pm2 logs pixelnest-worker # View worker logs
pm2 logs --lines 200      # Last 200 lines
```

### Check Status
```bash
./pixelnest-status.sh     # Status lengkap
pm2 list                  # PM2 processes
pm2 monit                 # Monitor resources
```

### Backup
```bash
./pixelnest-backup.sh     # Backup database & uploads
```

### Update
```bash
./pixelnest-update.sh     # Update aplikasi
```

## 🎯 Manajemen PM2

### List Processes
```bash
pm2 list
```

### Restart Processes
```bash
pm2 restart all                          # Restart semua
pm2 restart pixelnest-server             # Restart server saja
pm2 restart pixelnest-worker             # Restart worker saja
pm2 reload pixelnest-server --update-env # Graceful reload
```

### Stop Processes
```bash
pm2 stop all                  # Stop semua
pm2 stop pixelnest-server    # Stop server
pm2 stop pixelnest-worker    # Stop worker
```

### Delete Processes
```bash
pm2 delete all                # Delete semua
pm2 delete pixelnest-server  # Delete server
pm2 delete pixelnest-worker  # Delete worker
```

### View Logs
```bash
pm2 logs                      # Live logs semua
pm2 logs pixelnest-server     # Live logs server
pm2 logs pixelnest-worker     # Live logs worker
pm2 logs --lines 500         # Last 500 lines
pm2 logs --json              # JSON format
```

### Monitor
```bash
pm2 monit                     # Resource monitor
pm2 describe pixelnest-server # Info detail
```

### Save Configuration
```bash
pm2 save                      # Save current setup
pm2 resurrect                 # Restore saved setup
```

## 🗄️ Database Management

### Connect to Database
```bash
export PGPASSWORD="$(grep DB_PASSWORD .env | cut -d '=' -f2)"
psql -h localhost -U pixelnest_user -d pixelnest_db
```

### Run Database Scripts
```bash
npm run setup-db          # Setup tables
npm run populate-models   # Add AI models
npm run verify-db         # Verify database
```

### Backup Database
```bash
export PGPASSWORD="$(grep DB_PASSWORD .env | cut -d '=' -f2)"
pg_dump -h localhost -U pixelnest_user pixelnest_db > backup.sql
```

### Restore Database
```bash
export PGPASSWORD="$(grep DB_PASSWORD .env | cut -d '=' -f2)"
psql -h localhost -U pixelnest_user -d pixelnest_db < backup.sql
```

## 🌐 Nginx Management

### Check Status
```bash
systemctl status nginx
```

### Test Configuration
```bash
nginx -t
```

### Reload Nginx
```bash
systemctl reload nginx
```

### Restart Nginx
```bash
systemctl restart nginx
```

### View Logs
```bash
tail -f /var/log/nginx/pixelnest_access.log
tail -f /var/log/nginx/pixelnest_error.log
```

## 🔒 SSL Management

### Check Certificates
```bash
certbot certificates
```

### Renew Certificates
```bash
certbot renew
```

### Force Renewal
```bash
certbot certonly --force-renewal -d your-domain.com
```

### Test Auto-Renewal
```bash
certbot renew --dry-run
```

## 🐛 Troubleshooting

### Application not starting
```bash
# Check PM2 logs
pm2 logs --lines 100

# Check .env
cat .env

# Check database
npm run verify-db

# Check Node.js
node --version
```

### Database connection error
```bash
# Check PostgreSQL
systemctl status postgresql

# Check credentials
cat .env | grep DB_

# Test connection
export PGPASSWORD="$(grep DB_PASSWORD .env | cut -d '=' -f2)"
psql -h localhost -U pixelnest_user -d pixelnest_db -c "SELECT 1;"
```

### Nginx not serving
```bash
# Check status
systemctl status nginx

# Check config
nginx -t

# View error log
tail -f /var/log/nginx/pixelnest_error.log
```

### SSL not working
```bash
# Check certificate
certbot certificates

# Renew certificate
certbot renew

# Check Nginx config
nginx -t

# Check firewall
ufw status
```

### PM2 not starting on boot
```bash
# Check startup script
pm2 startup

# Save current state
pm2 save

# Reinstall startup
pm2 unstartup
env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER
pm2 save
```

## 📊 Monitoring

### System Resources
```bash
htop           # CPU & Memory
df -h           # Disk usage
free -h         # Memory
```

### Application Resources
```bash
pm2 monit       # PM2 monitor
pm2 describe    # Process details
```

### Network
```bash
netstat -tulpn   # Network connections
ss -tulpn        # Socket statistics
```

## 🔄 Updates

### Update Application
```bash
# Pull latest code
git pull

# Install dependencies
npm install --production

# Build CSS
npm run build:css

# Restart dengan zero-downtime
pm2 reload all --update-env
```

### Update Dependencies
```bash
npm update
npm run build:css
pm2 restart all
```

## 📦 Backup & Restore

### Backup Everything
```bash
./pixelnest-backup.sh
```

### Manual Backup
```bash
# Backup database
pg_dump -h localhost -U pixelnest_user pixelnest_db > backup.sql

# Backup uploads
tar -czf uploads.tar.gz public/uploads/ public/images/

# Backup .env
cp .env .env.backup
```

### Restore
```bash
# Restore database
psql -h localhost -U pixelnest_user pixelnest_db < backup.sql

# Restore uploads
tar -xzf uploads.tar.gz

# Restore .env
cp .env.backup .env
```

## ✅ Deployment Checklist

Setelah deployment, pastikan:

- [ ] Application accessible di https://YOUR_DOMAIN
- [ ] Can login dengan admin user
- [ ] Database tables ada dan terisi
- [ ] AI models ter-populate
- [ ] PM2 processes berjalan
- [ ] Nginx serving aplikasi
- [ ] SSL certificate valid
- [ ] API keys configured
- [ ] Worker processing jobs
- [ ] Upload functionality working
- [ ] Can generate AI content

## 🎉 Success!

Aplikasi PixelNest sudah berjalan dengan:
- ✅ PM2 untuk process management
- ✅ PostgreSQL untuk database
- ✅ Nginx sebagai reverse proxy
- ✅ SSL certificate
- ✅ Auto-startup on boot
- ✅ Management scripts
- ✅ Security hardening

Visit: **https://YOUR_DOMAIN**

