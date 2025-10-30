# 🚀 PixelNest Deployment - Quick Reference

## 📦 Create Deployment Package

```bash
# Recommended (Shell - Unix/Linux/macOS)
npm run deploy:zip

# Cross-platform (Node.js - Works everywhere)
npm run deploy:zip:node

# Direct execution
bash create-zip.sh                    # Shell script
node create-deployment-zip.js         # Node.js script
bash create-deployment-zip.sh         # Wrapper script
```

**Output:** `pixelnest-deployment-2025-10-29_14-30-45.zip` (25MB typical)

---

## 📤 Upload to Server

```bash
# SCP (Secure Copy)
scp pixelnest-deployment-*.zip user@yourserver.com:/var/www/

# SFTP
sftp user@yourserver.com
> put pixelnest-deployment-*.zip /var/www/
> quit
```

---

## 🛠️ Deploy on Server

```bash
# 1. SSH to server
ssh user@yourserver.com

# 2. Navigate and extract
cd /var/www/
unzip pixelnest-deployment-*.zip
cd pixelnest

# 3. Install dependencies
npm install --production

# 4. Setup environment
cp .env.example .env
nano .env  # Add your real credentials

# 5. Setup database
createdb pixelnest_db
npm run setup-db
npm run populate-models
npm run verify-db

# 6. Build CSS
npm run build:css

# 7. Start services
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Enable auto-start on reboot
```

---

## ✅ Verify Deployment

```bash
# Check services
pm2 status
pm2 logs

# Test database
npm run verify-db

# Sync payment channels
npm run sync:tripay-channels

# Check website
curl http://localhost:3000
```

---

## 🔄 Update Existing Deployment

```bash
# On server

# 1. Backup current
cd /var/www/
mv pixelnest pixelnest-backup-$(date +%Y%m%d)

# 2. Extract new package
unzip pixelnest-deployment-*.zip
cd pixelnest

# 3. Restore .env
cp ../pixelnest-backup-*/.env .env

# 4. Update
npm install --production
npm run build:css
pm2 restart all

# 5. Verify
pm2 status
pm2 logs --lines 50
```

---

## 🔑 Essential Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/pixelnest_db

# API Keys
FAL_KEY=your_fal_ai_api_key
SUNO_BASE_URL=your_suno_endpoint

# Payment
TRIPAY_API_KEY=your_api_key
TRIPAY_PRIVATE_KEY=your_private_key

# Email (Choose SendGrid OR SMTP)
SENDGRID_API_KEY=your_sendgrid_key
# OR
SMTP_HOST=smtp.gmail.com
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Security
SESSION_SECRET=change_this_to_random_string
```

---

## 🐛 Common Issues

### Package creation fails
```bash
chmod +x create-zip.sh create-deployment-zip.sh
```

### Database connection fails
```bash
# Check PostgreSQL is running
systemctl status postgresql

# Test connection
psql $DATABASE_URL
```

### Worker not processing
```bash
pm2 restart worker
pm2 logs worker
```

### CSS not loading
```bash
npm run build:css
```

---

## 📊 Package Contents

**✅ Included:**
- Application code (`src/`)
- Static assets (`public/css/`, `public/js/`, `public/assets/`)
- Migrations, scripts, examples
- Configuration files
- DEPLOYMENT_README.md (auto-generated)

**❌ Excluded (for smaller package):**
- `node_modules/` (install on server)
- `.env` (create on server)
- Documentation files (`*.md`)
- User content (`public/images/*`, `public/videos/*`, `public/audio/*`)
- Log files

**Size:** ~10-50MB (vs 500MB-5GB with user content)

---

## 🎯 PM2 Commands

```bash
pm2 start ecosystem.config.js    # Start all
pm2 stop all                      # Stop all
pm2 restart all                   # Restart all
pm2 delete all                    # Delete all
pm2 logs                          # View logs
pm2 logs --lines 100              # Last 100 lines
pm2 monit                         # Monitor
pm2 status                        # Status
pm2 save                          # Save list
pm2 startup                       # Auto-start
```

---

## 📝 Database Commands

```bash
npm run setup-db              # Setup tables
npm run populate-models       # Add AI models
npm run verify-db            # Verify setup
npm run sync:tripay-channels # Sync payment
npm run create-admin         # Create admin user
npm run migrate:fix-schema   # Run migrations
```

---

## 📚 Documentation

- **DEPLOYMENT_PACKAGE_GUIDE.md** - Complete deployment guide
- **DEPLOYMENT_README.md** - Auto-generated in each package
- **DEPLOYMENT_ZIP_UPDATE_SUMMARY.md** - System update details
- **DEPLOYMENT_GUIDE.md** - Main deployment documentation
- **DEPLOYMENT_CHECKLIST.md** - Pre-deployment checklist

---

## 🎉 One-Command Quick Deploy

```bash
# On local machine
npm run deploy:zip && echo "✅ Package created! Upload to server."

# On server (after upload)
cd /var/www && \
unzip -q pixelnest-deployment-*.zip && \
cd pixelnest && \
npm install --production && \
cp .env.example .env && \
echo "⚠️  Edit .env now, then run: npm run setup-db && npm run build:css && pm2 start ecosystem.config.js"
```

---

**Last Updated:** October 29, 2025  
**Version:** 2.0.0  
**Status:** ✅ Production Ready

