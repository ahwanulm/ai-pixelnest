#!/bin/bash

#########################################
# PixelNest Deployment ZIP Creator
# Creates pixelnest.zip with all files needed for deployment
# Optimized: Excludes user-generated content for smaller deployments
#########################################

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

log_header() {
    echo -e "\n${GREEN}$1${NC}\n"
}

# Main script
log_header "🚀 PixelNest Deployment ZIP Creator (Optimized)"

# Variables
PROJECT_DIR=$(pwd)
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
ZIP_NAME="pixelnest-deployment-${TIMESTAMP}.zip"
TEMP_DIR="${PROJECT_DIR}/.deployment-temp"
PIXELNEST_DIR="${TEMP_DIR}/pixelnest"

log_info "Project directory: ${PROJECT_DIR}"
log_info "ZIP name: ${ZIP_NAME}"
log_info "Creating structure in: ${PIXELNEST_DIR}"

# Clean up old temp directory
if [ -d "${TEMP_DIR}" ]; then
    log_info "Cleaning up old temp directory..."
    rm -rf "${TEMP_DIR}"
fi

# Create pixelnest directory structure
log_info "Creating pixelnest directory..."
mkdir -p "${PIXELNEST_DIR}"

# Copy files and directories
log_header "📋 Copying files to pixelnest directory..."

# Copy essential directories
log_info "Copying src/ directory..."
cp -r src "${PIXELNEST_DIR}/"

# Copy migrations if exists
if [ -d "migrations" ]; then
    log_info "Copying migrations/ directory..."
    cp -r migrations "${PIXELNEST_DIR}/"
fi

# Copy scripts if exists
if [ -d "scripts" ]; then
    log_info "Copying scripts/ directory..."
    cp -r scripts "${PIXELNEST_DIR}/"
fi

# Copy examples if exists
if [ -d "examples" ]; then
    log_info "Copying examples/ directory..."
    cp -r examples "${PIXELNEST_DIR}/"
fi

# Copy public directory (excluding user-generated content)
log_info "Copying public/ directory (excluding user content)..."
mkdir -p "${PIXELNEST_DIR}/public"

# Copy static assets only
if [ -d "public/css" ]; then
    cp -r public/css "${PIXELNEST_DIR}/public/"
    log_success "  ✓ public/css/"
fi

if [ -d "public/js" ]; then
    cp -r public/js "${PIXELNEST_DIR}/public/"
    log_success "  ✓ public/js/"
fi

if [ -d "public/assets" ]; then
    cp -r public/assets "${PIXELNEST_DIR}/public/"
    log_success "  ✓ public/assets/"
fi

# Create empty directories for user-generated content (will be populated on server)
log_info "Creating empty directories for user content..."
mkdir -p "${PIXELNEST_DIR}/public/images"
mkdir -p "${PIXELNEST_DIR}/public/videos"
mkdir -p "${PIXELNEST_DIR}/public/audio"
mkdir -p "${PIXELNEST_DIR}/public/uploads"
mkdir -p "${PIXELNEST_DIR}/public/uploads/temp"
mkdir -p "${PIXELNEST_DIR}/public/uploads/users"

# Create .gitkeep files to preserve directory structure
touch "${PIXELNEST_DIR}/public/images/.gitkeep"
touch "${PIXELNEST_DIR}/public/videos/.gitkeep"
touch "${PIXELNEST_DIR}/public/audio/.gitkeep"
touch "${PIXELNEST_DIR}/public/uploads/.gitkeep"
log_success "  ✓ Empty directories created with .gitkeep files"

