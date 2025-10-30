# 🚀 Manual VPS Deployment Guide

Panduan lengkap untuk deploy PixelNest ke VPS Ubuntu secara manual.

## 📋 Prerequisites

- VPS Ubuntu 20.04+ (fresh install)
- Domain name pointed to VPS IP
- Root or sudo access
- SSH access to VPS

## 🔧 Step 1: Prepare Local Machine

```bash
# Generate deployment ZIP
npm run deploy:zip

# This will create: pixelnest-deployment-YYYYMMDD_HHMMSS.zip
```

## 🔐 Step 2: Connect to VPS

```bash
ssh -p 22 root@YOUR_VPS_IP
```

## 📦 Step 3: Install Dependencies

### Update System
```bash
apt update && apt upgrade -y
```

### Install Node.js 20.x
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Verify installation
node --version  # Should be v20.x
npm --version
```

### Install PostgreSQL
```bash
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql

# Verify
systemctl status postgresql
```

### Install PM2
```bash
npm install -g pm2
pm2 startup

# Verify
pm2 --version
```

### Install Nginx
```bash
apt install -y nginx
systemctl start nginx
systemctl enable nginx

# Verify
systemctl status nginx
```

### Install Certbot (for SSL)
```bash
apt install -y certbot python3-certbot-nginx
certbot --version
```

## 📤 Step 4: Upload Application

### From Local Machine
```bash
# Upload ZIP file to VPS
scp pixelnest-deployment-*.zip root@YOUR_VPS_IP:~/
```

### On VPS
```bash
# Create application directory
mkdir -p /var/www/pixelnest
cd /var/www/pixelnest

# Extract ZIP
unzip ~/pixelnest-deployment-*.zip
cd pixelnest
```

## 💾 Step 5: Setup Database

```bash
# Create database and user
DB_NAME="pixelnest_db"
DB_USER="pixelnest_user"
DB_PASSWORD=$(openssl rand -base64 32)

# Create database
sudo -u postgres psql <<EOF
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER USER $DB_USER CREATEDB;
\q
EOF

# Save credentials (IMPORTANT!)
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo "Password: $DB_PASSWORD"
```

## ⚙️ Step 6: Configure Environment

```bash
# Copy example env
cp .env.example .env

# Edit .env with your details
nano .env
```

Edit `.env` file:
```env
# Server
NODE_ENV=production
PORT=3000

# Database (from Step 5)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pixelnest_db
DB_USER=pixelnest_user
DB_PASSWORD=paste_password_here

# Session
SESSION_SECRET=generate_random_string_here

# Email (Configure your SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# API Keys
FAL_KEY=your_fal_ai_key
TRIPAY_API_KEY=your_tripay_api_key
TRIPAY_MERCHANT_CODE=your_merchant_code
TRIPAY_PRIVATE_KEY=your_private_key
```

## 📊 Step 7: Setup Database Tables

```bash
# Install dependencies
npm install --production

# Build CSS
npm run build:css

# Setup database tables
npm run setup-db

# Populate models
npm run populate-models

# Verify setup
npm run verify-db
```

## 🚀 Step 8: Start with PM2

```bash
# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Check status
pm2 status
pm2 logs pixelnest
```

## 🌐 Step 9: Configure Nginx

```bash
# Create Nginx configuration
nano /etc/nginx/sites-available/pixelnest
```

Paste this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Upload size
        client_max_body_size 100M;
        client_body_buffer_size 1M;
        client_body_timeout 60s;
    }
}
```

```bash
# Enable site
ln -sf /etc/nginx/sites-available/pixelnest /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default

# Test configuration
nginx -t

# Reload Nginx
systemctl reload nginx
```

## 🔒 Step 10: Setup SSL with Certbot

```bash
# Install SSL certificate
certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal test
certbot renew --dry-run
```

## ✅ Step 11: Verify Deployment

```bash
# Check application status
pm2 status
pm2 logs pixelnest

# Check Nginx status
systemctl status nginx

# Check PostgreSQL status
systemctl status postgresql

# Visit your website
curl -I https://your-domain.com
```

## 🔧 Useful Commands

### PM2 Management
```bash
pm2 status              # Check status
pm2 logs pixelnest      # View logs
pm2 restart pixelnest   # Restart app
pm2 stop pixelnest      # Stop app
pm2 delete pixelnest    # Delete app
pm2 monit               # Monitor resources
pm2 save                # Save configuration
```

### Database Management
```bash
# Connect to database
sudo -u postgres psql -d pixelnest_db

# Run database scripts
npm run setup-db        # Setup tables
npm run populate-models # Add AI models
npm run verify-db       # Check tables

# Backup database
pg_dump pixelnest_db > backup.sql
```

### Nginx Management
```bash
# Restart Nginx
systemctl restart nginx

# Test configuration
nginx -t

# View error logs
tail -f /var/log/nginx/error.log

# View access logs
tail -f /var/log/nginx/access.log
```

## 🐛 Troubleshooting

### Application not starting
```bash
# Check PM2 logs
pm2 logs pixelnest

# Check .env file
cat /var/www/pixelnest/.env

# Verify database connection
psql -h localhost -U pixelnest_user -d pixelnest_db
```

### SSL certificate not working
```bash
# Check certificate
certbot certificates

# Renew certificate
certbot renew

# Force renewal
certbot certonly --force-renewal -d your-domain.com
```

### Database connection error
```bash
# Check PostgreSQL is running
systemctl status postgresql

# Check credentials in .env
# Verify user has permissions
sudo -u postgres psql -c "\du"
```

### Nginx errors
```bash
# Check Nginx error log
tail -f /var/log/nginx/error.log

# Test Nginx config
nginx -t

# Reload Nginx
systemctl reload nginx
```

## 📝 Post-Deployment Checklist

- [ ] Application accessible via HTTPS
- [ ] Database tables created successfully
- [ ] AI models populated
- [ ] Environment variables configured
- [ ] SSL certificate installed
- [ ] PM2 auto-start configured
- [ ] Nginx working properly
- [ ] Can login to admin panel
- [ ] Can generate AI content
- [ ] Upload functionality working

## 🔄 Updating Application

```bash
# Stop application
pm2 stop pixelnest

# Backup current version
mv /var/www/pixelnest /var/www/pixelnest.backup.$(date +%Y%m%d)

# Upload new ZIP from local
scp new-deployment.zip root@YOUR_VPS_IP:~/

# Extract new version
cd /var/www
unzip ~/new-deployment.zip
cd pixelnest/pixelnest

# Copy .env from backup
cp /var/www/pixelnest.backup.*/.env .

# Install dependencies
npm install --production
npm run build:css

# Run migrations if needed
npm run setup-db

# Start application
pm2 restart pixelnest

# Verify
pm2 status
pm2 logs pixelnest
```

## 🎉 Success!

Your PixelNest application is now deployed and accessible at:
**https://your-domain.com**

## 📞 Support

For issues or questions:
1. Check PM2 logs: `pm2 logs pixelnest`
2. Check Nginx logs: `tail -f /var/log/nginx/error.log`
3. Verify database: `npm run verify-db`
4. Check system resources: `pm2 monit`

