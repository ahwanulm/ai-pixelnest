#!/bin/bash

# 🚀 PixelNest VPS Deployment Script
# Automated deployment to Ubuntu VPS with PM2, Nginx, and SSL

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

log_header() {
    echo -e "\n${GREEN}═══════════════════════════════════════${NC}"
    echo -e "${GREEN}$1${NC}"
    echo -e "${GREEN}═══════════════════════════════════════${NC}\n"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    log_error "Please do not run as root. Use a sudo user."
    exit 1
fi

log_header "🚀 PixelNest VPS Deployment Script"

# Collect information
echo ""
log_info "Enter your deployment details:"
echo ""

read -p "Enter your domain name (e.g., example.com): " DOMAIN_NAME
read -p "Enter SSH username (default: root): " SSH_USER
SSH_USER=${SSH_USER:-root}
read -p "Enter VPS IP address: " VPS_IP
read -p "Enter VPS SSH port (default: 22): " SSH_PORT
SSH_PORT=${SSH_PORT:-22}

# Confirm
echo ""
log_info "Deployment configuration:"
echo "  Domain: $DOMAIN_NAME"
echo "  SSH User: $SSH_USER"
echo "  VPS IP: $VPS_IP"
echo "  SSH Port: $SSH_PORT"
echo ""
read -p "Continue with deployment? (y/n): " CONFIRM

if [ "$CONFIRM" != "y" ]; then
    log_error "Deployment cancelled."
    exit 1
fi

# Check if ZIP file exists
ZIP_FILE=$(ls pixelnest-deployment-*.zip 2>/dev/null | head -n 1)
if [ -z "$ZIP_FILE" ]; then
    log_error "No deployment ZIP file found. Please run 'npm run deploy:zip' first."
    exit 1
fi

log_success "Found deployment ZIP: $ZIP_FILE"

# Create deployment script for VPS
cat > /tmp/vps_deploy.sh << 'DEPLOY_SCRIPT'
#!/bin/bash

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

DOMAIN="$1"
APP_DIR="/var/www/pixelnest"
NODE_VERSION="20.x"

log_info "Starting PixelNest deployment on VPS..."

# Update system
log_info "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js
log_info "Installing Node.js $NODE_VERSION..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION} | sudo -E bash -
    sudo apt-get install -y nodejs
else
    log_success "Node.js already installed"
fi

# Install PostgreSQL
log_info "Installing PostgreSQL..."
if ! command -v psql &> /dev/null; then
    sudo apt install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
else
    log_success "PostgreSQL already installed"
fi

# Install PM2
log_info "Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    pm2 startup
else
    log_success "PM2 already installed"
fi

# Install Nginx
log_info "Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    sudo apt install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
else
    log_success "Nginx already installed"
fi

# Install Certbot
log_info "Installing Certbot..."
if ! command -v certbot &> /dev/null; then
    sudo apt install -y certbot python3-certbot-nginx
else
    log_success "Certbot already installed"
fi

# Create application directory
log_info "Creating application directory..."
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR

# Extract application
log_info "Extracting application..."
cd $APP_DIR
unzip -q pixelnest-deployment-*.zip
cd pixelnest

# Install dependencies
log_info "Installing Node.js dependencies..."
npm install --production

# Build CSS
log_info "Building CSS..."
npm run build:css

# Setup database
log_info "Setting up database..."
DB_NAME="pixelnest_db"
DB_USER="pixelnest_user"
DB_PASSWORD=$(openssl rand -base64 32)

# Create database and user
sudo -u postgres psql <<EOF
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER USER $DB_USER CREATEDB;
\q
EOF

# Create .env file
log_info "Creating .env file..."
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

log_success "Database credentials saved to .env"
log_warning "IMPORTANT: Edit .env file to add your API keys and other configurations!"

# Setup database tables
log_info "Setting up database tables..."
npm run setup-db

# Populate models
log_info "Populating AI models..."
npm run populate-models

# Verify database
npm run verify-db

# Start with PM2
log_info "Starting application with PM2..."
pm2 delete pixelnest 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

# Create Nginx configuration
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

# Enable site
log_info "Enabling Nginx site..."
sudo ln -sf /etc/nginx/sites-available/pixelnest /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

log_success "Nginx configured successfully"

# Setup SSL with Certbot
log_info "Setting up SSL certificate..."
log_warning "If this is your first time, Certbot will prompt for email and terms of service"
log_info "Running Certbot..."

sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --redirect || {
    log_warning "Certificate installation failed. You can run it manually later."
    log_info "To install SSL manually, run: sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
}

log_success "SSL setup completed"

# Create .env.example
log_info "Creating .env.example backup..."
cp .env .env.backup
sed 's/=.*$/=<your_value>/g' .env > .env.example

# Display deployment information
echo ""
echo "═══════════════════════════════════════════════════════"
echo "  🎉 Deployment Completed Successfully!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Application Directory: $APP_DIR"
echo "Domain: https://$DOMAIN"
echo ""
echo "📝 Important Information:"
echo ""
echo "1. Database Credentials (saved in $APP_DIR/.env):"
echo "   - Database: $DB_NAME"
echo "   - User: $DB_USER"
echo "   - Password: $DB_PASSWORD"
echo ""
echo "2. Application Status:"
pm2 status pixelnest
echo ""
echo "3. Next Steps:"
echo "   - Edit $APP_DIR/.env and add your API keys"
echo "   - Run 'pm2 restart pixelnest' to reload environment"
echo "   - Check logs: pm2 logs pixelnest"
echo ""
echo "4. Useful Commands:"
echo "   - View logs: pm2 logs pixelnest"
echo "   - Restart: pm2 restart pixelnest"
echo "   - Stop: pm2 stop pixelnest"
echo "   - Monitor: pm2 monit"
echo ""
DEPLOY_SCRIPT

chmod +x /tmp/vps_deploy.sh

# Transfer files
log_info "Uploading files to VPS..."
scp -P $SSH_PORT "$ZIP_FILE" $SSH_USER@$VPS_IP:~/

# Execute deployment script
log_info "Starting deployment on VPS..."
ssh -p $SSH_PORT $SSH_USER@$VPS_IP "bash -s" < /tmp/vps_deploy.sh "$DOMAIN_NAME"

log_success "Deployment completed!"
echo ""
log_info "Visit your application at: https://$DOMAIN_NAME"
echo ""
log_warning "IMPORTANT: Connect to your VPS and edit the .env file to add your API keys:"
echo "  ssh -p $SSH_PORT $SSH_USER@$VPS_IP"
echo "  nano /var/www/pixelnest/.env"
echo "  pm2 restart pixelnest"

# Cleanup
rm /tmp/vps_deploy.sh

echo ""
log_success "🎉 Deployment process completed!"
