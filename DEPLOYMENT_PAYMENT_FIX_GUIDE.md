# 🚀 Panduan Deploy dengan deploy-pixelnest.sh + Payment Fix

## 📋 Overview

Anda menggunakan `deploy-pixelnest.sh` untuk deployment. Berikut cara mengintegrasikan fix payment channels ke dalam proses deployment Anda.

---

## ⚡ Solusi Quick (Recommended)

### Opsi 1: Deploy Dulu, Fix Kemudian

```bash
# 1. Deploy seperti biasa
sudo bash deploy-pixelnest.sh

# 2. Setelah deployment selesai, jalankan fix payment channels
npm run fix:payment-channels

# SELESAI!
```

### Opsi 2: Manual Steps Setelah Deploy

```bash
# 1. Deploy seperti biasa
sudo bash deploy-pixelnest.sh

# 2. Fix payment channels secara manual
cd /var/www/pixelnest  # atau lokasi project Anda

# 3. Run migration
bash fix-payment-channels-complete.sh

# 4. Sync channels
npm run sync:tripay-channels

# 5. Verify
npm run verify:payment-channels
```

---

## 🔧 Integrasi ke dalam deploy-pixelnest.sh (ADVANCED)

Jika Anda ingin otomatis fix payment channels saat deployment, tambahkan step ini ke `deploy-pixelnest.sh`:

### Lokasi: Setelah Step 14 (Setup Database Tables)

Tambahkan code ini setelah line ~397 (setelah `npm run verify-db`):

```bash
# Step 14.5: Fix Payment Channels
print_info "Fixing payment channels structure..."
if [ -f "migrations/fix_payment_channels_structure_complete.sql" ]; then
    export PGPASSWORD="$DB_PASSWORD"
    psql -h localhost -U pixelnest_user -d pixelnest_db -f migrations/fix_payment_channels_structure_complete.sql
    unset PGPASSWORD
    print_success "Payment channels structure fixed"
else
    print_warning "Payment channels migration file not found, skipping..."
fi

# Sync payment channels from Tripay (if configured)
print_info "Syncing payment channels from Tripay..."
if sudo -u $ACTUAL_USER npm run sync:tripay-channels 2>/dev/null; then
    print_success "Payment channels synced"
else
    print_warning "Payment channels sync failed (might need Tripay configuration)"
fi
```

---

## 📝 Script Patch yang Sudah Saya Buat

Saya sudah membuat file `deploy-pixelnest-payment-patch.sh` yang dapat Anda gunakan untuk menambahkan fix payment channels ke dalam deployment script Anda.

---

## 🎯 Flow Deployment yang Benar

### 1. **Fresh Deployment (First Time)**

```bash
# A. Clone repository
git clone your-repo-url
cd pixelnest

# B. Run deployment script
sudo bash deploy-pixelnest.sh

# C. Setelah deployment selesai, configure Tripay
# Login ke Admin Panel → API Configs → Add Tripay

# D. Jalankan fix payment channels
npm run fix:payment-channels

# E. Verify
npm run verify:payment-channels
```

### 2. **Update Deployment (Subsequent Deploys)**

```bash
# A. Pull latest code
cd /var/www/pixelnest
git pull origin main

# B. Install dependencies (if any new)
npm install --production

# C. Build CSS (if changes)
npm run build:css

# D. Fix payment channels (IMPORTANT!)
npm run fix:payment-channels

# E. Restart application
pm2 restart pixelnest-server pixelnest-worker

# F. Verify
npm run verify:payment-channels
```

---

## 🔍 Troubleshooting Deployment

### Masalah 1: Payment Channels Tidak Muncul Setelah Deploy

**Solusi:**
```bash
cd /var/www/pixelnest

# Check apakah migration sudah jalan
psql -U pixelnest_user -d pixelnest_db -c "\d payment_channels"

# Jika struktur salah, jalankan fix
npm run fix:payment-channels
```

### Masalah 2: Tripay Credentials Belum Dikonfigurasi

**Solusi:**
```bash
# Login ke Admin Panel
# https://your-domain.com/admin/login

# Navigate to: API Configs
# Add Tripay Configuration:
# - API Key: [dari Tripay Dashboard]
# - Private Key: [dari Tripay Dashboard]
# - Endpoint: https://tripay.co.id/api-sandbox (testing)
#          atau https://tripay.co.id/api (production)

# Setelah save, sync channels
npm run sync:tripay-channels
```

### Masalah 3: Migration Error saat Deploy

**Solusi:**
```bash
# Check database connection
psql -U pixelnest_user -d pixelnest_db -c "SELECT version();"

# Jika database tidak accessible, check .env
cat .env | grep DB_

# Manual migration
export PGPASSWORD="your_db_password"
psql -h localhost -U pixelnest_user -d pixelnest_db \
  -f migrations/fix_payment_channels_structure_complete.sql
unset PGPASSWORD
```

---

## 📊 Checklist Deployment

