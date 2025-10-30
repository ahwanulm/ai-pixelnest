#!/bin/bash

echo "🔍 DEBUG: Server Cache Issue"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Step 1: Check if server is running
echo "1️⃣ Checking Server Status..."
if pm2 list | grep -q "pixelnest.*online"; then
    echo "   ✅ Server is running (PM2)"
    SERVER_RUNNING=true
elif lsof -i :5005 | grep -q LISTEN; then
    echo "   ✅ Server is running (Dev mode)"
    SERVER_RUNNING=true
else
    echo "   ❌ Server is NOT running!"
    SERVER_RUNNING=false
fi
echo ""

# Step 2: Check database config
echo "2️⃣ Checking Database Config..."
node -e "
const { pool } = require('./src/config/database');
(async () => {
  const result = await pool.query('SELECT endpoint_url, additional_config FROM api_configs WHERE service_name = \$1', ['TRIPAY']);
  const config = result.rows[0];
  const mode = config.additional_config?.mode || 'unknown';
  console.log('   Endpoint:', config.endpoint_url);
  console.log('   Mode:', mode);
  await pool.end();
})();
" 2>/dev/null
echo ""

# Step 3: Test API endpoint
echo "3️⃣ Testing API Endpoint..."
if [ "$SERVER_RUNNING" = true ]; then
    echo "   Making request to: http://localhost:5005/api/payment/channels"
    echo ""
    
    # Make request and show response
    RESPONSE=$(curl -s "http://localhost:5005/api/payment/channels?_=$(date +%s)" \
        -H "Cookie: connect.sid=test" \
        -w "\n\nHTTP_CODE:%{http_code}" \
        2>/dev/null)
    
    HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "   ✅ API responded with 200 OK"
        
        # Parse JSON response
        echo "$RESPONSE" | grep -v "HTTP_CODE" | node -e "
        const fs = require('fs');
        const data = JSON.parse(fs.readFileSync(0, 'utf-8'));
        
        if (data.success) {
            let total = 0;
            for (const group in data.data) {
                total += data.data[group].length;
            }
            console.log('   Channels returned:', total);
            
            // Check QRIS min
            if (data.data['E-Wallet']) {
                const qris = data.data['E-Wallet'].find(ch => ch.code === 'QRIS2');
                if (qris) {
                    console.log('   QRIS minimum:', 'Rp', qris.minimum_amount.toLocaleString('id-ID'));
                    
                    if (qris.minimum_amount === 1000) {
                        console.log('   ✅ QRIS minimum is CORRECT (Rp 1.000)');
                    } else {
                        console.log('   ❌ QRIS minimum is WRONG! (should be Rp 1.000)');
                    }
                }
            }
        } else {
            console.log('   ❌ API returned success: false');
        }
        " 2>/dev/null
    elif [ "$HTTP_CODE" = "401" ]; then
        echo "   ⚠️  Need authentication (401) - This is normal for logged-out request"
        echo "      Test from browser while logged in"
    else
        echo "   ❌ API error (HTTP $HTTP_CODE)"
    fi
else
    echo "   ⚠️  Cannot test - server not running"
fi
echo ""

# Step 4: Check server logs
echo "4️⃣ Checking Server Logs..."
if pm2 list | grep -q "pixelnest.*online"; then
    echo "   Last 10 lines from PM2 logs:"
    echo ""
    pm2 logs pixelnest --lines 10 --nostream 2>/dev/null | tail -20
else
    echo "   ⚠️  Server not running with PM2"
fi
echo ""

# Step 5: Recommendations
echo "═══════════════════════════════════════════════════════════"
echo "📋 NEXT STEPS:"
echo ""

if [ "$SERVER_RUNNING" = false ]; then
    echo "❌ SERVER NOT RUNNING!"
    echo ""
    echo "   1. Start server:"
    echo "      pm2 restart pixelnest"
    echo "      OR"
    echo "      npm run dev"
    echo ""
fi

echo "⚠️  IMPORTANT: After code changes, you MUST restart server!"
echo ""
echo "   Quick restart:"
echo "   $ pm2 restart pixelnest"
echo ""
echo "   Then test in browser:"
echo "   1. Open: http://localhost:5005/api/payment/top-up"
echo "   2. Open DevTools (F12) → Console tab"
echo "   3. Look for logs starting with 🔄 or 📄"
echo "   4. Should see: 'TripayService mode: production'"
echo ""
echo "═══════════════════════════════════════════════════════════"

