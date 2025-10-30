# Video Duration-Based Pricing System

**Date:** October 26, 2025  
**Status:** ✅ ACTIVE  
**Formula:** Different prices for 5s vs 10s videos

## 🎯 Overview

Video generation pricing now supports **two pricing models**:

### 1. Per-Second Pricing
**Models:** Sora 2, SORA 2 Pro, Runway Gen-3, Luma Dream Machine  
**Behavior:** Cost scales with video duration  
**Formula:** `Cost = (baseCost / max_duration) × requested_duration`

**Example: Sora 2**
- Base Cost: 24.0 credits (for max 20s)
- Cost per second: 24.0 ÷ 20 = 1.2 credits/s
- **5s video:** 1.2 × 5 = **6.0 credits** ✅
- **10s video:** 1.2 × 10 = **12.0 credits** ✅
- **20s video:** 1.2 × 20 = **24.0 credits** ✅

### 2. Flat-Rate Pricing
**Models:** Kling, Haiper AI, most other video models  
**Behavior:** Same cost regardless of duration  
**Formula:** `Cost = baseCost` (no duration multiplier)

**Example: Kling 2.5 Standard**
- Base Cost: 2.0 credits
- **5s video:** **2.0 credits** ✅
- **10s video:** **2.0 credits** ✅ (same)
- **Any duration:** **2.0 credits** ✅ (same)

## 📊 Database Schema

### `ai_models` Table Columns

```sql
CREATE TABLE ai_models (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  cost NUMERIC DEFAULT 1,           -- Base cost (for max_duration if per-second)
  fal_price NUMERIC,                -- FAL.AI USD price
  type VARCHAR(50),                 -- 'image' or 'video'
  pricing_type VARCHAR(20),         -- 'per_second' or 'flat'
  max_duration INTEGER,             -- Maximum video duration in seconds
  ...
);
```

### Key Fields:

1. **`cost`**  
   - For per-second: Cost for **full max_duration**
   - For flat-rate: Fixed cost for any duration

2. **`pricing_type`**  
   - `'per_second'`: Cost scales with duration
   - `'flat'`: Cost is fixed

3. **`max_duration`**  
   - Maximum video length supported by model
   - Used for per-second calculation

## 🔧 Backend Implementation

### `/src/services/falAiService.js`

```javascript
async calculateCost(modelId, quantity = 1, duration = null) {
  // Get full model data from database
  const model = await this.getCostFromDatabase(modelId);
  const baseCost = parseFloat(model.cost) || 1;
  
  // Per-second pricing for videos
  if (duration && model.type === 'video' && model.pricing_type === 'per_second') {
    const maxDuration = parseInt(model.max_duration) || 10;
    const requestedDuration = parseInt(duration);
    
    // Proportional pricing
    const durationMultiplier = Math.min(requestedDuration / maxDuration, 1.0);
    const adjustedCost = baseCost * durationMultiplier;
    const totalCost = adjustedCost * quantity;
    
    return totalCost;
  }
  
  // Flat-rate pricing
  const totalCost = baseCost * quantity;
  return totalCost;
}
```

### `/src/controllers/generationController.js`

```javascript
async generateVideo(req, res) {
  const numVideos = parseInt(quantity) || 1;
  const videoDuration = parseInt(duration) || 5;  // 5s or 10s
  const modelId = req.body.model || req.body.model_id;
  
  // Backend calculates cost based on duration
  const cost = await FalAiService.calculateCostByModel(
    modelId, 
    numVideos, 
    videoDuration  // ✅ Duration passed to backend
  );
  
  // Deduct correct amount
  await FalAiService.deductCredits(userId, cost, `video ${videoDuration}s`);
}
```

## 📱 Frontend Implementation

### `/public/js/dashboard-generation.js`

