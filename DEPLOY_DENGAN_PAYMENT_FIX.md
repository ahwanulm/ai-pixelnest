# 🚀 Deploy PixelNest dengan Payment Fix - Quick Guide

## ⚡ Cara Paling Mudah (RECOMMENDED)

### Deployment Lengkap:

```bash
# 1. Deploy dengan script utama
sudo bash deploy-pixelnest.sh

# 2. Setelah selesai, jalankan post-deployment
npm run post:deploy
```

**SELESAI!** ✅ Payment channels akan otomatis ter-fix.

---

## 📋 Step-by-Step Detail

### 1️⃣ **Deploy Aplikasi**

```bash
cd /path/to/pixelnest
sudo bash deploy-pixelnest.sh
```

Script ini akan:
- ✅ Setup Nginx + SSL
- ✅ Install PostgreSQL
- ✅ Setup database tables
- ✅ Install dependencies
- ✅ Configure PM2
- ✅ Create admin user

### 2️⃣ **Post-Deployment (WAJIB!)**

```bash
npm run post:deploy
```

Script ini akan:
- ✅ Fix payment channels structure
- ✅ Restart PM2
- ✅ Sync channels dari Tripay
- ✅ Verifikasi setup

### 3️⃣ **Konfigurasi Tripay**

1. Login ke Admin Panel: `https://your-domain.com/admin`
2. Navigate ke: **API Configs**
3. Add Tripay:
   - **API Key:** [dari dashboard Tripay]
   - **Private Key:** [dari dashboard Tripay]
   - **Endpoint:** `https://tripay.co.id/api-sandbox` (testing)
   - **Status:** Active

4. Sync channels:
```bash
npm run sync:tripay-channels
```

### 4️⃣ **Verifikasi**

```bash
# Check payment channels
npm run verify:payment-channels

# Check PM2 status
pm2 list

# Test API
curl http://localhost:3000/api/payment/channels
```

---

## 🔄 Update Deployment

Jika sudah pernah deploy dan mau update:

```bash
# 1. Pull latest code
cd /var/www/pixelnest
git pull origin main

# 2. Install new dependencies (if any)
npm install --production

# 3. Build CSS
npm run build:css

# 4. Fix payment channels (PENTING!)
npm run fix:payment-channels

# 5. Restart app
pm2 restart all

# 6. Verify
npm run verify:payment-channels
```

---

## 🎯 One-Liner Commands

### Fresh Deploy
```bash
sudo bash deploy-pixelnest.sh && npm run post:deploy
```

### Update Deploy
```bash
git pull && npm install --production && npm run build:css && npm run fix:payment-channels && pm2 restart all
```

### Quick Fix Payment Only
```bash
npm run fix:payment-channels
```

### Verify Everything
```bash
npm run verify:payment-channels && pm2 list
```

---

## ⚠️ Troubleshooting Cepat

### Problem: Payment methods tidak muncul

**Solution:**
```bash
npm run fix:payment-channels
npm run verify:payment-channels
```

### Problem: "Tripay configuration not found"

**Solution:**
1. Login Admin Panel
2. Go to API Configs
3. Add Tripay credentials
4. Run: `npm run sync:tripay-channels`

### Problem: Migration error

**Solution:**
```bash
# Check database
psql -U pixelnest_user -d pixelnest_db -c "SELECT version();"

# Manual migration
bash fix-payment-channels-complete.sh

# Verify
npm run verify:payment-channels
```

---

## 📊 Deployment Checklist

### Pre-Deployment
- [ ] Backup database (jika update)
- [ ] Check .env file ada
- [ ] Git pull latest code

### Deployment
- [ ] Run `sudo bash deploy-pixelnest.sh`
- [ ] Note admin credentials yang di-generate
- [ ] Check untuk errors di output

### Post-Deployment (WAJIB!)
- [ ] Run `npm run post:deploy`
- [ ] Configure Tripay di Admin Panel
- [ ] Run `npm run sync:tripay-channels`
- [ ] Run `npm run verify:payment-channels`

