# 📦 PixelNest Deployment Package Guide

## Overview

This guide explains how to create and use deployment packages for PixelNest. The deployment system is optimized to exclude user-generated content, resulting in smaller, faster deployments.

## 🎯 What's Included in Deployment Package

### ✅ Included:
- **Application code**: All source files in `src/`
- **Static assets**: CSS, JavaScript, images in `public/assets/`
- **Database files**: Migrations and SQL reference files
- **Configuration**: `package.json`, config files, ecosystem.config.js
- **Scripts**: Deployment and utility scripts
- **Auto-generated docs**: DEPLOYMENT_README.md (created during packaging)

### ❌ Excluded (for smaller packages):
- `node_modules/` - Install fresh on server
- `.env` - Create on server with your credentials
- **Documentation files** (*.md) - Not needed on production server
- User-generated content:
  - `public/images/*` - Existing user images
  - `public/videos/*` - Existing user videos
  - `public/audio/*` - Existing user audio
  - `public/uploads/*` - Existing user uploads
- Log files
- Development files

## 🚀 Creating Deployment Packages

### Method 1: Shell Script (Recommended for Unix/Linux/macOS)

```bash
# Using npm script
npm run deploy:zip

# Or directly
bash create-zip.sh
```

**Output**: `pixelnest-deployment-YYYY-MM-DD_HH-MM-SS.zip`

### Method 2: Node.js Script (Cross-platform)

```bash
# Using npm script
npm run deploy:zip:node

# Or directly
node create-deployment-zip.js
```

**Output**: `pixelnest-deployment-YYYY-MM-DD_HH-MM-SS.zip`

### Method 3: Legacy Wrapper

```bash
bash create-deployment-zip.sh
```

This calls `create-zip.sh` internally for backward compatibility.

## 📊 Package Size Comparison

| Package Type | Approximate Size | Notes |
|--------------|------------------|-------|
| Full backup with user content | 500MB - 5GB+ | Includes all user images/videos |
| Deployment package (optimized) | 10MB - 50MB | Clean deployment, no user content |

## 🎁 Package Contents Structure

```
pixelnest/
├── src/                      # Application source code
│   ├── controllers/          # Route controllers
│   ├── models/               # Database models
│   ├── routes/               # Express routes
│   ├── services/             # Business logic
│   ├── middleware/           # Custom middleware
│   ├── config/               # Configuration files
│   └── views/                # EJS templates
├── public/                   # Static assets
│   ├── css/                  # Stylesheets
│   ├── js/                   # Client JavaScript
│   ├── assets/               # Images, icons, fonts
│   ├── videos/.gitkeep       # Empty directory placeholder
│   ├── images/.gitkeep       # Empty directory placeholder
│   ├── audio/.gitkeep        # Empty directory placeholder
│   └── uploads/.gitkeep      # Empty directory placeholder
├── migrations/               # Database migrations
├── scripts/                  # Utility scripts
├── examples/                 # Code examples
├── package.json              # Dependencies
├── server.js                 # Main server
├── worker.js                 # Background worker
├── ecosystem.config.js       # PM2 configuration
├── .env.example              # Environment template
├── .gitignore                # Git ignore rules
├── DEPLOYMENT_README.md      # Deployment instructions
└── *.sql                     # SQL reference files
```

## 🔧 Deployment Workflow

### Step 1: Create Deployment Package

```bash
# On your local development machine
npm run deploy:zip

# This creates: pixelnest-deployment-2025-10-29_14-30-45.zip
```

### Step 2: Upload to Server

```bash
# Upload via SCP
scp pixelnest-deployment-*.zip user@yourserver.com:/var/www/

# Or use SFTP, FileZilla, or your preferred method
```

### Step 3: Extract on Server

```bash
# SSH into server
ssh user@yourserver.com

# Navigate to web directory
cd /var/www/

# Extract package
unzip pixelnest-deployment-*.zip

# Navigate to project
cd pixelnest
```

### Step 4: Setup on Server

```bash
# Install dependencies (production only)
npm install --production

# Create environment file
cp .env.example .env
nano .env  # Edit with your configuration

# Setup database
createdb pixelnest_db
npm run setup-db
npm run populate-models
npm run verify-db

# Build CSS
npm run build:css

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
```

## 🔐 Environment Configuration

The deployment package includes `.env.example` with all required variables. You must create `.env` on the server with real values:

### Essential Environment Variables:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/pixelnest_db

# Server
PORT=3000
NODE_ENV=production
SESSION_SECRET=your_unique_random_secret_here

