#!/bin/bash

# ============================================================================
# All-in-One: Deploy & Verify Payment Channels Fix
# ============================================================================
# This script will:
# 1. Run migration to fix payment_channels structure
# 2. Verify the structure is correct
# 3. Restart PM2
# 4. Check logs for errors
# ============================================================================

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

clear
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}║      Payment Channels Fix - Deploy & Verify Script        ║${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "server.js" ]; then
    echo -e "${RED}❌ Error: server.js not found.${NC}"
    echo "   Please run this script from the project root directory."
    exit 1
fi

# Load database credentials from .env
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Error: .env file not found${NC}"
    exit 1
fi

echo -e "${CYAN}[1/6] Loading database credentials...${NC}"
export $(grep -v '^#' .env | grep -E 'DB_HOST|DB_PORT|DB_NAME|DB_USER|DB_PASSWORD' | xargs)

if [ -z "$DB_HOST" ] || [ -z "$DB_NAME" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ]; then
    echo -e "${RED}❌ Missing database credentials in .env${NC}"
    exit 1
fi

echo -e "${GREEN}   ✓ Credentials loaded${NC}"
echo "     Host: $DB_HOST"
echo "     Database: $DB_NAME"
echo "     User: $DB_USER"
echo ""

# Step 2: Run migration
echo -e "${CYAN}[2/6] Running database migration...${NC}"
echo ""

PGPASSWORD="$DB_PASSWORD" psql \
    -h "$DB_HOST" \
    -p "${DB_PORT:-5432}" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -f migrations/fix_payment_channels_structure_complete.sql \
    2>&1 | grep -E "NOTICE|ERROR|WARNING" || true

if [ ${PIPESTATUS[0]} -ne 0 ]; then
    echo ""
    echo -e "${RED}❌ Migration failed!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}   ✓ Migration completed${NC}"
echo ""

# Step 3: Verify structure
echo -e "${CYAN}[3/6] Verifying database structure...${NC}"
echo ""

PGPASSWORD="$DB_PASSWORD" psql \
    -h "$DB_HOST" \
    -p "${DB_PORT:-5432}" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -f verify-payment-channels-structure.sql \
    2>&1 | grep -E "NOTICE|ERROR|WARNING|✓|✅|❌|⚠" || true

if [ ${PIPESTATUS[0]} -ne 0 ]; then
    echo ""
    echo -e "${RED}❌ Verification failed!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}   ✓ Structure verified${NC}"
echo ""

# Step 4: Restart PM2
echo -e "${CYAN}[4/6] Restarting PM2 application...${NC}"

if command -v pm2 &> /dev/null; then
    pm2 restart pixelnest-server 2>&1 | tail -n 5
    echo -e "${GREEN}   ✓ PM2 restarted${NC}"
else
    echo -e "${YELLOW}   ⚠ PM2 not found, skipping restart${NC}"
    echo "     Please restart your application manually"
fi

echo ""

# Step 5: Wait and check logs
echo -e "${CYAN}[5/6] Checking logs for errors...${NC}"
echo ""

if command -v pm2 &> /dev/null; then
    sleep 2  # Wait for app to start
    
    echo "   Last 20 log lines:"
    echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    pm2 logs pixelnest-server --lines 20 --nostream 2>&1 | tail -n 20
    echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # Check for errors
    if pm2 logs pixelnest-server --lines 50 --nostream 2>&1 | grep -qi "column.*does not exist"; then
        echo -e "${RED}   ❌ Still seeing column errors in logs!${NC}"
        echo ""
        exit 1
    else
        echo -e "${GREEN}   ✓ No column errors detected${NC}"
    fi
else
    echo -e "${YELLOW}   ⚠ PM2 not found, skipping log check${NC}"
fi

echo ""

# Step 6: Test API endpoint
echo -e "${CYAN}[6/6] Testing API endpoint...${NC}"
echo ""

if command -v curl &> /dev/null; then
    RESPONSE=$(curl -s http://localhost:3000/api/payment/channels 2>&1)
    
    if echo "$RESPONSE" | grep -q '"success":true'; then
        echo -e "${GREEN}   ✓ API endpoint working!${NC}"
        echo "     Response: ${RESPONSE:0:100}..."
    else
        echo -e "${YELLOW}   ⚠ API response unexpected${NC}"
        echo "     Response: $RESPONSE"
    fi
else
    echo -e "${YELLOW}   ⚠ curl not found, skipping API test${NC}"
    echo "     Please test manually: curl http://localhost:3000/api/payment/channels"
fi

echo ""
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}║              ✅  DEPLOYMENT COMPLETED SUCCESSFULLY          ║${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}📝 Next Steps:${NC}"
echo ""
echo "1. Sync payment channels from Tripay (optional):"
echo -e "   ${BLUE}npm run sync:tripay-channels${NC}"
echo "   or via Admin Panel: Payment Management > Sync Channels"
echo ""
echo "2. Monitor logs for any issues:"
echo -e "   ${BLUE}pm2 logs pixelnest-server${NC}"
echo ""
echo "3. Test payment flow:"
echo "   - Visit payment page"
echo "   - Select a payment channel"
echo "   - Create a test transaction"
echo ""
echo -e "${GREEN}All done! Payment channels should now work correctly. 🎉${NC}"
echo ""

