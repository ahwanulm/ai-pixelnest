# 🚀 Advanced Pricing Setup Guide

## Overview

Fitur **Advanced Pricing Structures** telah ditambahkan ke sistem PixelNest untuk mendukung semua model pricing dari fal.ai.

---

## ✅ Checklist Implementation

### Frontend Changes ✅
- [x] Form modal dengan 6 pricing structures
- [x] Auto-calculator untuk semua pricing types
- [x] Compact layout (40% smaller)
- [x] Help guide collapsible
- [x] Smart section switching
- [x] Edit model support untuk semua pricing structures
- [x] Form reset saat Add Manual

### Backend Changes ✅
- [x] Updated addModel controller untuk handle semua pricing fields
- [x] Dynamic INSERT query dengan conditional fields
- [x] Extracted pricing fields dari request body

### Database Changes ⚠️ **REQUIRES MIGRATION**
- [ ] Run migration SQL to add new columns
- [ ] Verify columns created successfully

---

## 📋 Required Steps

### 1. **Run Database Migration** ⚠️ IMPORTANT

Connect to your PostgreSQL database and run the migration file:

```bash
# Option 1: Via psql command
psql -U your_username -d pixelnest -f migrations/add-advanced-pricing-columns.sql

# Option 2: Via database GUI (pgAdmin, DBeaver, etc.)
# - Open migrations/add-advanced-pricing-columns.sql
# - Execute the SQL script
```

**Migration adds these columns:**

**Per-Pixel Pricing:**
- `price_per_pixel` (NUMERIC 10,7)
- `base_resolution` (VARCHAR 20)
- `max_upscale_factor` (NUMERIC 4,1)

**Per-Megapixel Pricing:**
- `price_per_megapixel` (NUMERIC 10,3)
- `base_megapixels` (NUMERIC 4,1)
- `max_megapixels` (NUMERIC 4,1)

**3D Modeling:**
- `base_3d_price` (NUMERIC 10,2)
- `quality_multiplier` (NUMERIC 4,2)

**Resolution-Based:**
- `price_sd` (NUMERIC 10,3)
- `price_hd` (NUMERIC 10,3)
- `price_2k` (NUMERIC 10,3)
- `price_4k` (NUMERIC 10,3)

**Metadata:**
- `pricing_structure` (VARCHAR 30) - tracks which pricing type is used

---

### 2. **Verify Migration Success**

After running migration, verify with:

```sql
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'ai_models' 
    AND column_name IN (
        'price_per_pixel', 'base_resolution', 'max_upscale_factor',
        'price_per_megapixel', 'base_megapixels', 'max_megapixels',
        'base_3d_price', 'quality_multiplier',
        'price_sd', 'price_hd', 'price_2k', 'price_4k',
        'pricing_structure'
    )
ORDER BY column_name;
```

**Expected Result:** 13 rows returned

---

### 3. **Restart Application**

After migration:

```bash
# If using npm
npm restart

# If using PM2
pm2 restart pixelnest

# If using custom script
./restart.sh
```

---

### 4. **Test Each Pricing Structure**

Go to Admin Panel → Models → Add Manual and test:

#### Test 1: Simple Pricing (Existing)
```
Model ID: test-simple
Type: Image
Pricing Structure: Simple (Flat/Per-Second)
FAL Price: 0.025
Expected: 1 cr
```

#### Test 2: Per-Pixel Pricing (NEW)
```
Model ID: test-per-pixel
Type: Image
Pricing Structure: Per-Pixel
Price per Pixel: 0.0000023
Base Resolution: 1920x1080
Max Upscale Factor: 4
Expected: ~153 cr
```

#### Test 3: Per-Megapixel Pricing (NEW)
```
Model ID: test-per-mp
Type: Image
Pricing Structure: Per-Megapixel
Price per MP: 0.055
Base Megapixels: 1.0
Expected: 2 cr
```

#### Test 4: Multi-Tier Pricing (Existing - Enhanced)
```
Model ID: test-multi-tier
Type: Video
Pricing Structure: Multi-Tier
T2V No Audio: 0.20
T2V With Audio: 0.40
I2V No Audio: 0.10
I2V With Audio: 0.15
Max Duration: 8
Expected: Multiple pricing options displayed
```

#### Test 5: 3D Modeling (NEW)
```
Model ID: test-3d
Type: Image
Pricing Structure: 3D Modeling
Base Price: 0.50
Quality Multiplier: 1.5x (High)
Expected: 12 cr
```

#### Test 6: Resolution-Based (NEW)
```
Model ID: test-resolution
Type: Image
Pricing Structure: Resolution-Based
SD: 0.010
HD: 0.025
2K: 0.050
4K: 0.100
Expected: Multiple resolutions with different credits
```

---

## 🔧 Troubleshooting

