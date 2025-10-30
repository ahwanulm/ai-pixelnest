#!/bin/bash

# ============================================================================
# ALL-IN-ONE FIX: Payment Channels Deployment
# ============================================================================
# Script lengkap untuk fix masalah payment channels saat deployment
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
echo -e "${CYAN}║   Payment Channels - Complete Deployment Fix          ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Check files
echo -e "${BLUE}[1/5]${NC} ${YELLOW}Checking required files...${NC}"

if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Error: .env file not found${NC}"
    exit 1
fi

if [ ! -f "migrations/fix_payment_channels_structure_complete.sql" ]; then
    echo -e "${RED}❌ Error: Migration file not found${NC}"
    echo "   Expected: migrations/fix_payment_channels_structure_complete.sql"
    exit 1
fi

if [ ! -f "src/services/tripayService.js" ]; then
    echo -e "${RED}❌ Error: tripayService.js not found${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All required files found${NC}"
echo ""

# Step 2: Load database credentials
echo -e "${BLUE}[2/5]${NC} ${YELLOW}Loading database credentials...${NC}"

export $(grep -v '^#' .env | grep -E 'DB_HOST|DB_PORT|DB_NAME|DB_USER|DB_PASSWORD' | xargs)

if [ -z "$DB_HOST" ] || [ -z "$DB_NAME" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ]; then
    echo -e "${RED}❌ Error: Missing database credentials in .env${NC}"
    echo "   Required: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD"
    exit 1
fi

echo -e "${GREEN}✓ Database credentials loaded${NC}"
echo "   Host: $DB_HOST"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo ""

# Step 3: Run migration
echo -e "${BLUE}[3/5]${NC} ${YELLOW}Running database migration...${NC}"
echo ""

PGPASSWORD="$DB_PASSWORD" psql \
    -h "$DB_HOST" \
    -p "${DB_PORT:-5432}" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -f migrations/fix_payment_channels_structure_complete.sql

if [ $? -ne 0 ]; then
    echo ""
    echo -e "${RED}❌ Migration failed!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✓ Migration completed successfully${NC}"
echo ""

# Step 4: Restart PM2 (if running)
echo -e "${BLUE}[4/5]${NC} ${YELLOW}Restarting application...${NC}"

if command -v pm2 &> /dev/null; then
    # Check if pixelnest-server is running
    if pm2 list | grep -q "pixelnest-server"; then
        pm2 restart pixelnest-server
        echo -e "${GREEN}✓ PM2 application restarted${NC}"
    else
        echo -e "${YELLOW}⚠ PM2 process 'pixelnest-server' not found${NC}"
        echo "   Please restart your application manually"
    fi
else
    echo -e "${YELLOW}⚠ PM2 not found${NC}"
    echo "   Please restart your application manually"
fi

echo ""

# Step 5: Sync payment channels
echo -e "${BLUE}[5/5]${NC} ${YELLOW}Syncing payment channels from Tripay...${NC}"
echo ""

if [ -f "sync-tripay-channels.js" ]; then
    node sync-tripay-channels.js
    SYNC_RESULT=$?
else
    echo -e "${YELLOW}⚠ sync-tripay-channels.js not found, trying alternative method...${NC}"
    
    node -e "
    const tripayService = require('./src/services/tripayService');
    (async () => {
      try {
        console.log('⏳ Syncing channels...');
        await tripayService.initialize();
        const result = await tripayService.syncPaymentChannels();
        console.log('✅ Sync completed!');
        console.log('   Channels synced:', result.processed || 0);
        process.exit(0);
      } catch (error) {
        console.error('❌ Sync failed:', error.message);
        process.exit(1);
      }
    })();
    "
    SYNC_RESULT=$?
fi

echo ""

# Final summary
echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"

if [ $SYNC_RESULT -eq 0 ]; then
    echo -e "${CYAN}║${GREEN}   ✅ DEPLOYMENT FIX COMPLETED SUCCESSFULLY!           ${CYAN}║${NC}"
else
    echo -e "${CYAN}║${YELLOW}   ⚠  DEPLOYMENT FIX COMPLETED WITH WARNINGS           ${CYAN}║${NC}"
fi

echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Verification steps
echo -e "${YELLOW}📋 Verification Steps:${NC}"
echo ""
echo "1. Check database structure:"
echo -e "   ${BLUE}psql -U $DB_USER -d $DB_NAME -c '\d payment_channels'${NC}"
echo ""
echo "2. Check channels data:"
echo -e "   ${BLUE}psql -U $DB_USER -d $DB_NAME -c 'SELECT COUNT(*) FROM payment_channels WHERE is_active = true;'${NC}"
echo ""
echo "3. Test API endpoint:"
echo -e "   ${BLUE}curl http://localhost:3000/api/payment/channels | jq .${NC}"
echo ""
echo "4. Check application logs:"
echo -e "   ${BLUE}pm2 logs pixelnest-server --lines 50${NC}"
echo ""
echo "5. Test from frontend:"
echo "   - Login to your app"
echo "   - Open Top Up Credits page"
echo "   - Verify payment methods are displayed"
echo ""

if [ $SYNC_RESULT -ne 0 ]; then
    echo -e "${YELLOW}⚠ Note: Channel sync had issues. Please:${NC}"
    echo "  1. Check Tripay API configuration in database (api_configs table)"
    echo "  2. Verify API credentials are correct"
    echo "  3. Try syncing again: node sync-tripay-channels.js"
    echo ""
fi

echo -e "${GREEN}✨ Done! Your payment channels should now work correctly.${NC}"
echo ""