Gunakan checklist ini setiap kali deploy:

### ✅ Pre-Deployment
- [ ] Backup database: `pg_dump pixelnest_db > backup.sql`
- [ ] Pull latest code: `git pull origin main`
- [ ] Check .env file ada dan lengkap

### ✅ During Deployment
- [ ] Run deployment script: `sudo bash deploy-pixelnest.sh`
- [ ] Monitor output untuk errors
- [ ] Note admin credentials yang di-generate

### ✅ Post-Deployment
- [ ] Fix payment channels: `npm run fix:payment-channels`
- [ ] Configure Tripay di Admin Panel (if not yet)
- [ ] Sync payment channels: `npm run sync:tripay-channels`
- [ ] Verify: `npm run verify:payment-channels`
- [ ] Test frontend: Login → Top Up → Check payment methods
- [ ] Check PM2 logs: `pm2 logs --lines 50`

---

## 🎯 Best Practices

### 1. **Always Test in Staging First**
```bash
# Deploy ke staging server dulu
sudo bash deploy-pixelnest.sh

# Test semua fitur
# Termasuk payment channels

# Kalau OK, baru deploy ke production
```

### 2. **Keep Backups**
```bash
# Backup database sebelum deploy
pg_dump -U pixelnest_user pixelnest_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup .env
cp .env .env.backup
```

### 3. **Monitor After Deployment**
```bash
# Monitor logs for 5-10 minutes
pm2 logs --lines 100

# Check if payment channels work
curl http://localhost:3000/api/payment/channels | jq .

# Check nginx logs
tail -f /var/log/nginx/error.log
```

### 4. **Document Your Config**
```bash
# Simpan konfigurasi penting di tempat aman:
# - Tripay API credentials
# - Database credentials
# - Domain & SSL info
# - Admin login credentials
```

---

## 📖 Quick Command Reference

### Deployment Commands
```bash
# Full deployment
sudo bash deploy-pixelnest.sh

# Update only
git pull && npm install && npm run build:css && pm2 restart all

# Fix payment channels
npm run fix:payment-channels

# Verify everything
npm run verify:payment-channels && npm run verify-db
```

### Management Commands
```bash
# Start
pm2 start ecosystem.config.js

# Stop
pm2 stop all

# Restart
pm2 restart all

# Logs
pm2 logs --lines 100

# Status
pm2 list
```

### Database Commands
```bash
# Access database
psql -U pixelnest_user -d pixelnest_db

# Check payment channels
psql -U pixelnest_user -d pixelnest_db -c "SELECT COUNT(*) FROM payment_channels WHERE is_active = true;"

# Backup
pg_dump -U pixelnest_user pixelnest_db > backup.sql

# Restore
psql -U pixelnest_user -d pixelnest_db < backup.sql
```

---

## 💡 Tips & Tricks

### 1. Automate Post-Deployment Steps

Buat file `post-deploy.sh`:
```bash
#!/bin/bash
echo "Running post-deployment tasks..."

# Fix payment channels
npm run fix:payment-channels

# Sync channels
npm run sync:tripay-channels

# Verify
npm run verify:payment-channels

echo "Post-deployment completed!"
```

Kemudian setelah deploy:
```bash
sudo bash deploy-pixelnest.sh && bash post-deploy.sh
```

### 2. Create Deployment Alias

Tambahkan ke `.bashrc` atau `.zshrc`:
```bash
alias deploy-pixelnest='cd /var/www/pixelnest && git pull && sudo bash deploy-pixelnest.sh && npm run fix:payment-channels'
```

### 3. Setup Monitoring

```bash
# Install monitoring
pm2 install pm2-logrotate

# Configure
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

---

## 🆘 Emergency Recovery

Jika deployment gagal total:

```bash
# 1. Stop semua
pm2 stop all
sudo systemctl stop nginx

# 2. Restore database dari backup
psql -U pixelnest_user -d pixelnest_db < backup.sql

# 3. Reset PM2
pm2 delete all
pm2 start ecosystem.config.js

# 4. Restart services
sudo systemctl start nginx

# 5. Fix payment channels
npm run fix:payment-channels

# 6. Check status
pm2 list
curl http://localhost:3000/health
```

---

## 📞 Need Help?

### Check Files
- `PAYMENT_FIX_README.md` - Complete documentation
- `QUICK_FIX_PAYMENT_ID.md` - Quick reference
- `SOLUSI_METODE_PEMBAYARAN_DEPLOYMENT.md` - Detailed troubleshooting

### Check Logs
```bash
# Application logs
pm2 logs pixelnest-server --lines 200

# Nginx logs
tail -f /var/log/nginx/error.log

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*.log

# System logs
journalctl -u pm2-* -f
```

---

**Remember:** Setiap kali deploy, SELALU jalankan `npm run fix:payment-channels` setelah deployment untuk memastikan payment channels bekerja dengan baik!

---

**Last Updated:** 2025-10-29  
**Version:** 1.0  
**Author:** Ahwanulm


