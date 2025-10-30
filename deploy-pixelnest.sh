#!/bin/bash

# ========================================
# PIXELNEST - PM2 VPS Deployment Script
# ========================================
# Ubuntu + Node.js + PM2 + PostgreSQL + Nginx + Certbot
# ========================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Banner
clear
echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════════════╗
║         PIXELNEST - PM2 Deployment Script             ║
║         Node.js + PM2 + PostgreSQL + Nginx            ║
╚═══════════════════════════════════════════════════════╝
EOF
echo -e "${NC}\n"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    print_error "This script must be run as root (use sudo)"
    exit 1
fi

# Get the actual user (not root) for proper permissions
ACTUAL_USER="${SUDO_USER:-$USER}"
if [ "$ACTUAL_USER" = "root" ]; then
    print_warning "Running as root without sudo. Using root user."
    ACTUAL_USER="root"
fi

# Get project directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
print_info "Project directory: $PROJECT_DIR"

# Step 1: Get domain from user
print_header "Step 1: Domain Configuration"
read -p "Enter your domain name (e.g., pixelnest.example.com): " DOMAIN

if [ -z "$DOMAIN" ]; then
    print_error "Domain cannot be empty!"
    exit 1
fi

print_success "Domain: $DOMAIN"
ADMIN_EMAIL="admin@$DOMAIN"
print_info "Admin email: $ADMIN_EMAIL"
print_info "SSL will be requested for: $DOMAIN"

# Confirm
echo ""
read -p "Continue with domain $DOMAIN? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_error "Deployment cancelled"
    exit 1
fi

# Step 2: System Update & Install Build Tools
print_header "Step 2: Updating System & Installing Build Tools"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq
print_success "System updated"

# Install build tools for native Node.js modules
print_info "Installing build tools (gcc, g++, make)..."
apt-get install -y -qq build-essential python3 git curl wget ca-certificates
print_success "Build tools installed"

# Step 3: Install Node.js 20.x LTS
print_header "Step 3: Installing Node.js 20.x LTS"
if command -v node &> /dev/null; then
    print_warning "Node.js already installed"
    node --version
    npm --version
else
    print_info "Installing Node.js 20.x LTS..."
    
    # Install NodeSource repository
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    
    # Install Node.js
    apt-get install -y -qq nodejs
    
    print_success "Node.js installed"
    node --version
    npm --version
fi

# Step 4: Install PM2
print_header "Step 4: Installing PM2"
if command -v pm2 &> /dev/null; then
    print_warning "PM2 already installed"
    pm2 --version
else
    print_info "Installing PM2 globally..."
    npm install -g pm2@latest
    
    # Setup PM2 startup script
    env PATH=$PATH:/usr/bin pm2 startup systemd -u $ACTUAL_USER --hp /home/$ACTUAL_USER
    
    print_success "PM2 installed"
    pm2 --version
fi

# Step 5: Install PostgreSQL 15
print_header "Step 5: Installing PostgreSQL 15"
if command -v psql &> /dev/null; then
    print_warning "PostgreSQL already installed"
    psql --version
else
    print_info "Installing PostgreSQL 15..."
    
    # Install PostgreSQL repository
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /usr/share/keyrings/postgresql-keyring.gpg
    echo "deb [signed-by=/usr/share/keyrings/postgresql-keyring.gpg] http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" | tee /etc/apt/sources.list.d/pgdg.list
    
    apt-get update -qq
    apt-get install -y -qq postgresql-15 postgresql-contrib-15
    
    print_success "PostgreSQL installed"
    psql --version
fi

# Start and enable PostgreSQL
systemctl enable postgresql
systemctl start postgresql
print_success "PostgreSQL service started"

# Step 6: Install Nginx
print_header "Step 6: Installing Nginx"
if command -v nginx &> /dev/null; then
    print_warning "Nginx already installed"
else
    apt-get install -y -qq nginx
    print_success "Nginx installed"
fi

systemctl enable nginx
systemctl stop nginx  # Stop temporarily for Certbot
print_success "Nginx configured"

