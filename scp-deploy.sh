#!/bin/bash

# ============================================================================
# SCP Deploy Script - Upload Files to Server
# ============================================================================

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║            SCP Deploy - Upload to Server                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Server configuration
SERVER_USER="root"
SERVER_HOST="test-pixelnest"
SERVER_PATH="/var/www/pixelnest"

echo -e "${YELLOW}Server Info:${NC}"
echo "  User: $SERVER_USER"
echo "  Host: $SERVER_HOST"
echo "  Path: $SERVER_PATH"
echo ""

# Files to upload
echo -e "${YELLOW}Files to upload:${NC}"
echo ""

# 1. Migration files
echo -e "${GREEN}[1/6] Uploading migration files...${NC}"
scp migrations/fix_payment_channels_structure_complete.sql \
    ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/migrations/

echo -e "${GREEN}[2/6] Uploading verification script...${NC}"
scp verify-payment-channels-structure.sql \
    ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/

# 2. Deployment scripts
echo -e "${GREEN}[3/6] Uploading deployment scripts...${NC}"
scp deploy-and-verify.sh \
    fix-payment-channels-complete.sh \
    ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/

# 3. Database config files
echo -e "${GREEN}[4/6] Uploading database config files...${NC}"
scp src/config/setupDatabase.js \
    ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/src/config/

scp src/config/migrateTripayPayment.js \
    ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/src/config/

# 4. Service files (optimized)
echo -e "${GREEN}[5/6] Uploading optimized service files...${NC}"
scp src/services/emailService.js \
    ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/src/services/

# 5. Controller files
echo -e "${GREEN}[6/6] Uploading controller files...${NC}"
scp src/controllers/authController.js \
    ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/src/controllers/

echo ""
echo -e "${GREEN}✅ All files uploaded successfully!${NC}"
echo ""
echo -e "${YELLOW}Next steps on server:${NC}"
echo ""
echo "1. SSH to server:"
echo -e "   ${BLUE}ssh ${SERVER_USER}@${SERVER_HOST}${NC}"
echo ""
echo "2. Run deployment:"
echo -e "   ${BLUE}cd ${SERVER_PATH}${NC}"
echo -e "   ${BLUE}bash deploy-and-verify.sh${NC}"
echo ""
echo "3. Restart PM2:"
echo -e "   ${BLUE}pm2 restart pixelnest-server${NC}"
echo ""
echo "4. Monitor logs:"
echo -e "   ${BLUE}pm2 logs pixelnest-server${NC}"
echo ""

