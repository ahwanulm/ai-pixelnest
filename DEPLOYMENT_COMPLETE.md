# 🚀 PixelNest Deployment System - Complete Guide

Sistem deployment lengkap untuk PixelNest dengan optimasi ukuran file dan automated VPS deployment.

## 📦 Overview

Sistem deployment ini terdiri dari:
1. **Deployment ZIP Creator** - Membuat file ZIP untuk deployment (dioptimasi)
2. **VPS Deployment Script** - Automated deployment ke Ubuntu VPS
3. **Manual Deployment Guide** - Panduan step-by-step deployment manual

## 🎯 Quick Start

### 1. Generate Deployment ZIP
```bash
npm run deploy:zip
```

### 2. Deploy to VPS (Automated)
```bash
npm run deploy:vps
```

### 3. Deploy to VPS (Manual)
Ikuti panduan di [DEPLOY_VPS_MANUAL.md](DEPLOY_VPS_MANUAL.md)

## 📁 Files Created

### Deployment Scripts
- `create-deployment-zip.js` - Node.js script untuk membuat deployment ZIP
- `create-deployment-zip.sh` - Shell script untuk membuat deployment ZIP
- `deploy-vps.sh` - Automated VPS deployment script

### Documentation
- `DEPLOYMENT_COMPLETE.md` - This file (overview)
- `DEPLOY_VPS_QUICKSTART.md` - Quick start guide untuk VPS deployment
- `DEPLOY_VPS_MANUAL.md` - Manual deployment guide lengkap
- `DEPLOYMENT_ZIP_GUIDE.md` - Panduan lengkap membuat ZIP
- `QUICK_START_ZIP.md` - Quick reference untuk ZIP creation

## ✨ Features

### Deployment ZIP
- ✅ **Optimized size**: 160MB → 0.89MB (99.4% reduction)
- ✅ Exclude user-generated content (videos, images, uploads)
- ✅ Include hanya static assets yang diperlukan
- ✅ Auto-generate `.env.example`
- ✅ Include `DEPLOYMENT_README.md`
- ✅ Semua file di dalam folder `pixelnest/` (tidak di root archive)

### VPS Deployment
- ✅ **Automated**: Install semua dependencies otomatis
- ✅ **Interactive**: Prompt untuk domain dan konfigurasi
- ✅ PM2: Application process management
- ✅ Nginx: Reverse proxy configuration
- ✅ Certbot: SSL certificate setup
- ✅ PostgreSQL: Database setup
- ✅ Node.js: Instalasi otomatis
- ✅ **Manual option**: Step-by-step manual guide

## 📋 Deployment Options

### Option 1: Automated Deployment (Recommended)

```bash
# Step 1: Create deployment ZIP
npm run deploy:zip

# Step 2: Run deployment script
npm run deploy:vps
```

Script akan:
1. Prompt untuk domain, IP, SSH credentials
2. Upload file ke VPS
3. Install semua dependencies
4. Setup database
5. Configure Nginx
6. Setup SSL certificate
7. Start application dengan PM2

### Option 2: Manual Deployment

```bash
# Step 1: Create deployment ZIP
npm run deploy:zip

# Step 2: Follow manual guide
# Open: DEPLOY_VPS_MANUAL.md
```

## 🗂️ ZIP Contents

### ✅ Included
- `src/` - Application source code
- `public/css/` - CSS files
- `public/js/` - JavaScript files
- `public/assets/` - Static assets (icons, images)
- `migrations/` - Database migration files
- `scripts/` - Utility scripts
- `examples/` - Example files
- `*.sql` - SQL reference files
- `server.js` - Main server
- `worker.js` - Background worker
- `package.json` - Dependencies
- `.env.example` - Environment template
- `DEPLOYMENT_README.md` - Deployment instructions

### ❌ Excluded (Optimization)
- `node_modules/` - Dependencies (install di server)
- `.env` - Environment file (create di server)
- `public/videos/` - User-generated videos (118MB)
- `public/images/` - User-generated images (59MB)
- `public/uploads/` - User uploads
- `public/audio/` - User-generated audio
- `logs/` - Log files
- `*.md` - Documentation files

## 🔧 Requirements

### Local Machine
- Node.js 18+
- npm
- SSH access to VPS
- Deployment ZIP created

### VPS Ubuntu
- Ubuntu 20.04+ (fresh install recommended)
- Domain pointed to VPS IP
- SSH access
- Root or sudo access

## 📝 Deployment Process

### Automated Deployment Flow

