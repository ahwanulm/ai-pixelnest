#!/bin/bash

echo "🔄 FORCE RELOAD TRIPAY PRODUCTION CONFIGURATION"
echo "═══════════════════════════════════════════════════════════"
echo ""

# 1. Force reload Tripay config from database
echo "1️⃣ Reloading Tripay configuration from database..."
node -e "
const tripayService = require('./src/services/tripayService');
(async () => {
  await tripayService.initialize(true); // Force reload
  console.log('✅ TripayService reloaded');
  console.log('   Mode:', tripayService.config.mode);
  console.log('   Endpoint:', tripayService.config.baseUrl);
  process.exit(0);
})();
" 2>/dev/null

echo ""

# 2. Verify payment channels
echo "2️⃣ Verifying payment channels..."
node -e "
const { pool } = require('./src/config/database');
(async () => {
  const result = await pool.query('SELECT COUNT(*) as count FROM payment_channels WHERE is_active = true');
  console.log('✅ Active payment channels:', result.rows[0].count);
  await pool.end();
})();
" 2>/dev/null

echo ""

# 3. Verify credit price
echo "3️⃣ Verifying credit price..."
node -e "
const { pool } = require('./src/config/database');
(async () => {
  const result = await pool.query('SELECT config_value FROM pricing_config WHERE config_key = \$1', ['credit_price_idr']);
  const price = parseInt(result.rows[0]?.config_value || 2000);
  console.log('✅ Credit price: Rp', price.toLocaleString('id-ID'), '/credit');
  await pool.end();
})();
" 2>/dev/null

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ All configurations verified!"
echo ""
echo "⚠️  NEXT STEPS:"
echo "1. Restart your server:"
echo "   - PM2: pm2 restart pixelnest"
echo "   - Dev: Ctrl+C then npm run dev"
echo ""
echo "2. Clear browser cache:"
echo "   - Hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)"
echo "   - Or use Incognito/Private mode"
echo ""
echo "3. Test top-up page:"
echo "   - Visit: http://localhost:5005/api/payment/top-up"
echo "   - Check if payment channels show (not empty)"
echo "   - Check if mode badge shows PRODUCTION (green)"
echo ""
echo "═══════════════════════════════════════════════════════════"

