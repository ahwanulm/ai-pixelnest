# 🔧 Model ID Fix - FAL.AI Integration

> **Fixed: "Invalid app id: 12. Must be in the format <appOwner>/<appId>"**

---

## ❌ Problem

Error terjadi saat generate image/video:
```
POST http://localhost:5005/api/generate/image/generate 500 (Internal Server Error)

Error: Failed to generate image: Invalid app id: 12. 
Must be in the format <appOwner>/<appId>
```

### Root Cause

**Frontend mengirim database ID (integer) ke FAL.AI, bukan model_id format FAL.AI**

```javascript
// ❌ WRONG: models-loader.js (line 155 & 189)
option.value = model.id;  // Database ID: 12

// Result sent to backend:
{ model: "12" }  // ❌ Integer ID

// FAL.AI expects:
{ model: "fal-ai/flux-pro" }  // ✅ FAL.AI format
```

---

## ✅ Solution

### Frontend Fix: `public/js/models-loader.js`

Changed dropdown option values to use **FAL.AI model_id** instead of database ID:

#### Image Models (Line 153-166)
```javascript
// BEFORE ❌
option.value = model.id;  // Database ID (12, 13, etc.)

// AFTER ✅
option.value = model.model_id;  // FAL.AI model_id ("fal-ai/flux-pro")
option.dataset.dbId = model.id;  // Store DB ID for reference
```

#### Video Models (Line 188-205)
```javascript
// BEFORE ❌
option.value = model.id;  // Database ID

// AFTER ✅
option.value = model.model_id;  // FAL.AI model_id ("fal-ai/kling-video/v1/...")
option.dataset.dbId = model.id;  // Store DB ID for reference
```

---

## 🔍 How It Works Now

### 1. Frontend (models-loader.js)

**Populate Dropdown:**
```javascript
models.forEach((model, index) => {
  const option = document.createElement('option');
  
  // ✅ Use FAL.AI model_id as value
  option.value = model.model_id;  // "fal-ai/flux-pro"
  
  // Store full model data
  option.dataset.modelData = JSON.stringify(model);
  option.dataset.dbId = model.id;  // Keep DB ID for reference
  
  select.appendChild(option);
});
```

**User Selects Model:**
```javascript
<select id="image-model-select">
  <option value="fal-ai/flux-pro">FLUX Pro 🔥 - 1.1 credits</option>
  <option value="fal-ai/flux-realism">FLUX Realism 🔥 - 1.1 credits</option>
  <option value="fal-ai/recraft-v3">Recraft V3 🔥 - 0.8 credits</option>
</select>
```

### 2. Generate Button Click (dashboard-generation.js)

```javascript
const modelSelect = document.getElementById('image-model-select');
const model = modelSelect ? modelSelect.value : 'fal-ai/flux-pro';

// ✅ model now contains FAL.AI format
console.log(model);  // "fal-ai/flux-pro"

formData.append('model', model);
```

### 3. Backend (generationController.js)

```javascript
const { model } = req.body;
// ✅ Receives: "fal-ai/flux-pro"

// Calculate cost from database
const cost = await FalAiService.calculateCostByModel(model, numImages);

// Generate with FAL.AI
result = await FalAiService.generateImage({
  prompt,
  model,  // ✅ "fal-ai/flux-pro" - correct format!
  aspectRatio,
  numImages
});
```

### 4. FAL.AI Service (falAiService.js)

```javascript
async getCostFromDatabase(modelId) {
  // ✅ Smart query: handles both DB ID and model_id
  const result = await pool.query(
    `SELECT cost, pricing_type, max_duration, type, name, fal_price 
     FROM ai_models 
     WHERE id::text = $1::text OR model_id::text = $1::text
     LIMIT 1`,
    [modelId.toString()]  // "fal-ai/flux-pro"
  );
  
  return result.rows[0];
}

async generateImage(options) {
  await configureFalAi();
  
  // ✅ Send to FAL.AI with correct format
  const result = await fal.subscribe(options.model, {
    input: {
      prompt: options.prompt,
      image_size: aspectRatioMap[options.aspectRatio],
      num_images: options.numImages
    }
  });
}
```

---

## 📊 Data Flow Comparison

### Before (❌ Broken)

```
Database:
┌────┬──────────────────┬───────────────┐
│ id │    model_id      │     name      │
├────┼──────────────────┼───────────────┤
│ 12 │ fal-ai/flux-pro  │ FLUX Pro 🔥   │
└────┴──────────────────┴───────────────┘

Dropdown:
<option value="12">FLUX Pro 🔥</option>
           ↓
Frontend sends: { model: "12" }
           ↓
Backend receives: "12"
           ↓
FAL.AI receives: "12"
           ↓
❌ ERROR: Invalid app id: 12
```

### After (✅ Fixed)

