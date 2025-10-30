# 🔴 Reset Total Database - README

## ✅ File Sudah Dibuat!

Saya sudah membuatkan file untuk reset total database. Berikut yang sudah dibuat:

### 📁 Files Created:

1. **Main Script:**
   - `src/scripts/resetDatabase.js` - Script utama untuk reset database

2. **Documentation:**
   - `DATABASE_RESET_GUIDE.md` - Dokumentasi lengkap
   - `DATABASE_RESET_QUICK_START.md` - Quick start guide

3. **Updated Files:**
   - `package.json` - Ditambahkan npm scripts
   - `DATABASE_QUICK_REFERENCE.md` - Updated dengan command baru

---

## 🚀 Cara Pakai

### Simple Command:
```bash
npm run reset-db:full
```

atau

```bash
npm run nuke-db
```

### Safety Confirmations:
Script akan meminta konfirmasi 2x:
1. Ketik: `yes`
2. Ketik: `DELETE ALL DATA`

---

## ⚠️ PERINGATAN

Command ini akan **MENGHAPUS SEMUA DATA** termasuk:
- ❌ Semua users
- ❌ Semua AI models
- ❌ Semua generation history
- ❌ Semua transactions
- ❌ Semua promo codes
- ❌ **SEMUA TABEL DI-DROP & DIBUAT ULANG**

---

## 📝 What It Does

1. **Drop Everything:**
   - All tables (CASCADE)
   - All views
   - All sequences
   - All functions

2. **Recreate Structure:**
   - Menjalankan `setupDatabase.js`
   - Membuat semua tabel baru
   - Membuat default admin user

3. **Default Admin Created:**
   - Email: `admin@pixelnest.pro`
   - Password: `andr0Hardcore`
   - Credits: 999,999

---

## 🎯 Complete Setup After Reset

```bash
# 1. Reset database
npm run reset-db:full

# 2. Populate AI models (optional)
npm run populate-models

# 3. Add Suno models (optional)
node src/scripts/populateSunoModels.js

# 4. Init pricing config
npm run init:credit-price
npm run init:credits-settings

# 5. Sync payment channels (if using Tripay)
npm run sync:tripay-channels

# 6. Verify everything works
npm run verify-db
```

---

## 💾 Backup (Production Only)

**ALWAYS backup production database first!**

```bash
# Create backup
pg_dump -U your_user pixelnest_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore if needed
psql -U your_user pixelnest_db < backup_20251030_120000.sql
```

---

## 🔧 NPM Scripts Available

| Command | Description |
|---------|-------------|
| `npm run reset-db` | Soft reset (setup + populate, no delete) |
| `npm run reset-db:full` | **FULL RESET** - Deletes all data |
| `npm run nuke-db` | Alias untuk reset-db:full |
| `npm run setup-db` | Setup tables only (no delete) |
| `npm run verify-db` | Verify database structure |

---

## 📚 Documentation

- **Quick Start:** `DATABASE_RESET_QUICK_START.md`
- **Full Guide:** `DATABASE_RESET_GUIDE.md`
- **General DB Ref:** `DATABASE_QUICK_REFERENCE.md`

---

## 🐛 Troubleshooting

### Error: Cannot drop table
```bash
# Manual reset
psql -U your_user -d pixelnest_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
npm run setup-db
```

### Error: Connection failed
- Check PostgreSQL is running
- Check .env database config
- Verify database exists

### Script hangs
- Make sure to press Enter after typing
- Try Ctrl+C to cancel and restart

---

## ✅ Success Output

Setelah berhasil, akan ada output seperti ini:

```
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
```

---

## 🎓 When to Use

### ✅ Good Use Cases:
- Development fresh start
- Testing environment reset
- Database schema issues
- Clean install on new server

### ❌ Avoid in Production Unless:
- You have full backup
- You understand data will be lost
- You have informed all stakeholders

---

**Created:** 30 Oktober 2025  
**Version:** 1.0  
**Status:** ✅ Ready to use

