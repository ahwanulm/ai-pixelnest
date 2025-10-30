# 🔧 Fix Database Pricing - Complete Guide

**Problem:** Pricing di database tidak benar karena model per-second dan pricing structures lain menggunakan formula lama yang salah.

**Solution:** Recalculate semua pricing dengan formula yang sudah diperbaiki.

---

## 🎯 Quick Fix

### Option 1: Fix Existing Models ⭐ RECOMMENDED

Recalculate pricing untuk semua model yang sudah ada:

```bash
node src/scripts/fixAllModelPricing.js
```

**What it does:**
- ✅ Recalculate pricing dengan formula yang benar
- ✅ Fix per-second models (store as cr/s)
- ✅ Fix per-pixel models (use × 2 formula)
- ✅ Fix multi-tier models (use correct tier)
- ✅ Keep model IDs and configurations
- ✅ Only update `cost` field

**Safe:** YES - Only updates pricing, keeps everything else

---

### Option 2: Delete & Re-add Models

Complete reset dengan model baru:

```bash
# Step 1: Delete default models
node src/scripts/deleteDefaultModels.js

# Step 2: Re-populate with correct pricing
npm run setup-db
```

**What it does:**
- ⚠️ Delete all default models
- ✅ Add fresh models with correct pricing
- ✅ Keep custom models

---

## 📊 What Gets Fixed

### 1. Per-Second Models (Video/Audio)

**Problem:**
```
Model: Kling Video v2.5
FAL Price: $0.28/s
OLD: 28.0 cr (total for max duration) ❌
```

**Fix:**
```
NEW: 2.8 cr/s (per second rate) ✅
Formula: $0.28 × 10 = 2.8 cr/s
```

---

### 2. Per-Pixel Models (Upscaling)

**Problem:**
```
Model: Clarity Upscaler
Total FAL: $76.31
OLD: 763.1 cr (× 10 formula) ❌
```

**Fix:**
```
NEW: 152.6 cr (× 2 formula) ✅
Formula: $76.31 × 2 = 152.6 cr
```

---

### 3. Multi-Tier Models (Veo)

**Problem:**
```
Model: Veo 3
Tiers: T2V no audio ($0.05/s), T2V audio ($0.07/s)
OLD: Random or wrong tier ❌
```

**Fix:**
```
NEW: 4.0 cr (base tier, 8s) ✅
Formula: $0.05/s × 8s × 10 = 4.0 cr
```

---

### 4. Flat Rate Models

**Problem:**
```
Model: FLUX Dev
FAL Price: $0.025
OLD: Could be wrong ❌
```

**Fix:**
```
NEW: 0.5 cr (rounded) ✅
Formula: $0.025 × 10 = 0.25 → 0.5 cr (min)
```

---

## 🔍 Example Output

```bash
$ node src/scripts/fixAllModelPricing.js

🔧 FIXING ALL MODEL PRICING IN DATABASE

======================================================================
📊 Found 45 models to check

✅ FIXED: Kling Video v2.5
   Type: video | Structure: simple
   Old: 28.00 cr → New: 2.80 cr (-25.2)
   Formula: $0.28/s × 10 = 2.8 cr/s
   Reason: Per-second pricing (credits per second)

✅ FIXED: Clarity Upscaler
   Type: image | Structure: per_pixel
   Old: 763.10 cr → New: 152.60 cr (-610.5)
   Formula: $0.0000023/px × 33,177,600 px × 2 = 152.6 cr
   Reason: Per-pixel pricing (upscaling)

✅ FIXED: Veo 3
   Type: video | Structure: multi_tier
   Old: 12.80 cr → New: 4.00 cr (-8.8)
   Formula: $0.05/s × 8s × 10 = 4.0 cr
   Reason: Multi-tier pricing (base tier)

======================================================================
📊 SUMMARY:

   Total models checked: 45
   Models fixed: 12
   Models unchanged: 33

📋 BREAKDOWN BY TYPE:

   VIDEO: 5 models
      - Kling Video v2.5: 28.0 → 2.8 (-25.2)
      - Luma Dream Machine: 10.0 → 1.0 (-9.0)
      - Veo 3: 12.8 → 4.0 (-8.8)
      - Sora 2: 240.0 → 24.0 (-216.0)
      - Runway Gen-3: 60.0 → 6.0 (-54.0)

   IMAGE: 7 models
      - Clarity Upscaler: 763.1 → 152.6 (-610.5)
      - CCSR Upscaler: 400.0 → 80.0 (-320.0)
      - FLUX Dev: 2.5 → 0.5 (-2.0)
      ...

📋 BREAKDOWN BY STRUCTURE:

   simple: 8 models
   per_pixel: 2 models
   multi_tier: 2 models

======================================================================
✅ ALL MODEL PRICING FIXED!

Next steps:
1. Verify in Admin Panel → Models
2. Check user dashboard pricing display
3. Test generation with updated models
```

