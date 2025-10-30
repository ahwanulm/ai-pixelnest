# 🔴 Database Reset Guide

**Last Updated:** 30 Oktober 2025  
**Script:** `src/scripts/resetDatabase.js`

---

## 🎯 Overview

Script untuk mereset TOTAL database - menghapus semua data dan membuat struktur database baru dari awal.

### ⚠️ WARNING

Script ini akan **MENGHAPUS SEMUA DATA** termasuk:
- ❌ Semua users (kecuali admin default yang akan dibuat ulang)
- ❌ Semua AI models
- ❌ Semua generation history
- ❌ Semua transactions & payments
- ❌ Semua promo codes
- ❌ Semua referrals
- ❌ Semua notifications
- ❌ Semua blog posts
- ❌ Semua feature requests
- ❌ **SEMUA DATA DARI SEMUA TABEL**

---

## 🚀 Usage

### Cara 1: Full Reset (Recommended)
```bash
npm run reset-db:full
```

### Cara 2: Nuke Database (Alias)
```bash
npm run nuke-db
```

### Kedua command di atas akan menjalankan script yang sama: `src/scripts/resetDatabase.js`

---

## 📝 What the Script Does

### Step 1: Safety Confirmation
Script akan meminta konfirmasi 2x:
1. **First confirmation:** Type `yes`
2. **Second confirmation:** Type `DELETE ALL DATA`

Ini untuk mencegah accidental deletion.

### Step 2: Drop Everything
Script akan menghapus:
- ✓ All tables (with CASCADE)
- ✓ All views
- ✓ All sequences
- ✓ All functions
- ✓ All triggers

### Step 3: Recreate Structure
Script akan menjalankan `setupDatabase.js` yang akan membuat:
- ✓ Authentication tables (users, sessions)
- ✓ Basic application tables
- ✓ Admin tables
- ✓ AI models tables
- ✓ Payment tables
- ✓ Referral system tables
- ✓ Feature request tables
- ✓ Public gallery tables

### Step 4: Create Default Admin
Script akan membuat user admin default:
- **Email:** `admin@pixelnest.pro`
- **Password:** `andr0Hardcore`
- **Credits:** 999,999
- **Role:** admin
- **Status:** active & verified

---

## 🎯 Complete Setup Flow

After running `npm run reset-db:full`, ikuti langkah ini untuk setup lengkap:

### 1. Reset Database
```bash
npm run reset-db:full
```

### 2. Populate AI Models (Optional)
```bash
# If you have populate script
npm run populate-models
```

### 3. Add Suno Models (Optional)
```bash
npm run populate:suno
# atau
node src/scripts/populateSunoModels.js
```

### 4. Init Pricing Config
```bash
npm run init:credit-price
npm run init:credits-settings
```

### 5. Sync Payment Channels (If using Tripay)
```bash
npm run sync:tripay-channels
```

### 6. Verify Database
```bash
npm run verify-db
```

---

## 📊 Output Example

```
═══════════════════════════════════════════════════════════
🔴 FULL DATABASE RESET
═══════════════════════════════════════════════════════════

⚠️  WARNING: This will DELETE ALL DATA in the database!

This includes:
  ❌ All users (except will recreate default admin)
  ❌ All AI models
  ❌ All generation history
  ❌ All transactions
  ❌ All payments
  ❌ All promo codes
  ❌ All referrals
  ❌ All notifications
  ❌ All blog posts
  ❌ All feature requests
  ❌ ALL DATA from ALL TABLES

═══════════════════════════════════════════════════════════

❓ Are you ABSOLUTELY SURE you want to reset the database? (yes/no): yes
❓ Type "DELETE ALL DATA" to confirm: DELETE ALL DATA

🔴 Starting database reset...

📋 Getting list of all tables...
   Found 26 tables

📊 Tables to be deleted:
   1. users
   2. sessions
   3. ai_models
   4. ai_generation_history
   5. credit_transactions
   ... (and 21 more)

🗑️  Dropping all tables...
   ✓ Dropped: users
   ✓ Dropped: sessions
   ✓ Dropped: ai_models
   ... (all tables)

✅ All tables, views, sequences, and functions dropped successfully!

═══════════════════════════════════════════════════════════
🔧 Recreating database structure...

🚀 PixelNest Database Setup Started
═══════════════════════════════════════════════════════════

📝 Step 1/9: Creating authentication tables...
✅ Authentication tables created

📝 Step 2/9: Creating basic application tables...
✅ Basic application tables created

... (all steps)

🎉 Database Setup Completed Successfully!

═══════════════════════════════════════════════════════════
✅ DATABASE RESET COMPLETED SUCCESSFULLY!

📊 Database Status:
  ✓ All old data deleted
  ✓ All tables recreated with fresh structure
  ✓ Default admin user created

👤 Default Admin Credentials:
  Email: admin@pixelnest.pro
  Password: andr0Hardcore
  Credits: 999,999

💡 Next Steps:
  1. Populate AI models: npm run populate:models
  2. Add Suno models: npm run populate:suno
  3. Setup pricing config: npm run init:pricing
  4. Give users default credits: npm run give:credits
  5. Sync payment channels: npm run sync:tripay

🚀 Your database is ready to use!
═══════════════════════════════════════════════════════════
```

