#!/bin/bash

# Script to fix payment_channels column name issue on server
# This script will run the migration to rename group_name to group_channel

set -e  # Exit on any error

echo "🔧 Fixing payment_channels column name issue..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "server.js" ]; then
    echo -e "${RED}❌ Error: server.js not found. Please run this script from the project root directory.${NC}"
    exit 1
fi

# Check if migration file exists
if [ ! -f "migrations/fix_payment_channels_column.sql" ]; then
    echo -e "${RED}❌ Error: migrations/fix_payment_channels_column.sql not found.${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Running database migration...${NC}"

# Run the migration using psql
# Assuming PostgreSQL connection details are in environment variables
# or you can modify this to use your database connection string

# Option 1: If you have DATABASE_URL
if [ ! -z "$DATABASE_URL" ]; then
    psql "$DATABASE_URL" -f migrations/fix_payment_channels_column.sql
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Migration completed successfully!${NC}"
    else
        echo -e "${RED}❌ Migration failed!${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  DATABASE_URL not found.${NC}"
    echo "Please run the migration manually using:"
    echo "  psql your_database_url -f migrations/fix_payment_channels_column.sql"
    echo ""
    echo "Or set your DATABASE_URL environment variable and run this script again."
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Fix applied successfully!${NC}"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Restart your PM2 application:"
echo "   pm2 restart pixelnest-server"
echo ""
echo "2. Check the logs to ensure everything is working:"
echo "   pm2 logs pixelnest-server"
echo ""

