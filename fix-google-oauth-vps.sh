#!/bin/bash

# 🔧 Script untuk deploy fix Google OAuth ke VPS
# Fix: "Unknown authentication strategy 'google'" error

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🔧 Fix Google OAuth Strategy Error - VPS Deploy      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Cek apakah file passport.js ada
if [ ! -f "src/config/passport.js" ]; then
  echo -e "${RED}❌ Error: File src/config/passport.js tidak ditemukan${NC}"
  echo "   Pastikan Anda menjalankan script ini dari root project"
  exit 1
fi

# Cek apakah sudah ada fix di file
if grep -q "Register strategy SYNCHRONOUSLY" src/config/passport.js; then
  echo -e "${GREEN}✅ File passport.js sudah memiliki fix terbaru${NC}"
else
  echo -e "${RED}❌ File passport.js belum memiliki fix${NC}"
  echo "   Jalankan perbaikan lokal terlebih dahulu"
  exit 1
fi

# Minta input VPS details
echo -e "${YELLOW}📋 Masukkan detail VPS:${NC}"
echo ""

read -p "VPS IP/Domain (default: 158.69.214.93): " VPS_HOST
VPS_HOST=${VPS_HOST:-158.69.214.93}

read -p "VPS User (default: root): " VPS_USER
VPS_USER=${VPS_USER:-root}

read -p "VPS Path (default: /var/www/pixelnest): " VPS_PATH
VPS_PATH=${VPS_PATH:-/var/www/pixelnest}

read -p "PM2 Process Name (default: pixelnest-server): " PM2_NAME
PM2_NAME=${PM2_NAME:-pixelnest-server}

echo ""
echo -e "${BLUE}📤 Deploying ke:${NC}"
echo "   Host: $VPS_USER@$VPS_HOST"
echo "   Path: $VPS_PATH"
echo "   PM2 : $PM2_NAME"
echo ""

read -p "Lanjutkan? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}⚠️  Deploy dibatalkan${NC}"
  exit 0
fi

echo ""
echo -e "${BLUE}📤 Step 1: Upload file passport.js...${NC}"

if scp src/config/passport.js $VPS_USER@$VPS_HOST:$VPS_PATH/src/config/; then
  echo -e "${GREEN}✅ File berhasil diupload${NC}"
else
  echo -e "${RED}❌ Gagal upload file${NC}"
  exit 1
fi

echo ""
echo -e "${BLUE}🔍 Step 2: Cek environment variables di VPS...${NC}"

ssh $VPS_USER@$VPS_HOST "bash -s" << ENDSSH
cd $VPS_PATH

echo "Checking .env file..."

if [ ! -f .env ]; then
  echo "⚠️  File .env tidak ditemukan!"
  exit 1
fi

# Cek apakah Google OAuth sudah dikonfigurasi
if grep -q "GOOGLE_CLIENT_ID" .env && grep -q "GOOGLE_CLIENT_SECRET" .env; then
  echo "✅ Google OAuth credentials ditemukan di .env"
  
  # Tampilkan (sebagian) untuk verifikasi
  echo ""
  echo "Current config:"
  grep "GOOGLE_CLIENT_ID" .env | head -c 50
  echo "..."
  grep "GOOGLE_CLIENT_SECRET" .env | head -c 50
  echo "..."
else
  echo "⚠️  Google OAuth belum dikonfigurasi di .env"
  echo ""
  echo "Tambahkan konfigurasi ini ke .env:"
  echo ""
  echo "GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com"
  echo "GOOGLE_CLIENT_SECRET=your-client-secret"
  echo "GOOGLE_CALLBACK_URL=https://yourdomain.com/auth/google/callback"
  echo ""
  echo "Dapatkan credentials dari:"
  echo "https://console.cloud.google.com/apis/credentials"
fi
ENDSSH

echo ""
echo -e "${BLUE}🔄 Step 3: Restart PM2 process...${NC}"

if ssh $VPS_USER@$VPS_HOST "cd $VPS_PATH && pm2 restart $PM2_NAME"; then
  echo -e "${GREEN}✅ PM2 process berhasil direstart${NC}"
else
  echo -e "${RED}❌ Gagal restart PM2 process${NC}"
  echo "   Coba manual: ssh $VPS_USER@$VPS_HOST 'pm2 restart $PM2_NAME'"
  exit 1
fi

echo ""
echo -e "${BLUE}📋 Step 4: Cek logs untuk verifikasi...${NC}"
echo ""

ssh $VPS_USER@$VPS_HOST "pm2 logs $PM2_NAME --nostream --lines 30" | grep -A5 -B5 "Google\|strategy\|passport" || true

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           ✅ Deploy Fix Selesai!                       ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}📝 Langkah Selanjutnya:${NC}"
echo ""
echo "1. Pastikan tidak ada error di logs:"
echo "   ssh $VPS_USER@$VPS_HOST 'pm2 logs $PM2_NAME'"
echo ""
echo "2. Cek apakah ada warning tentang Google OAuth:"
echo "   - Jika ada warning: Set GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET di .env"
echo "   - Jika tidak: Google OAuth sudah siap digunakan"
echo ""
echo "3. Test Google login di browser:"
echo "   https://yourdomain.com/auth/google"
echo ""
echo "4. Jika perlu update .env, restart lagi:"
echo "   ssh $VPS_USER@$VPS_HOST 'cd $VPS_PATH && pm2 restart $PM2_NAME'"
echo ""
echo -e "${GREEN}✨ Error 'Unknown authentication strategy' seharusnya sudah hilang!${NC}"
echo ""

echo -e "${BLUE}📚 Dokumentasi lengkap: FIX_GOOGLE_OAUTH_VPS.md${NC}"

