#!/bin/bash

# ═══════════════════════════════════════════════════
# Deploy SendGrid Fix - Upload & Configure
# ═══════════════════════════════════════════════════
# Run this from LOCAL machine to fix ETIMEDOUT error

set -e

echo "═══════════════════════════════════════════════════"
echo "🚀 Deploy SendGrid Email Fix"
echo "═══════════════════════════════════════════════════"
echo ""

# Configuration
LOCAL_DIR="/Users/ahwanulm/Desktop/PROJECT/PIXELNEST"
REMOTE_USER="root"
REMOTE_HOST=""
REMOTE_DIR="/var/www/pixelnest"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Prompt for server details
echo "📝 Server Configuration"
echo "───────────────────────────────────────────────────"
read -p "Enter server IP or hostname: " REMOTE_HOST
read -p "Enter SSH username (default: root): " INPUT_USER
if [ ! -z "$INPUT_USER" ]; then
    REMOTE_USER=$INPUT_USER
fi
echo ""

if [ -z "$REMOTE_HOST" ]; then
    echo -e "${RED}❌ Server hostname required!${NC}"
    exit 1
fi

# Test connection
echo "🔍 Testing SSH connection..."
if ssh -o ConnectTimeout=5 -o BatchMode=yes $REMOTE_USER@$REMOTE_HOST echo "Connected" 2>/dev/null; then
    echo -e "${GREEN}✅ SSH connection successful${NC}"
else
    echo -e "${YELLOW}⚠️  Cannot connect with SSH keys, will prompt for password${NC}"
fi
echo ""

# Step 1: Upload updated emailService.js
echo "📦 Step 1: Upload emailService.js"
echo "───────────────────────────────────────────────────"
if scp "$LOCAL_DIR/src/services/emailService.js" $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/src/services/; then
    echo -e "${GREEN}✅ emailService.js uploaded${NC}"
else
    echo -e "${RED}❌ Failed to upload emailService.js${NC}"
    exit 1
fi
echo ""

# Step 2: Check and update .env
echo "📝 Step 2: Configure .env"
echo "───────────────────────────────────────────────────"

# Ask for SendGrid API key
echo "Enter your SendGrid API Key (starts with SG.):"
read -p "API Key: " SENDGRID_API_KEY

if [ -z "$SENDGRID_API_KEY" ]; then
    echo -e "${RED}❌ SendGrid API Key required!${NC}"
    exit 1
fi

# Create .env update script
cat > /tmp/update-env.sh << 'ENVSCRIPT'
#!/bin/bash
cd /var/www/pixelnest

# Backup existing .env
if [ -f .env ]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ Backed up existing .env"
fi

# Remove old SMTP config if exists
sed -i '/^SMTP_HOST=/d' .env 2>/dev/null || true
sed -i '/^SMTP_PORT=/d' .env 2>/dev/null || true

# Update EMAIL_USER and EMAIL_PASSWORD
if grep -q "^EMAIL_USER=" .env 2>/dev/null; then
    sed -i 's/^EMAIL_USER=.*/EMAIL_USER=apikey/' .env
else
    echo "EMAIL_USER=apikey" >> .env
fi

if grep -q "^EMAIL_PASSWORD=" .env 2>/dev/null; then
    sed -i "s|^EMAIL_PASSWORD=.*|EMAIL_PASSWORD=SENDGRID_KEY_PLACEHOLDER|" .env
else
    echo "EMAIL_PASSWORD=SENDGRID_KEY_PLACEHOLDER" >> .env
fi

# Add SMTP config
echo "" >> .env
echo "# SendGrid SMTP Configuration" >> .env
echo "SMTP_HOST=smtp.sendgrid.net" >> .env
echo "SMTP_PORT=587" >> .env

echo "✅ .env updated"
ENVSCRIPT

# Replace placeholder with actual key
sed -i.bak "s|SENDGRID_KEY_PLACEHOLDER|$SENDGRID_API_KEY|g" /tmp/update-env.sh
rm /tmp/update-env.sh.bak

# Upload and execute
scp /tmp/update-env.sh $REMOTE_USER@$REMOTE_HOST:/tmp/
ssh $REMOTE_USER@$REMOTE_HOST "chmod +x /tmp/update-env.sh && /tmp/update-env.sh && rm /tmp/update-env.sh"
rm /tmp/update-env.sh

echo -e "${GREEN}✅ .env configured${NC}"
echo ""

# Step 3: Check ports
echo "🔥 Step 3: Check Firewall & Ports"
echo "───────────────────────────────────────────────────"

ssh $REMOTE_USER@$REMOTE_HOST << 'PORTCHECK'
# Test SendGrid ports
echo "Testing SendGrid SMTP ports..."
echo -n "Port 587: "
if timeout 5 bash -c "cat < /dev/null > /dev/tcp/smtp.sendgrid.net/587" 2>/dev/null; then
    echo "✅ OPEN"
    PORT_587_STATUS="open"
else
    echo "❌ BLOCKED"
    PORT_587_STATUS="blocked"
fi

echo -n "Port 2525: "
if timeout 5 bash -c "cat < /dev/null > /dev/tcp/smtp.sendgrid.net/2525" 2>/dev/null; then
    echo "✅ OPEN"
    PORT_2525_STATUS="open"
else
    echo "❌ BLOCKED"
    PORT_2525_STATUS="blocked"
fi

echo -n "Port 465: "
if timeout 5 bash -c "cat < /dev/null > /dev/tcp/smtp.sendgrid.net/465" 2>/dev/null; then
    echo "✅ OPEN"
    PORT_465_STATUS="open"
