# 🔍 Database Column Inconsistencies Report

## Tanggal: 29 Oktober 2025

## 📊 Summary of Issues Found

### ⚠️ Issue 1: `ai_generation_history` - Duplicate Credit Columns

**Kolom yang Bermasalah:**
- `credits_used` (DECIMAL) - DEFAULT 1
- `credits_cost` (DECIMAL) - DEFAULT 1  
- `cost_credits` (DECIMAL) - DEFAULT 0

**Problem:**
Terdapat 3 kolom yang menyimpan informasi credits yang sama:
1. `credits_used` - Kolom legacy
2. `credits_cost` - Kolom duplikat
3. `cost_credits` - Kolom yang seharusnya digunakan

**Impact:**
- Confusion dalam code (kolom mana yang harus dipakai?)
- Data mungkin tidak sinkron antara kolom
- Waste storage space

**Rekomendasi:**
Gunakan HANYA `cost_credits` dan drop kolom lainnya setelah migrasi data.

---

### ⚠️ Issue 2: `feature_requests` - Duplicate Type Columns

**Kolom yang Bermasalah:**
- `type` (VARCHAR(20)) - NOT NULL
- `request_type` (VARCHAR(50)) - NULL

**Problem:**
Ada 2 kolom yang menyimpan tipe yang sama dengan constraint berbeda

**Impact:**
- Confusion dalam code
- `type` is NOT NULL tapi `request_type` is NULL
- Tidak jelas kolom mana yang authoritative

**Rekomendasi:**
Standardisasi menggunakan `request_type` saja (lebih deskriptif)

---

### ⚠️ Issue 3: `users.credits` - Type Inconsistency

**Current State:**
- Type: `numeric` (precision not specified)
- DEFAULT: 0

**Problem:**
Tidak ada precision specified untuk numeric type, bisa menyebabkan rounding issues

**Rekomendasi:**
Change to `DECIMAL(10, 2)` untuk konsistensi dengan kolom lain

---

### ⚠️ Issue 4: `ai_generation_history` - Extra Column Not in Setup

**Kolom Ditemukan di Database:**
- `fal_request_id` (VARCHAR(255))

**Problem:**
Kolom ini ada di database tapi TIDAK ada di `setupDatabase.js`

**Impact:**
- Jika database di-reset, kolom ini akan hilang
- Setup tidak konsisten dengan production database

**Rekomendasi:**
Tambahkan kolom ini ke `setupDatabase.js`

---

### ✅ Issue 5: Missing Columns That Should Be Added

**ai_generation_history** should have:
```sql
fal_request_id VARCHAR(255) -- untuk tracking FAL.AI requests
```

---

## 🔧 Recommended Actions

### Priority 1: Fix Duplicate Columns

```sql
-- 1. Sync data ke cost_credits (primary column)
UPDATE ai_generation_history
SET cost_credits = COALESCE(cost_credits, credits_cost, credits_used, 0)
WHERE cost_credits IS NULL OR cost_credits = 0;

-- 2. Drop redundant columns (AFTER backup!)
-- ALTER TABLE ai_generation_history DROP COLUMN credits_used;
-- ALTER TABLE ai_generation_history DROP COLUMN credits_cost;
```

### Priority 2: Standardize feature_requests type

```sql
-- Sync data to request_type
UPDATE feature_requests
SET request_type = COALESCE(request_type, type)
WHERE request_type IS NULL;

-- Drop old type column (AFTER backup!)
-- ALTER TABLE feature_requests DROP COLUMN type;
```

### Priority 3: Add Missing Column to setupDatabase.js

Add `fal_request_id` to ai_generation_history table creation in setupDatabase.js:

```javascript
await client.query(`
  CREATE TABLE IF NOT EXISTS ai_generation_history (
    // ... existing columns ...
    fal_request_id VARCHAR(255),  // <- ADD THIS
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`);
```

### Priority 4: Fix users.credits precision

```sql
ALTER TABLE users 
ALTER COLUMN credits TYPE DECIMAL(10, 2) USING credits::DECIMAL(10, 2);
```

---

## 📋 Verification Checklist

- [x] Identified duplicate columns in ai_generation_history
- [x] Identified duplicate type columns in feature_requests  
- [x] Found missing column in setupDatabase.js
- [x] Checked numeric precision issues
- [ ] Created migration script
- [ ] Tested migration on dev database
- [ ] Updated setupDatabase.js
- [ ] Verified all changes

---

## 💡 Best Practices Going Forward

1. **Single Source of Truth**: Setiap data hanya ada di SATU kolom
2. **Explicit Precision**: Selalu specify precision untuk NUMERIC/DECIMAL
3. **Consistent Naming**: Gunakan naming convention yang jelas (`cost_credits` lebih baik dari `credits_used`)
4. **Keep Setup in Sync**: Setiap ALTER TABLE harus juga update setupDatabase.js
5. **Migration Scripts**: Buat migration script untuk setiap schema change

---

## 🎯 Next Steps

1. Review laporan ini
2. Backup database sebelum perubahan
3. Buat migration script untuk fix issues
4. Update setupDatabase.js
5. Test di development
6. Deploy ke production (kalau sudah yakin)