---

## ✅ Verification Steps

### Step 1: Check Admin Panel

```
Go to: http://localhost:5005/admin/models

Verify:
- Per-second models show correct cr/s rate
- Per-pixel models show reasonable credits
- Multi-tier models show base tier
```

### Step 2: Check User Dashboard

```
Go to: http://localhost:5005/dashboard

Test:
1. Select Kling Video v2.5
   - Should show: "3.0 cr/s" ✅
   - 8s video → 24.0 cr ✅

2. Select Clarity Upscaler
   - Should show: "152.6 cr" ✅

3. Select Veo 3
   - Should show: "from 4.0 cr" ✅
```

### Step 3: Test Generation

```
Generate a video:
1. Model: Kling Video v2.5
2. Duration: 8s
3. Check charged: 24.0 cr ✅
4. Check history: 24.0 cr ✅
```

---

## 🐛 Troubleshooting

### Issue: Script shows "0 models to check"

**Solution:**
```bash
# Check if models exist
psql pixelnest -c "SELECT COUNT(*) FROM ai_models;"

# If 0, add models first:
npm run setup-db
```

---

### Issue: Some models not fixed

**Reason:** Model missing `fal_price` or pricing structure fields

**Solution:**
```sql
-- Check models without fal_price
SELECT id, name, fal_price, pricing_structure 
FROM ai_models 
WHERE fal_price IS NULL OR fal_price = 0;

-- Update manually if needed
UPDATE ai_models 
SET fal_price = 0.028, pricing_structure = 'simple', pricing_type = 'per_second'
WHERE name = 'Kling Video v2.5';
```

---

### Issue: Pricing still wrong after fix

**Check:**
1. Cache issue? Hard refresh browser (Ctrl+Shift+R)
2. API returning old data? Restart server
3. Database not updated? Check with:
```sql
SELECT name, cost, fal_price, pricing_type 
FROM ai_models 
WHERE name = 'Kling Video v2.5';
```

---

## 🔄 Rollback

If something goes wrong:

### Option 1: Restore from backup
```bash
psql pixelnest < backup_before_fix.sql
```

### Option 2: Re-run setup
```bash
node src/scripts/deleteDefaultModels.js
npm run setup-db
```

---

## 📝 Summary

| Method | Speed | Safe? | Keeps Custom? | Updates IDs? |
|--------|-------|-------|---------------|--------------|
| fixAllModelPricing.js | Fast | ✅ YES | ✅ YES | ✅ NO (keeps IDs) |
| Delete + Re-add | Slow | ⚠️ Medium | ✅ YES | ❌ YES (new IDs) |

**Recommendation:** Use **fixAllModelPricing.js** untuk quick fix tanpa reset IDs.

---

## 🎯 Complete Workflow

```bash
# Step 1: Backup (optional)
pg_dump pixelnest > backup_before_fix.sql

# Step 2: Fix all pricing
node src/scripts/fixAllModelPricing.js

# Step 3: Verify in browser
# - Admin panel: Check model costs
# - User dashboard: Check display
# - Generate: Test actual charging

# Step 4: If all good, you're done! ✅
```

---

**End of Guide**