```javascript
function calculateCreditCost() {
  const selectedModel = getSelectedModel();
  const duration = getSelectedDuration(); // 5 or 10
  const quantity = getQuantity();
  
  let baseCost = parseFloat(selectedModel.cost) || 1;
  let costMultiplier = 1.0;
  
  // Per-second video pricing
  if (selectedModel.type === 'video' && 
      selectedModel.pricing_type === 'per_second') {
    
    const maxDuration = selectedModel.max_duration || 20;
    const requestedDuration = duration;
    
    // Scale based on duration
    costMultiplier = requestedDuration / maxDuration;
    
    console.log(`📹 Per-second pricing:`,{
      model: selectedModel.name,
      baseCost: baseCost,
      maxDuration: maxDuration,
      requested: requestedDuration,
      multiplier: costMultiplier,
      finalCost: (baseCost * costMultiplier).toFixed(1)
    });
  }
  
  const adjustedCost = baseCost * costMultiplier;
  const totalCost = adjustedCost * quantity;
  
  // Update UI
  updateCreditDisplay(totalCost);
}
```

## 📝 Model Configuration Examples

### Per-Second Models

```sql
-- Sora 2: $0.75/20s = $0.0375/s
INSERT INTO ai_models (name, type, fal_price, pricing_type, max_duration, cost)
VALUES ('Sora 2', 'video', 0.75, 'per_second', 20, 7.5);
-- Cost: $0.75 × 10 = 7.5 credits for full 20s
-- 5s: 7.5 × (5/20) = 1.875 ≈ 1.9 credits
-- 10s: 7.5 × (10/20) = 3.75 ≈ 3.8 credits
-- 20s: 7.5 × (20/20) = 7.5 credits

-- Runway Gen-3: Per-second pricing
UPDATE ai_models
SET 
  pricing_type = 'per_second',
  max_duration = 10,
  cost = (fal_price * 10)  -- Cost for 10s
WHERE name = 'Runway Gen-3';
```

### Flat-Rate Models

```sql
-- Kling 2.5: Flat $0.20 regardless of duration
INSERT INTO ai_models (name, type, fal_price, pricing_type, max_duration, cost)
VALUES ('Kling 2.5 Standard', 'video', 0.20, 'flat', 10, 2.0);
-- Cost: $0.20 × 10 = 2.0 credits
-- 5s: 2.0 credits (same)
-- 10s: 2.0 credits (same)
-- Any duration: 2.0 credits (same)

-- Haiper AI: Flat rate
UPDATE ai_models
SET 
  pricing_type = 'flat',
  cost = (fal_price * 10)  -- Fixed cost
WHERE name LIKE 'Haiper%';
```

## 🎯 Price Calculation Flow

### Scenario: User generates 10s video with Sora 2

```
1. User Interface
   ├─ Model: Sora 2
   ├─ Duration: 10s (selected)
   └─ Quantity: 1x

2. Frontend Calculation
   ├─ Model data: { cost: 7.5, pricing_type: 'per_second', max_duration: 20 }
   ├─ Duration multiplier: 10 / 20 = 0.5
   ├─ Adjusted cost: 7.5 × 0.5 = 3.75
   └─ Display: "3.8 Credits" (rounded)

3. User clicks "Generate"

4. Backend API
   ├─ Receives: { model_id: 22, duration: 10, quantity: 1 }
   ├─ Fetches model from DB
   ├─ Calculates: 7.5 × (10/20) × 1 = 3.75 credits
   ├─ Deducts: 3.75 credits from user
   └─ Generates video

5. Verification
   ├─ Frontend said: 3.8 credits
   ├─ Backend charged: 3.75 credits
   └─ ✅ MATCH (minor rounding difference OK)
```

### Scenario: User generates 5s video with Kling 2.5

```
1. User Interface
   ├─ Model: Kling 2.5 Standard
   ├─ Duration: 5s (selected)
   └─ Quantity: 1x

2. Frontend Calculation
   ├─ Model data: { cost: 2.0, pricing_type: 'flat', max_duration: 10 }
   ├─ Duration multiplier: 1.0 (flat rate!)
   ├─ Adjusted cost: 2.0 × 1.0 = 2.0
   └─ Display: "2.0 Credits"

3. Backend API
   ├─ Receives: { model_id: 34, duration: 5, quantity: 1 }
   ├─ Calculates: 2.0 × 1.0 × 1 = 2.0 credits (no duration scaling)
   ├─ Deducts: 2.0 credits
   └─ ✅ Same cost for any duration
```

## ✅ Verification

### Test Query: Compare 5s vs 10s Costs

