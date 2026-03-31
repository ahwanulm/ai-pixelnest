#!/bin/bash

# Upload ALL Model Name Cleanup Fixes (Backend + Frontend)
# Date: 2025-10-29

SERVER="root@188.166.188.91"
PASSWORD="andr0Hardcore"
REMOTE_PATH="/var/www/pixelnest"

echo "🚀 Uploading ALL Model Name Cleanup Fixes..."
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

# ============================================
# BACKEND FILES
# ============================================

echo "📦 BACKEND FILES"
echo "----------------"

# File 1: Backend Service
echo "📤 [1/7] Uploading falAiService.js (Backend Model Cleanup)..."
sshpass -p "$PASSWORD" scp -o StrictHostKeyChecking=no src/services/falAiService.js $SERVER:$REMOTE_PATH/src/services/falAiService.js
if [ $? -eq 0 ]; then
    echo "✅ falAiService.js uploaded successfully"
else
    echo "❌ Failed to upload falAiService.js"
    exit 1
fi
echo ""

# ============================================
# FRONTEND FILES
# ============================================

echo "📦 FRONTEND FILES"
echo "-----------------"

# File 2: Dashboard Generation
echo "📤 [2/7] Uploading dashboard-generation.js..."
sshpass -p "$PASSWORD" scp -o StrictHostKeyChecking=no public/js/dashboard-generation.js $SERVER:$REMOTE_PATH/public/js/dashboard-generation.js
if [ $? -eq 0 ]; then
    echo "✅ dashboard-generation.js uploaded successfully"
else
    echo "❌ Failed to upload dashboard-generation.js"
    exit 1
fi
echo ""

# File 3: Generation Detail Modal
echo "📤 [3/7] Uploading generation-detail-modal.js..."
sshpass -p "$PASSWORD" scp -o StrictHostKeyChecking=no public/js/generation-detail-modal.js $SERVER:$REMOTE_PATH/public/js/generation-detail-modal.js
if [ $? -eq 0 ]; then
    echo "✅ generation-detail-modal.js uploaded successfully"
else
    echo "❌ Failed to upload generation-detail-modal.js"
    exit 1
fi
echo ""

# File 4: Dashboard EJS
echo "📤 [4/7] Uploading dashboard.ejs..."
sshpass -p "$PASSWORD" scp -o StrictHostKeyChecking=no src/views/auth/dashboard.ejs $SERVER:$REMOTE_PATH/src/views/auth/dashboard.ejs
if [ $? -eq 0 ]; then
    echo "✅ dashboard.ejs uploaded successfully"
else
    echo "❌ Failed to upload dashboard.ejs"
    exit 1
fi
echo ""

# File 5: Public Gallery
echo "📤 [5/7] Uploading public-gallery.js..."
sshpass -p "$PASSWORD" scp -o StrictHostKeyChecking=no public/js/public-gallery.js $SERVER:$REMOTE_PATH/public/js/public-gallery.js
if [ $? -eq 0 ]; then
    echo "✅ public-gallery.js uploaded successfully"
else
    echo "❌ Failed to upload public-gallery.js"
    exit 1
fi
echo ""

# File 6: Usage Statistics
echo "📤 [6/7] Uploading usage.ejs..."
sshpass -p "$PASSWORD" scp -o StrictHostKeyChecking=no src/views/auth/usage.ejs $SERVER:$REMOTE_PATH/src/views/auth/usage.ejs
if [ $? -eq 0 ]; then
    echo "✅ usage.ejs uploaded successfully"
else
    echo "❌ Failed to upload usage.ejs"
    exit 1
fi
echo ""

# File 7: Documentation
echo "📤 [7/7] Uploading documentation..."
sshpass -p "$PASSWORD" scp -o StrictHostKeyChecking=no MODEL_NAME_CLEANUP_FIX.md $SERVER:$REMOTE_PATH/MODEL_NAME_CLEANUP_FIX.md
if [ $? -eq 0 ]; then
    echo "✅ Documentation uploaded successfully"
fi
echo ""

# ============================================
# RESTART SERVER
# ============================================

echo "🔄 Restarting PM2 on server..."
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER "cd $REMOTE_PATH && pm2 restart pixelnest"
if [ $? -eq 0 ]; then
    echo "✅ PM2 restarted successfully"
fi
echo ""

echo "=============================================="
echo "✅ ALL FILES UPLOADED & SERVER RESTARTED!"
echo ""
echo "🎉 Model names will now display clean everywhere:"
echo ""
echo "   📱 Mobile View:"
echo "      ✨ 'Gpt Image 1' (not 'fal-ai/gpt-image-1/text-to-image/byok')"
echo ""
echo "   💻 Desktop View:"
echo "      ✨ Result cards"
echo "      ✨ Detail modals"
echo "      ✨ Fullscreen viewer"
echo "      ✨ Public gallery"
echo "      ✨ Usage statistics"
echo ""
echo "   ❌ Error Messages:"
echo "      ✨ 'Invalid parameters for model Gpt Image 1'"
echo "      ✨ (not 'Invalid parameters for model fal-ai/gpt-image-1/text-to-image/byok')"
echo ""
echo "🌐 Test on production: https://ai.pixelnest.pro/dashboard"