# Copy root files
log_header "📦 Copying essential root files..."
cp package.json "${PIXELNEST_DIR}/" 2>/dev/null && log_success "  ✓ package.json" || log_warning "  ⚠ package.json not found"
cp package-lock.json "${PIXELNEST_DIR}/" 2>/dev/null && log_success "  ✓ package-lock.json" || log_warning "  ⚠ package-lock.json not found"
cp server.js "${PIXELNEST_DIR}/" 2>/dev/null && log_success "  ✓ server.js" || log_warning "  ⚠ server.js not found"
cp worker.js "${PIXELNEST_DIR}/" 2>/dev/null && log_success "  ✓ worker.js" || log_warning "  ⚠ worker.js not found"
cp postcss.config.js "${PIXELNEST_DIR}/" 2>/dev/null && log_success "  ✓ postcss.config.js" || true
cp tailwind.config.js "${PIXELNEST_DIR}/" 2>/dev/null && log_success "  ✓ tailwind.config.js" || true
cp ecosystem.config.js "${PIXELNEST_DIR}/" 2>/dev/null && log_success "  ✓ ecosystem.config.js" || true
cp restart-worker.sh "${PIXELNEST_DIR}/" 2>/dev/null && log_success "  ✓ restart-worker.sh" || true

# Create .env.example from .env if it exists
if [ -f ".env" ]; then
    log_info "Creating .env.example from .env (masking sensitive values)..."
    sed 's/=.*/=<your_value>/g' .env > "${PIXELNEST_DIR}/.env.example"
    log_success "  ✓ .env.example created"
elif [ -f ".env.example" ]; then
    cp .env.example "${PIXELNEST_DIR}/"
    log_success "  ✓ .env.example copied"
else
    log_warning "  ⚠ No .env or .env.example found"
fi

# Copy deployment scripts
log_header "🔧 Copying deployment scripts..."
cp deploy-pixelnest.sh "${PIXELNEST_DIR}/" 2>/dev/null && log_success "  ✓ deploy-pixelnest.sh" || true
cp post-deploy.sh "${PIXELNEST_DIR}/" 2>/dev/null && log_success "  ✓ post-deploy.sh" || true
cp restart-worker.sh "${PIXELNEST_DIR}/" 2>/dev/null && log_success "  ✓ restart-worker.sh" || true

# Copy database-related files
log_info "Copying database utility files..."
cp sync-tripay-channels.js "${PIXELNEST_DIR}/" 2>/dev/null && log_success "  ✓ sync-tripay-channels.js" || true
cp update-database-consistency.js "${PIXELNEST_DIR}/" 2>/dev/null && log_success "  ✓ update-database-consistency.js" || true
cp run-migration-fix.js "${PIXELNEST_DIR}/" 2>/dev/null && log_success "  ✓ run-migration-fix.js" || true

# Copy SQL files (for reference)
log_info "Copying SQL reference files..."
SQL_COUNT=0
for sql_file in *.sql; do
    if [ -f "$sql_file" ]; then
        cp "$sql_file" "${PIXELNEST_DIR}/"
        SQL_COUNT=$((SQL_COUNT + 1))
    fi
done
if [ $SQL_COUNT -gt 0 ]; then
    log_success "  ✓ ${SQL_COUNT} SQL files copied"
fi

# Skip copying .md files (documentation not needed on server)
# DEPLOYMENT_README.md will be auto-generated below

# Create DEPLOYMENT_README.md
log_info "Creating DEPLOYMENT_README.md..."
cat > "${PIXELNEST_DIR}/DEPLOYMENT_README.md" << 'EOF'
# 🚀 PixelNest Deployment Guide

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 12+
- pm2 (recommended for process management)

## Quick Start Deployment

### 1. Install Dependencies
```bash
npm install --production
```

### 2. Setup Environment
```bash
cp .env.example .env
# Edit .env with your server configuration:
# - Database credentials
# - API keys (Fal.ai, Suno, etc.)
# - Email settings (SendGrid/SMTP)
# - Tripay payment credentials
nano .env  # or use your preferred editor
```

### 3. Database Setup
```bash
# Create PostgreSQL database
createdb pixelnest_db

# Run all migrations and setup
npm run setup-db

# Populate AI models
npm run populate-models

# Verify database setup
npm run verify-db
```

### 4. Build CSS
```bash
npm run build:css
```

### 5. Start Application

#### Option A: Using PM2 (Recommended for Production)
```bash
# Install pm2 globally if not already installed
npm install -g pm2

# Start both server and worker
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs

# Save PM2 process list for auto-restart
pm2 save
pm2 startup
```