```
1. Generate ZIP
   ↓
2. Run deploy-vps.sh
   ↓
3. Enter credentials
   - Domain name
   - VPS IP
   - SSH username/password
   ↓
4. Upload files to VPS
   ↓
5. Install dependencies
   - Node.js 20.x
   - PostgreSQL
   - PM2
   - Nginx
   - Certbot
   ↓
6. Setup database
   - Create database
   - Create user
   - Setup tables
   - Populate models
   ↓
7. Configure application
   - Create .env
   - Install dependencies
   - Build CSS
   ↓
8. Start with PM2
   ↓
9. Configure Nginx
   ↓
10. Setup SSL
    ↓
11. Done! 🎉
```

## 🎛️ Post-Deployment

### 1. Configure Environment Variables

```bash
# Connect to VPS
ssh -p 22 root@YOUR_VPS_IP

# Edit .env file
nano /var/www/pixelnest/.env
```

Tambahkan API keys:
- FAL AI Key
- Tripay credentials
- Email SMTP settings
- Session secret
- dll.

### 2. Restart Application

```bash
pm2 restart pixelnest
```

### 3. Verify Deployment

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs pixelnest

# Monitor resources
pm2 monit
```

## 🔧 Useful Commands

### PM2 Management
```bash
pm2 status              # Check status
pm2 logs pixelnest      # View logs
pm2 restart pixelnest   # Restart
pm2 stop pixelnest     # Stop
pm2 delete pixelnest   # Delete
pm2 monit              # Monitor
pm2 save               # Save config
```

### Database Management
```bash
# Connect to database
sudo -u postgres psql -d pixelnest_db

# Run setup scripts
npm run setup-db        # Setup tables
npm run populate-models # Add models
npm run verify-db       # Verify tables

# Backup
pg_dump pixelnest_db > backup.sql
```

### Nginx Management
```bash
# Restart
systemctl restart nginx

# Test config
nginx -t

# View logs
tail -f /var/log/nginx/error.log
```

### SSL Management
```bash
# Check certificates
certbot certificates

# Renew
certbot renew

# Force renewal
certbot certonly --force-renewal -d domain.com
```

## 🐛 Troubleshooting

### Application not starting
1. Check PM2 logs: `pm2 logs pixelnest`
2. Check .env file: `cat /var/www/pixelnest/.env`
3. Verify database: `npm run verify-db`
4. Check resources: `pm2 monit`

### Database connection error
1. Check PostgreSQL is running: `systemctl status postgresql`
2. Verify credentials in .env
3. Check permissions: `sudo -u postgres psql -c "\du"`

### SSL not working
1. Check certificate: `certbot certificates`
2. Renew certificate: `certbot renew`
3. Check Nginx config: `nginx -t`

## 📊 Size Comparison

| Before | After | Reduction |
|--------|-------|-----------|
| ~160MB | 0.89MB | **99.4%** ✅ |

**Before:** Include semua user-generated content  
**After:** Hanya include static assets + source code

## 🎉 Success Checklist

- [ ] ZIP created successfully (~0.89MB)
- [ ] VPS accessible via SSH
- [ ] Domain pointed to VPS IP
- [ ] All dependencies installed
- [ ] Database created and configured
- [ ] Application running with PM2
- [ ] Nginx configured properly
- [ ] SSL certificate installed
- [ ] Application accessible via HTTPS
- [ ] Environment variables configured
- [ ] Can login to admin panel
- [ ] AI generation working
- [ ] Upload functionality working

## 📚 Documentation Index

### Quick Reference
- [QUICK_START_ZIP.md](QUICK_START_ZIP.md) - ZIP creation quick start
- [DEPLOY_VPS_QUICKSTART.md](DEPLOY_VPS_QUICKSTART.md) - VPS deployment quick start

### Complete Guides
- [DEPLOYMENT_ZIP_GUIDE.md](DEPLOYMENT_ZIP_GUIDE.md) - ZIP creation complete guide
- [DEPLOY_VPS_MANUAL.md](DEPLOY_VPS_MANUAL.md) - VPS manual deployment guide

### This File
- [DEPLOYMENT_COMPLETE.md](DEPLOYMENT_COMPLETE.md) - Complete system overview (you are here)

## 🆘 Support

For issues:
1. Check logs: `pm2 logs pixelnest`
2. Verify database: `npm run verify-db`
3. Check Nginx: `tail -f /var/log/nginx/error.log`
4. Review documentation files

## 🎯 Summary

Sistem deployment ini menyediakan:

✅ **Optimized ZIP** - 99.4% size reduction  
✅ **Automated Deployment** - One command deployment  
✅ **Manual Option** - Step-by-step guide  
✅ **Complete Setup** - PM2 + Nginx + SSL + PostgreSQL  
✅ **Production Ready** - All best practices included  

**Ready to deploy! 🚀**

---

**Generated:** PixelNest Deployment System  
**Version:** 2.0.0  
**Date:** October 2025