```
Database:
┌────┬──────────────────┬───────────────┐
│ id │    model_id      │     name      │
├────┼──────────────────┼───────────────┤
│ 12 │ fal-ai/flux-pro  │ FLUX Pro 🔥   │
└────┴──────────────────┴───────────────┘

Dropdown:
<option value="fal-ai/flux-pro" data-db-id="12">FLUX Pro 🔥</option>
           ↓
Frontend sends: { model: "fal-ai/flux-pro" }
           ↓
Backend receives: "fal-ai/flux-pro"
           ↓
Backend queries DB: WHERE model_id = "fal-ai/flux-pro"
           ↓
FAL.AI receives: "fal-ai/flux-pro"
           ↓
✅ SUCCESS: Image generated!
```

---

## 🎯 Benefits

### 1. Correct FAL.AI Integration
```
✅ FAL.AI receives proper model_id format
✅ No more "Invalid app id" errors
✅ Direct compatibility with FAL.AI API
```

### 2. Backend Flexibility
```
✅ Backend query handles BOTH formats:
   - model_id: "fal-ai/flux-pro"
   - id: "12"
✅ Backward compatible
✅ Future-proof
```

### 3. Data Integrity
```
✅ Dropdown value = FAL.AI model_id (source of truth)
✅ DB ID stored in data-attribute (for reference)
✅ Full model data in dataset.modelData
```

---

## 🔧 Testing

### Test Case 1: Image Generation
```javascript
// Select model
document.getElementById('image-model-select').value = 'fal-ai/flux-pro';

// Check value
console.log(select.value);
// Expected: "fal-ai/flux-pro" ✅

// Generate
Click "Run" button

// Expected result:
// ✅ Request to FAL.AI succeeds
// ✅ Image generated successfully
// ✅ Credits deducted correctly
```

### Test Case 2: Video Generation
```javascript
// Select model
document.getElementById('video-model-select').value = 'fal-ai/kling-video/v1/standard/text-to-video';

// Check value
console.log(select.value);
// Expected: "fal-ai/kling-video/v1/standard/text-to-video" ✅

// Generate
Click "Run" button

// Expected result:
// ✅ Request to FAL.AI succeeds
// ✅ Video generated successfully
// ✅ Credits deducted correctly
```

### Test Case 3: Cost Calculation
```javascript
// Backend receives model_id
const cost = await FalAiService.calculateCostByModel('fal-ai/flux-pro', 1);

// Expected:
console.log(cost);  // 1.1 credits ✅

// Database query works:
// SELECT cost FROM ai_models WHERE model_id = 'fal-ai/flux-pro'
// Returns: 1.1
```

---

## 🐛 Debugging

### Check Dropdown Values
```javascript
// Open browser console
const select = document.getElementById('image-model-select');
console.log('Options:', Array.from(select.options).map(o => ({
  value: o.value,
  dbId: o.dataset.dbId,
  text: o.textContent
})));

// Expected output:
// [
//   { value: "fal-ai/flux-pro", dbId: "12", text: "FLUX Pro 🔥 - 1.1 credits" },
//   { value: "fal-ai/flux-realism", dbId: "13", text: "FLUX Realism 🔥 - 1.1 credits" },
//   ...
// ]
```

### Check FormData Sent
```javascript
// In dashboard-generation.js, add console.log before fetch:
console.log('Sending to backend:', {
  prompt: formData.get('prompt'),
  model: formData.get('model'),  // Should be FAL.AI format
  quantity: formData.get('quantity')
});
```

### Check Backend Receives
```javascript
// In generationController.js:
console.log('Received model:', req.body.model);
// Expected: "fal-ai/flux-pro" ✅
// NOT: "12" ❌
```

### Check Database Query
```javascript
// In falAiService.js getCostFromDatabase:
console.log('Querying for model_id:', modelId);
// Expected: "fal-ai/flux-pro" ✅
```

---

## 📝 Files Modified

1. **`public/js/models-loader.js`**
   - Line 155: `option.value = model.model_id;`
   - Line 159: `option.dataset.dbId = model.id;`
   - Line 190: `option.value = model.model_id;`
   - Line 198: `option.dataset.dbId = model.id;`

2. **Backend (already compatible)**
   - `src/services/falAiService.js` - getCostFromDatabase handles both formats
   - `src/controllers/generationController.js` - receives model_id correctly

---

## ✅ Summary

**Problem:**
- Dropdown sent database ID (12) instead of FAL.AI model_id

**Solution:**
- Changed dropdown value to use `model.model_id` (FAL.AI format)
- Kept database ID in `data-db-id` attribute for reference

**Result:**
- ✅ FAL.AI receives correct model format
- ✅ No more "Invalid app id" errors
- ✅ Image/video generation works!
- ✅ Cost calculation accurate
- ✅ Backward compatible with backend

---

**🎉 Issue Resolved! Generation now works correctly with FAL.AI API.**