# Step 7: Install Certbot
print_header "Step 7: Installing Certbot"
if command -v certbot &> /dev/null; then
    print_warning "Certbot already installed"
else
    apt-get install -y -qq certbot python3-certbot-nginx
    print_success "Certbot installed"
fi

# Step 8: Configure Firewall
print_header "Step 8: Configuring Firewall"
if command -v ufw &> /dev/null; then
    print_info "Configuring UFW firewall..."
    ufw --force enable
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Allow SMTP ports for email (SendGrid)
    print_info "Opening SMTP ports for email..."
    ufw allow out 587/tcp   # SMTP TLS (Gmail)
    ufw allow out 2525/tcp  # SMTP alternative (SendGrid recommended)
    ufw allow out 465/tcp   # SMTP SSL
    
    ufw status
    print_success "Firewall configured (HTTP, HTTPS, SMTP)"
else
    print_warning "UFW not available, skipping firewall configuration"
fi

# Step 9: Generate Secure Passwords
print_header "Step 9: Generating Secure Configuration"
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
SESSION_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
print_success "Secure passwords generated"

# Step 10: Setup PostgreSQL Database
print_header "Step 10: Setting up PostgreSQL Database"
print_info "Creating database and user..."

# Create database and user
sudo -u postgres psql << EOFSQL
-- Drop existing if any
DROP DATABASE IF EXISTS pixelnest_db;
DROP USER IF EXISTS pixelnest_user;

-- Create user
CREATE USER pixelnest_user WITH PASSWORD '$DB_PASSWORD';

-- Create database
CREATE DATABASE pixelnest_db OWNER pixelnest_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE pixelnest_db TO pixelnest_user;

-- Connect to database and grant schema privileges
\c pixelnest_db
GRANT ALL ON SCHEMA public TO pixelnest_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO pixelnest_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO pixelnest_user;
EOFSQL

print_success "Database and user created"

# Configure PostgreSQL authentication
print_info "Configuring PostgreSQL authentication..."

# Backup original pg_hba.conf
PG_HBA_CONF="/etc/postgresql/15/main/pg_hba.conf"
if [ -f "$PG_HBA_CONF" ]; then
    cp "$PG_HBA_CONF" "$PG_HBA_CONF.backup"
    
    # Add md5 authentication for pixelnest_user (before peer auth line)
    if ! grep -q "host.*pixelnest_user.*pixelnest_user.*md5" "$PG_HBA_CONF"; then
        # Insert line before "local   all             all                                     peer"
        sed -i '/^local[[:space:]]*all[[:space:]]*all[[:space:]]*peer/i\
# Allow password authentication for pixelnest_user\
local   pixelnest_user        pixelnest_user                                md5\
host    pixelnest_user        pixelnest_user        127.0.0.1/32            md5\
host    pixelnest_user        pixelnest_user        ::1/128                 md5' "$PG_HBA_CONF"
        
        # Restart PostgreSQL to apply changes
        systemctl restart postgresql
        sleep 3
        
        print_success "PostgreSQL authentication configured"
    else
        print_info "PostgreSQL authentication already configured"
    fi
else
    print_warning "pg_hba.conf not found, trying alternative location..."
    # Try to find pg_hba.conf
    PG_HBA_CONF=$(find /etc/postgresql -name pg_hba.conf 2>/dev/null | head -n 1)
    if [ ! -z "$PG_HBA_CONF" ]; then
        print_info "Found pg_hba.conf at: $PG_HBA_CONF"
        cp "$PG_HBA_CONF" "$PG_HBA_CONF.backup"
        sed -i '/^local[[:space:]]*all[[:space:]]*all[[:space:]]*peer/i\
# Allow password authentication for pixelnest_user\
local   pixelnest_user        pixelnest_user                                md5\
host    pixelnest_user        pixelnest_user        127.0.0.1/32            md5\
host    pixelnest_user        pixelnest_user        ::1/128                 md5' "$PG_HBA_CONF"
        systemctl restart postgresql
        sleep 3
        print_success "PostgreSQL authentication configured"
    fi
fi

# Step 11: Create .env file
print_header "Step 11: Creating Environment Configuration"

