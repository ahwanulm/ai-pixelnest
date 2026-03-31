#!/bin/bash

# ═══════════════════════════════════════════════════
# PixelNest Email Configuration Setup Script
# ═══════════════════════════════════════════════════
# This script helps you set up email configuration
# Run this on your production server

set -e

echo "═══════════════════════════════════════════════════"
echo "📧 PixelNest Email Configuration Setup"
echo "═══════════════════════════════════════════════════"
echo ""

# Check if running in correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in PixelNest directory!"
    echo "   Please run this script from /var/www/pixelnest/"
    exit 1
fi

echo "✅ Found PixelNest project"
echo ""

# Check if .env exists
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists!"
    echo ""
    read -p "Do you want to update it? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 0
    fi
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ Backed up existing .env"
fi

echo ""
echo "───────────────────────────────────────────────────"
echo "📝 Email Configuration"
echo "───────────────────────────────────────────────────"
echo ""
echo "⚠️  IMPORTANT: You need a Gmail App Password!"
echo ""
echo "📖 How to get Gmail App Password:"
echo "   1. Go to: https://myaccount.google.com/security"
echo "   2. Enable '2-Step Verification' (if not enabled)"
echo "   3. Go to: https://myaccount.google.com/apppasswords"
echo "   4. Select 'Mail' and 'Other (Custom name)'"
echo "   5. Type 'PixelNest' and click 'Generate'"
echo "   6. Copy the 16-character password"
echo ""
echo "───────────────────────────────────────────────────"
echo ""

# Get email credentials
read -p "Enter your Gmail address: " EMAIL_USER
echo ""
read -p "Enter your Gmail App Password: " EMAIL_PASSWORD
echo ""

# Validate inputs
if [ -z "$EMAIL_USER" ] || [ -z "$EMAIL_PASSWORD" ]; then
    echo "❌ Error: Email credentials cannot be empty!"
    exit 1
fi

# Test SMTP connectivity
echo "🔍 Testing SMTP connectivity..."
if nc -zv smtp.gmail.com 587 2>&1 | grep -q "succeeded"; then
    echo "✅ Port 587 (TLS): Accessible"
else
    echo "⚠️  Port 587: Not accessible (trying 465...)"
fi

if nc -zv smtp.gmail.com 465 2>&1 | grep -q "succeeded"; then
    echo "✅ Port 465 (SSL): Accessible"
else
    echo "⚠️  Port 465: Not accessible"
fi

echo ""

# Check if we should update existing .env or create new one
if [ -f ".env" ]; then
    echo "📝 Updating .env file..."
    
    # Update or add EMAIL_USER
    if grep -q "^EMAIL_USER=" .env; then
        sed -i.bak "s|^EMAIL_USER=.*|EMAIL_USER=${EMAIL_USER}|" .env
    else
        echo "EMAIL_USER=${EMAIL_USER}" >> .env
    fi
    
    # Update or add EMAIL_PASSWORD
    if grep -q "^EMAIL_PASSWORD=" .env; then
        sed -i.bak "s|^EMAIL_PASSWORD=.*|EMAIL_PASSWORD=${EMAIL_PASSWORD}|" .env
    else
        echo "EMAIL_PASSWORD=${EMAIL_PASSWORD}" >> .env
    fi
    
    rm -f .env.bak
else
    echo "📝 Creating new .env file..."
    
    cat > .env << EOF
# ═══════════════════════════════════════════════════
# PixelNest Configuration
# ═══════════════════════════════════════════════════

# Email Configuration
EMAIL_USER=${EMAIL_USER}
EMAIL_PASSWORD=${EMAIL_PASSWORD}

# Server Configuration
BASE_URL=http://localhost:5005
NODE_ENV=production
PORT=5005

# Database (adjust as needed)
DB_HOST=localhost
DB_PORT=5432
DB_USER=pixelnest_user
DB_PASSWORD=your_db_password
DB_NAME=pixelnest_db

# Security (generate strong secrets!)
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)

# Payment (Midtrans)
MIDTRANS_SERVER_KEY=
MIDTRANS_CLIENT_KEY=
MIDTRANS_IS_PRODUCTION=false
EOF
fi

# Set proper permissions
chmod 600 .env
echo "✅ Set .env permissions to 600"
echo ""

# Verify
echo "───────────────────────────────────────────────────"
echo "✅ Configuration saved!"
echo "───────────────────────────────────────────────────"
echo ""
echo "📋 Email Configuration:"
grep "EMAIL_" .env | sed 's/EMAIL_PASSWORD=.*/EMAIL_PASSWORD=***hidden***/'
echo ""

# Ask to restart PM2
echo "───────────────────────────────────────────────────"
read -p "Restart PM2 now? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🔄 Restarting PM2..."
    
    if command -v pm2 &> /dev/null; then
        pm2 restart all
        echo ""
        echo "✅ PM2 restarted!"
        echo ""
        echo "📊 Checking logs..."
        sleep 2
        pm2 logs --lines 10 --nostream | grep -i email || echo "   (No email logs yet)"
    else
        echo "⚠️  PM2 not found. Please restart your server manually."
    fi
fi

echo ""
echo "═══════════════════════════════════════════════════"
echo "🎉 Setup Complete!"
echo "═══════════════════════════════════════════════════"
echo ""
echo "🧪 Next Steps:"
echo ""
echo "1. Test email sending:"
echo "   node test-email-connection.js"
echo ""
echo "2. Watch logs:"
echo "   pm2 logs pixelnest-server"
echo ""
echo "3. Try user registration on your website"
echo ""
echo "📖 Troubleshooting guide: EMAIL_TIMEOUT_FIX.md"
echo ""
echo "═══════════════════════════════════════════════════"

