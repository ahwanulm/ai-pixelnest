#!/bin/bash

echo "🧪 Testing Code Validation System"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test configuration
API_URL="http://localhost:3000"
TEST_USER_TOKEN="YOUR_TEST_TOKEN_HERE" # Replace with actual token

echo "📝 Test Scenario 1: Claim Code First, Then Try as Promo"
echo "--------------------------------------------------------"
echo ""

echo "Step 1: Create test claim code via admin..."
echo "Go to: ${API_URL}/admin/promo-codes"
echo "Create:"
echo "  - Code: TESTVALIDATION"
echo "  - Type: Claim"
echo "  - Credit Amount: 50"
echo ""
read -p "Press Enter after code is created..."

echo ""
echo "Step 2: Claim the code..."
curl -X POST "${API_URL}/api/user/claim-credits" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TEST_USER_TOKEN}" \
  -d '{"code": "TESTVALIDATION"}' \
  | jq '.'

echo ""
echo -e "${YELLOW}Expected: Success with +50 credits${NC}"
echo ""
read -p "Press Enter to continue..."

echo ""
echo "Step 3: Try to use same code as promo..."
curl -X POST "${API_URL}/api/user/promo/validate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TEST_USER_TOKEN}" \
  -d '{"code": "TESTVALIDATION"}' \
  | jq '.'

echo ""
echo -e "${RED}Expected: Error - Code already claimed${NC}"
echo ""
read -p "Press Enter to continue..."

echo ""
echo "=================================================="
echo ""
echo "📝 Test Scenario 2: Check Database Logs"
echo "--------------------------------------------------------"
echo ""

echo "Query credit_transactions to verify:"
echo ""
echo "SQL:"
echo "SELECT user_id, transaction_type, description, created_at"
echo "FROM credit_transactions"
echo "WHERE description LIKE '%TESTVALIDATION%'"
echo "ORDER BY created_at DESC;"
echo ""
echo -e "${GREEN}Expected: Should show 'claim_code' transaction${NC}"
echo ""

echo "=================================================="
echo ""
echo "✅ Manual Testing Guide:"
echo ""
echo "1. Create code TESTCLAIM (type: claim, 50 credits)"
echo "2. Login as User A"
echo "3. Claim at /billing → Should SUCCESS"
echo "4. Try to use as promo → Should FAIL"
echo "5. Logout, login as User B"
echo "6. Claim same code → Should SUCCESS (if not single_use)"
echo ""
echo "7. Create code TESTPROMO (type: promo, 10% discount)"
echo "8. Use TESTPROMO at checkout → Should SUCCESS"
echo "9. Try to claim TESTPROMO at /billing → Should FAIL"
echo ""

echo "=================================================="
echo ""
echo "🔍 Quick Check via psql:"
echo ""
echo "psql -d pixelnest_db -c \\"
echo "  SELECT"
echo "    u.email,"
echo "    ct.transaction_type,"
echo "    ct.description,"
echo "    ct.created_at"
echo "  FROM credit_transactions ct"
echo "  JOIN users u ON u.id = ct.user_id"
echo "  WHERE ct.description LIKE '%code:%'"
echo "  ORDER BY ct.created_at DESC"
echo "  LIMIT 10;"
echo "\\"
echo ""

echo "Done! 🎉"

