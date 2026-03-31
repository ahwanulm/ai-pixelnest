#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}   DEBUG PROMO CODE - PIXELNEST20${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Database configuration
DB_USER="${USER}"
DB_NAME="pixelnest_db"

echo -e "${YELLOW}Running debug queries...${NC}"
echo ""

# Run the SQL file
psql -U "$DB_USER" -d "$DB_NAME" -f debug-promo.sql

echo ""
echo -e "${GREEN}✓ Debug complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Check the output above for any ✗ marks"
echo "2. Restart your server: npm start"
echo "3. Try applying the promo code again"
echo "4. Check server logs for detailed validation steps"
echo ""
echo -e "${BLUE}Server logs will show:${NC}"
echo "  📊 Query result - if promo found in DB"
echo "  ✅ Promo found - promo details"
echo "  ✗ Error messages - specific validation failures"
echo ""

