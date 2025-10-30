# 📦 SCP Commands - Upload ke Server

## 🚀 Option 1: Menggunakan Script (RECOMMENDED)

```bash
./scp-deploy.sh
```

Script ini akan otomatis upload semua files yang diperlukan!

---

## 📝 Option 2: Manual SCP Commands

### 1. Upload Migration Files

```bash
# Migration SQL
scp migrations/fix_payment_channels_structure_complete.sql \
    root@test-pixelnest:/var/www/pixelnest/migrations/

# Verification script
scp verify-payment-channels-structure.sql \
    root@test-pixelnest:/var/www/pixelnest/
```

### 2. Upload Deployment Scripts

```bash
# All-in-one deployment script
scp deploy-and-verify.sh \
    root@test-pixelnest:/var/www/pixelnest/

# Payment channels fix script
scp fix-payment-channels-complete.sh \
    root@test-pixelnest:/var/www/pixelnest/
```

### 3. Upload Updated Source Files

```bash
# Database setup
scp src/config/setupDatabase.js \
    root@test-pixelnest:/var/www/pixelnest/src/config/

# Email service (optimized)
scp src/services/emailService.js \
    root@test-pixelnest:/var/www/pixelnest/src/services/

# Auth controller (updated)
scp src/controllers/authController.js \
    root@test-pixelnest:/var/www/pixelnest/src/controllers/
```

### 4. Upload Documentation (Optional)

```bash
# Upload all documentation at once
scp DEPLOYMENT_READY_SUMMARY.md \
    DATABASE_CONSISTENCY_CHECK.md \
    EMAIL_PERFORMANCE_FIX.md \
    PAYMENT_CHANNELS_STRUCTURE.md \
    root@test-pixelnest:/var/www/pixelnest/
```

---

## 🎯 Upload All Files Sekaligus (One Command)

```bash
scp migrations/fix_payment_channels_structure_complete.sql \
    verify-payment-channels-structure.sql \
    deploy-and-verify.sh \
    fix-payment-channels-complete.sh \
    src/config/setupDatabase.js \
    src/services/emailService.js \
    src/controllers/authController.js \
    root@test-pixelnest:/var/www/pixelnest/
```

**Note:** Files akan masuk ke root directory, Anda perlu move manually ke folder yang sesuai.

---

## 🔧 Setelah Upload

### SSH ke Server:

```bash
ssh root@test-pixelnest
```

### Pindahkan Files ke Lokasi yang Benar:

```bash
cd /var/www/pixelnest

# Move scripts if needed (jika upload ke root directory)
# mv deploy-and-verify.sh /var/www/pixelnest/
# mv fix-payment-channels-complete.sh /var/www/pixelnest/

# Make scripts executable
chmod +x deploy-and-verify.sh
chmod +x fix-payment-channels-complete.sh

# Check files
ls -la migrations/fix_payment_channels_structure_complete.sql
ls -la src/config/setupDatabase.js
ls -la src/services/emailService.js
ls -la src/controllers/authController.js
```

### Run Deployment:

```bash
cd /var/www/pixelnest

# Run all-in-one script
bash deploy-and-verify.sh

# Or manual steps:
# 1. Fix database
PGPASSWORD=mRua5xVr0xlayFowwPuO5fqagpkKesiT psql \
  -h localhost -U pixelnest_user -d pixelnest_db \
  -f migrations/fix_payment_channels_structure_complete.sql

# 2. Restart PM2
pm2 restart pixelnest-server

# 3. Check logs
pm2 logs pixelnest-server --lines 50
```

---

## 📋 Checklist

Upload files:
- [ ] migrations/fix_payment_channels_structure_complete.sql
- [ ] verify-payment-channels-structure.sql
- [ ] deploy-and-verify.sh
- [ ] fix-payment-channels-complete.sh
- [ ] src/config/setupDatabase.js
- [ ] src/services/emailService.js
- [ ] src/controllers/authController.js

On server:
- [ ] chmod +x scripts
- [ ] Run deploy-and-verify.sh
- [ ] Restart PM2
- [ ] Verify no errors in logs
- [ ] Test payment channels endpoint
- [ ] Test registration speed

---

## 🆘 Troubleshooting

### Permission Denied

```bash
# Pastikan Anda punya akses SSH
ssh root@test-pixelnest

# Check permissions
ls -la /var/www/pixelnest/
```

### Connection Refused

```bash
# Test SSH connection
ssh -v root@test-pixelnest

# Check if host is correct
ping test-pixelnest
```

### File Already Exists

```bash
# Overwrite dengan -f flag (force)
scp -f file.js root@test-pixelnest:/var/www/pixelnest/
```

---

## 💡 Tips

### 1. Upload Directory Recursive:

```bash
# Upload entire migrations folder
scp -r migrations/ root@test-pixelnest:/var/www/pixelnest/
```

### 2. Compress During Transfer:

```bash
# Faster for large files
scp -C file.js root@test-pixelnest:/var/www/pixelnest/
```

### 3. Preserve Timestamps:

```bash
# Keep original file dates
scp -p file.js root@test-pixelnest:/var/www/pixelnest/
```

### 4. Show Progress:

```bash
# Verbose output
scp -v file.js root@test-pixelnest:/var/www/pixelnest/
```

### 5. Use SSH Config:

Create `~/.ssh/config`:
```
Host pixelnest
    HostName test-pixelnest
    User root
    Port 22
```

Then use:
```bash
scp file.js pixelnest:/var/www/pixelnest/
```

---

## ⚡ Quick Reference

```bash
# Upload single file
scp local_file.js root@test-pixelnest:/remote/path/

# Upload multiple files
scp file1.js file2.js root@test-pixelnest:/remote/path/

# Upload directory
scp -r local_dir/ root@test-pixelnest:/remote/path/

# Download from server
scp root@test-pixelnest:/remote/file.js local_file.js

# Copy between two servers
scp server1:/path/file.js server2:/path/
```

---

**Gunakan script `./scp-deploy.sh` untuk cara paling mudah!** 🚀

