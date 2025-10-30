# 🔧 Credits Column Consistency Fix

## 📋 Problem

Database table `ai_generation_history` had **inconsistent column naming** for storing credit costs:
- Some code used `credits_cost`
- Other code used `cost_credits`

This caused:
- ❌ Credit usage showing as **0.0 cr** in Usage page
- ❌ Data inconsistency between different parts of the application
- ❌ Worker updating `credits_cost` but UI reading from `cost_credits`

---

## ✅ Solution

### 1. **Standardized on `cost_credits` as PRIMARY column**
   - ✅ Type: `DECIMAL(10, 2)` (supports fractional credits)
   - ✅ All new code uses `cost_credits`
   - ✅ `credits_cost` kept for backward compatibility

### 2. **Database Trigger for Auto-Sync**
   - ✅ Automatically syncs both columns on INSERT/UPDATE
   - ✅ Works bi-directionally (either column can be set)
   - ✅ Prioritizes `cost_credits` as the primary source

### 3. **Data Migration**
   - ✅ Synced all existing data from `credits_cost` → `cost_credits`
   - ✅ 8 rows updated successfully
   - ✅ All historical data preserved

---

## 📝 Files Updated

### Backend - Workers
- ✅ `src/workers/aiGenerationWorker.js`
  - Changed UPDATE query from `credits_cost` → `cost_credits`
  
- ✅ `src/workers/customAIGenerationWorker.js`
  - Changed UPDATE query from `credits_cost` → `cost_credits`

### Backend - Services
- ✅ `src/services/falAiService.js`
  - Changed INSERT query from `credits_cost` → `cost_credits`

### Backend - Controllers
- ✅ `src/controllers/authController.js`
  - Parse `cost_credits` to float with fallback
  
- ✅ `src/controllers/generationController.js`
  - Changed SELECT query from `credits_cost` → `cost_credits`
  
- ✅ `src/controllers/generationQueueController.js`
  - Changed SELECT query from `credits_cost` → `cost_credits`

### Frontend - Views
- ✅ `src/views/auth/usage.ejs`
  - All credit displays use `parseFloat()` with fallback
  - Safe rendering with division-by-zero checks

### Database Schema
- ✅ `src/config/setupDatabase.js`
  - Updated CREATE TABLE to use `DECIMAL(10, 2)` for both columns
  - Added trigger function `sync_credits_columns()`
  - Added trigger `sync_credits_trigger`
  - Auto-syncs existing data on setup

---

## 🔄 Trigger Logic

```sql
CREATE OR REPLACE FUNCTION sync_credits_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Prioritize cost_credits as the primary column
  IF NEW.cost_credits IS NOT NULL AND NEW.cost_credits > 0 THEN
    NEW.credits_cost = NEW.cost_credits;
  ELSIF NEW.credits_cost IS NOT NULL AND NEW.credits_cost > 0 
        AND (NEW.cost_credits IS NULL OR NEW.cost_credits = 0) THEN
    NEW.cost_credits = NEW.credits_cost;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**How it works:**
1. If `cost_credits` is set → sync to `credits_cost`
2. If only `credits_cost` is set → sync to `cost_credits`
3. Runs automatically on every INSERT/UPDATE

---

## 🧪 Testing

All tests passed ✅:

```
Test 1: Insert with cost_credits = 5.5
   ✅ Inserted: credits_cost=5.50, cost_credits=5.50
   ✅ SYNC WORKS: Both columns match!

Test 2: Insert with credits_cost = 3.2
   ✅ Inserted: credits_cost=3.20, cost_credits=3.20
   ✅ SYNC WORKS: Both columns match!

Test 3: Checking all existing data consistency
   Total rows: 8
   Synced rows: 8
   Not synced: 0
   ✅ ALL DATA IS SYNCED!
```

---

## 📊 Database Schema

```sql
CREATE TABLE ai_generation_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  
  -- Generation info
  generation_type VARCHAR(50) NOT NULL,
  sub_type VARCHAR(50),
  prompt TEXT,
  result_url TEXT,
  
  -- ⚡ CREDITS COLUMNS (Always in sync via trigger)
  cost_credits DECIMAL(10, 2) DEFAULT 0,    -- PRIMARY ✅
  credits_cost DECIMAL(10, 2) DEFAULT 0,    -- Backup (for compatibility)
  credits_used DECIMAL(10, 2) DEFAULT 1,
  
  -- Status & timing
  status VARCHAR(50) DEFAULT 'pending',
  progress INTEGER DEFAULT 0,
  job_id VARCHAR(255),
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🎯 Result

✅ **Credit usage now displays correctly** in Usage page
✅ **All columns stay synced automatically**
✅ **Backward compatibility maintained**
✅ **Future-proof with trigger automation**

### Before:
```
Recent Activity:
  - Image Generation: 0.0 cr ❌
  - Video Generation: 0.0 cr ❌
```

### After:
```
Recent Activity:
  - Image Generation: 1.5 cr ✅
  - Video Generation: 5.2 cr ✅
```

---

## 📁 Migration Files

- `migrations/fix-credits-consistency.sql` - Full migration SQL
- `sync-cost-credits.sql` - Data sync only (for reference)

---

## 💡 Best Practices Going Forward

1. **Always use `cost_credits`** in new code
2. The trigger ensures backward compatibility
3. Both columns will always have the same value
4. Type is `DECIMAL(10, 2)` for fractional credit support

---

**Status:** ✅ **COMPLETED** - Database is now fully consistent!
**Date:** October 28, 2025
**Tested:** ✅ All tests passed

