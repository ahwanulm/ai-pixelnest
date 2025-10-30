#!/bin/bash

# ═══════════════════════════════════════════════════
# Deploy Email Fix to Production Server
# ═══════════════════════════════════════════════════
# Run this from your LOCAL machine to deploy fixes

set -e

echo "═══════════════════════════════════════════════════"
echo "🚀 Deploy Email Fix to Production"
echo "═══════════════════════════════════════════════════"
echo ""

# Configuration
LOCAL_DIR="/Users/ahwanulm/Desktop/PROJECT/PIXELNEST"
REMOTE_USER=""
REMOTE_HOST=""
REMOTE_DIR="/var/www/pixelnest"

# Prompt for server details
echo "📝 Server Configuration"
echo "───────────────────────────────────────────────────"
read -p "Enter SSH username (e.g., root): " REMOTE_USER
read -p "Enter server IP or hostname: " REMOTE_HOST
echo ""

# Verify connection
echo "🔍 Testing SSH connection..."
if ssh -o ConnectTimeout=5 -o BatchMode=yes $REMOTE_USER@$REMOTE_HOST echo "Connected" 2>/dev/null; then
    echo "✅ SSH connection successful"
else
    echo "⚠️  Cannot connect with SSH keys, will prompt for password"
fi
echo ""

# Deploy files
echo "📦 Deploying files to production..."
echo "───────────────────────────────────────────────────"

echo "1. Uploading updated emailService.js..."
scp "$LOCAL_DIR/src/services/emailService.js" $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/src/services/

echo "2. Uploading updated authController.js..."
scp "$LOCAL_DIR/src/controllers/authController.js" $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/src/controllers/

echo "3. Uploading setup script..."
scp "$LOCAL_DIR/setup-email.sh" $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/

echo "4. Uploading test script..."
scp "$LOCAL_DIR/test-email-connection.js" $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/

echo "5. Uploading documentation..."
scp "$LOCAL_DIR/EMAIL_TIMEOUT_FIX.md" $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/
scp "$LOCAL_DIR/SETUP_ENV_FILE.md" $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/
scp "$LOCAL_DIR/FIX_SUMMARY.md" $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/

echo ""
echo "✅ All files uploaded!"
echo ""

# Set permissions
echo "🔧 Setting permissions..."
ssh $REMOTE_USER@$REMOTE_HOST "chmod +x $REMOTE_DIR/setup-email.sh $REMOTE_DIR/test-email-connection.js"
echo "✅ Permissions set"
echo ""

# Offer to run setup
echo "═══════════════════════════════════════════════════"
echo "📋 Next Steps"
echo "═══════════════════════════════════════════════════"
echo ""
echo "Files deployed to: $REMOTE_DIR"
echo ""
echo "Choose an option:"
echo ""
echo "1. Run automated setup now (recommended)"
echo "2. I'll do it manually later"
echo ""
read -p "Enter choice (1 or 2): " -n 1 CHOICE
echo ""
echo ""

if [ "$CHOICE" = "1" ]; then
    echo "🚀 Running automated email setup..."
    echo "───────────────────────────────────────────────────"
    echo ""
    ssh -t $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && ./setup-email.sh"
    
    echo ""
    echo "═══════════════════════════════════════════════════"
    echo "✅ Setup Complete!"
    echo "═══════════════════════════════════════════════════"
    echo ""
    echo "🧪 Want to test email sending now?"
    read -p "Run test script? (y/n): " -n 1 TEST
    echo ""
    
    if [[ $TEST =~ ^[Yy]$ ]]; then
        echo ""
        echo "🧪 Running email test..."
        ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && node test-email-connection.js"
    fi
else
    echo "📝 Manual setup instructions:"
    echo ""
    echo "SSH into your server:"
    echo "  ssh $REMOTE_USER@$REMOTE_HOST"
    echo ""
    echo "Run the setup script:"
    echo "  cd $REMOTE_DIR"
    echo "  ./setup-email.sh"
    echo ""
    echo "Or follow the guide:"
    echo "  cat FIX_SUMMARY.md"
fi

echo ""
echo "═══════════════════════════════════════════════════"
echo "📚 Documentation Available"
echo "═══════════════════════════════════════════════════"
echo ""
echo "On your server at $REMOTE_DIR:"
echo ""
echo "  • FIX_SUMMARY.md - Quick reference"
echo "  • SETUP_ENV_FILE.md - Detailed setup guide"
echo "  • EMAIL_TIMEOUT_FIX.md - Troubleshooting guide"
echo "  • setup-email.sh - Automated setup script"
echo "  • test-email-connection.js - Diagnostic tool"
echo ""
echo "═══════════════════════════════════════════════════"
echo ""

