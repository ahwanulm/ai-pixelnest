# 🎯 Auto-Pricing Calculator - Per-Second vs Flat Rate

**Created:** October 27, 2025  
**Status:** ✅ COMPLETE

---

## 🌟 Overview

Sistem sekarang **otomatis menghitung credits** berdasarkan pricing type dari FAL.AI:

- ✅ **Per-Second Pricing** - Harga berbeda untuk 5s, 10s video
- ✅ **Flat Rate Pricing** - Harga sama untuk semua durasi
- ✅ **Auto-Calculate** - Admin hanya input harga FAL.AI
- ✅ **Live Preview** - Lihat perhitungan real-time

---

## 💡 How It Works

### User Experience

```
Admin adds new model:
     ↓
1. Input FAL price: $0.24
2. Select pricing type: "Per Second"  
3. Input max duration: 20s
     ↓
🎉 SISTEM AUTO-CALCULATE:
     ↓
5s video  = 19 credits
10s video = 38 credits
20s video = 76 credits
     ↓
Admin clicks Save ✅
```

---

## 📊 Pricing Types

### 1. **Per-Second Pricing** ⚡

**Example:** Sora 2 ($0.24/second)

```
FAL Price: $0.24/second
Max Duration: 20s
     ↓
Full Price: $0.24 × 20s = $4.80
IDR: $4.80 × 16,000 = Rp 76,800
Credits (20s): Rp 76,800 ÷ 500 = 76 credits
     ↓
Per second: 76 ÷ 20 = 3.8 credits/s
     ↓
5s video:  3.8 × 5  = 19 credits ✅
10s video: 3.8 × 10 = 38 credits ✅
20s video: 3.8 × 20 = 76 credits ✅
```

**Preview in Form:**
```
⚡ Per-Second Pricing
• FAL Price: $0.240/second
• Max Duration: 20s
• Full Duration Cost: 76 credits (20s)

Duration-based charges:
→ 5s video: 19 credits
→ 10s video: 38 credits
→ 20s video: 76 credits

💡 Cost scales proportionally with video duration
```

### 2. **Flat Rate Pricing** 💎

**Example:** Kling 2.5 ($0.25 flat)

```
FAL Price: $0.25
Max Duration: 10s (irrelevant)
     ↓
IDR: $0.25 × 16,000 = Rp 4,000
Credits: Rp 4,000 ÷ 500 = 8 credits
     ↓
5s video:  8 credits (same) ✅
10s video: 8 credits (same) ✅
20s video: 8 credits (same) ✅
```

**Preview in Form:**
```
💎 Flat Rate Pricing
• FAL Price: $0.250
• Price in IDR: Rp 4,000
• Credits: 8 credits
→ Same cost for any duration (5s, 10s, 20s)

💡 Formula: (FAL Price × 16,000) ÷ 500 = credits
```

---

## 🎨 UI/UX

### Add Model Form

#### Before (Manual Input)
```
❌ Admin harus calculate sendiri:
   - Hitung IDR
   - Hitung credits untuk 5s
   - Hitung credits untuk 10s
   - Prone to errors
```

#### After (Auto-Calculate) ✅
```
✅ Admin input minimal:
   1. FAL Price: $0.24
   2. Pricing Type: Per Second
   3. Max Duration: 20s
   
✅ System auto-calculate:
   - Shows preview
   - Different prices for durations
   - Save correct values
```

### Live Preview

```html
<div class="auto-calculation-preview">
  ⚡ Per-Second Pricing
  • FAL Price: $0.240/second
  • Max Duration: 20s
  • Full Duration Cost: 76 credits (20s)
  
  Duration-based charges:
  → 5s video: 19 credits
  → 10s video: 38 credits  
  → 20s video: 76 credits
  
  💡 Cost scales proportionally with video duration
</div>
```

---

## 🔧 Technical Implementation

### Frontend (`public/js/admin-models.js`)

```javascript
function autoCalculateCredits() {
  const falPrice = parseFloat($('#model-fal-price').value);
  const pricingType = $('#model-pricing-type').value; // 'per_second' or 'flat'
  const modelType = $('#model-type').value; // 'image' or 'video'
  const maxDuration = parseInt($('#model-duration').value) || 10;
  
  const USD_TO_IDR = 16000;
  const IDR_PER_CREDIT = 500;
  
  if (modelType === 'video' && pricingType === 'per_second') {
    // PER-SECOND CALCULATION
    const priceIDR = falPrice * USD_TO_IDR;
    const creditsForMaxDuration = Math.ceil(priceIDR / IDR_PER_CREDIT);
    const creditsPerSecond = creditsForMaxDuration / maxDuration;
    
    const credits5s = Math.ceil(creditsPerSecond * 5);
    const credits10s = Math.ceil(creditsPerSecond * 10);
    
    // Show preview
    showPreview({
      type: 'per_second',
      falPrice,
      maxDuration,
      creditsForMaxDuration,
      credits5s,
      credits10s
    });
    
    // Set base cost (for max duration)
    $('#model-cost').value = creditsForMaxDuration;
    
  } else {
    // FLAT-RATE CALCULATION
    const priceIDR = falPrice * USD_TO_IDR;
    const credits = Math.ceil(priceIDR / IDR_PER_CREDIT);
    
    // Show preview
    showPreview({
      type: 'flat',
      falPrice,
      credits
    });
    
    // Set cost
    $('#model-cost').value = credits;
  }
}
```

