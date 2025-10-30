#!/bin/bash

# Quick Debug Script for Pending Transaction Limit
# Run this to diagnose why the limit isn't working

echo "🔍 Debugging Pending Transaction Limit"
echo "======================================"
echo ""

# Run the SQL checks
psql -U ahwanulm -d pixelnest_db -f check-pending-transactions.sql

echo ""
echo "======================================"
echo "🧪 Quick Manual Test:"
echo "======================================"
echo ""
echo "To test the feature manually:"
echo ""
echo "1. Open browser and login to dashboard"
echo "2. Open browser console (F12 -> Console)"
echo "3. Click 'Top Up' button"
echo "4. Check console logs for:"
echo "   - 🔍 Checking pending transactions..."
echo "   - 📡 Response status: 200"
echo "   - 📊 Pending data: {...}"
echo ""
echo "5. If you see errors in console, check:"
echo "   - Is server running? (npm start)"
echo "   - Is route registered? Check src/routes/payment.js"
echo "   - Is function exported? Check src/controllers/paymentController.js"
echo ""
echo "6. To force test the limit:"
echo "   - Create 3 pending transactions"
echo "   - Try to create 4th"
echo "   - Should see warning modal"
echo ""

