#!/bin/bash

# Upload Model Name Cleanup Fix to Server
# Date: 2025-10-29

SERVER="root@188.166.188.91"
REMOTE_PATH="/var/www/pixelnest"

echo "🚀 Uploading Model Name Cleanup Fix to Server..."
echo "================================================"
echo ""

# File 1: Dashboard Generation
echo "📤 [1/5] Uploading dashboard-generation.js..."
scp public/js/dashboard-generation.js $SERVER:$REMOTE_PATH/public/js/dashboard-generation.js
if [ $? -eq 0 ]; then
    echo "✅ dashboard-generation.js uploaded successfully"
else
    echo "❌ Failed to upload dashboard-generation.js"
    exit 1
fi
echo ""

# File 2: Generation Detail Modal
echo "📤 [2/5] Uploading generation-detail-modal.js..."
scp public/js/generation-detail-modal.js $SERVER:$REMOTE_PATH/public/js/generation-detail-modal.js
if [ $? -eq 0 ]; then
    echo "✅ generation-detail-modal.js uploaded successfully"
else
    echo "❌ Failed to upload generation-detail-modal.js"
    exit 1
fi
echo ""

# File 3: Dashboard EJS
echo "📤 [3/5] Uploading dashboard.ejs..."
scp src/views/auth/dashboard.ejs $SERVER:$REMOTE_PATH/src/views/auth/dashboard.ejs
if [ $? -eq 0 ]; then
    echo "✅ dashboard.ejs uploaded successfully"
else
    echo "❌ Failed to upload dashboard.ejs"
    exit 1
fi
echo ""

# File 4: Public Gallery
echo "📤 [4/5] Uploading public-gallery.js..."
scp public/js/public-gallery.js $SERVER:$REMOTE_PATH/public/js/public-gallery.js
if [ $? -eq 0 ]; then
    echo "✅ public-gallery.js uploaded successfully"
else
    echo "❌ Failed to upload public-gallery.js"
    exit 1
fi
echo ""

# File 5: Usage Statistics
echo "📤 [5/5] Uploading usage.ejs..."
scp src/views/auth/usage.ejs $SERVER:$REMOTE_PATH/src/views/auth/usage.ejs
if [ $? -eq 0 ]; then
    echo "✅ usage.ejs uploaded successfully"
else
    echo "❌ Failed to upload usage.ejs"
    exit 1
fi
echo ""

# Upload documentation
echo "📤 [BONUS] Uploading documentation..."
scp MODEL_NAME_CLEANUP_FIX.md $SERVER:$REMOTE_PATH/MODEL_NAME_CLEANUP_FIX.md
if [ $? -eq 0 ]; then
    echo "✅ Documentation uploaded successfully"
fi
echo ""

echo "================================================"
echo "✅ All files uploaded successfully!"
echo ""
echo "🔄 Next steps:"
echo "   1. SSH to server: ssh $SERVER"
echo "   2. Restart PM2: pm2 restart pixelnest"
echo "   3. Test the changes on production"
echo ""
echo "🎉 Model names will now display clean (e.g., 'Gpt Image' instead of 'fal.id/gpt-image')"

