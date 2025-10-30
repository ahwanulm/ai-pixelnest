# 🐛 REAL-TIME COST UPDATE - DEBUG GUIDE

## 🔍 DEBUGGING STEPS

### 1. **Open Browser Console** (F12)

### 2. **Refresh Dashboard** (`http://localhost:5005/dashboard`)

### 3. **Check Initial Load**

Expected console output:
```
🔄 Loading models from database...
✅ Loaded models with real pricing: 15
📊 Models by type: {image: 8, video: 7}
🎯 Default model set: [MODEL NAME] (video/image)
💰 Calculating credit cost...
```

### 4. **Change Model in Dropdown**

Expected console output:
```
🔔 Video dropdown changed!
Selected option: <option>
🎬 Video model changed: Veo 3.1 (8.0 credits)
Model ID: 123 Model_ID: fal-ai/veo-3.1
📤 Calling updateSelectedModel with ID: 123
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 updateSelectedModel CALLED
📥 Received modelId: 123 number
📦 Available models: 15
✅ MATCH FOUND: Veo 3.1 via id: 123
✅ Selected model SET: Veo 3.1
💰 Model cost: 8.0
🔄 Calling calculateCreditCost...
💰 Calculating credit cost...
Current mode: video
Selected model: Veo 3.1
💵 Cost breakdown: {...}
✅ Updated credit display: 8.0
✅ Updated breakdown
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## ❌ POSSIBLE ERRORS

### Error 1: No console output when changing model
**Cause:** Event listener not attached
**Fix:** Check if `#video-model-select` or `#image-model-select` exists

### Error 2: "updateSelectedModel not available yet"
**Cause:** Race condition - models-loader.js loaded before dashboard-generation.js
**Fix:** Already handled with retry mechanism

### Error 3: "Model not found"
**Cause:** ID mismatch between dropdown value and database
**Fix:** Check `option.value` vs `model.id` in database

---

## 🧪 MANUAL TESTING COMMANDS

### Check if function exists:
```javascript
console.log(typeof window.updateSelectedModel);
// Should return: 'function'
```

### Get all available models:
```javascript
window.getAvailableModels();
// Should return: Array of 15+ models
```

### Get currently selected model:
```javascript
window.getSelectedModel();
// Should return: {id: X, name: 'Model Name', cost: Y.Y}
```

### Manually trigger update:
```javascript
// Change model to ID 5 (example)
window.updateSelectedModel(5);
```

### Manually recalculate cost:
```javascript
window.calculateCreditCost();
```

---

## 🎯 VERIFICATION CHECKLIST

- [ ] Console shows "Loading models from database..."
- [ ] Console shows "Loaded models with real pricing: X"
- [ ] Default model is set on page load
- [ ] Cost displays correct value on load
- [ ] Changing dropdown triggers console log "🔔 [Type] dropdown changed!"
- [ ] Console shows "updateSelectedModel CALLED"
- [ ] Console shows "MATCH FOUND"
- [ ] Console shows "Updated credit display: X.X"
- [ ] UI updates to show correct cost
- [ ] Breakdown shows correct model name

---

## 🚨 IF STILL NOT WORKING

### Step 1: Check element IDs
```javascript
console.log(document.getElementById('video-model-select'));
console.log(document.getElementById('credit-cost'));
console.log(document.getElementById('credit-breakdown'));
```

### Step 2: Check script load order
```javascript
console.log('models-loader.js loaded:', typeof loadAvailableModels);
console.log('dashboard-generation.js loaded:', typeof window.updateSelectedModel);
```

### Step 3: Force model update
```javascript
// Get first video model
const videoModels = window.getAvailableModels().filter(m => m.type === 'video');
console.log('Video models:', videoModels);
// Update to first one
window.updateSelectedModel(videoModels[0].id);
```

---

## ✅ EXPECTED RESULT

After selecting "Veo 3.1 🔥 - 8.0 credits (10s)":

```
┌─────────────────────────────────────┐
│ Total Cost: 8.0 Credits             │
│ 1x × 8.0 credits (Veo 3.1)          │
└─────────────────────────────────────┘
```

NOT:
```
┌─────────────────────────────────────┐
│ Total Cost: 1.0 Credit              │
│ 1x × 1.0 credits (Dreamina)         │
└─────────────────────────────────────┘
```

---

**If problem persists, send console output screenshot!**
