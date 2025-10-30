#!/bin/bash

# ============================================================================
# Post-Deployment Script
# ============================================================================
# Jalankan script ini setelah deploy-pixelnest.sh selesai
# Usage: bash post-deploy.sh
# ============================================================================

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   Post-Deployment Tasks - PixelNest                   ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Get current directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Not in project directory${NC}"
    exit 1
fi

echo -e "${BLUE}[1/4]${NC} ${YELLOW}Fixing payment channels structure...${NC}"
if [ -f "fix-payment-deployment.sh" ]; then
    bash fix-payment-deployment.sh
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Payment channels fix completed${NC}"
    else
        echo -e "${RED}✗ Payment channels fix failed${NC}"
        echo -e "${YELLOW}  You may need to run it manually: npm run fix:payment-channels${NC}"
    fi
else
    echo -e "${YELLOW}⚠ fix-payment-deployment.sh not found${NC}"
    echo -e "${YELLOW}  Trying alternative method...${NC}"
    
    # Try running migration directly
    if [ -f "migrations/fix_payment_channels_structure_complete.sql" ]; then
        if [ -f ".env" ]; then
            export $(grep -v '^#' .env | grep -E 'DB_HOST|DB_PORT|DB_NAME|DB_USER|DB_PASSWORD' | xargs)
            
            PGPASSWORD="$DB_PASSWORD" psql \
                -h "$DB_HOST" \
                -p "${DB_PORT:-5432}" \
                -U "$DB_USER" \
                -d "$DB_NAME" \
                -f migrations/fix_payment_channels_structure_complete.sql
            
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✓ Migration completed${NC}"
            else
                echo -e "${RED}✗ Migration failed${NC}"
            fi
        else
            echo -e "${RED}✗ .env file not found${NC}"
        fi
    fi
fi

echo ""
echo -e "${BLUE}[2/4]${NC} ${YELLOW}Restarting PM2 application...${NC}"
if command -v pm2 &> /dev/null; then
    pm2 restart pixelnest-server pixelnest-worker 2>/dev/null || pm2 restart all
    echo -e "${GREEN}✓ PM2 restarted${NC}"
else
    echo -e "${YELLOW}⚠ PM2 not found, skipping restart${NC}"
fi

echo ""
echo -e "${BLUE}[3/4]${NC} ${YELLOW}Syncing payment channels from Tripay...${NC}"
if [ -f "sync-tripay-channels.js" ]; then
    node sync-tripay-channels.js
    SYNC_STATUS=$?
else
    npm run sync:tripay-channels 2>/dev/null
    SYNC_STATUS=$?
fi

if [ $SYNC_STATUS -eq 0 ]; then
    echo -e "${GREEN}✓ Payment channels synced${NC}"
else
    echo -e "${YELLOW}⚠ Payment channels sync had issues${NC}"
    echo -e "${YELLOW}  This is OK if Tripay API is not configured yet${NC}"
    echo -e "${YELLOW}  You can configure it later in Admin Panel > API Configs${NC}"
    echo -e "${YELLOW}  Then run: npm run sync:tripay-channels${NC}"
fi

echo ""
echo -e "${BLUE}[4/4]${NC} ${YELLOW}Running verification...${NC}"
if [ -f "verify-payment-channels.sh" ]; then
    bash verify-payment-channels.sh
else
    npm run verify:payment-channels 2>/dev/null || echo -e "${YELLOW}⚠ Verification script not found${NC}"
fi

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   Post-Deployment Completed!                          ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${GREEN}✨ Next Steps:${NC}"
echo ""
echo "1. Configure Tripay API (if not done yet):"
echo "   - Login to Admin Panel"
echo "   - Go to API Configs"
echo "   - Add Tripay credentials"
echo ""
echo "2. Test the application:"
echo "   - Open your domain in browser"
echo "   - Login and test Top Up feature"
echo "   - Verify payment methods are displayed"
echo ""
echo "3. Monitor the logs:"
echo -e "   ${BLUE}pm2 logs --lines 50${NC}"
echo ""
echo "4. Check application status:"
echo -e "   ${BLUE}pm2 list${NC}"
echo ""

# Show current status
echo -e "${YELLOW}Current Status:${NC}"
echo ""
if command -v pm2 &> /dev/null; then
    pm2 list 2>/dev/null || echo "PM2 processes not running"
else
    echo "PM2 not available"
fi

echo ""
echo -e "${GREEN}🎉 All done! Your PixelNest is ready to use.${NC}"
echo ""