#### Option B: Manual Start (Development/Testing)
```bash
# Terminal 1: Start server
npm start

# Terminal 2: Start worker
npm run worker
```

## Important Configuration

### Environment Variables (.env)
Key variables that MUST be configured:
- `DATABASE_URL` - PostgreSQL connection string
- `FAL_KEY` - Fal.ai API key for AI models
- `SUNO_BASE_URL` - Suno API endpoint
- `TRIPAY_API_KEY`, `TRIPAY_PRIVATE_KEY` - Payment gateway
- `SENDGRID_API_KEY` or SMTP settings - Email functionality
- `SESSION_SECRET` - Unique session secret

### Port Configuration
Default ports:
- Server: 3000
- Worker: Runs alongside server

Change in `.env`:
```
PORT=3000
```

## Post-Deployment Checklist

- [ ] Database is created and accessible
- [ ] All environment variables are set in `.env`
- [ ] `npm install` completed successfully
- [ ] Database migrations ran successfully (`npm run setup-db`)
- [ ] AI models populated (`npm run populate-models`)
- [ ] CSS built (`npm run build:css`)
- [ ] Both server and worker processes are running
- [ ] Payment channels synced (`node sync-tripay-channels.js`)
- [ ] Admin account created (register and promote to admin in database)
- [ ] Email sending tested (activation emails)

## File Structure

```
pixelnest/
├── src/              # Application source code
│   ├── controllers/  # Route controllers
│   ├── models/       # Database models
│   ├── routes/       # Express routes
│   ├── services/     # Business logic (Fal.ai, Suno, etc.)
│   ├── middleware/   # Custom middleware
│   └── views/        # EJS templates
├── public/           # Static assets
│   ├── css/          # Compiled CSS
│   ├── js/           # Client-side JavaScript
│   ├── assets/       # Images, icons, etc.
│   ├── videos/       # User-generated videos (empty on deployment)
│   ├── images/       # User-generated images (empty on deployment)
│   └── audio/        # User-generated audio (empty on deployment)
├── migrations/       # Database migrations
├── scripts/          # Utility scripts
├── server.js         # Main Express server
├── worker.js         # Background job processor
└── ecosystem.config.js  # PM2 configuration
```

## Maintenance Commands

### Database
```bash
# Check database connection
npm run verify-db

# Sync payment channels
node sync-tripay-channels.js

# Update database consistency
node update-database-consistency.js
```

### Application
```bash
# Restart with PM2
pm2 restart all

# Restart worker only
bash restart-worker.sh

# View logs
pm2 logs

# Monitor processes
pm2 monit
```

## Troubleshooting

### Database Connection Issues
- Check PostgreSQL is running: `systemctl status postgresql`
- Verify credentials in `.env`
- Test connection: `psql -U username -d pixelnest_db`

### Worker Not Processing Jobs
- Check if worker process is running: `pm2 status`
- View worker logs: `pm2 logs worker`
- Restart worker: `pm2 restart worker`

### CSS Not Loading
- Rebuild CSS: `npm run build:css`
- Check if `public/css/output.css` exists
- Verify Tailwind configuration

### Payment Issues
- Sync Tripay channels: `node sync-tripay-channels.js`
- Check Tripay credentials in `.env`
- Verify webhook URL is accessible

### Email Not Sending
- Check SendGrid API key or SMTP settings in `.env`
- Test email configuration in admin panel
- Check logs for email errors

## Security Notes

- Change `SESSION_SECRET` to a random string
- Use strong database passwords
- Keep API keys secure and never commit to version control
- Enable firewall and restrict database access
- Use HTTPS in production (setup reverse proxy with nginx/apache)
- Regularly update dependencies: `npm audit fix`

## Performance Tips

- Use PM2 cluster mode for better CPU utilization
- Setup nginx as reverse proxy
- Enable PostgreSQL connection pooling (already configured)
- Monitor with PM2: `pm2 monit`
- Setup log rotation for PM2 logs

## Support

