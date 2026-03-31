#!/bin/bash

# Quick Email Status Checker
# Checks SendGrid configuration and provides quick status

echo ""
echo "=================================================="
echo "📧 PIXELNEST EMAIL STATUS CHECKER"
echo "=================================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "   Create .env file first"
    exit 1
fi

# Load .env
source .env 2>/dev/null || true

echo "🔍 Checking Configuration..."
echo ""

# Check SENDGRID_API_KEY
if [ -z "$SENDGRID_API_KEY" ]; then
    echo "❌ SENDGRID_API_KEY: NOT SET"
    ERRORS=1
else
    # Check if starts with SG.
    if [[ $SENDGRID_API_KEY == SG.* ]]; then
        echo "✅ SENDGRID_API_KEY: SET (${SENDGRID_API_KEY:0:10}...)"
    else
        echo "⚠️  SENDGRID_API_KEY: SET but invalid format (should start with SG.)"
        echo "   Current: ${SENDGRID_API_KEY:0:20}..."
        ERRORS=1
    fi
fi

# Check EMAIL_FROM
if [ -z "$EMAIL_FROM" ]; then
    if [ -z "$EMAIL_USER" ]; then
        echo "⚠️  EMAIL_FROM: NOT SET (will use default: noreply@pixelnest.id)"
    else
        echo "✅ EMAIL_FROM: Using EMAIL_USER ($EMAIL_USER)"
    fi
else
    echo "✅ EMAIL_FROM: $EMAIL_FROM"
fi

echo ""
echo "🗄️  Checking Database Configuration..."
echo ""

# Check if psql is available
if command -v psql &> /dev/null; then
    # Try to connect to database
    DB_HOST=${DB_HOST:-localhost}
    DB_PORT=${DB_PORT:-5432}
    DB_NAME=${DB_NAME:-pixelnest_db}
    DB_USER=${DB_USER:-pixelnest}
    
    # Check if database is accessible
    if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1" &> /dev/null; then
        echo "✅ Database connection: OK"
        
        # Check SendGrid config in database
        SENDGRID_CONFIG=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM api_configs WHERE service_name = 'SENDGRID';" 2>/dev/null | xargs)
        
        if [ "$SENDGRID_CONFIG" = "1" ]; then
            echo "✅ SendGrid config: FOUND in database"
            
            # Check if active
            IS_ACTIVE=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT is_active FROM api_configs WHERE service_name = 'SENDGRID';" 2>/dev/null | xargs)
            
            if [ "$IS_ACTIVE" = "t" ]; then
                echo "✅ SendGrid status: ACTIVE"
            else
                echo "❌ SendGrid status: INACTIVE"
                ERRORS=1
            fi
            
            # Check API key in database
            HAS_API_KEY=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT LENGTH(api_key) > 0 FROM api_configs WHERE service_name = 'SENDGRID';" 2>/dev/null | xargs)
            
            if [ "$HAS_API_KEY" = "t" ]; then
                echo "✅ API Key in database: SET"
            else
                echo "❌ API Key in database: EMPTY"
                ERRORS=1
            fi
        elif [ "$SENDGRID_CONFIG" = "0" ]; then
            echo "⚠️  SendGrid config: NOT FOUND in database (using .env)"
        else
            echo "⚠️  Could not check database config"
        fi
    else
        echo "⚠️  Database connection: FAILED"
        echo "   (This is OK if using .env configuration)"
    fi
else
    echo "⚠️  psql not installed, skipping database check"
    echo "   (This is OK if using .env configuration)"
fi

echo ""
echo "=================================================="

if [ "$ERRORS" = "1" ]; then
    echo "❌ ISSUES FOUND!"
    echo ""
    echo "📋 Quick Fix:"
    echo ""
    
    if [ -z "$SENDGRID_API_KEY" ]; then
        echo "1. Get SendGrid API Key:"
        echo "   https://app.sendgrid.com/settings/api_keys"
        echo ""
        echo "2. Add to .env:"
        echo "   echo 'SENDGRID_API_KEY=SG.your-api-key-here' >> .env"
        echo ""
    fi
    
    echo "3. Run full diagnosis:"
    echo "   node diagnose-sendgrid.js"
    echo ""
    echo "4. Read guide:"
    echo "   cat CARA_FIX_EMAIL_AKTIVASI.md"
    echo ""
else
    echo "✅ CONFIGURATION LOOKS GOOD!"
    echo ""
    echo "📋 Next Steps:"
    echo ""
    echo "1. Run full test:"
    echo "   node diagnose-sendgrid.js"
    echo ""
    echo "2. Verify sender email:"
    echo "   https://app.sendgrid.com/settings/sender_auth"
    echo ""
    echo "3. Test user registration"
    echo ""
fi

echo "=================================================="
echo ""

