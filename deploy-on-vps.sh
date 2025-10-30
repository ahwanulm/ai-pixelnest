#!/bin/bash

# 🚀 PixelNest VPS Deployment Script
# Script untuk dijalankan langsung di VPS (bukan dari local machine)
# Gunakan ini untuk deployment di VPS: curl -fsSL https://example.com/deploy.sh | bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ${NC} $1"; }
log_success() { echo -e "${GREEN}✓${NC} $1"; }
log_warning() { echo -e "${YELLOW}⚠${NC} $1"; }
log_error() { echo -e "${RED}✗${NC} $1"; }
log_header() {
    echo -e "\n${GREEN}═══════════════════════════════════════${NC}"
    echo -e "${GREEN}$1${NC}"
    echo -e "${GREEN}═══════════════════════════════════════${NC}\n"
}

log_header "🚀 PixelNest VPS Deployment Script"

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    log_error "Please do not run as root. Create and use a sudo user first."
    echo ""
    log_info "To create a sudo user, run as root:"
    echo "  adduser deploy"
    echo "  usermod -aG sudo deploy"
    echo "  su - deploy"
    echo ""
    log_info "Then run this script again as the new user."
    exit 1
fi

# Get domain
read -p "Enter your domain name (e.g., example.com): " DOMAIN_NAME
if [ -z "$DOMAIN_NAME" ]; then
    log_error "Domain name is required"
    exit 1
fi

DOMAIN=${DOMAIN_NAME}

# Setup directories
APP_DIR="/var/www/pixelnest"
NODE_VERSION="20.x"

log_info "Deployment configuration:"
echo "  Domain: $DOMAIN"
echo "  App Directory: $APP_DIR"
echo ""

# Update system
log_header "Step 1/10: Updating System"
log_info "Updating system packages..."
sudo apt update && sudo apt upgrade -y
log_success "System updated"

# Install Node.js
log_header "Step 2/10: Installing Node.js $NODE_VERSION"
if ! command -v node &> /dev/null; then
    log_info "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION} | sudo -E bash -
    sudo apt-get install -y nodejs
    log_success "Node.js installed"
else
    NODE_VER=$(node --version)
    log_success "Node.js already installed: $NODE_VER"
fi

# Install PostgreSQL
log_header "Step 3/10: Installing PostgreSQL"
if ! command -v psql &> /dev/null; then
    log_info "Installing PostgreSQL..."
    sudo apt install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    log_success "PostgreSQL installed and started"
else
    log_success "PostgreSQL already installed"
fi

# Install PM2
log_header "Step 4/10: Installing PM2"
if ! command -v pm2 &> /dev/null; then
    log_info "Installing PM2..."
    sudo npm install -g pm2
    pm2 startup
    log_success "PM2 installed"
else
    log_success "PM2 already installed"
fi

# Install Nginx
log_header "Step 5/10: Installing Nginx"
if ! command -v nginx &> /dev/null; then
    log_info "Installing Nginx..."
    sudo apt install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
    log_success "Nginx installed and started"
else
    log_success "Nginx already installed"
fi

# Install Certbot
log_header "Step 6/10: Installing Certbot"
if ! command -v certbot &> /dev/null; then
    log_info "Installing Certbot..."
    sudo apt install -y certbot python3-certbot-nginx
    log_success "Certbot installed"
else
    log_success "Certbot already installed"
fi

# Create application directory
log_header "Step 7/10: Setting Up Application"
log_info "Creating application directory..."
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR

# Navigate to app directory
cd $APP_DIR

# Check if pixelnest.zip exists
if [ ! -f "pixelnest.zip" ] && [ ! -d "pixelnest" ]; then
    log_error "pixelnest.zip not found in current directory"
    log_info "Please upload pixelnest.zip to this directory first"
    log_info "Or extract the pixelnest folder here"
    exit 1
fi

# Extract if ZIP exists
if [ -f "pixelnest.zip" ]; then
    log_info "Extracting application..."
    unzip -q pixelnest.zip
    cd pixelnest/pixelnest 2>/dev/null || cd pixelnest
    log_success "Application extracted"
elif [ -d "pixelnest" ]; then
    log_info "Using existing pixelnest directory"
    cd pixelnest
fi

# Install dependencies
log_info "Installing Node.js dependencies..."
npm install --production
log_success "Dependencies installed"