# API Keys
FAL_KEY=your_fal_ai_api_key
SUNO_BASE_URL=your_suno_endpoint
GROQ_API_KEY=your_groq_api_key

# Payment (Tripay)
TRIPAY_API_KEY=your_tripay_api_key
TRIPAY_PRIVATE_KEY=your_tripay_private_key
TRIPAY_MERCHANT_CODE=your_merchant_code

# Email (Choose one)
# Option 1: SendGrid
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_FROM=noreply@yourdomain.com

# Option 2: SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://yourdomain.com/auth/google/callback

# Application
SITE_URL=http://yourdomain.com
```

## 📝 Post-Deployment Checklist

After deploying, verify everything works:

- [ ] Server is running: `pm2 status`
- [ ] Database connected: `npm run verify-db`
- [ ] Payment channels synced: `npm run sync:tripay-channels`
- [ ] Email sending works (test account activation)
- [ ] CSS is loaded properly (check homepage)
- [ ] Worker is processing jobs: `pm2 logs worker`
- [ ] Can create admin account: `npm run create-admin`
- [ ] Can generate test image/video
- [ ] Payment flow works (if enabled)

## 🔄 Updating Existing Deployment

When updating an existing deployment:

```bash
# On server, backup current installation
cd /var/www
mv pixelnest pixelnest-backup-$(date +%Y%m%d)

# Extract new package
unzip pixelnest-deployment-*.zip
cd pixelnest

# Copy .env from backup
cp ../pixelnest-backup-*/env .env

# Install/update dependencies
npm install --production

# Run migrations if needed
npm run migrate:fix-schema

# Rebuild CSS
npm run build:css

# Restart services
pm2 restart all

# Verify
pm2 status
pm2 logs
```

## 🛠️ Customizing Deployment Package

### Exclude Additional Files

Edit `create-zip.sh` or `create-deployment-zip.js` to exclude more files:

```bash
# In create-zip.sh, add to exclusions:
# Don't copy certain files
# Example: Skip test files
# skip copying test/ directory
```

### Include Additional Files

```bash
# In create-zip.sh, add after other copies:
cp your-custom-file.txt "${PIXELNEST_DIR}/"
```

## 📈 Best Practices

1. **Always test locally first** before creating deployment package
2. **Version control** your code before creating package
3. **Create backups** before deploying to production
4. **Use timestamped packages** to track deployments
5. **Keep .env secure** - never include in package
6. **Test on staging** before production deployment
7. **Monitor logs** after deployment: `pm2 logs`
8. **Check error rates** in first hour after deployment

## 🐛 Troubleshooting

### Package Creation Issues

**Problem**: Script fails with permission error
```bash
# Solution: Make scripts executable
chmod +x create-zip.sh create-deployment-zip.sh
```

**Problem**: Package is too large (>100MB)
```bash
# Check what's being included
unzip -l pixelnest-deployment-*.zip | grep -v "/$" | sort -k4 -rn | head -20

# Verify user content is excluded
unzip -l pixelnest-deployment-*.zip | grep "public/images/"
# Should only see .gitkeep
```

### Deployment Issues

**Problem**: npm install fails on server
```bash
# Check Node.js version
node --version  # Should be 18+

# Clean install
rm -rf node_modules package-lock.json
npm install --production
```

**Problem**: Database connection fails
```bash
# Check PostgreSQL is running
systemctl status postgresql

# Test connection
psql $DATABASE_URL

# Verify .env has correct credentials
```

**Problem**: Worker not processing
```bash
# Check worker is running
pm2 status

# Restart worker
pm2 restart worker

# Check worker logs
pm2 logs worker --lines 100
```

## 📞 Support

For deployment issues:
1. Check `DEPLOYMENT_README.md` in the package
2. Check `DEPLOYMENT_GUIDE.md` for detailed setup
3. Review `DEPLOYMENT_CHECKLIST.md` for common issues
4. Check logs: `pm2 logs`

## 🎯 Quick Reference

| Command | Description |
|---------|-------------|
| `npm run deploy:zip` | Create deployment package (Shell) |
| `npm run deploy:zip:node` | Create deployment package (Node.js) |
| `npm run setup-db` | Setup database tables |
| `npm run populate-models` | Populate AI models |
| `npm run verify-db` | Verify database setup |
| `npm run build:css` | Build production CSS |
| `pm2 start ecosystem.config.js` | Start all services |
| `pm2 logs` | View all logs |
| `pm2 restart all` | Restart all services |

---

**Last Updated**: October 29, 2025  
**Package Version**: 2.0.0

