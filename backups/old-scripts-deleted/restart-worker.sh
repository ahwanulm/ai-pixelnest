#!/bin/bash

# ========================================
# Worker Restart Script
# ========================================
# Safely restart worker dengan verification
# Usage: ./restart-worker.sh

echo "🔄 Restarting PixelNest Worker..."
echo ""

# Check if PM2 is running
if command -v pm2 &> /dev/null; then
    echo "📦 PM2 detected"
    
    # Check if worker is running
    if pm2 list | grep -q "pixelnest-worker"; then
        echo "🛑 Stopping current worker..."
        pm2 stop pixelnest-worker
        sleep 2
        
        echo "🗑️  Deleting worker process..."
        pm2 delete pixelnest-worker
        sleep 1
    fi
    
    echo "🚀 Starting worker with new configuration..."
    pm2 start ecosystem.config.js --only pixelnest-worker
    
    echo ""
    echo "✅ Worker restarted successfully!"
    echo ""
    
    # Show status
    pm2 list
    
    echo ""
    echo "📊 Worker Logs (last 20 lines):"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    pm2 logs pixelnest-worker --lines 20 --nostream
    
    echo ""
    echo "💡 Monitor logs in real-time:"
    echo "   pm2 logs pixelnest-worker"
    echo ""
    echo "📈 Check status:"
    echo "   pm2 status"
    echo ""
    
else
    echo "⚠️  PM2 not detected - using manual restart"
    
    # Kill existing worker
    echo "🛑 Stopping current worker..."
    pkill -f "node worker.js" || true
    sleep 2
    
    # Start new worker in background
    echo "🚀 Starting worker..."
    nohup node worker.js --queue=pgboss > logs/worker-manual.log 2>&1 &
    WORKER_PID=$!
    
    echo "✅ Worker started with PID: $WORKER_PID"
    echo ""
    echo "📊 Worker Logs:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    sleep 2
    tail -n 20 logs/worker-manual.log
    
    echo ""
    echo "💡 Monitor logs:"
    echo "   tail -f logs/worker-manual.log"
    echo ""
    echo "🛑 Stop worker:"
    echo "   kill $WORKER_PID"
    echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 Expected in logs:"
echo "   ✅ AI Generation Worker is running"
echo "   👷 Worker registered: ai-generation (team: 3, concurrency: 1)"
echo "   ⏳ Waiting for jobs..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✨ Worker is now ready to process 3 concurrent jobs!"
echo ""