# Build CSS
log_info "Building CSS..."
npm run build:css
log_success "CSS built"

# Setup database
log_header "Step 8/10: Setting Up Database"
DB_NAME="pixelnest_db"
DB_USER="pixelnest_user"
DB_PASSWORD=$(openssl rand -base64 32)

log_info "Creating database: $DB_NAME"
log_info "Creating user: $DB_USER"

# Create database and user
sudo -u postgres psql <<EOF
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME') THEN
        CREATE DATABASE $DB_NAME;
    END IF;
END
\$\$;
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = '$DB_USER') THEN
        CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
    END IF;
END
\$\$;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER USER $DB_USER CREATEDB;
EOF

log_success "Database created"

# Create .env file
log_info "Creating .env file..."
if [ -f ".env.example" ]; then
    cp .env.example .env
else
    cat > .env <<ENVFILE
# Server
NODE_ENV=production
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD

# Session
SESSION_SECRET=$(openssl rand -base64 32)

# Add your other environment variables here
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_USER=your_email
# EMAIL_PASS=your_password
# FAL_KEY=your_fal_key
# TRIPAY_API_KEY=your_tripay_key
ENVFILE
fi

log_success ".env file created"
log_warning "IMPORTANT: Edit .env file to add your API keys:"
echo "  sudo nano $APP_DIR/pixelnest/.env"

# Setup database tables
log_info "Setting up database tables..."
npm run setup-db || log_warning "Setup-db failed, continuing..."

log_info "Populating AI models..."
npm run populate-models || log_warning "Populate-models failed, continuing..."

log_info "Verifying database..."
npm run verify-db || log_warning "Verify-db failed, continuing..."

log_success "Database setup completed"

# Start with PM2
log_header "Step 9/10: Starting Application with PM2"
log_info "Stopping existing processes..."
pm2 delete pixelnest 2>/dev/null || true

log_info "Starting application..."
pm2 start ecosystem.config.js || pm2 start npm --name "pixelnest" -- start

pm2 save
log_success "Application started with PM2"

# Create Nginx configuration
log_header "Step 10/10: Configuring Nginx"
log_info "Creating Nginx configuration..."

sudo tee /etc/nginx/sites-available/pixelnest > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Upload size
        client_max_body_size 100M;
        client_body_buffer_size 1M;
        client_body_timeout 60s;
    }
}
EOF

log_success "Nginx configuration created"

# Enable site
log_info "Enabling Nginx site..."
sudo ln -sf /etc/nginx/sites-available/pixelnest /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

log_info "Testing Nginx configuration..."
sudo nginx -t

log_info "Reloading Nginx..."
sudo systemctl reload nginx

log_success "Nginx configured successfully"

# Setup SSL with Certbot
log_header "Setting Up SSL Certificate"
log_warning "Certbot will prompt for email and terms of service"
log_info "Running Certbot..."

if sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --redirect 2>/dev/null; then
    log_success "SSL certificate installed"
else
    log_warning "Certificate installation failed or skipped"
    log_info "To install SSL manually, run:"
    echo "  sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
fi

# Display deployment information
echo ""
echo "═══════════════════════════════════════════════════════"
echo "  🎉 Deployment Completed Successfully!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Application Directory: $APP_DIR/pixelnest"
echo "Domain: https://$DOMAIN"
echo ""
echo "📝 Important Information:"
echo ""
echo "1. Database Credentials (saved in $APP_DIR/pixelnest/.env):"
echo "   - Database: $DB_NAME"
echo "   - User: $DB_USER"
echo "   - Password: $DB_PASSWORD"
echo ""
echo "2. Application Status:"
pm2 status pixelnest 2>/dev/null || pm2 list | grep pixelnest
echo ""
echo "3. Next Steps:"
echo "   - Edit $APP_DIR/pixelnest/.env and add your API keys"
echo "   - Run 'pm2 restart pixelnest' to reload environment"
echo "   - Check logs: pm2 logs pixelnest"
echo ""
echo "4. Useful Commands:"
echo "   - View logs: pm2 logs pixelnest"
echo "   - Restart: pm2 restart pixelnest"
echo "   - Stop: pm2 stop pixelnest"
echo "   - Monitor: pm2 monit"
echo ""
echo "5. Access your application:"
echo "   https://$DOMAIN"
echo ""

log_success "🎉 Deployment process completed!"