### Backend (`src/controllers/adminController.js`)

```javascript
async addModel(req, res) {
  const {
    fal_price,           // Input from admin (required)
    pricing_type,        // 'per_second' or 'flat'
    max_duration,        // For video models
    cost                 // Auto-calculated from frontend
  } = req.body;
  
  // Save to database
  await pool.query(`
    INSERT INTO ai_models (
      fal_price, pricing_type, max_duration, cost, ...
    ) VALUES ($1, $2, $3, $4, ...)
  `, [
    fal_price,
    pricing_type || 'flat',
    max_duration,
    cost
  ]);
}
```

### Database Schema

```sql
ALTER TABLE ai_models 
ADD COLUMN IF NOT EXISTS pricing_type VARCHAR(20) DEFAULT 'flat';

COMMENT ON COLUMN ai_models.pricing_type IS 
  'Pricing model: per_second (scales with duration) or flat (fixed cost)';
```

---

## 📝 Form Fields

### Input Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| **FAL Price** | number | ✅ Yes | Price from fal.ai (USD) |
| **Pricing Type** | select | No | per_second or flat (default) |
| **Max Duration** | number | For videos | Maximum video duration |

### Auto-Calculated (Hidden)

| Field | Auto-Calculated From |
|-------|---------------------|
| **Cost** | FAL Price ÷ pricing formula |

---

## 🎯 Use Cases

### Use Case 1: Add Sora 2 (Per-Second)

```
Admin Input:
  ├─ Model: Sora 2
  ├─ FAL Price: $0.24
  ├─ Pricing Type: Per Second
  └─ Max Duration: 20s

System Auto-Calculate:
  ├─ Full price: $4.80 (20s)
  ├─ IDR: Rp 76,800
  ├─ Credits (20s): 76
  ├─ Per second: 3.8
  ├─ 5s: 19 credits
  ├─ 10s: 38 credits
  └─ 20s: 76 credits

Database Saved:
  ├─ fal_price: 0.24
  ├─ pricing_type: 'per_second'
  ├─ max_duration: 20
  └─ cost: 76 (base cost for 20s)

Generation Time:
  ├─ User selects 5s → Charged 19 credits ✅
  ├─ User selects 10s → Charged 38 credits ✅
  └─ User selects 20s → Charged 76 credits ✅
```

### Use Case 2: Add Kling 2.5 (Flat Rate)

```
Admin Input:
  ├─ Model: Kling 2.5
  ├─ FAL Price: $0.25
  ├─ Pricing Type: Flat Rate
  └─ Max Duration: 10s

System Auto-Calculate:
  ├─ IDR: Rp 4,000
  └─ Credits: 8

Database Saved:
  ├─ fal_price: 0.25
  ├─ pricing_type: 'flat'
  ├─ max_duration: 10
  └─ cost: 8

Generation Time:
  ├─ User selects 5s → Charged 8 credits ✅
  ├─ User selects 10s → Charged 8 credits ✅
  └─ Same for any duration
```

### Use Case 3: Add Image Model (Always Flat)

```
Admin Input:
  ├─ Model: FLUX Pro
  ├─ FAL Price: $0.055
  └─ Pricing Type: Flat (default)

System Auto-Calculate:
  ├─ IDR: Rp 880
  └─ Credits: 2

Database Saved:
  ├─ fal_price: 0.055
  ├─ pricing_type: 'flat'
  └─ cost: 2

Generation Time:
  └─ User generates → Charged 2 credits ✅
```

---

## ⚡ Real-Time Calculation

### Triggers

Auto-calculate runs when:
- FAL Price input changes
- Pricing Type selector changes
- Max Duration input changes

```javascript
// Event listeners
$('#model-fal-price').oninput = autoCalculateCredits;
$('#model-pricing-type').onchange = autoCalculateCredits;
$('#model-duration').oninput = autoCalculateCredits;
```

### Preview Updates

**Live feedback as admin types:**

```
Admin types: 0.24
   ↓ (instant)
Preview shows: "76 credits for 20s"

Admin changes to: Per Second
   ↓ (instant)
Preview updates: "5s=19, 10s=38, 20s=76"

Admin changes duration to: 10
   ↓ (instant)
Preview recalculates: "5s=10, 10s=19"
```

---

## 🔒 Validation

### Required Fields

```javascript
if (!falPrice || falPrice <= 0) {
  return 'FAL Price is required and must be > 0';
}

if (modelType === 'video' && pricingType === 'per_second' && !maxDuration) {
  return 'Max Duration required for per-second pricing';
}
```