### Testing
- [ ] Login ke aplikasi
- [ ] Test Top Up feature
- [ ] Verify payment methods muncul
- [ ] Check PM2 logs: `pm2 logs --lines 50`

---

## 📝 Files & Scripts Reference

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `deploy-pixelnest.sh` | Full deployment | First time setup |
| `post-deploy.sh` | Post-deployment tasks | After deploy-pixelnest.sh |
| `fix-payment-deployment.sh` | Fix payment channels | When payment broken |
| `sync-tripay-channels.js` | Sync from Tripay API | After config change |
| `verify-payment-channels.sh` | Verify setup | Check status |

| NPM Command | Equivalent | Purpose |
|-------------|------------|---------|
| `npm run deploy:pm2` | `sudo bash deploy-pixelnest.sh` | Full deploy |
| `npm run post:deploy` | `bash post-deploy.sh` | Post-deploy tasks |
| `npm run fix:payment-channels` | `bash fix-payment-deployment.sh` | Fix payments |
| `npm run sync:tripay-channels` | `node sync-tripay-channels.js` | Sync channels |
| `npm run verify:payment-channels` | `bash verify-payment-channels.sh` | Verify |

---

## 💡 Pro Tips

### 1. Create Deployment Alias
```bash
echo 'alias pixelnest-deploy="cd /var/www/pixelnest && sudo bash deploy-pixelnest.sh && npm run post:deploy"' >> ~/.bashrc
source ~/.bashrc

# Now you can just run:
pixelnest-deploy
```

### 2. Auto-Backup Before Deploy
```bash
# Create backup script
cat > backup-before-deploy.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/pixelnest"
mkdir -p $BACKUP_DIR
pg_dump -U pixelnest_user pixelnest_db > $BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql
echo "Backup saved to $BACKUP_DIR"
EOF

chmod +x backup-before-deploy.sh

# Run before deploy
bash backup-before-deploy.sh && sudo bash deploy-pixelnest.sh
```

### 3. Setup Monitoring
```bash
# Install PM2 monitoring
pm2 install pm2-logrotate

# Configure
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30

# View dashboard
pm2 monit
```

---

## 🆘 Emergency Recovery

Jika deployment benar-benar gagal:

```bash
# 1. Stop everything
pm2 stop all
sudo systemctl stop nginx

# 2. Restore backup (if you have)
psql -U pixelnest_user -d pixelnest_db < /var/backups/pixelnest/backup_latest.sql

# 3. Restart services
sudo systemctl start nginx
pm2 restart all

# 4. Fix payment channels
npm run fix:payment-channels

# 5. Check status
pm2 list
curl http://localhost:3000/health
```

---

## 📞 Dokumentasi Lengkap

Jika butuh info lebih detail:

- **Quick Fix:** `QUICK_FIX_PAYMENT_ID.md`
- **Lengkap:** `SOLUSI_METODE_PEMBAYARAN_DEPLOYMENT.md`
- **Master Guide:** `PAYMENT_FIX_README.md`
- **Deploy + Payment:** `DEPLOYMENT_PAYMENT_FIX_GUIDE.md`

---

## ✅ Summary

### Deployment Flow:
1. `sudo bash deploy-pixelnest.sh` - Deploy aplikasi
2. `npm run post:deploy` - Fix payment channels
3. Configure Tripay di Admin Panel
4. `npm run sync:tripay-channels` - Sync channels
5. Test di browser ✅

### Update Flow:
1. `git pull` - Pull latest code
2. `npm install` - Install dependencies
3. `npm run fix:payment-channels` - Fix payments
4. `pm2 restart all` - Restart app
5. Test di browser ✅

---

**Remember:** Selalu jalankan `npm run post:deploy` setelah `deploy-pixelnest.sh`!

---

**Last Updated:** 2025-10-29  
**Author:** Ahwanulm  
**Status:** ✅ Production Ready


