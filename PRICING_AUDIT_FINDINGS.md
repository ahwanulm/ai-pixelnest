# 🔍 PRICING AUDIT - Critical Findings

**Date:** 2025-10-30  
**Audited by:** AI Assistant  
**Purpose:** Verify pricing logic consistency across admin panel and user generation

---

## 🚨 CRITICAL ISSUES FOUND

### 1. **MULTI-TIER PRICING FORMULA MISMATCH**

**Location:** 
- Admin Panel: `public/js/admin-models.js` (line 1003-1026)
- Backend: `src/services/falAiService.js` (line 904-910)

**Problem:**
Different formulas used for multi-tier pricing calculation!

#### Admin Panel Formula (× 10):
```javascript
const totalPrice = priceTTVNoAudio * maxDuration;
const credits = Math.max(0.1, Math.round(totalPrice * 10 * 10) / 10); // ×10 formula
```

**Example:**
- Price: $0.05/s
- Duration: 8s
- Total: $0.40
- Credits: **4 cr** (× 10)

#### Backend Service Formula (× 32):
```javascript
const USD_TO_IDR = 16000;
const IDR_PER_CREDIT = 500;

const totalPrice = falPrice * requestedDuration;
const priceIDR = totalPrice * USD_TO_IDR;  // × 16000
const creditsPerVideo = Math.ceil(priceIDR / IDR_PER_CREDIT);  // ÷ 500 = × 32
```

**Example:**
- Price: $0.05/s
- Duration: 8s
- Total: $0.40
- Credits: **13 cr** (× 32) ❌

**Impact:**
- Admin sees: 4 credits
- User charged: 13 credits
- **3.25x price difference!** User gets overcharged!

---

### 2. **INCOMPLETE DATABASE QUERY FOR MULTI-TIER**

**Location:** `src/services/falAiService.js` (line 855-877)

**Problem:**
`getCostFromDatabase()` doesn't query multi-tier pricing fields!

```javascript
// CURRENT (INCOMPLETE):
SELECT cost, pricing_type, max_duration, type, name, fal_price 
FROM ai_models 
WHERE id::text = $1::text OR model_id::text = $1::text

// MISSING FIELDS:
// - has_multi_tier_pricing
// - price_text_to_video_no_audio
// - price_text_to_video_with_audio
// - price_image_to_video_no_audio
// - price_image_to_video_with_audio
```

**Current Behavior:**
- `model.has_multi_tier_pricing` is always `undefined`
- Multi-tier calculation at line 889 never executes
- Falls back to simple pricing (line 946): `baseCost * quantity`
- This is **accidentally correct** because it uses admin-calculated cost!

**Risk:**
If someone fixes the query to include multi-tier fields, the × 32 formula will activate and cause overcharging!

---

### 3. **PER-SECOND PRICING LOGIC DISCREPANCY**

**Admin Panel:**
```javascript
// Stores credits PER SECOND
const creditsPerSecond = Math.max(0.1, Math.round(falPrice * 10 * 10) / 10);
document.getElementById('model-cost').value = creditsPerSecond;
```

**Backend (aiGenerationWorker.js line 1007-1013):**
```javascript
if (pricing_type === 'per_second') {
  const creditsPerSecond = baseCost;  // FROM DATABASE
  baseCost = creditsPerSecond * requestedDur;  // MULTIPLY BY DURATION
  costMultiplier = 1.0;
}
```

**Analysis:**
- ✅ Admin stores credits/second in database
- ✅ Worker multiplies by actual duration
- ✅ **This is CORRECT!**

---

## 📊 PRICING STRUCTURE AUDIT RESULTS

### ✅ CORRECT - No Issues:

#### 1. **Simple Pricing (Flat Rate)**
- **Admin:** `credits = falPrice × 10`
- **Backend:** Uses `model.cost` from database (already calculated by admin)
- **Status:** ✅ Consistent

#### 2. **Per-Second Pricing**
- **Admin:** Stores `credits_per_second = falPrice × 10` 
- **Worker:** `total = credits_per_second × duration`
- **Status:** ✅ Consistent

#### 3. **Per-Pixel Pricing**
- **Admin:** `credits = (totalPrice × 2)` ✅ (Just fixed!)
- **Backend:** Uses `model.cost` from database
- **Status:** ✅ Consistent

#### 4. **Per-Megapixel Pricing**
- **Admin:** `credits = totalPrice × 10`
- **Backend:** Uses `model.cost` from database
- **Status:** ✅ Consistent

#### 5. **3D Modeling Pricing**
- **Admin:** `credits = (basePrice × quality) × 10`
- **Backend:** Uses `model.cost` from database
- **Status:** ✅ Consistent

#### 6. **Resolution-Based Pricing**
- **Admin:** `credits = priceSD/HD/2K/4K × 10`
- **Backend:** Uses `model.cost` from database
- **Status:** ✅ Consistent