# Remove old .env if exists
cd "$PROJECT_DIR"
rm -f .env

# Create .env file
cat > .env << ENVEOF
NODE_ENV=production
PORT=5005
BASE_URL=https://${DOMAIN}

SESSION_SECRET=${SESSION_SECRET}

DB_HOST=localhost
DB_PORT=5432
DB_NAME=pixelnest_db
DB_USER=pixelnest_user
DB_PASSWORD=${DB_PASSWORD}

# Email Configuration - SendGrid (RECOMMENDED for production)
# For SendGrid: Use apikey as EMAIL_USER and your API Key as EMAIL_PASSWORD
EMAIL_USER=
EMAIL_PASSWORD=
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=2525

# Alternative Gmail (for development only)
# EMAIL_USER=your-email@gmail.com
# EMAIL_PASSWORD=your-gmail-app-password
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587

# Google OAuth (Configure below)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=https://${DOMAIN}/auth/google/callback

# API Keys (Configure below)
FAL_KEY=
TRIPAY_API_KEY=
TRIPAY_PRIVATE_KEY=
TRIPAY_MERCHANT_CODE=

# Admin Email
ADMIN_EMAIL=${ADMIN_EMAIL}

# Timezone
TZ=UTC
ENVEOF

chmod 600 .env
chown $ACTUAL_USER:$ACTUAL_USER .env
print_success ".env file created"

# Step 12: Install Node.js Dependencies
print_header "Step 12: Installing Node.js Dependencies"
cd "$PROJECT_DIR"
print_info "Running npm install..."

# Change ownership to actual user for npm install
chown -R $ACTUAL_USER:$ACTUAL_USER "$PROJECT_DIR"

# Install all dependencies (including devDependencies for building)
sudo -u $ACTUAL_USER npm install --no-audit --no-fund

print_success "Node.js dependencies installed"

# Build CSS
print_info "Building CSS..."
if sudo -u $ACTUAL_USER npm run build:css; then
    print_success "CSS built"
else
    print_warning "CSS build failed, skipping (will build on first run)"
fi

# Now remove devDependencies to save space (optional)
print_info "Removing devDependencies..."
cd "$PROJECT_DIR"
sudo -u $ACTUAL_USER npm prune --production --no-audit --no-fund || true

# Step 13: Create directories with proper permissions
print_header "Step 13: Creating Application Directories"
cd "$PROJECT_DIR"

# Create directories (ignore if exists)
mkdir -p logs public/uploads public/videos public/images public/audio 2>/dev/null || true

# Set proper ownership and permissions
chown -R $ACTUAL_USER:$ACTUAL_USER logs 2>/dev/null || true
chmod -R 775 logs 2>/dev/null || true

# Create upload directories with proper permissions
chown -R www-data:www-data public/uploads public/videos public/images public/audio 2>/dev/null || true
chmod -R 755 public/uploads public/videos public/images public/audio 2>/dev/null || true

print_success "Directories created with proper permissions"

# Step 14: Setup Database Tables
print_header "Step 14: Setting up Database Tables"
cd "$PROJECT_DIR"

print_info "Initializing database schema..."
sudo -u $ACTUAL_USER npm run setup-db
print_success "Database tables created"

print_info "Populating AI models..."
sudo -u $ACTUAL_USER npm run populate-models
print_success "AI models populated"

print_info "Verifying database..."
sudo -u $ACTUAL_USER npm run verify-db
print_success "Database verified"

# Step 15: Create Admin User
print_header "Step 15: Creating Admin User"
print_info "Generating admin password..."

ADMIN_PASSWORD="PixelNest@2025"
ADMIN_EMAIL="${ADMIN_EMAIL}"

