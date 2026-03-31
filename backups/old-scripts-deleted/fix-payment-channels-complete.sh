#!/bin/bash

# ============================================================================
# Complete Fix for Payment Channels Structure
# ============================================================================
# This script will fix all column mismatches in payment_channels table
# ============================================================================

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   Payment Channels Structure - Complete Fix${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if migration file exists
if [ ! -f "migrations/fix_payment_channels_structure_complete.sql" ]; then
    echo -e "${RED}❌ Error: Migration file not found!${NC}"
    echo "   Expected: migrations/fix_payment_channels_structure_complete.sql"
    exit 1
fi

# Load database credentials from .env
if [ -f ".env" ]; then
    echo -e "${YELLOW}📋 Loading database credentials from .env...${NC}"
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
else
    echo -e "${RED}❌ Error: .env file not found${NC}"
    exit 1
fi

# Run migration
echo -e "${YELLOW}🔧 Running database migration...${NC}"
echo ""

PGPASSWORD="$DB_PASSWORD" psql \
    -h "$DB_HOST" \
    -p "${DB_PORT:-5432}" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -f migrations/fix_payment_channels_structure_complete.sql

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}   ✅ Migration completed successfully!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}📝 Next steps:${NC}"
    echo ""
    echo "1. Restart PM2 application:"
    echo -e "   ${BLUE}pm2 restart pixelnest-server${NC}"
    echo ""
    echo "2. Sync payment channels from Tripay:"
    echo -e "   ${BLUE}npm run sync:tripay-channels${NC}"
    echo "   or visit: Admin Panel > Payment Management > Sync Channels"
    echo ""
    echo "3. Check logs to verify:"
    echo -e "   ${BLUE}pm2 logs pixelnest-server${NC}"
    echo ""
    echo "4. Test payment channels endpoint:"
    echo -e "   ${BLUE}curl http://localhost:3000/api/payment/channels${NC}"
    echo ""
else
    echo ""
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}   ❌ Migration failed!${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    exit 1
fi

