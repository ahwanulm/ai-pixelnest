#!/bin/bash

# Upload Model Name Cleanup Fix to Server (with sshpass)
# Date: 2025-10-29

SERVER="root@188.166.188.91"
PASSWORD="andr0Hardcore"
REMOTE_PATH="/var/www/pixelnest"

echo "🚀 Uploading Model Name Cleanup Fix to Server..."
echo "================================================"
echo ""

# Check if sshpass is installed
if ! command -v sshpass &> /dev/null; then
    echo "⚠️  sshpass not installed. Installing..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install hudochenkov/sshpass/sshpass
        else
            echo "❌ Please install Homebrew first: https://brew.sh"
            exit 1
        fi
    else
        # Linux
        sudo apt-get install -y sshpass
    fi
fi

# File 1: Dashboard Generation
echo "📤 [1/5] Uploading dashboard-generation.js..."
sshpass -p "$PASSWORD" scp -o StrictHostKeyChecking=no public/js/dashboard-generation.js $SERVER:$REMOTE_PATH/public/js/dashboard-generation.js
if [ $? -eq 0 ]; then
    echo "✅ dashboard-generation.js uploaded successfully"
else
    echo "❌ Failed to upload dashboard-generation.js"
    exit 1
fi
echo ""

# File 2: Generation Detail Modal
echo "📤 [2/5] Uploading generation-detail-modal.js..."
sshpass -p "$PASSWORD" scp -o StrictHostKeyChecking=no public/js/generation-detail-modal.js $SERVER:$REMOTE_PATH/public/js/generation-detail-modal.js
if [ $? -eq 0 ]; then
    echo "✅ generation-detail-modal.js uploaded successfully"
else
    echo "❌ Failed to upload generation-detail-modal.js"
    exit 1
fi
echo ""

# File 3: Dashboard EJS
echo "📤 [3/5] Uploading dashboard.ejs..."
sshpass -p "$PASSWORD" scp -o StrictHostKeyChecking=no src/views/auth/dashboard.ejs $SERVER:$REMOTE_PATH/src/views/auth/dashboard.ejs
if [ $? -eq 0 ]; then
    echo "✅ dashboard.ejs uploaded successfully"
else
    echo "❌ Failed to upload dashboard.ejs"
    exit 1
fi
echo ""

# File 4: Public Gallery
echo "📤 [4/5] Uploading public-gallery.js..."
sshpass -p "$PASSWORD" scp -o StrictHostKeyChecking=no public/js/public-gallery.js $SERVER:$REMOTE_PATH/public/js/public-gallery.js
if [ $? -eq 0 ]; then
    echo "✅ public-gallery.js uploaded successfully"
else
    echo "❌ Failed to upload public-gallery.js"
    exit 1
fi
echo ""

# File 5: Usage Statistics
echo "📤 [5/5] Uploading usage.ejs..."
sshpass -p "$PASSWORD" scp -o StrictHostKeyChecking=no src/views/auth/usage.ejs $SERVER:$REMOTE_PATH/src/views/auth/usage.ejs
if [ $? -eq 0 ]; then
    echo "✅ usage.ejs uploaded successfully"
else
    echo "❌ Failed to upload usage.ejs"
    exit 1
fi
echo ""

# Upload documentation
echo "📤 [BONUS] Uploading documentation..."
sshpass -p "$PASSWORD" scp -o StrictHostKeyChecking=no MODEL_NAME_CLEANUP_FIX.md $SERVER:$REMOTE_PATH/MODEL_NAME_CLEANUP_FIX.md
if [ $? -eq 0 ]; then
    echo "✅ Documentation uploaded successfully"
fi
echo ""

# Restart PM2
echo "🔄 Restarting PM2 on server..."
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER "cd $REMOTE_PATH && pm2 restart pixelnest"
if [ $? -eq 0 ]; then
    echo "✅ PM2 restarted successfully"
fi
echo ""

echo "================================================"
echo "✅ All files uploaded and server restarted!"
echo ""
echo "🎉 Model names will now display clean on production:"
echo "   ✨ 'Gpt Image' instead of 'fal.id/gpt-image'"
echo "   ✨ 'Flux Pro' instead of 'fal.ai/flux-pro'"
echo "   ✨ 'Sora Turbo' instead of 'fal.id/sora-turbo'"
echo ""
echo "🌐 Test your changes at: https://your-domain.com"

