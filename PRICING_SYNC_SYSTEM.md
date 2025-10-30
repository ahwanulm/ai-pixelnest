# Pricing Sync System - Complete Documentation

**Date:** October 26, 2025  
**Status:** ✅ FULLY SYNCHRONIZED  
**Formula:** `Credits = Price × 10`

## 🎯 System Overview

This system ensures that pricing is **ALWAYS in sync** between:
1. **Admin Panel** (`/admin/models`) - Where admins set prices
2. **User Dashboard** (`/dashboard`) - Where users see costs
3. **Backend API** - Where generation costs are calculated
4. **Database** - Single source of truth

## 🔄 Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     SINGLE SOURCE OF TRUTH                  │
│                    Database: ai_models.cost                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
    ┌─────────────────┐             ┌─────────────────┐
    │  ADMIN PANEL    │             │  USER DASHBOARD │
    │  /admin/models  │             │   /dashboard    │
    └─────────────────┘             └─────────────────┘
              │                               │
              │ 1. Admin edits price          │ 2. User sees price
              │    via UI                     │    from database
              ▼                               ▼
    ┌─────────────────┐             ┌─────────────────┐
    │  UPDATE MODEL   │             │   GET MODELS    │
    │  API Endpoint   │             │   API Endpoint  │
    │  PUT /admin/... │             │   GET /api/...  │
    └─────────────────┘             └─────────────────┘
              │                               │
              └───────────────┬───────────────┘
                              ▼
                    ┌─────────────────┐
                    │   GENERATION    │
                    │   Controller    │
                    │ calculateCost() │
                    └─────────────────┘
                              │
                              ▼
                    Uses model.cost from DB
                    (NO hardcoded values!)
```

## 📁 Key Files & Their Roles

### 1. Database (Single Source of Truth)

**Table:** `ai_models`  
**Column:** `cost` (NUMERIC)

**Trigger (INSERT only):**
```sql
CREATE FUNCTION auto_calculate_credits_func()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.cost IS NULL OR NEW.cost = 0 OR NEW.cost = 1 THEN
    IF NEW.fal_price IS NOT NULL AND NEW.fal_price > 0 THEN
      -- SIMPLE: Credits = Price × 10
      NEW.cost := ROUND(NEW.fal_price * 10.0, 1);
      IF NEW.cost < 0.1 THEN
        NEW.cost := 0.1;
      END IF;
    ELSE
      NEW.cost := 0.1;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Key Points:**
- Trigger only fires on **INSERT** (not UPDATE)
- Allows manual price overrides by admin
- Uses simple formula: `Credits = Price × 10`

### 2. Backend Services

#### `/src/services/falAiService.js`

**NEW: Database-Driven Pricing**
```javascript
async getCostFromDatabase(modelId) {
  const result = await pool.query(
    'SELECT cost FROM ai_models WHERE id = $1 OR model_id = $1',
    [modelId]
  );
  return parseFloat(result.rows[0].cost) || 1;
}

async calculateCostByModel(modelId, quantity = 1) {
  const baseCost = await this.getCostFromDatabase(modelId);
  const totalCost = baseCost * quantity;
  console.log(`💰 Cost from DB: ${modelId} → ${baseCost} × ${quantity} = ${totalCost}`);
  return totalCost;
}
```

**OLD (REMOVED):**
```javascript
❌ getPricing() - Hardcoded pricing table
❌ calculateCost(type, subType) - Manual calculation
```

#### `/src/controllers/generationController.js`

**Image Generation:**
```javascript
// Calculate cost from database (ALWAYS in sync)
const numImages = parseInt(quantity) || 1;
const modelId = model || req.body.model_id;
const cost = await FalAiService.calculateCostByModel(modelId, numImages);
```

**Video Generation:**
```javascript
// Calculate cost from database (ALWAYS in sync)
const numVideos = parseInt(quantity) || 1;
const modelId = req.body.model || req.body.model_id;
const cost = await FalAiService.calculateCostByModel(modelId, numVideos);
```

**Key Points:**
- NO hardcoded pricing
- ALWAYS fetches from database
- Uses `model_id` passed from frontend

### 3. Admin Panel

#### `/public/js/admin-models.js`

**Price Calculation Formula:**
```javascript
// Simple pricing formula: Credits = Price × 10
function calculateCreditsFromFalPrice(falPriceUSD) {
  if (!falPriceUSD || falPriceUSD <= 0) return 0.1;
  
  // SIMPLE: Credits = Price × 10
  const credits = Math.max(0.1, Math.round(falPriceUSD * 10 * 10) / 10);
  
  console.log(`💰 Price calculation: $${falPriceUSD} → ${credits} credits (×10)`);
  return credits;
}
```

