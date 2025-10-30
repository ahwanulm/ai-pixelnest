#!/bin/bash

#########################################
# PixelNest Deployment ZIP Creator (Shell Wrapper)
# This is a wrapper that calls create-zip.sh
# Created for backward compatibility
#########################################

echo "🔄 Running deployment ZIP creator..."
echo ""

# Check if create-zip.sh exists
if [ -f "create-zip.sh" ]; then
    bash create-zip.sh
else
    echo "❌ Error: create-zip.sh not found"
    exit 1
fi