### ❌ CRITICAL ISSUE:

#### 7. **Multi-Tier Pricing (Veo Models)**
- **Admin:** `credits = (price × duration) × 10`
- **Backend:** `credits = (price × duration) × 32` ❌
- **Current State:** Backend code doesn't execute (missing DB fields)
- **Status:** 🔴 **BROKEN BY DESIGN, SAVED BY BUG**

---

## 🛠️ REQUIRED FIXES

### Fix #1: Remove Multi-Tier Recalculation in Backend

**File:** `src/services/falAiService.js` (line 888-923)

**Problem:** Backend recalculates multi-tier pricing instead of using pre-calculated `model.cost`

**Solution:** Remove the multi-tier recalculation block and use `model.cost` like other pricing structures

```javascript
// ❌ DELETE THIS BLOCK (line 888-923):
if (model.has_multi_tier_pricing && duration && videoType) {
  // ... complex recalculation with × 32 formula
  const USD_TO_IDR = 16000;
  const IDR_PER_CREDIT = 500;
  // ...
}

// ✅ KEEP ONLY THIS (simple pricing):
const totalCost = baseCost * quantity;
return totalCost;
```

**Reason:** 
- Admin already calculates correct credits and stores in `cost` field
- Backend should trust database values (single source of truth)
- Prevents formula inconsistencies

---

### Fix #2: Update getCostFromDatabase() Query (Optional)

**File:** `src/services/falAiService.js` (line 859)

**Current:**
```javascript
SELECT cost, pricing_type, max_duration, type, name, fal_price 
```

**Option A (Recommended):** Keep as-is since we're removing multi-tier backend logic

**Option B:** Add fields for future use (but don't recalculate):
```javascript
SELECT cost, pricing_type, max_duration, type, name, fal_price,
       has_multi_tier_pricing,
       price_text_to_video_no_audio,
       price_text_to_video_with_audio,
       price_image_to_video_no_audio,
       price_image_to_video_with_audio
```

**Recommendation:** Use Option A to prevent accidental reactivation of broken logic.

---

### Fix #3: Update Multi-Tier Admin Panel Logic (Optional Enhancement)

**File:** `public/js/admin-models.js` (line 1030)

**Current:**
```javascript
document.getElementById('model-cost').value = Math.max(...allPrices);
```

**Issue:** Stores only the highest tier price. But which tier does user actually choose?

**Possible Enhancement:** 
Store a JSON mapping of tier → credits, or document which price is stored.

**For now:** Keep as-is, but add comment:
```javascript
// Store highest tier price (most expensive option)
document.getElementById('model-cost').value = Math.max(...allPrices);
```

---

## 🎯 SUMMARY & RECOMMENDATIONS

### Immediate Actions Required:

1. ✅ **FIXED:** Per-pixel pricing formula (× 2 instead of × 10)
2. ❌ **TODO:** Remove multi-tier recalculation in `falAiService.js`
3. ✅ **VERIFIED:** All other pricing structures are consistent

### Design Principle:

**"Admin calculates, Backend trusts"**

- Admin panel calculates credits using `× 10` (or `× 2` for per-pixel)
- Saves `cost` field to database
- Backend simply uses `model.cost` from database
- **No recalculation in backend** (except for dynamic adjustments like duration multipliers)

### Risk Assessment:

| Issue | Severity | Impact | Status |
|-------|----------|--------|--------|
| Per-pixel wrong formula | 🟡 Medium | Overpricing upscale models | ✅ FIXED |
| Multi-tier formula mismatch | 🔴 Critical | 3.25x overcharge (if activated) | ⚠️ Currently dormant |
| Incomplete DB query | 🟡 Medium | Multi-tier doesn't work | ⚠️ Bug prevents worse bug |

---

## 📝 TESTING CHECKLIST

After fixes, test these scenarios:

### Multi-Tier Model (e.g., Veo 3):
- [ ] Add model in admin with multi-tier pricing
- [ ] Verify preview shows correct credits for each tier
- [ ] Generate video as user (text-to-video, no audio)
- [ ] Verify charged credits match admin preview
- [ ] Test all 4 tiers (T2V/I2V × Audio/NoAudio)

### Per-Second Model:
- [ ] Add model with per-second pricing ($0.10/s)
- [ ] Admin shows: 1.0 cr/s
- [ ] Generate 5s video → charged 5.0 cr ✅
- [ ] Generate 10s video → charged 10.0 cr ✅

### Per-Pixel Model (Upscaling):
- [ ] Add upscaler ($0.0000023/px, 1920x1080, 4x)
- [ ] Admin shows: ~152.6 cr ✅
- [ ] Generate upscale → charged 152.6 cr ✅

---

**End of Audit Report**

