#!/bin/bash

# ============================================================================
# Verify Payment Channels Setup
# ============================================================================
# Script untuk memverifikasi payment channels sudah setup dengan benar
# ============================================================================

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   Payment Channels - Verification                     ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Load .env
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env file not found${NC}"
    exit 1
fi

export $(grep -v '^#' .env | grep -E 'DB_HOST|DB_PORT|DB_NAME|DB_USER|DB_PASSWORD' | xargs)

if [ -z "$DB_HOST" ] || [ -z "$DB_NAME" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ]; then
    echo -e "${RED}❌ Missing database credentials in .env${NC}"
    exit 1
fi

PASSED=0
FAILED=0

# Test 1: Check table structure
echo -e "${BLUE}[1/6]${NC} ${YELLOW}Checking table structure...${NC}"

TABLE_CHECK=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER" -d "$DB_NAME" -t -c "
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'payment_channels'
);
" | xargs)

if [ "$TABLE_CHECK" = "t" ]; then
    echo -e "${GREEN}✓ Table payment_channels exists${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Table payment_channels does not exist${NC}"
    ((FAILED++))
fi

# Test 2: Check required columns
echo -e "${BLUE}[2/6]${NC} ${YELLOW}Checking required columns...${NC}"

REQUIRED_COLUMNS=("code" "name" "group_channel" "fee_merchant_flat" "fee_merchant_percent" "fee_customer_flat" "fee_customer_percent" "minimum_amount" "maximum_amount" "is_active")
ALL_COLUMNS_EXIST=true

for col in "${REQUIRED_COLUMNS[@]}"; do
    COL_CHECK=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER" -d "$DB_NAME" -t -c "
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'payment_channels' AND column_name = '$col'
    );
    " | xargs)
    
    if [ "$COL_CHECK" = "t" ]; then
        echo -e "${GREEN}  ✓ Column '$col' exists${NC}"
    else
        echo -e "${RED}  ✗ Column '$col' missing${NC}"
        ALL_COLUMNS_EXIST=false
    fi
done

if [ "$ALL_COLUMNS_EXIST" = true ]; then
    ((PASSED++))
else
    ((FAILED++))
fi

# Test 3: Check data count
echo -e "${BLUE}[3/6]${NC} ${YELLOW}Checking payment channels data...${NC}"

CHANNEL_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER" -d "$DB_NAME" -t -c "
SELECT COUNT(*) FROM payment_channels WHERE is_active = true;
" | xargs)

if [ "$CHANNEL_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ Found $CHANNEL_COUNT active payment channels${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ No active payment channels found${NC}"
    echo -e "${YELLOW}  → Run: npm run sync:tripay-channels${NC}"
    ((FAILED++))
fi

# Test 4: Check Tripay configuration
echo -e "${BLUE}[4/6]${NC} ${YELLOW}Checking Tripay API configuration...${NC}"

TRIPAY_CONFIG=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER" -d "$DB_NAME" -t -c "
SELECT EXISTS (
    SELECT FROM api_configs 
    WHERE service_name = 'TRIPAY' AND is_active = true
);
" | xargs)

if [ "$TRIPAY_CONFIG" = "t" ]; then
    echo -e "${GREEN}✓ Tripay API configuration exists and active${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Tripay API configuration not found or inactive${NC}"
    echo -e "${YELLOW}  → Configure Tripay in Admin Panel > API Configs${NC}"
    ((FAILED++))
fi

# Test 5: Test API endpoint
echo -e "${BLUE}[5/6]${NC} ${YELLOW}Testing API endpoint...${NC}"

if command -v curl &> /dev/null; then
    API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/payment/channels)
    
    if [ "$API_RESPONSE" = "200" ]; then
        echo -e "${GREEN}✓ API endpoint responds successfully (200)${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ API endpoint error (HTTP $API_RESPONSE)${NC}"
        echo -e "${YELLOW}  → Check if application is running: pm2 list${NC}"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⚠ curl not found, skipping API test${NC}"
fi

# Test 6: Show sample channels
echo -e "${BLUE}[6/6]${NC} ${YELLOW}Showing sample payment channels...${NC}"

PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER" -d "$DB_NAME" -c "
SELECT 
    code,
    name,
    group_channel,
    CONCAT('Rp ', fee_customer_flat) as customer_fee_flat,
    CONCAT(fee_customer_percent, '%') as customer_fee_percent,
    is_active
FROM payment_channels
WHERE is_active = true
ORDER BY group_channel, name
LIMIT 10;
"

echo ""

# Summary
echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   Verification Summary                                 ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${GREEN}Passed: $PASSED${NC}"
echo -e "  ${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Payment channels are properly configured.${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Some checks failed. Please fix the issues above.${NC}"
    echo ""
    echo -e "${YELLOW}Quick fixes:${NC}"
    echo "  1. Run migration: bash fix-payment-channels-complete.sh"
    echo "  2. Sync channels: npm run sync:tripay-channels"
    echo "  3. Configure Tripay: Admin Panel > API Configs"
    echo "  4. Restart app: pm2 restart pixelnest-server"
    echo ""
    exit 1
fi

