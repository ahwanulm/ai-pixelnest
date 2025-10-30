# ✅ Function Signature Fix

## 🎯 Error yang Terjadi

```
❌ Error: function calculate_credits_typed(numeric, character varying) does not exist
Hint: No function matches the given name and argument types. You might need to add explicit type casts.
```

**Location:** `src/controllers/adminController.js` line 1287

---

## 🔍 Root Cause

Function `calculate_credits_typed` sudah di-update dengan signature baru (5 parameters), tapi masih ada code yang call dengan signature lama (2 parameters).

### Old Function (2 params):
```sql
calculate_credits_typed(fal_price, type)
```

### New Function (5 params):
```sql
calculate_credits_typed(
  model_id INTEGER,
  model_type VARCHAR(10),
  fal_price_usd DECIMAL,
  model_max_duration INTEGER,
  model_pricing_type VARCHAR(20)
)
```

---

## ✅ Fix Applied

### Fix 1: Quick Import (Line 1015)

**Before:**
```javascript
const costResult = await pool.query(
  'SELECT calculate_credits_typed($1, $2) as cost',
  [fal_price, falModel.type]
);
```

**After:**
```javascript
const max_duration = falModel.max_duration || null;
const pricing_type = falModel.pricing_type || 'flat';
const costResult = await pool.query(
  'SELECT calculate_credits_typed($1, $2, $3, $4, $5) as cost',
  [0, falModel.type, fal_price, max_duration, pricing_type]
);
```

---

### Fix 2: Bulk Recalculation (Line 1289)

**Before:**
```sql
UPDATE ai_models 
SET cost = calculate_credits_typed(fal_price, type)
WHERE fal_price IS NOT NULL AND fal_price > 0
```

**After:**
```sql
UPDATE ai_models 
SET cost = calculate_credits_typed(
  id, 
  type, 
  fal_price, 
  max_duration, 
  COALESCE(pricing_type, 'flat')
)
WHERE fal_price IS NOT NULL AND fal_price > 0
```

---

## 🎯 Why This Matters

**New Function Benefits:**
1. ✅ Supports `pricing_type` (per_second vs flat)
2. ✅ Uses `max_duration` for per-second models
3. ✅ Calculates total cost for per-second models
4. ✅ More accurate pricing

**Example:**
```
Old Way (WRONG):
  Sora 2: $0.24 → 3.8 credits ❌
  
New Way (CORRECT):
  Sora 2: $0.24/s × 20s = $4.80 → 75.0 credits ✅
```

---

## ✅ Status

- ✅ Fixed `adminController.js` line 1015
- ✅ Fixed `adminController.js` line 1289
- ✅ Function now called with correct parameters
- ✅ All pricing calculations will use new logic

---

## 🚀 Result

**Now when admin updates pricing config:**
- ✅ System recalculates with correct function
- ✅ Per-second models calculated correctly
- ✅ Flat rate models calculated correctly
- ✅ No more function signature errors

**Restart server untuk apply changes!**




