#!/bin/bash

echo "🚀 Setting up Claim Code System..."
echo ""

# Database credentials
DB_USER="ahwanulm"
DB_HOST="localhost"
DB_NAME="pixelnest_db"
DB_PORT="5432"

echo "📊 Checking database connection..."
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -p $DB_PORT -c "SELECT version();" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Database connection successful!"
else
    echo "❌ Database connection failed!"
    echo "Please check your database credentials and make sure PostgreSQL is running."
    exit 1
fi

echo ""
echo "📝 Running migration: add_claim_codes.sql..."
echo ""

psql -h $DB_HOST -U $DB_USER -d $DB_NAME -p $DB_PORT -f migrations/add_claim_codes.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
else
    echo ""
    echo "⚠️  Migration had some warnings (this is normal if columns already exist)"
fi

echo ""
echo "🔍 Checking table structure..."
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -p $DB_PORT -c "\d promo_codes"

echo ""
echo "📋 Sample data in promo_codes table:"
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -p $DB_PORT -c "SELECT id, code, code_type, discount_type, discount_value, credit_amount, is_active FROM promo_codes ORDER BY created_at DESC LIMIT 5;"

echo ""
echo "✨ Setup complete!"
echo ""
echo "📚 Next steps:"
echo "1. Start the server: npm start"
echo "2. Login as admin at: http://localhost:3000/admin"
echo "3. Go to Promo Codes: http://localhost:3000/admin/promo-codes"
echo "4. Click green button '🎁 Create Claim Code'"
echo "5. Create a claim code with some free credits"
echo "6. Test claiming at: http://localhost:3000/billing"
echo ""