---

## 🔧 When to Use This Script

### ✅ Good Use Cases:
1. **Development:** Fresh start untuk development
2. **Testing:** Reset sebelum testing
3. **Migration Issues:** Database schema bermasalah dan perlu reset
4. **Clean Install:** Setup baru di server baru
5. **Major Version Update:** Update schema yang besar

### ❌ DON'T Use in Production Unless:
- You have full backup
- You understand all data will be lost
- You have communicated with all stakeholders
- You have migration plan for existing data

---

## 🛡️ Safety Features

1. **Double Confirmation:** Meminta konfirmasi 2x
2. **Explicit Text:** Harus ketik "DELETE ALL DATA" persis
3. **Transaction Rollback:** Jika error, akan rollback
4. **Detailed Logging:** Semua operasi di-log
5. **Post-Setup Verification:** Menjalankan setupDatabase.js

---

## 🐛 Troubleshooting

### Error: "cannot drop table because other objects depend on it"
**Solution:** Script sudah menggunakan `CASCADE`, tapi jika masih error:
```bash
# Manual drop semua
psql -U your_user -d pixelnest_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
npm run setup-db
```

### Error: "database connection failed"
**Check:**
1. PostgreSQL running? `pg_ctl status`
2. Database exists? `psql -l | grep pixelnest`
3. .env file correct?
4. User has permissions?

### Error during recreate tables
**Solution:**
```bash
# Drop and recreate database manually
dropdb pixelnest_db
createdb pixelnest_db
npm run setup-db
```

### Script hangs at confirmation
**Solution:**
- Make sure to press Enter after typing
- Check terminal input is not blocked
- Try Ctrl+C to cancel and restart

---

## 📁 Related Files

- **Main Script:** `src/scripts/resetDatabase.js`
- **Setup Script:** `src/config/setupDatabase.js`
- **Auth Tables:** `src/config/authDatabase.js`
- **Admin Tables:** `src/config/adminDatabase.js`
- **Verification:** `src/config/verifyDatabase.js`

---

## 🎓 Alternative Commands

### Partial Resets (Safer):

#### Delete Only Models
```bash
node src/scripts/deleteALLModels.js
```

#### Clean Failed Jobs
```bash
npm run cleanup:failed-jobs
```

#### Clean Expired Jobs
```bash
npm run cleanup:jobs
```

#### Clean Stale Sessions
```bash
npm run cleanup:sessions
```

### Setup Only (No Delete):
```bash
npm run setup-db
```

### Verify Only:
```bash
npm run verify-db
```

---

## 💾 Backup Before Reset

**ALWAYS backup before full reset!**

### PostgreSQL Backup:
```bash
# Backup entire database
pg_dump -U your_user pixelnest_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup (if needed)
psql -U your_user pixelnest_db < backup_20251030_120000.sql
```

### Backup Specific Tables:
```bash
# Backup users only
pg_dump -U your_user -t users pixelnest_db > users_backup.sql

# Backup multiple tables
pg_dump -U your_user -t users -t ai_models -t ai_generation_history pixelnest_db > important_tables.sql
```

---

## ⚙️ Configuration

Script ini tidak memerlukan konfigurasi khusus. Menggunakan:
- Database connection dari `src/config/database.js`
- Setup logic dari `src/config/setupDatabase.js`
- Default credentials hardcoded dalam script

---

## 📞 Support

Jika ada masalah:
1. Check error logs
2. Verify database connection
3. Try manual database recreate
4. Contact admin/developer

---

## ✅ Checklist

Before running reset:
- [ ] Backup database (if needed)
- [ ] Inform team/users (if production)
- [ ] Stop all running processes
- [ ] Check PostgreSQL is running
- [ ] Review what data will be lost

After running reset:
- [ ] Verify admin can login
- [ ] Populate models
- [ ] Setup pricing config
- [ ] Sync payment channels
- [ ] Test basic functionality

---

**Status:** ✅ Production Ready  
**Tested:** Yes  
**Safe:** Yes (with confirmations)  
**Reversible:** No (requires backup to restore)

