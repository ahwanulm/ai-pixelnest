# 🎬 Proportional Video Pricing Fix

## 🐛 Problem

**User Report**: "Harga cost di dashboard user tidak mengikuti pengaturan pricing yang ada dihalaman settings pricing, dan cost tidak menyesuaikan dengan durasi yang dimasukan user saat mau generate video"

### Issues:

1. **Cost tidak mengikuti pricing dari database/admin settings**
   - Frontend menggunakan hardcoded pricing
   - Tidak sync dengan pricing config di admin panel

2. **Cost tidak proportional dengan durasi video**
   - 5s video dan 20s video harga hampir sama
   - Seharusnya: lebih panjang durasi = lebih mahal (proportional)

### Example (Before Fix):
```
Sora 2 (max 20s, cost 8.0 credits):
- User pilih 5s  → Cost: 6.4 credits ❌ (using 0.8x multiplier)
- User pilih 10s → Cost: 6.4 credits ❌ (same!)
- User pilih 20s → Cost: 8.0 credits ✅ (using 1.0x multiplier)

Problem: 5s dan 10s harganya sama! Not proportional!
```

---

## ✅ Solution

### 1. **Use Database Pricing**
Frontend sekarang menggunakan `selectedModel.cost` dari database yang sudah dikalkulasi oleh admin pricing settings.

**Code** (`dashboard-generation.js`):
```javascript
// Use real model price if available
if (selectedModel && selectedModel.cost) {
    baseCost = parseFloat(selectedModel.cost);
    // baseCost now reflects pricing from admin settings!
}
```

### 2. **Implement Proportional Duration Pricing**

**Formula**:
```
actualCost = baseCost * (requestedDuration / maxDuration)
```

**Code** (`dashboard-generation.js`):
```javascript
// PROPORTIONAL PRICING: Cost scales with duration
const modelMaxDuration = selectedModel.max_duration || 20;
const requestedDuration = activeDuration ? parseInt(activeDuration.getAttribute('data-duration')) : 5;

if (requestedDuration <= modelMaxDuration) {
    // Proportional to duration
    costMultiplier = requestedDuration / modelMaxDuration;
} else {
    // If requested duration > max, cap at full cost
    costMultiplier = 1.0;
}
```

### 3. **Examples After Fix**

#### Sora 2 (max 20s, base cost 8.0 credits):
```
- User pilih 5s  → 8.0 * (5/20)  = 2.0 credits ✅
- User pilih 10s → 8.0 * (10/20) = 4.0 credits ✅
- User pilih 15s → 8.0 * (15/20) = 6.0 credits ✅
- User pilih 20s → 8.0 * (20/20) = 8.0 credits ✅

Perfect! Proportional scaling! 🎯
```

#### Kling 2.5 Turbo Pro (max 10s, base cost 5.0 credits):
```
- User pilih 5s  → 5.0 * (5/10) = 2.5 credits ✅
- User pilih 10s → 5.0 * (10/10) = 5.0 credits ✅

Proportional! 🎯
```

### 4. **Type Multipliers Still Apply**

After duration multiplier, type-specific multipliers are applied:

```javascript
// Additional cost for image-to-video operations
if (type === 'image-to-video') {
    costMultiplier *= 1.2; // 20% more
} else if (type === 'image-to-video-end') {
    costMultiplier *= 1.4; // 40% more
}
```

**Example**:
```
Sora 2, 10s, Image-to-Video:
- Base: 8.0 credits
- Duration multiplier: 10/20 = 0.5
- Type multiplier: 1.2 (image-to-video)
- Final: 8.0 * 0.5 * 1.2 = 4.8 credits ✅
```

---

## 📊 Pricing Breakdown

### Formula:
```
finalCost = baseCost * (duration / maxDuration) * typeMultiplier * quantity
```

### Components:
1. **baseCost**: From database (admin pricing settings)
2. **duration/maxDuration**: Proportional ratio (0.0 - 1.0)
3. **typeMultiplier**: 
   - text-to-video: 1.0x
   - image-to-video: 1.2x
   - image-to-video-end: 1.4x
4. **quantity**: Number of videos to generate (1-10x)

---

## 🧪 Testing

### Test Case 1: Text-to-Video (Sora 2)
```
Model: Sora 2
Max Duration: 20s
Base Cost: 8.0 credits
Type: text-to-video

Test 1: 5s video, 1x quantity
Expected: 8.0 * (5/20) * 1.0 * 1 = 2.0 credits ✅

Test 2: 10s video, 2x quantity
Expected: 8.0 * (10/20) * 1.0 * 2 = 8.0 credits ✅

Test 3: 20s video, 1x quantity
Expected: 8.0 * (20/20) * 1.0 * 1 = 8.0 credits ✅
```

### Test Case 2: Image-to-Video (Kling 2.5)
```
Model: Kling 2.5 Turbo Pro
Max Duration: 10s
Base Cost: 5.0 credits
Type: image-to-video

Test 1: 5s video, 1x quantity
Expected: 5.0 * (5/10) * 1.2 * 1 = 3.0 credits ✅

Test 2: 10s video, 1x quantity
Expected: 5.0 * (10/10) * 1.2 * 1 = 6.0 credits ✅
```

### Test Case 3: Image-to-Video with End Frame
```
Model: Sora 2
Max Duration: 20s
Base Cost: 8.0 credits
Type: image-to-video-end

Test: 10s video, 1x quantity
Expected: 8.0 * (10/20) * 1.4 * 1 = 5.6 credits ✅
```

---

## 🔄 Comparison

### Before Fix:

| Duration | Old Cost | Logic |
|----------|----------|-------|
| 5s | 6.4 credits | 8.0 * 0.8 (hardcoded) |
| 10s | 6.4 credits | 8.0 * 0.8 (hardcoded) |
| 15s | 8.0 credits | 8.0 * 1.0 (hardcoded) |
| 20s | 8.0 credits | 8.0 * 1.0 (hardcoded) |

❌ Not proportional!  
❌ 5s and 10s same price!

### After Fix:

| Duration | New Cost | Logic |
|----------|----------|-------|
| 5s | 2.0 credits | 8.0 * (5/20) = 8.0 * 0.25 |
| 10s | 4.0 credits | 8.0 * (10/20) = 8.0 * 0.50 |
| 15s | 6.0 credits | 8.0 * (15/20) = 8.0 * 0.75 |
| 20s | 8.0 credits | 8.0 * (20/20) = 8.0 * 1.00 |

✅ Perfectly proportional!  
✅ Each 5s costs 2.0 credits!

---

## 📝 Files Modified

### 1. `public/js/dashboard-generation.js`
**Changes**:
- Line 104-144: Updated video pricing logic to use proportional calculation
- Added logging for video cost calculation
- Formula: `costMultiplier = requestedDuration / modelMaxDuration`

**Before**:
```javascript
if (requestedDuration <= modelMaxDuration / 2) {
    costMultiplier = 0.8; // 80% for short videos
} else {
    costMultiplier = 1.0; // 100% for longer videos
}
```

**After**:
```javascript
if (requestedDuration <= modelMaxDuration) {
    costMultiplier = requestedDuration / modelMaxDuration; // Proportional!
} else {
    costMultiplier = 1.0; // Cap at max
}
```

### 2. `public/js/dashboard.js` (Fallback/Legacy)
**Changes**:
- Line 85-105: Updated fallback video pricing to match new logic
- Uses same proportional formula for consistency

**Before**:
```javascript
if (type === 'text-to-video') {
    baseCost = duration === 5 ? 3 : 5;
}
```

**After**:
```javascript
const defaultMaxDuration = 20;
const defaultBaseCost = 5.0;
baseCost = defaultBaseCost * (duration / defaultMaxDuration);
```

---

## 🎯 Benefits

### For Users:
✅ **Fair Pricing**: Pay proportionally for what you use  
✅ **Cheaper Short Videos**: 5s video costs 1/4 of 20s video  
✅ **Predictable Costs**: Easy to understand pricing  
✅ **Flexibility**: Can choose duration based on budget  

### For Admin:
✅ **One Config**: Set base price once in admin panel  
✅ **Auto-scaling**: Duration pricing calculated automatically  
✅ **Type-aware**: Different margins for image vs video  
✅ **Database-driven**: All pricing from database  

### For System:
✅ **Consistent**: Frontend matches backend pricing  
✅ **Accurate**: No hardcoded values  
✅ **Scalable**: Easy to add new models  
✅ **Maintainable**: Single source of truth  

---

## 💰 Real-World Examples

### Scenario 1: User wants quick 5s demo
```
Before: 6.4 credits (expensive for 5s!)
After:  2.0 credits (fair!)
Savings: 4.4 credits (69% cheaper!) 💰
```

### Scenario 2: User wants full 20s video
```
Before: 8.0 credits
After:  8.0 credits (same)
Fair: Yes, paying for full duration ✅
```

### Scenario 3: User wants medium 10s video
```
Before: 6.4 credits (same as 5s!)
After:  4.0 credits (exactly half of 20s!)
Fair: Yes, proportional! ✅
```

---

## 🚨 Important Notes

### 1. **Max Duration Varies by Model**
- Sora 2: max 20s
- Kling 2.5: max 10s
- Default fallback: 20s

### 2. **Cost Cannot Exceed Base Cost**
If user requests 30s but max is 20s:
- Capped at 20s pricing (full cost)
- UI should prevent selecting > max duration

### 3. **Type Multipliers Apply After Duration**
Order of calculation:
1. Get base cost from database
2. Apply duration multiplier
3. Apply type multiplier
4. Multiply by quantity

### 4. **Fallback Logic Matches**
Even if no model selected, fallback uses same proportional logic for consistency.

---

## 📊 Console Logging

New logging added for debugging:

```javascript
console.log('🎬 Video cost calculation:', {
    model: 'Sora 2',
    baseCost: 8.0,
    maxDuration: '20s',
    requestedDuration: '10s',
    durationMultiplier: '0.50',
    typeMultiplier: 1.0,
    finalMultiplier: '0.50'
});
```

Check browser console to verify calculations!

---

## ✅ Checklist

- [x] Proportional duration pricing implemented
- [x] Uses database pricing (admin settings)
- [x] Type multipliers preserved
- [x] Fallback logic updated
- [x] Console logging added
- [x] No linter errors
- [x] Tested with multiple durations
- [x] Tested with different model types
- [x] Documentation created

---

## 🎉 Result

**Before**: ❌ Fixed/hardcoded pricing, not proportional  
**After**: ✅ Dynamic, database-driven, perfectly proportional!

**Status**: ✅ FIXED  
**Last Updated**: October 2025

---

## 🚀 Quick Test

1. Open dashboard: `http://localhost:5005/dashboard`
2. Switch to Video tab
3. Select "Sora 2" model
4. Try different durations:
   - Click 5s → See cost: ~2.0 credits
   - Click 10s → See cost: ~4.0 credits
   - Click 20s → See cost: ~8.0 credits
5. Check console for detailed calculation logs
6. Change quantity (1x-10x) → Cost multiplies correctly

**Expected**: Cost increases proportionally with duration! ✅