For detailed guides, check:
- `DEPLOYMENT_GUIDE.md` - Comprehensive deployment instructions
- `DEPLOYMENT_CHECKLIST.md` - Pre-deployment checklist
- Main documentation in project repository

---

**Deployment Package Created:** $(date)
**Ready for production deployment!**
EOF
log_success "  ✓ DEPLOYMENT_README.md created"

# Create .gitignore for deployment
cat > "${PIXELNEST_DIR}/.gitignore" << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment
.env
.env.local

# Logs
*.log
logs/
server.log

# OS
.DS_Store
Thumbs.db

# Editor
.vscode/
.idea/
*.swp
*.swo

# Temporary
temp/

# Build
public/css/output.css

# Database backups
*.sql.backup
EOF

# Make scripts executable
log_info "Making scripts executable..."
chmod +x "${PIXELNEST_DIR}"/*.sh 2>/dev/null || true

# Count files
log_header "📊 Deployment Package Summary"
TOTAL_FILES=$(find "${PIXELNEST_DIR}" -type f | wc -l | tr -d ' ')
TOTAL_DIRS=$(find "${PIXELNEST_DIR}" -type d | wc -l | tr -d ' ')
TOTAL_SIZE=$(du -sh "${PIXELNEST_DIR}" | cut -f1)

log_success "Total files: ${TOTAL_FILES}"
log_success "Total directories: ${TOTAL_DIRS}"
log_success "Package size: ${TOTAL_SIZE}"

# Show what was excluded
log_header "🚫 Excluded from deployment:"
echo "  • node_modules/ (install on server)"
echo "  • .env (create on server)"
echo "  • Documentation files (*.md)"
echo "  • User-generated content:"
echo "    - public/images/* (existing user images)"
echo "    - public/videos/* (existing user videos)"
echo "    - public/audio/* (existing user audio)"
echo "    - public/uploads/* (existing uploads)"
echo "  • Log files"
echo ""

# Create ZIP
log_header "📦 Creating ZIP file..."
cd "${TEMP_DIR}"

if command -v zip &> /dev/null; then
    # Use zip command
    log_info "Using zip command..."
    zip -r "${ZIP_NAME}" pixelnest/ -q
    log_success "ZIP created successfully"
else
    # Fallback to tar
    log_warning "zip command not found, using tar.gz instead..."
    ZIP_NAME="${ZIP_NAME%.zip}.tar.gz"
    tar -czf "${ZIP_NAME}" pixelnest/
    log_success "Archive created using tar"
fi

# Move ZIP to project root
mv "${ZIP_NAME}" "${PROJECT_DIR}/"
cd "${PROJECT_DIR}"

# Clean up temp directory
log_info "Cleaning up temporary files..."
rm -rf "${TEMP_DIR}"

# Final summary
log_header "🎉 Deployment Package Created Successfully!"
ZIP_SIZE=$(du -sh "${ZIP_NAME}" | cut -f1)
log_success "File: ${ZIP_NAME}"
log_success "Size: ${ZIP_SIZE}"
log_success "Location: ${PROJECT_DIR}/${ZIP_NAME}"

# Show what's inside
log_header "📋 Package Contents Preview:"
if command -v unzip &> /dev/null && [[ "${ZIP_NAME}" == *.zip ]]; then
    unzip -l "${ZIP_NAME}" | head -25
elif command -v tar &> /dev/null && [[ "${ZIP_NAME}" == *.tar.gz ]]; then
    tar -tzf "${ZIP_NAME}" | head -25
fi

echo ""
log_header "📝 Next Steps:"
echo ""
echo "1. Upload to server:"
echo "   scp ${ZIP_NAME} user@yourserver.com:/var/www/"
echo ""
echo "2. On server, extract:"
if [[ "${ZIP_NAME}" == *.zip ]]; then
    echo "   unzip ${ZIP_NAME}"
else
    echo "   tar -xzf ${ZIP_NAME}"
fi
echo ""
echo "3. Navigate to directory:"
echo "   cd pixelnest"
echo ""
echo "4. Follow DEPLOYMENT_README.md for complete setup"
echo ""
log_success "Ready for deployment! 🚀"
echo ""