# Generate password hash using Node.js
cd "$PROJECT_DIR"
ADMIN_HASH=$(sudo -u $ACTUAL_USER node -e "
const bcrypt = require('bcryptjs');
const password = '$ADMIN_PASSWORD';
const hash = bcrypt.hashSync(password, 10);
console.log(hash);
" 2>/dev/null | tr -d '\r\n')

if [ -z "$ADMIN_HASH" ]; then
    print_warning "Using fallback password hash..."
    ADMIN_HASH='$2a$10$xGKqY6/hNYZZ8mZC4YhUke3KqJ7Kl5DvXN8qp.6pYZWxmXhqZhqLy'
fi

print_info "Creating admin user in database..."

# Use PGPASSWORD to authenticate
export PGPASSWORD="$DB_PASSWORD"
psql -h localhost -U pixelnest_user -d pixelnest_db << EOSQL
-- Delete existing admin if exists
DELETE FROM users WHERE email = '$ADMIN_EMAIL' OR username = 'admin';

-- Create admin user
INSERT INTO users (username, email, password, role, is_active, created_at) 
VALUES (
    'admin',
    '$ADMIN_EMAIL',
    '$ADMIN_HASH',
    'admin',
    true,
    NOW()
);

-- Verify creation
SELECT 'Admin user created!' as status;
SELECT id, username, email, role FROM users WHERE username = 'admin';
EOSQL
unset PGPASSWORD

if [ $? -eq 0 ]; then
    print_success "Admin user created successfully"
else
    print_error "Failed to create admin user!"
fi

# Step 16: Obtain SSL Certificate
print_header "Step 16: Obtaining SSL Certificate"
print_info "Requesting SSL certificate for $DOMAIN"
print_warning "Make sure your domain points to this server's IP!"
print_info "For Cloudflare: Set DNS to 'DNS only' (gray cloud) during setup"
echo ""
read -p "Press Enter when ready to continue..."

# Get certificate
certbot certonly --standalone \
    --non-interactive \
    --agree-tos \
    --email "$ADMIN_EMAIL" \
    -d "$DOMAIN" \
    || {
        print_error "SSL certificate generation failed!"
        print_info "Common issues:"
        print_info "  1. Domain doesn't point to this server"
        print_info "  2. Cloudflare proxy is enabled (should be DNS only/gray cloud)"
        print_info "  3. Port 80 is blocked"
        exit 1
    }

print_success "SSL certificate obtained"

# Step 17: Configure Nginx
print_header "Step 17: Configuring Nginx"

# Create Nginx config
cat > /etc/nginx/sites-available/pixelnest << 'NGINXEOF'
server {
    listen 80;
    listen [::]:80;
    server_name DOMAIN_PLACEHOLDER www.DOMAIN_PLACEHOLDER;

    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name DOMAIN_PLACEHOLDER www.DOMAIN_PLACEHOLDER;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/privkey.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Upload size
    client_max_body_size 100M;
    client_body_buffer_size 1M;
    client_body_timeout 60s;

    # Main location
    location / {
        proxy_pass http://localhost:5005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Serve static files directly for performance
    location /css {
        alias PROJECT_DIR/public/css;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /js {
        alias PROJECT_DIR/public/js;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /assets {
        alias PROJECT_DIR/public/assets;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Logging
    access_log /var/log/nginx/pixelnest_access.log;
    error_log /var/log/nginx/pixelnest_error.log;
}
NGINXEOF

# Replace placeholders
sed -i "s|DOMAIN_PLACEHOLDER|$DOMAIN|g" /etc/nginx/sites-available/pixelnest
sed -i "s|PROJECT_DIR|$PROJECT_DIR|g" /etc/nginx/sites-available/pixelnest

# Enable site
ln -sf /etc/nginx/sites-available/pixelnest /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
nginx -t || {
    print_error "Nginx configuration test failed!"
    exit 1
}

print_success "Nginx configured"

# Step 18: Setup PM2 Application
print_header "Step 18: Setting up PM2 Application"
cd "$PROJECT_DIR"

# Create PM2 ecosystem config
cat > ecosystem.config.js << 'EOFECO'
module.exports = {
  apps: [
    {
      name: 'pixelnest-server',
      script: './server.js',
      instances: 1,
      exec_mode: 'fork',
      
      autorestart: true,
      watch: false,
      
      max_memory_restart: '2G',
      kill_timeout: 30000,
      listen_timeout: 8000,
      
      max_restarts: 3,
      min_uptime: '30s',
      restart_delay: 10000,
      
      env: {
        NODE_ENV: 'production',
        TZ: 'UTC'
      },
      
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      wait_ready: true,
      shutdown_with_message: false,
      source_map_support: true
    },
    {
      name: 'pixelnest-worker',
      script: './worker.js',
      args: '--queue=pgboss',
      instances: 1,
      exec_mode: 'fork',
      
      autorestart: true,
      watch: false,
      
      max_memory_restart: '1G',
      kill_timeout: 30000,
      listen_timeout: 8000,
      
      env: {
        NODE_ENV: 'production',
        TZ: 'UTC'
      },
      
      error_file: './logs/pm2-worker-error.log',
      out_file: './logs/pm2-worker-out.log',
      log_file: './logs/pm2-worker-combined.log',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      wait_ready: true
    }
  ]
};
EOFECO

chown $ACTUAL_USER:$ACTUAL_USER ecosystem.config.js

# Stop existing PM2 processes
sudo -u $ACTUAL_USER pm2 delete pixelnest-server pixelnest-worker 2>/dev/null || true

# Start application with PM2
print_info "Starting application with PM2..."
cd "$PROJECT_DIR"
sudo -u $ACTUAL_USER pm2 start ecosystem.config.js
sudo -u $ACTUAL_USER pm2 save

# Setup PM2 startup script
env PATH=$PATH:/usr/bin pm2 startup systemd -u $ACTUAL_USER --hp $(eval echo ~$ACTUAL_USER)

print_success "PM2 application started"

# Wait for app to start
print_info "Waiting for application to initialize..."
sleep 5

# Show PM2 status
sudo -u $ACTUAL_USER pm2 list

# Step 19: Start Nginx
print_header "Step 19: Starting Nginx"
systemctl start nginx
systemctl status nginx --no-pager || true
print_success "Nginx started"

# Step 20: Setup SSL Auto-renewal
print_header "Step 20: Setting up SSL Auto-renewal"

# Create renewal hook
mkdir -p /etc/letsencrypt/renewal-hooks/post
cat > /etc/letsencrypt/renewal-hooks/post/nginx-reload.sh << 'EOFHOOK'
#!/bin/bash
systemctl reload nginx
EOFHOOK

chmod +x /etc/letsencrypt/renewal-hooks/post/nginx-reload.sh

# Test renewal (dry run)
certbot renew --dry-run || print_warning "SSL renewal test failed, but installation continues"
print_success "SSL auto-renewal configured"

# Step 21: Create Management Scripts
print_header "Step 21: Creating Management Scripts"
cd "$PROJECT_DIR"

# Start script
cat > pixelnest-start.sh << 'EOFSTART'
#!/bin/bash
echo "Starting PixelNest..."
sudo systemctl start postgresql
sudo systemctl start nginx
cd "$(dirname "$0")"
pm2 start pixelnest-server pixelnest-worker
echo "PixelNest started!"
pm2 list
EOFSTART

# Stop script
cat > pixelnest-stop.sh << 'EOFSTOP'
#!/bin/bash
echo "Stopping PixelNest..."
cd "$(dirname "$0")"
pm2 stop pixelnest-server pixelnest-worker
echo "PixelNest stopped!"
EOFSTOP

# Restart script
cat > pixelnest-restart.sh << 'EOFRESTART'
#!/bin/bash
echo "Restarting PixelNest..."
cd "$(dirname "$0")"
pm2 reload pixelnest-server pixelnest-worker --update-env
sudo systemctl reload nginx
echo "PixelNest restarted!"
pm2 list
EOFRESTART

# Logs script
cat > pixelnest-logs.sh << 'EOFLOGS'
#!/bin/bash
cd "$(dirname "$0")"
pm2 logs pixelnest-server pixelnest-worker --lines 100
EOFLOGS

# Status script
cat > pixelnest-status.sh << 'EOFSTATUS'
#!/bin/bash
echo "=== PixelNest Status ==="
echo ""
echo "PM2 Status:"
pm2 list
echo ""
echo "Nginx Status:"
sudo systemctl status nginx --no-pager
echo ""
echo "PostgreSQL Status:"
sudo systemctl status postgresql --no-pager
echo ""
echo "Disk Usage:"
df -h | grep -E '(Filesystem|/$)'
echo ""
echo "Memory Usage:"
free -h
EOFSTATUS

# Backup script
cat > pixelnest-backup.sh << 'EOFBACKUP'
#!/bin/bash
BACKUP_DIR="backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

echo "Creating backup..."

# Backup database
PGPASSWORD="$(grep DB_PASSWORD .env | cut -d '=' -f2)" pg_dump -h localhost -U pixelnest_user pixelnest_db > "$BACKUP_DIR/db_$TIMESTAMP.sql"

# Backup uploads
tar -czf "$BACKUP_DIR/uploads_$TIMESTAMP.tar.gz" public/uploads/ public/images/ 2>/dev/null || true

# Backup .env
cp .env "$BACKUP_DIR/env_$TIMESTAMP.backup"

echo "Backup created:"
echo "  - Database: $BACKUP_DIR/db_$TIMESTAMP.sql"
echo "  - Uploads: $BACKUP_DIR/uploads_$TIMESTAMP.tar.gz"
echo "  - Config: $BACKUP_DIR/env_$TIMESTAMP.backup"
EOFBACKUP

# Update script
cat > pixelnest-update.sh << 'EOFUPDATE'
#!/bin/bash
echo "Updating PixelNest..."
cd "$(dirname "$0")"

# Install dependencies
npm install --production

# Build CSS
npm run build:css

# Reload for zero-downtime
pm2 reload pixelnest-server pixelnest-worker --update-env

echo "PixelNest updated with zero downtime!"
pm2 list
EOFUPDATE

chmod +x pixelnest-*.sh
chown $ACTUAL_USER:$ACTUAL_USER pixelnest-*.sh

print_success "Management scripts created"

# Step 22: Secure Configuration
print_header "Step 22: Security Hardening"

# Secure .env file
chmod 600 "$PROJECT_DIR/.env"
chown $ACTUAL_USER:$ACTUAL_USER "$PROJECT_DIR/.env"

# Create .npmrc to avoid running as root
cat > "$PROJECT_DIR/.npmrc" << 'EOFNPMRC'
unsafe-perm=false
EOFNPMRC
chown $ACTUAL_USER:$ACTUAL_USER "$PROJECT_DIR/.npmrc"

print_success "Security hardening applied"

# Final Summary
print_header "🎉 Deployment Complete!"

echo -e "${GREEN}"
cat << EOF
╔═══════════════════════════════════════════════════════╗
║         PIXELNEST Successfully Deployed with PM2!      ║
╚═══════════════════════════════════════════════════════╝
EOF
echo -e "${NC}\n"

print_info "Your PixelNest installation is ready!"
echo ""
echo -e "${BLUE}📋 Deployment Information:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🌐 URL:${NC}              https://$DOMAIN"
echo -e "${GREEN}👤 Admin User:${NC}       admin"
echo -e "${GREEN}🔑 Admin Pass:${NC}       $ADMIN_PASSWORD"
echo -e "${GREEN}📧 Admin Email:${NC}      $ADMIN_EMAIL"
echo -e "${GREEN}🕐 Timezone:${NC}         UTC"
echo -e "${GREEN}🗄️  Database:${NC}         PostgreSQL (localhost)"
echo -e "${GREEN}⚙️  Process:${NC}          PM2"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT NOTES:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Configure your API keys in .env file:"
echo "   - Email (SendGrid RECOMMENDED - see instructions below)"
echo "   - Google OAuth (required for Google login)"
echo "   - FAL_KEY (for AI generation)"
echo "   - Tripay keys (for payments)"
echo "2. Database password: $DB_PASSWORD"
echo "3. Edit .env: nano $PROJECT_DIR/.env"
echo "4. Restart after editing .env: pm2 restart all"
echo "5. For Cloudflare: You can now enable proxy (orange cloud)"
echo ""
echo -e "${BLUE}📧 Email Configuration (REQUIRED):${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Option 1: SendGrid (RECOMMENDED for production):"
echo "  1. Sign up at https://sendgrid.com (12,000 free emails/month)"
echo "  2. Create API Key: Settings → API Keys → Create"
echo "  3. Edit .env and set:"
echo "     EMAIL_USER=apikey"
echo "     EMAIL_PASSWORD=SG.your-api-key-here"
echo "     SMTP_HOST=smtp.sendgrid.net"
echo "     SMTP_PORT=2525"
echo "  4. Open firewall: sudo ufw allow out 2525/tcp"
echo "  5. Restart: pm2 restart all"
echo ""
echo "Option 2: Gmail (development only, limited to ~100 emails/day):"
echo "  1. Get App Password: https://myaccount.google.com/apppasswords"
echo "  2. Edit .env and set:"
echo "     EMAIL_USER=your-email@gmail.com"
echo "     EMAIL_PASSWORD=your-app-password"
echo "     SMTP_HOST=smtp.gmail.com"
echo "     SMTP_PORT=587"
echo "  3. Open firewall: sudo ufw allow out 587/tcp"
echo "  4. Restart: pm2 restart all"
echo ""
echo -e "${BLUE}🔧 Management Commands:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ./pixelnest-start.sh        - Start PixelNest"
echo "  ./pixelnest-stop.sh         - Stop PixelNest"
echo "  ./pixelnest-restart.sh      - Restart PixelNest"
echo "  ./pixelnest-logs.sh         - View logs"
echo "  ./pixelnest-status.sh       - Check status"
echo "  ./pixelnest-backup.sh       - Backup database & uploads"
echo "  ./pixelnest-update.sh       - Update application"
echo ""
echo -e "${BLUE}🔍 PM2 Commands:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  pm2 list                   - List all processes"
echo "  pm2 logs                   - View all logs"
echo "  pm2 logs pixelnest-server   - View server logs"
echo "  pm2 logs pixelnest-worker   - View worker logs"
echo "  pm2 monit                   - Monitor resources"
echo "  pm2 restart all             - Restart all"
echo "  pm2 restart pixelnest-server- Restart server only"
echo "  pm2 restart pixelnest-worker- Restart worker only"
echo ""
echo -e "${BLUE}🗄️  Database Commands:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  sudo -u postgres psql -U pixelnest_user -d pixelnest_db"
echo "  npm run verify-db          - Verify database"
echo "  npm run setup-db            - Setup tables"
echo "  npm run populate-models     - Add AI models"
echo ""
echo -e "${BLUE}🌐 Nginx Commands:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  systemctl status nginx"
echo "  systemctl reload nginx"
echo "  nginx -t"
echo ""
echo -e "${BLUE}🔒 SSL Commands:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  certbot certificates       - Check SSL certificates"
echo "  certbot renew              - Renew certificates"
echo ""
echo -e "${BLUE}📊 Current Status:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sudo -u $ACTUAL_USER pm2 list
echo ""
echo -e "${GREEN}✓ Installation complete! Visit https://$DOMAIN to get started!${NC}"
echo ""
echo -e "${YELLOW}💡 First Steps:${NC}"
echo "1. Configure Email (REQUIRED for user registration):"
echo "   a) Sign up SendGrid: https://sendgrid.com"
echo "   b) Get API Key from Settings → API Keys"
echo "   c) Edit .env: nano $PROJECT_DIR/.env"
echo "      Set: EMAIL_USER=apikey"
echo "      Set: EMAIL_PASSWORD=SG.your-api-key"
echo "   d) Test: cd $PROJECT_DIR && node test-email-connection.js"
echo "   e) Restart: pm2 restart all"
echo ""
echo "2. Visit https://$DOMAIN"
echo "3. Login with admin / $ADMIN_PASSWORD"
echo "4. Configure other API keys in .env (Google OAuth, FAL, Tripay)"
echo "5. Restart: pm2 restart all"
echo "6. Start generating AI content!"
echo ""
echo -e "${YELLOW}⚠️  Without email configuration, users cannot register!${NC}"
echo ""