### Problem: Migration fails with "column already exists"
**Solution:** Columns may have been added before. Safe to ignore if using `IF NOT EXISTS`.

### Problem: Form doesn't show new pricing structures
**Solution:** 
1. Clear browser cache (Ctrl+Shift+R / Cmd+Shift+R)
2. Check browser console for errors
3. Verify files updated: `models.ejs`, `admin-models.js`

### Problem: Credits showing as 1 for all structures
**Solution:**
1. Enter pricing values in the fields
2. Calculator should auto-update
3. Check browser console for JavaScript errors

### Problem: Save fails with database error
**Solution:**
1. Verify migration ran successfully
2. Check database connection
3. Look at server logs for specific error
4. Ensure all required fields filled

### Problem: Edit model doesn't populate pricing fields
**Solution:**
1. Verify pricing_structure field saved to database
2. Check that model has correct pricing fields in DB
3. Review browser console for JavaScript errors

---

## 📊 Database Schema Summary

```
ai_models table now supports:

1. SIMPLE PRICING (existing)
   - fal_price, pricing_type, max_duration

2. PER-PIXEL PRICING (new)
   - price_per_pixel, base_resolution, max_upscale_factor

3. PER-MEGAPIXEL PRICING (new)
   - price_per_megapixel, base_megapixels, max_megapixels

4. MULTI-TIER PRICING (existing)
   - has_multi_tier_pricing, price_text_to_video_no_audio, etc.

5. 3D MODELING (new)
   - base_3d_price, quality_multiplier

6. RESOLUTION-BASED (new)
   - price_sd, price_hd, price_2k, price_4k

All with:
   - pricing_structure field to track which type is used
```

---

## 📚 Documentation Files

After setup, refer to these guides:

1. **MANUAL_MODEL_PRICING_GUIDE.md** - Complete user guide with examples
2. **ADVANCED_PRICING_SETUP.md** (this file) - Setup instructions
3. **migrations/add-advanced-pricing-columns.sql** - Database migration

---

## 🎯 Quick Start Summary

```bash
# 1. Run migration
psql -U postgres -d pixelnest -f migrations/add-advanced-pricing-columns.sql

# 2. Restart app
pm2 restart pixelnest

# 3. Test in browser
# Go to: /admin/models → Add Manual → Try each pricing structure

# 4. Verify
# Check credits auto-calculate correctly for each type
```

---

## ⚠️ Important Notes

1. **Backward Compatible:** Existing models with simple pricing continue to work
2. **Optional Fields:** All new pricing fields are nullable (optional)
3. **Auto-Detection:** Edit function auto-detects pricing structure from saved data
4. **Default Structure:** New models default to 'simple' if not specified
5. **Credits Auto-Calculate:** All pricing types calculate credits in real-time

---

## 🔄 Rollback (If Needed)

If you need to rollback the changes:

```sql
-- Remove new columns (CAUTION: This deletes data!)
ALTER TABLE ai_models DROP COLUMN IF EXISTS price_per_pixel;
ALTER TABLE ai_models DROP COLUMN IF EXISTS base_resolution;
ALTER TABLE ai_models DROP COLUMN IF EXISTS max_upscale_factor;
ALTER TABLE ai_models DROP COLUMN IF EXISTS price_per_megapixel;
ALTER TABLE ai_models DROP COLUMN IF EXISTS base_megapixels;
ALTER TABLE ai_models DROP COLUMN IF EXISTS max_megapixels;
ALTER TABLE ai_models DROP COLUMN IF EXISTS base_3d_price;
ALTER TABLE ai_models DROP COLUMN IF EXISTS quality_multiplier;
ALTER TABLE ai_models DROP COLUMN IF EXISTS price_sd;
ALTER TABLE ai_models DROP COLUMN IF EXISTS price_hd;
ALTER TABLE ai_models DROP COLUMN IF EXISTS price_2k;
ALTER TABLE ai_models DROP COLUMN IF EXISTS price_4k;
ALTER TABLE ai_models DROP COLUMN IF EXISTS pricing_structure;

-- Remove indexes
DROP INDEX IF EXISTS idx_pricing_structure;
DROP INDEX IF EXISTS idx_per_pixel_pricing;
DROP INDEX IF EXISTS idx_per_megapixel_pricing;
```

---

## ✅ Success Indicators

You'll know everything is working when:

- ✅ All 6 pricing structures appear in dropdown
- ✅ Switching structures shows/hides correct fields
- ✅ Credits auto-calculate for each pricing type
- ✅ Models save successfully with new pricing
- ✅ Edit modal populates pricing fields correctly
- ✅ No browser console errors
- ✅ No server errors in logs

---

**Version:** 2.0  
**Last Updated:** October 28, 2025  
**Status:** Ready for Production (after migration)