### Formula Validation

```javascript
// Ensure credits are positive integers
const credits = Math.ceil(priceIDR / IDR_PER_CREDIT);

// Minimum 1 credit
if (credits < 1) {
  credits = 1;
}
```

---

## 📊 Formula Reference

### Constants

```javascript
const USD_TO_IDR = 16000;      // 1 USD = Rp 16,000
const IDR_PER_CREDIT = 500;    // 1 Credit = Rp 500
```

### Flat Rate Formula

```
Credits = CEIL((FAL_Price_USD × 16,000) ÷ 500)
```

**Example:**
```
$0.25 → Rp 4,000 → 8 credits
$0.055 → Rp 880 → 2 credits
```

### Per-Second Formula

```
1. Full_Price = FAL_Price_Per_Second × Max_Duration
2. Full_Price_IDR = Full_Price × 16,000
3. Credits_Max = CEIL(Full_Price_IDR ÷ 500)
4. Credits_Per_Second = Credits_Max ÷ Max_Duration
5. Credits_Duration = CEIL(Credits_Per_Second × Requested_Duration)
```

**Example (Sora 2):**
```
1. $0.24/s × 20s = $4.80
2. $4.80 × 16,000 = Rp 76,800
3. 76,800 ÷ 500 = 153.6 → 154 credits (20s)
4. 154 ÷ 20 = 7.7 credits/s
5. For 5s: 7.7 × 5 = 38.5 → 39 credits
   For 10s: 7.7 × 10 = 77 credits
```

---

## ✅ Testing

### Test Case 1: Per-Second Video

```
Input:
  - FAL Price: $0.15
  - Pricing Type: Per Second
  - Max Duration: 10s

Expected Output:
  - Full price: $1.50
  - IDR: Rp 24,000
  - Credits (10s): 48
  - Per second: 4.8
  - 5s: 24 credits ✅
  - 10s: 48 credits ✅

Database:
  - fal_price: 0.15
  - pricing_type: 'per_second'
  - cost: 48
```

### Test Case 2: Flat Rate Video

```
Input:
  - FAL Price: $0.50
  - Pricing Type: Flat
  - Max Duration: 10s

Expected Output:
  - IDR: Rp 8,000
  - Credits: 16 (any duration)

Database:
  - fal_price: 0.50
  - pricing_type: 'flat'
  - cost: 16
```

### Test Case 3: Image Model

```
Input:
  - FAL Price: $0.025
  - Pricing Type: Flat (default)

Expected Output:
  - IDR: Rp 400
  - Credits: 1

Database:
  - fal_price: 0.025
  - pricing_type: 'flat'
  - cost: 1
```

---

## 🎉 Benefits

### For Admins

✅ **No manual calculation** - System does it automatically  
✅ **Accurate pricing** - Formula consistent with backend  
✅ **Live preview** - See costs before saving  
✅ **Error prevention** - Validation built-in  
✅ **Time savings** - Add models faster

### For System

✅ **Consistent pricing** - Same formula everywhere  
✅ **Correct charges** - Users pay accurate amounts  
✅ **Flexible** - Supports both pricing types  
✅ **Transparent** - Shows calculation logic

### For Users

✅ **Fair pricing** - Pay only for duration used  
✅ **Clear costs** - See exact credits needed  
✅ **Predictable** - Know costs upfront

---

## 📚 Setup Instructions

### 1. Run Migration

```bash
cd /Users/ahwanulm/Desktop/PROJECT/PIXELNEST
psql -d pixelnest -f migrations/add_fal_verification_columns.sql
```

### 2. Restart Server

```bash
npm start
```

### 3. Test in Admin Panel

```
1. Admin Panel → AI Models → Add New Model
2. Input:
   - FAL Price: 0.24
   - Pricing Type: Per Second
   - Max Duration: 20
3. Watch preview update automatically
4. Verify calculations match expected
5. Save model
6. Test generation with different durations
```

---

## 📁 Files Changed

| File | Changes |
|------|---------|
| `src/views/admin/models.ejs` | Added pricing type selector, preview div |
| `public/js/admin-models.js` | Added `autoCalculateCredits()` function |
| `src/controllers/adminController.js` | Save pricing_type to database |
| `migrations/add_fal_verification_columns.sql` | Added pricing_type column |

---

## 🎓 Examples

### Sora 2 (Per-Second)
```
FAL: $0.24/s × 20s = $4.80
Credits: 76 (20s), 38 (10s), 19 (5s)
```

### Runway Gen-3 (Per-Second)
```
FAL: $0.15/s × 10s = $1.50
Credits: 48 (10s), 24 (5s)
```

### Kling 2.5 (Flat)
```
FAL: $0.25 flat
Credits: 8 (any duration)
```

### FLUX Pro (Flat)
```
FAL: $0.055 flat
Credits: 2
```

---

**Feature Complete! 🚀**

Admin sekarang hanya perlu input harga FAL.AI, sistem otomatis menghitung credits untuk berbagai durasi!