else
    echo "❌ BLOCKED"
    PORT_465_STATUS="blocked"
fi

echo ""

# If all blocked, try to open firewall
if [ "$PORT_587_STATUS" = "blocked" ] && [ "$PORT_2525_STATUS" = "blocked" ] && [ "$PORT_465_STATUS" = "blocked" ]; then
    echo "⚠️  All ports blocked! Attempting to open firewall..."
    
    if command -v ufw &> /dev/null; then
        echo "Opening ports with UFW..."
        sudo ufw allow out 587/tcp 2>/dev/null || true
        sudo ufw allow out 2525/tcp 2>/dev/null || true
        sudo ufw allow out 465/tcp 2>/dev/null || true
        sudo ufw reload 2>/dev/null || true
        echo "✅ Firewall updated"
    else
        echo "⚠️  UFW not found. Please open ports manually or contact hosting provider."
    fi
    
    # Test again
    echo ""
    echo "Testing again..."
    timeout 5 bash -c "cat < /dev/null > /dev/tcp/smtp.sendgrid.net/587" 2>/dev/null && echo "Port 587: ✅ NOW OPEN" || echo "Port 587: ❌ Still blocked (contact provider)"
    timeout 5 bash -c "cat < /dev/null > /dev/tcp/smtp.sendgrid.net/2525" 2>/dev/null && echo "Port 2525: ✅ NOW OPEN" || echo "Port 2525: ❌ Still blocked"
fi
PORTCHECK

echo ""

# Step 4: Update to use working port
echo "📝 Step 4: Select Working Port"
echo "───────────────────────────────────────────────────"

ssh $REMOTE_USER@$REMOTE_HOST << 'SELECTPORT'
cd /var/www/pixelnest

# Test which port works
if timeout 5 bash -c "cat < /dev/null > /dev/tcp/smtp.sendgrid.net/587" 2>/dev/null; then
    WORKING_PORT=587
    echo "✅ Using port 587"
elif timeout 5 bash -c "cat < /dev/null > /dev/tcp/smtp.sendgrid.net/2525" 2>/dev/null; then
    WORKING_PORT=2525
    echo "✅ Using port 2525 (alternative)"
    sed -i 's/^SMTP_PORT=.*/SMTP_PORT=2525/' .env
elif timeout 5 bash -c "cat < /dev/null > /dev/tcp/smtp.sendgrid.net/465" 2>/dev/null; then
    WORKING_PORT=465
    echo "✅ Using port 465 (SSL)"
    sed -i 's/^SMTP_PORT=.*/SMTP_PORT=465/' .env
else
    echo "❌ No SendGrid ports are accessible!"
    echo "   Contact your hosting provider to unblock SMTP ports."
    WORKING_PORT=587
fi
SELECTPORT

echo ""

# Step 5: Restart PM2
echo "🔄 Step 5: Restart Server"
echo "───────────────────────────────────────────────────"

ssh $REMOTE_USER@$REMOTE_HOST << 'RESTART'
cd /var/www/pixelnest

# Stop all PM2 processes
pm2 stop all

# Delete and restart (force reload)
pm2 delete all

# Start server
if [ -f ecosystem.config.js ]; then
    pm2 start ecosystem.config.js
else
    pm2 start server.js --name pixelnest-server
fi

# Save PM2 config
pm2 save

echo "✅ Server restarted"
RESTART

echo -e "${GREEN}✅ Server restarted${NC}"
echo ""

# Step 6: Verify configuration
echo "🔍 Step 6: Verify Configuration"
echo "───────────────────────────────────────────────────"
sleep 3

ssh $REMOTE_USER@$REMOTE_HOST << 'VERIFY'
cd /var/www/pixelnest

echo "Current email configuration:"
cat .env | grep -E "EMAIL_USER|EMAIL_PASSWORD|SMTP_HOST|SMTP_PORT" | sed 's/EMAIL_PASSWORD=.*/EMAIL_PASSWORD=***hidden***/'

echo ""
echo "PM2 logs (checking for SMTP initialization):"
pm2 logs --lines 30 --nostream | grep -i -E "email service|smtp host" | tail -5

echo ""
VERIFY

echo ""

# Step 7: Test email
echo "🧪 Step 7: Test Email Connection"
echo "───────────────────────────────────────────────────"

read -p "Run email connection test now? (y/n): " -n 1 RUN_TEST
echo ""
echo ""

if [[ $RUN_TEST =~ ^[Yy]$ ]]; then
    ssh $REMOTE_USER@$REMOTE_HOST << 'TESTMAIL'
cd /var/www/pixelnest
echo "Running email test..."
timeout 30 node test-email-connection.js 2>&1 || echo "Test timed out or failed"
TESTMAIL
else
    echo "Skipped. You can run it manually:"
    echo "  ssh $REMOTE_USER@$REMOTE_HOST"
    echo "  cd /var/www/pixelnest"
    echo "  node test-email-connection.js"
fi

echo ""
echo "═══════════════════════════════════════════════════"
echo "🎉 Deployment Complete!"
echo "═══════════════════════════════════════════════════"
echo ""
echo "✅ emailService.js updated"
echo "✅ .env configured with SendGrid"
echo "✅ Server restarted"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Check PM2 logs:"
echo "   ssh $REMOTE_USER@$REMOTE_HOST 'pm2 logs --lines 20'"
echo ""
echo "2. Test user registration on your website"
echo ""
echo "3. If still not working, check:"
echo "   ssh $REMOTE_USER@$REMOTE_HOST 'cd /var/www/pixelnest && node test-email-connection.js'"
echo ""
echo "═══════════════════════════════════════════════════"
echo ""