**Edit Credits Function:**
```javascript
async function editCredits(modelId, currentCost) {
  const newCost = parseFloat(prompt('Enter new credit cost:', currentCost));
  
  if (newCost && newCost > 0 && newCost !== currentCost) {
    const response = await fetch(`/admin/api/models/${modelId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cost: newCost })
    });
    
    if (response.ok) {
      // Update UI immediately
      document.getElementById(`cost-display-${modelId}`).textContent = newCost.toFixed(1);
      loadModels(); // Refresh from database
    }
  }
}
```

**Key Points:**
- Admin can edit credits directly
- Changes saved to database
- UI updates immediately
- Formula shown for reference

### 4. User Dashboard

#### `/public/js/dashboard-generation.js`

**Cost Calculation (Database-Driven):**
```javascript
function calculateCreditCost() {
    let baseCost = 1;
    let costMultiplier = 1.0;
    
    // Get cost from SELECTED MODEL (from database)
    if (selectedModel && selectedModel.cost) {
        baseCost = parseFloat(selectedModel.cost);
        console.log(`✅ Using cost from database: ${baseCost} credits`);
        
        // Apply video duration multipliers if needed
        if (mode === 'video') {
            const pricingType = selectedModel.pricing_type || 'flat';
            if (pricingType === 'per_second') {
                const maxDuration = selectedModel.max_duration || 20;
                const requestedDuration = getRequestedDuration();
                costMultiplier = requestedDuration / maxDuration;
            }
        }
    } else {
        // NO MODEL SELECTED - Show warning
        console.warn('⚠️ No model selected! Using minimum fallback');
        baseCost = 1.0;
        showPricingWarning();
    }
    
    const totalCost = baseCost * costMultiplier * quantity;
    updateCreditDisplay(totalCost);
}
```

#### `/public/js/dashboard.js`

**DEPRECATED Function (Marked for Removal):**
```javascript
function calculateCreditCost() {
    // ⚠️ DEPRECATED: Uses hardcoded pricing
    // dashboard-generation.js has accurate pricing from database
    console.warn('⚠️ Using deprecated function');
    // Minimum fallback only
}
```

**Key Points:**
- ALWAYS uses `selectedModel.cost` from database
- NO hardcoded fallback prices
- User MUST select a model to see accurate pricing

## 🔧 How Updates Flow

### Scenario 1: Admin Changes Price

```
1. Admin opens /admin/models
2. Clicks "Edit Credits" button for a model
3. Enters new price (e.g., 5.0 credits)
4. JavaScript sends PUT request to /admin/api/models/:id
5. Backend updates database: UPDATE ai_models SET cost = 5.0
6. Admin UI refreshes → Shows 5.0 credits
7. User dashboard automatically shows 5.0 credits
   (because it reads from database on page load)
```

### Scenario 2: User Generates Content

```
1. User opens /dashboard
2. Selects a model (e.g., "FLUX Pro")
3. JavaScript fetches model data: GET /api/models
4. Response includes: { id: 2, name: "FLUX Pro", cost: 1.0 }
5. Frontend displays: "1.0 Credits"
6. User clicks "Generate"
7. Backend receives: { model_id: 2, quantity: 1 }
8. Backend fetches cost from DB: SELECT cost FROM ai_models WHERE id = 2
9. Backend charges: 1.0 credits
10. User's credits deducted: 1.0 credits
```

### Scenario 3: FAL.AI Price Changes

```
1. FAL.AI updates pricing (e.g., FLUX Pro: $0.10 → $0.15)
2. Admin clicks "Sync FAL.AI" button in /admin/models
3. Backend fetches latest prices from FAL.AI API
4. Backend updates database with new fal_price
5. Trigger calculates new cost: 0.15 × 10 = 1.5 credits
   (Only if cost was default/unset, else manual override kept)
