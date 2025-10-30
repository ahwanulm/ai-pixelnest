# 🔴 Database Reset - Quick Start

## ⚡ TL;DR

```bash
# FULL DATABASE RESET (Deletes ALL data!)
npm run reset-db:full

# atau
npm run nuke-db
```

---

## ⚠️ WARNING

Perintah ini akan **MENGHAPUS SEMUA DATA**:
- ❌ Semua users, generations, transactions
- ❌ Semua tabel akan di-drop dan dibuat ulang
- ❌ **TIDAK BISA DI-UNDO!**

---

## 📋 Complete Setup Flow

```bash
# 1. Reset database
npm run reset-db:full

# 2. (Optional) Populate models
npm run populate-models

# 3. (Optional) Add Suno models  
node src/scripts/populateSunoModels.js

# 4. Init pricing config
npm run init:credit-price
npm run init:credits-settings

# 5. Verify
npm run verify-db
```

---

## 👤 Default Admin After Reset

```
Email: admin@pixelnest.pro
Password: andr0Hardcore
Credits: 999,999
```

---

## 🔒 Safety Confirmations

Script akan meminta konfirmasi 2x:
1. Type: `yes`
2. Type: `DELETE ALL DATA`

---

## 💾 Backup First! (Production)

```bash
# Backup sebelum reset
pg_dump -U your_user pixelnest_db > backup_$(date +%Y%m%d).sql

# Restore jika diperlukan
psql -U your_user pixelnest_db < backup_20251030.sql
```

---

## 📚 Full Documentation

Lihat: `DATABASE_RESET_GUIDE.md` untuk dokumentasi lengkap.

---

## 🆚 vs Regular Reset

| Command | What it does | Safe? |
|---------|-------------|-------|
| `npm run reset-db` | Setup + populate (no delete) | ✅ Yes |
| `npm run reset-db:full` | DROP ALL + recreate | ⚠️ Confirms 2x |
| `npm run nuke-db` | Same as reset-db:full | ⚠️ Confirms 2x |

---

**Script Location:** `src/scripts/resetDatabase.js`  
**Created:** 30 Oktober 2025