```sql
SELECT 
  name,
  cost as base_cost,
  pricing_type,
  max_duration,
  
  -- Cost for 5s video
  CASE 
    WHEN pricing_type = 'per_second' THEN 
      ROUND((cost * (5.0 / max_duration))::numeric, 1)
    ELSE cost
  END as cost_5s,
  
  -- Cost for 10s video
  CASE 
    WHEN pricing_type = 'per_second' THEN 
      ROUND((cost * (10.0 / max_duration))::numeric, 1)
    ELSE cost
  END as cost_10s,
  
  -- Difference
  CASE 
    WHEN pricing_type = 'per_second' THEN 'Different ✅'
    ELSE 'Same (flat) ℹ️'
  END as pricing_behavior
  
FROM ai_models
WHERE type = 'video' AND is_active = true
ORDER BY pricing_type DESC, name;
```

### Expected Output:

```
| Model              | Base | Type       | Max | 5s   | 10s  | Behavior         |
|--------------------|------|------------|-----|------|------|------------------|
| Sora 2             | 7.5  | per_second | 20  | 1.9  | 3.8  | Different ✅     |
| Runway Gen-3       | 10.0 | per_second | 10  | 5.0  | 10.0 | Different ✅     |
| Kling 2.5 Standard | 2.0  | flat       | 10  | 2.0  | 2.0  | Same (flat) ℹ️   |
| Haiper AI          | 1.2  | flat       | 4   | 1.2  | 1.2  | Same (flat) ℹ️   |
```

## 🐛 Troubleshooting

### Problem: All videos show same cost for 5s and 10s

**Cause:** Models set to `pricing_type = 'flat'`

**Solution:**
```sql
-- Check current pricing types
SELECT name, pricing_type FROM ai_models WHERE type = 'video';

-- Update to per-second if needed
UPDATE ai_models 
SET pricing_type = 'per_second'
WHERE name IN ('Sora 2', 'Runway Gen-3') AND type = 'video';
```

### Problem: Frontend shows different cost than backend charges

**Cause:** Duration not passed to backend

**Solution:**
```javascript
// ✅ Correct: Pass duration to backend
fetch('/api/generate-video', {
  method: 'POST',
  body: JSON.stringify({
    model_id: modelId,
    quantity: quantity,
    duration: duration  // ← REQUIRED for per-second pricing
  })
});
```

### Problem: Per-second model shows wrong cost

**Possible Causes:**
1. ❌ `max_duration` not set in database
2. ❌ `cost` is for 1s instead of max_duration
3. ❌ Frontend not reading `pricing_type`

**Solution:**
```sql
-- Fix max_duration and cost
UPDATE ai_models
SET 
  max_duration = 20,
  cost = (fal_price * max_duration * 10)  -- Cost for full duration
WHERE name = 'Sora 2';
```

## 📚 FAL.AI Pricing Reference

### Per-Second Models (from FAL.AI):

| Model | FAL Price | Per Second | Max Duration |
|-------|-----------|------------|--------------|
| Sora 2 | $0.75/20s | $0.0375/s | 20s |
| Runway Gen-3 | Variable | Per-second | 10s |
| Luma Dream | Variable | Per-second | 10s |

### Flat-Rate Models (from FAL.AI):

| Model | FAL Price | Any Duration |
|-------|-----------|--------------|
| Kling 2.5 | $0.20 | Fixed |
| Haiper AI | $0.12 | Fixed |
| Most others | Variable | Fixed |

## 🎉 Summary

✅ **Per-second models:** Different prices for 5s vs 10s  
✅ **Flat-rate models:** Same price regardless of duration  
✅ **Database:** Stores `pricing_type` and `max_duration`  
✅ **Backend:** Calculates cost based on actual duration  
✅ **Frontend:** Shows accurate preview before generation  
✅ **Sync:** Always matches FAL.AI pricing structure  

**Result:** Video pricing accurately reflects FAL.AI's duration-based costs! 🎊

---

**Related Documentation:**
- `SIMPLE_PRICING_FORMULA.md` - Base pricing formula
- `PRICING_SYNC_SYSTEM.md` - Price synchronization
- `FAL_AI_OFFICIAL_PRICING_2025.md` - FAL.AI pricing details

**Last Updated:** October 26, 2025

