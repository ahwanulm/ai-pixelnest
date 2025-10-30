# 🗑️ Delete Models Scripts

Dua script untuk menghapus models dari database.

---

## 📋 Scripts Available

### 1. `deleteDefaultModels.js` - Hapus Model Default Saja ⭐ RECOMMENDED

**Purpose:** Hapus model default yang harganya salah, KEEP custom models

**Safe:** ✅ YES - Custom models tetap aman

**Usage:**
```bash
node src/scripts/deleteDefaultModels.js
```

**What it does:**
- ✅ Hapus semua model default (is_custom = false or NULL)
- ✅ KEEP model custom (is_custom = true) 
- ✅ Show preview sebelum delete
- ✅ Transaction safe (rollback on error)

**Example Output:**
```
📊 Current Database Status:
   Total models: 45
   Default models (will be deleted): 42
   Custom models (will be kept): 3

📋 Example models to be deleted (first 10):
   - [image] FLUX Dev (cost: 1.0 cr, fal: $0.025)
   - [video] Kling Video v2.5 (cost: 3.0 cr, fal: $0.28)
   ... and more

✅ Deleted models:
   Total deleted: 42 models

📊 After Deletion:
   Remaining models: 3
   Custom models (preserved): 3
```

---

### 2. `deleteALLModels.js` - Hapus SEMUA Model ⚠️ DANGEROUS

**Purpose:** Hapus SEMUA model termasuk custom

**Safe:** ❌ NO - Will delete custom models too!

**Usage:**
```bash
node src/scripts/deleteALLModels.js
```

**What it does:**
- ⚠️ Hapus SEMUA model (default + custom)
- ⚠️ Meminta konfirmasi user (ketik "yes")
- ✅ Show preview sebelum delete
- ✅ Transaction safe (rollback on error)

**Example Output:**
```
⚠️  WARNING: DELETE ALL MODELS (INCLUDING CUSTOM)

📊 Current Database:
   Total models: 45
   Default models: 42
   Custom models: 3

📋 Example models (first 15):
   [CUSTOM] [image] My Custom Model
   [DEFAULT] [image] FLUX Dev
   [DEFAULT] [video] Kling Video v2.5
   ... and 30 more

⚠️  THIS WILL DELETE ALL MODELS INCLUDING CUSTOM ONES!
⚠️  THIS ACTION CANNOT BE UNDONE!

Type "yes" to confirm deletion of ALL models: _
```

---

## 🎯 Recommended Workflow

### Scenario 1: Fix Pricing, Keep Custom Models ⭐ RECOMMENDED

```bash
# Step 1: Delete default models only
node src/scripts/deleteDefaultModels.js

# Step 2: Verify in admin panel (should only show custom models)
# Go to: http://localhost:5005/admin/models

# Step 3: Re-populate with correct defaults
npm run setup-db
```

**Result:**
- ✅ Default models with wrong pricing deleted
- ✅ Custom models preserved
- ✅ New default models with correct pricing added

---

### Scenario 2: Complete Reset (Delete Everything)

```bash
# Step 1: Delete ALL models
node src/scripts/deleteALLModels.js
# (Type "yes" when prompted)

# Step 2: Verify database is empty
# Go to: http://localhost:5005/admin/models

# Step 3: Re-populate with defaults
npm run setup-db
```

**Result:**
- ⚠️ ALL models deleted (including custom)
- ✅ Fresh start with correct pricing
- ✅ Can add custom models again

---

## 📊 What Gets Deleted?

### Script 1: deleteDefaultModels.js

**DELETED:**
- ✅ All FAL.AI default models
- ✅ Models with is_custom = false
- ✅ Models with is_custom = NULL

**KEPT:**
- ✅ Models with is_custom = true (user-added)
- ✅ Custom configurations
- ✅ User-specific pricing

---

### Script 2: deleteALLModels.js

**DELETED:**
- ⚠️ ALL models (no exceptions)
- ⚠️ Default models
- ⚠️ Custom models
- ⚠️ Everything in ai_models table

**KEPT:**
- Nothing (complete wipe)

---

## 🛡️ Safety Features

Both scripts have:
- ✅ Transaction support (ROLLBACK on error)
- ✅ Preview before deletion
- ✅ Detailed output
- ✅ Count by type/origin
- ✅ Error handling

Script 2 has additional:
- ✅ User confirmation required (type "yes")
- ✅ Extra warnings

---

## ⚠️ IMPORTANT NOTES

### Before Running:

1. **Backup database** (optional but recommended):
```bash
pg_dump pixelnest > backup_before_delete.sql
```

2. **Check current models:**
```bash
psql pixelnest -c "SELECT COUNT(*), is_custom FROM ai_models GROUP BY is_custom;"
```

3. **Know what you're deleting:**
   - Script 1: Default models only
   - Script 2: EVERYTHING

---

## 🔄 After Deletion

### Option 1: Re-populate with Setup Script
```bash
npm run setup-db
```

This will:
- Create tables if needed
- Add correct default models
- Keep existing users/credits

---

### Option 2: Manual Addition
1. Go to Admin Panel → Models
2. Click "Add Model" or "Browse FAL.AI"
3. Add models with correct pricing

---

## 🐛 Troubleshooting

### Error: "relation ai_models does not exist"
```bash
# Table tidak ada, buat dulu:
npm run setup-db
```

### Error: "column is_custom does not exist"
```sql
-- Add column if missing:
ALTER TABLE ai_models ADD COLUMN is_custom BOOLEAN DEFAULT false;
```

### Want to restore backup:
```bash
psql pixelnest < backup_before_delete.sql
```

---

## 📝 Summary

| Script | Deletes | Safe? | Use When |
|--------|---------|-------|----------|
| deleteDefaultModels.js | Default only | ✅ YES | Fix pricing, keep custom |
| deleteALLModels.js | Everything | ❌ NO | Complete reset needed |

**Recommendation:** Use **deleteDefaultModels.js** to safely remove models with wrong pricing while keeping custom models.

---

**End of Guide**

