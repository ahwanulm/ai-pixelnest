#!/bin/bash

# Upload Backend Model Name Cleanup Fix
# Date: 2025-10-29

SERVER="root@188.166.188.91"
PASSWORD="andr0Hardcore"
REMOTE_PATH="/var/www/pixelnest"

echo "🚀 Uploading Backend Model Name Cleanup Fix..."
echo "=============================================="
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

# Upload falAiService.js
echo "📤 Uploading falAiService.js (Backend Model Name Cleanup)..."
sshpass -p "$PASSWORD" scp -o StrictHostKeyChecking=no src/services/falAiService.js $SERVER:$REMOTE_PATH/src/services/falAiService.js
if [ $? -eq 0 ]; then
    echo "✅ falAiService.js uploaded successfully"
else
    echo "❌ Failed to upload falAiService.js"
    exit 1
fi
echo ""

# Restart PM2
echo "🔄 Restarting PM2 on server..."
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER "cd $REMOTE_PATH && pm2 restart pixelnest"
if [ $? -eq 0 ]; then
    echo "✅ PM2 restarted successfully"
fi
echo ""

echo "=============================================="
echo "✅ Backend fix uploaded and server restarted!"
echo ""
echo "🎉 Now error messages will show:"
echo "   ❌ 'Invalid parameters for model Gpt Image 1'"
echo "   ✅ Instead of 'Invalid parameters for model fal-ai/gpt-image-1/text-to-image/byok'"
echo ""
echo "🌐 Test on production: https://ai.pixelnest.pro/dashboard"