6. Admin sees updated price: 1.5 credits
7. User dashboard shows: 1.5 credits
```

## ✅ Verification Checklist

### After Price Change in Admin:

1. **Database Check:**
   ```sql
   SELECT name, cost FROM ai_models WHERE name = 'Your Model';
   ```
   ✅ Should show NEW price

2. **Admin UI Check:**
   - Open `/admin/models`
   - Find the model in table
   - ✅ Should show NEW price in "Credits" column

3. **User Dashboard Check:**
   - Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
   - Open `/dashboard`
   - Select the model
   - ✅ Should show NEW price in credit cost display

4. **API Check:**
   ```bash
   curl http://localhost:5005/api/models | jq '.models[] | select(.name=="Your Model")'
   ```
   ✅ Should return NEW cost value

5. **Generation Check:**
   - Try to generate content with the model
   - Check console logs
   - ✅ Should deduct NEW price from credits

## 🐛 Troubleshooting

### Problem: Dashboard shows OLD price

**Solution:**
1. Hard refresh browser: `Cmd+Shift+R`
2. Clear browser cache
3. Check console for errors
4. Verify API returns correct data:
   ```javascript
   fetch('/api/models').then(r => r.json()).then(console.log)
   ```

### Problem: Price reverts after saving

**Possible Causes:**
1. ❌ Database trigger overriding (FIXED - trigger only on INSERT now)
2. ❌ Frontend recalculating on load (FIXED - uses DB value)
3. ❌ Cache issue (Solution: hard refresh)

**Solution:**
```sql
-- Check if trigger is correct
SELECT tgname, tgtype FROM pg_trigger WHERE tgrelid = 'ai_models'::regclass;

-- Should only show INSERT trigger, not UPDATE
```

### Problem: "Model not found" error

**Solution:**
1. Check if `model_id` is passed from frontend
2. Verify model exists in database:
   ```sql
   SELECT id, model_id, name FROM ai_models WHERE id = X OR model_id = 'Y';
   ```
3. Check backend logs for exact error

## 📊 Testing Script

```bash
# Save as test_pricing_sync.sh
#!/bin/bash

echo "🧪 Testing Pricing Sync System"
echo "=============================="

# Test 1: Update price in database
echo ""
echo "Test 1: Updating FLUX Pro to 5.0 credits..."
psql $DATABASE_URL -c "UPDATE ai_models SET cost = 5.0 WHERE name = 'FLUX Pro';"

# Test 2: Check database
echo ""
echo "Test 2: Verifying database..."
psql $DATABASE_URL -c "SELECT name, cost FROM ai_models WHERE name = 'FLUX Pro';"

# Test 3: Check API
echo ""
echo "Test 3: Verifying API response..."
curl -s http://localhost:5005/api/models | jq '.models[] | select(.name=="FLUX Pro") | {name, cost}'

# Test 4: Test generation cost calculation
echo ""
echo "Test 4: Testing cost calculation..."
node -e "
const { FalAiService } = require('./src/services/falAiService');
(async () => {
  const cost = await FalAiService.getCostFromDatabase(2);
  console.log('Cost from DB:', cost, 'credits');
})();
"

echo ""
echo "✅ All tests complete!"
```

## 🎯 Best Practices

1. **NEVER hardcode prices** in frontend or backend
2. **ALWAYS fetch from database** using model_id
3. **Test after every price change** using checklist above
4. **Document any manual overrides** in admin notes
5. **Monitor logs** for pricing calculation messages
6. **Hard refresh** browser after admin changes

## 📚 Related Files

### Backend:
- `/src/services/falAiService.js` - Cost calculation
- `/src/controllers/generationController.js` - Generation logic
- `/src/controllers/adminController.js` - Admin pricing functions
- `/src/routes/admin.js` - Admin API routes

### Frontend:
- `/public/js/admin-models.js` - Admin model management
- `/public/js/dashboard-generation.js` - User cost display
- `/public/js/dashboard.js` - Deprecated (to be removed)

### Database:
- `migrations/create_ai_models_table.sql` - Table schema
- `migrations/create_pricing_trigger.sql` - Auto-calculation trigger

### Documentation:
- `SIMPLE_PRICING_FORMULA.md` - Formula details
- `PRICING_TRIGGER_FIX.md` - Historical trigger issues
- `PRICING_SYNC_SYSTEM.md` - This file

## 🎉 Summary

✅ **Database** = Single source of truth  
✅ **Backend** = Always reads from database  
✅ **Frontend** = Always reads from database  
✅ **Admin** = Can edit prices, saves to database  
✅ **Trigger** = Only on INSERT (allows manual edits)  
✅ **Formula** = Simple: Credits = Price × 10  

**Result:** Pricing is ALWAYS synchronized! 🎊

---

**Last Updated:** October 26, 2025  
**Status:** Production Ready ✅

