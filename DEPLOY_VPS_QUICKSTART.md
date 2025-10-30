# ⚡ Quick Start - VPS Deployment

## 🚀 Automated Deployment

```bash
# Step 1: Generate deployment ZIP
npm run deploy:zip

# Step 2: Run automated deployment script
npm run deploy:vps
```

Script akan meminta:
- Domain name (e.g., example.com)
- SSH username (default: root)
- VPS IP address
- SSH port (default: 22)

## 📋 What It Does Automatically

✅ Installs Node.js 20.x  
✅ Installs PostgreSQL  
✅ Installs PM2  
✅ Installs Nginx  
✅ Installs Certbot  
✅ Creates database  
✅ Sets up application  
✅ Configures Nginx  
✅ Sets up SSL certificate  
✅ Starts application with PM2  

## 🎯 Manual Deployment

Jika ingin deploy secara manual, ikuti panduan di:  
**[DEPLOY_VPS_MANUAL.md](DEPLOY_VPS_MANUAL.md)**

## ⚙️ Post-Deployment

Setelah deployment selesai, jangan lupa:

1. **Edit `.env` file untuk menambahkan API keys:**
```bash
ssh -p 22 root@YOUR_VPS_IP
nano /var/www/pixelnest/.env
```

2. **Restart aplikasi untuk load environment baru:**
```bash
pm2 restart pixelnest
```

3. **Check status:**
```bash
pm2 status
pm2 logs pixelnest
```

## 🔧 Quick Commands

```bash
# View logs
pm2 logs pixelnest

# Restart app
pm2 restart pixelnest

# Stop app
pm2 stop pixelnest

# Monitor resources
pm2 monit
```

## 📝 Checklist

- [ ] Domain pointed to VPS IP
- [ ] Deployment completed successfully
- [ ] SSL certificate installed
- [ ] Application accessible via HTTPS
- [ ] Database credentials saved
- [ ] API keys added to .env
- [ ] Application restarted

## 🌐 Access Your Application

Visit: **https://YOUR_DOMAIN**

## 📚 Documentation

- **Automated Deployment:** This file
- **Manual Deployment:** [DEPLOY_VPS_MANUAL.md](DEPLOY_VPS_MANUAL.md)
- **ZIP Creation:** [DEPLOYMENT_ZIP_GUIDE.md](DEPLOYMENT_ZIP_GUIDE.md)
- **Quick ZIP Guide:** [QUICK_START_ZIP.md](QUICK_START_ZIP.md)

