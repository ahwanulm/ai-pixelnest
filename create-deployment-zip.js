#!/usr/bin/env node

/**
 * PixelNest Deployment ZIP Creator (Node.js Version)
 * Cross-platform deployment zip creator - Optimized to exclude user-generated content
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Helper functions
function countFiles(dir) {
  let count = 0;
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isFile()) {
      count++;
    } else if (item.isDirectory()) {
      count += countFiles(fullPath);
    }
  }
  return count;
}

function countDirs(dir) {
  let count = 0;
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      count++;
      count += countDirs(fullPath);
    }
  }
  return count;
}

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  header: (msg) => console.log(`${colors.bright}${msg}${colors.reset}`),
};

function main() {
  log.header('\n🚀 Starting PixelNest Deployment ZIP Creation (Node.js)\n');

  const projectDir = process.cwd();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const zipName = `pixelnest-deployment-${timestamp}.zip`;
  const tempDir = path.join(projectDir, '.deployment-temp');
  const pixelnestDir = path.join(tempDir, 'pixelnest');

  try {
    // Create temp directory
    log.info(`Project directory: ${projectDir}`);
    log.info(`ZIP name: ${zipName}`);
    log.info(`Temp directory: ${tempDir}\n`);

    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    fs.mkdirSync(pixelnestDir, { recursive: true });

    log.info('📋 Copying files to pixelnest directory...\n');

    // Copy essential files
    const essentialFiles = [
      'package.json',
      'package-lock.json',
      'server.js',
      'worker.js',
      'postcss.config.js',
      'tailwind.config.js',
      'ecosystem.config.js',
      'restart-worker.sh',
      'run-migration-fix.js',
    ];

    essentialFiles.forEach(file => {
      if (fs.existsSync(file)) {
        fs.copyFileSync(file, path.join(pixelnestDir, file));
        log.success(`Essential files: ${file}`);
      }
    });

    // Copy directories
    const dirs = ['src', 'migrations', 'scripts', 'examples'];
    dirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        const dest = path.join(pixelnestDir, dir);
        fs.cpSync(dir, dest, { recursive: true });
        log.success(`Directories: ${dir}/`);
      }
    });

    // Copy public directory selectively (exclude user-generated content)
    if (fs.existsSync('public')) {
      const publicDest = path.join(pixelnestDir, 'public');
      fs.mkdirSync(publicDest, { recursive: true });
      
      // Copy only essential static assets
      const publicAssets = ['css', 'js', 'assets'];
      publicAssets.forEach(asset => {
        const srcPath = path.join('public', asset);
        const destPath = path.join(publicDest, asset);
        if (fs.existsSync(srcPath)) {
          fs.cpSync(srcPath, destPath, { recursive: true });
          log.success(`Public assets: ${asset}/`);
        }
      });
      
      // Create empty directories for user-generated content (will be created on server)
      ['videos', 'images', 'uploads', 'audio'].forEach(dir => {
        fs.mkdirSync(path.join(publicDest, dir), { recursive: true });
      });
      
      log.success('Public directory: created (excluding user-generated content)');
    }

    // Copy SQL files
    const sqlFiles = fs.readdirSync(projectDir)
      .filter(f => f.endsWith('.sql'))
      .filter(f => fs.statSync(f).isFile());
    
    if (sqlFiles.length > 0) {
      sqlFiles.forEach(file => {
        fs.copyFileSync(file, path.join(pixelnestDir, file));
      });
      log.success(`SQL reference files: ${sqlFiles.length} files`);
    }

    // Create .env.example
    if (fs.existsSync('.env')) {
      let envContent = fs.readFileSync('.env', 'utf8');
      // Mask sensitive values
      envContent = envContent.replace(/=(.+)$/gm, '=<your_value>');
      fs.writeFileSync(path.join(pixelnestDir, '.env.example'), envContent);
      log.success(`Created .env.example`);
    } else {
      log.warning('.env file not found (create it manually in deployment)');
    }

    // Create .gitignore
    const gitignoreContent = `# Dependencies
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
uploads/
temp/

# Build
public/css/output.css

# Database
*.sql.backup
`;
    fs.writeFileSync(path.join(pixelnestDir, '.gitignore'), gitignoreContent);

    // Create deployment README
    const readmeContent = `# 🚀 PixelNest Deployment Guide

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 12+
- pm2 (optional, for process management)

## Installation Steps

### 1. Install Dependencies
\`\`\`bash
npm install --production
\`\`\`

### 2. Setup Environment
\`\`\`bash
cp .env.example .env
# Edit .env with your configuration
\`\`\`

### 3. Database Setup
\`\`\`bash
# Create database
createdb pixelnest_db

# Setup all tables
npm run setup-db

# Populate models
npm run populate-models

# Verify setup
npm run verify-db
\`\`\`

### 4. Build CSS
\`\`\`bash
npm run build:css
\`\`\`2

### 5. Start Application

#### Option A: Using npm
\`\`\`bash
# Start server
npm start

# In another terminal, start worker
npm run worker
\`\`\`

#### Option B: Using PM2 (Recommended)
\`\`\`bash
pm2 start ecosystem.config.js
\`\`\`

## File Structure

\`\`\`
pixelnest/
├── src/           # Application source code
├── public/        # Static assets (CSS, JS, images, uploads)
├── migrations/    # Database migrations
├── scripts/       # Utility scripts
├── server.js      # Main server
├── worker.js      # Background worker
└── package.json   # Dependencies
\`\`\`

## Important Notes

- Make sure PostgreSQL is running before starting the application
- Configure all environment variables in \`.env\` file
- Worker and server must run simultaneously for full functionality
- Check \`DEPLOYMENT_GUIDE.md\` for detailed deployment instructions

## Troubleshooting

- Database connection issues: Check \`.env\` database credentials
- Missing tables: Run \`npm run verify-db\` and \`npm run setup-db\`
- Worker not processing: Ensure worker process is running separately
- CSS not loading: Run \`npm run build:css\`

## Support

For issues, check the main documentation in the project repository.
`;
    fs.writeFileSync(path.join(pixelnestDir, 'DEPLOYMENT_README.md'), readmeContent);
    log.success('Created DEPLOYMENT_README.md');

    // Create ZIP file
    // Show summary before zipping
    log.header('\n📊 Deployment Package Summary');
    const fileCount = countFiles(pixelnestDir);
    const dirCount = countDirs(pixelnestDir);
    log.success(`Total files: ${fileCount}`);
    log.success(`Total directories: ${dirCount}`);

    // Show what was excluded
    log.header('\n🚫 Excluded from deployment:');
    console.log('  • node_modules/ (install on server)');
    console.log('  • .env (create on server)');
    console.log('  • Documentation files (*.md)');
    console.log('  • User-generated content:');
    console.log('    - public/images/* (existing user images)');
    console.log('    - public/videos/* (existing user videos)');
    console.log('    - public/audio/* (existing user audio)');
    console.log('    - public/uploads/* (existing uploads)');
    console.log('  • Log files\n');

    log.info('\n🗜️  Creating ZIP archive...');
    
    const isWindows = process.platform === 'win32';
    const zipCommand = isWindows 
      ? `powershell Compress-Archive -Path "${pixelnestDir}" -DestinationPath "${path.join(projectDir, zipName)}" -Force`
      : `cd "${tempDir}" && zip -r "${path.join(projectDir, zipName)}" pixelnest/ > /dev/null`;

    execSync(zipCommand, { stdio: 'inherit' });

    // Clean up
    fs.rmSync(tempDir, { recursive: true, force: true });

    log.success('\n✅ Deployment ZIP created successfully!\n');
    log.info(`📦 File: ${zipName}`);
    log.info(`📁 Location: ${projectDir}\n`);

    const stats = fs.statSync(path.join(projectDir, zipName));
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    log.info(`📏 File size: ${fileSizeMB} MB\n`);

    log.header('📋 Package Contents Preview:');
    const listCommand = isWindows
      ? `powershell "& { $zip = [System.IO.Compression.ZipFile]::OpenRead('${path.join(projectDir, zipName)}'); $zip.Entries | Select-Object -First 25 | ForEach-Object { $_.FullName }; $zip.Dispose() }"`
      : `unzip -l "${zipName}" | head -n 25`;
    console.log('');
    try {
      execSync(listCommand, { stdio: 'inherit', cwd: projectDir });
    } catch (e) {
      log.warning('Could not list archive contents');
    }

    log.header('\n📝 Next Steps:\n');
    console.log('1. Upload to server:');
    console.log(`   scp ${zipName} user@yourserver.com:/var/www/\n`);
    console.log('2. On server, extract:');
    console.log(isWindows ? `   powershell Expand-Archive ${zipName}` : `   unzip ${zipName}\n`);
    console.log('3. Navigate to directory:');
    console.log('   cd pixelnest\n');
    console.log('4. Follow DEPLOYMENT_README.md for complete setup\n');
    
    log.success('Ready for deployment! 🚀\n');

  } catch (error) {
    log.error(`\nError: ${error.message}`);
    
    // Clean up on error
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    
    process.exit(1);
  }
}

main();
