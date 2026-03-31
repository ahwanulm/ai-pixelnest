#!/bin/bash

# Test Pending Transaction Limit Feature
# Run this after logging in to get session cookie

echo "🧪 Testing Pending Transaction Limit Feature"
echo "============================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://localhost:5005"

# You need to replace this with your actual session cookie
# Get it from browser DevTools -> Application -> Cookies
COOKIE="connect.sid=YOUR_SESSION_COOKIE_HERE"

echo "⚠️  NOTE: Replace COOKIE variable in this script with your actual session cookie"
echo "   Get it from: Browser DevTools -> Application -> Cookies -> connect.sid"
echo ""
read -p "Press Enter to continue with test (or Ctrl+C to cancel)..."
echo ""

# Test 1: Check pending transactions endpoint
echo -e "${YELLOW}Test 1: Check Pending Transactions Endpoint${NC}"
echo "GET $BASE_URL/api/payment/check-pending"
echo ""

response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -H "Cookie: $COOKIE" \
  "$BASE_URL/api/payment/check-pending")

http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
body=$(echo "$response" | sed '$d')

if [ "$http_status" == "200" ]; then
  echo -e "${GREEN}✅ SUCCESS - Status: $http_status${NC}"
  echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
else
  echo -e "${RED}❌ FAILED - Status: $http_status${NC}"
  echo "$body"
fi

echo ""
echo "============================================"
echo ""

# Test 2: Try to create payment (will test limit)
echo -e "${YELLOW}Test 2: Create Payment (Test Limit)${NC}"
echo "POST $BASE_URL/api/payment/create"
echo ""

response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST \
  -H "Cookie: $COOKIE" \
  -H "Content-Type: application/json" \
  -d '{"amount": 20000, "paymentMethod": "QRIS"}' \
  "$BASE_URL/api/payment/create")

http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
body=$(echo "$response" | sed '$d')

if [ "$http_status" == "200" ]; then
  echo -e "${GREEN}✅ Payment created successfully${NC}"
  echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
elif [ "$http_status" == "429" ]; then
  echo -e "${YELLOW}⚠️  BLOCKED - Too many pending transactions (Expected behavior)${NC}"
  echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
else
  echo -e "${RED}❌ Unexpected error - Status: $http_status${NC}"
  echo "$body"
fi

echo ""
echo "============================================"
echo ""

# Test 3: Check database directly
echo -e "${YELLOW}Test 3: Check Database for Pending Transactions${NC}"
echo ""

psql -U ahwanulm -d pixelnest_db << EOF
SELECT 
  COUNT(*) as total_pending,
  string_agg(status, ', ') as statuses,
  MIN(expired_time) as earliest_expiry
FROM payment_transactions 
WHERE status = 'PENDING'
  AND expired_time > NOW();
EOF

echo ""
echo "============================================"
echo ""
echo -e "${GREEN}Testing Complete!${NC}"
echo ""
echo "📝 Next steps:"
echo "1. Check browser console for frontend logs"
echo "2. Check server logs for backend errors"
echo "3. Verify pending_count in database"
echo "4. Try creating 3 transactions and test the limit"

