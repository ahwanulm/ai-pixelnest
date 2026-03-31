#!/bin/bash

# ============================================
# Quick Fix Script for Promo Code Column
# ============================================

echo "🔧 Fixing Promo Code Column..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Database credentials (auto-detect or modify if needed)
DB_USER="${USER}"  # Use current system username
DB_NAME="pixelnest"

echo "📋 Database Info:"
echo "   User: $DB_USER"
echo "   Database: $DB_NAME"
echo ""

# Check if migration file exists
if [ ! -f "migrations/add_promo_code_column.sql" ]; then
    echo -e "${RED}❌ Error: Migration file not found!${NC}"
    echo "   Expected: migrations/add_promo_code_column.sql"
    exit 1
fi

echo "✅ Migration file found"
echo ""

# Ask for confirmation
read -p "Do you want to run the migration? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Migration cancelled"
    exit 0
fi

echo ""
echo "🚀 Running migration..."
echo ""

# Run migration
psql -U $DB_USER -d $DB_NAME -f migrations/add_promo_code_column.sql

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Migration completed successfully!${NC}"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Restart your server (Ctrl+C then npm start)"
    echo "   2. Test promo code feature"
    echo "   3. Check if payment with promo works"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Migration failed!${NC}"
    echo ""
    echo "Possible issues:"
    echo "   1. Database not running"
    echo "   2. Wrong database credentials"
    echo "   3. Table payment_transactions doesn't exist"
    echo ""
    echo "Try manual fix:"
    echo "   psql -U $DB_USER -d $DB_NAME"
    echo "   Then run:"
    echo "   ALTER TABLE payment_transactions ADD COLUMN promo_code VARCHAR(50);"
    echo ""
    exit 1
fi

