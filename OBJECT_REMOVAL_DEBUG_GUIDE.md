# 🔍 Object Removal Model - Debug Guide

**Date:** October 30, 2025  
**Issue:** Model `fal-ai/image-editing/object-removal` tidak bekerja dengan baik  
**Status:** 🔧 **DEBUGGING**

---

## 🔴 **Problem:**

User melaporkan bahwa model `fal-ai/image-editing/object-removal` **tidak bekerja dengan baik**, dan mungkin ada kesalahan di **input prompt**.

---

## 🛠️ **Perbaikan yang Sudah Dilakukan:**

### **1. Enhanced Logging untuk Object Removal**

Added detailed logging ketika object-removal model digunakan:

```javascript
if (model.includes('object-removal')) {
  console.log('🎯 Object Removal Model:');
  console.log('   - Image URL provided:', !!image_url);
  console.log('   - Prompt:', prompt || 'No prompt');
  console.log('   ⚠️  Note: Model may require mask/coordinates instead of text');
  
  // Add default prompt if empty
  if (!prompt || prompt.trim() === '') {
    input.prompt = 'Remove unwanted object from image';
    console.log('   ✏️  Using default prompt');
  }
}
```

### **2. Enhanced Error Messages**

Added comprehensive error messages untuk debugging:

```javascript
if (model.includes('object-removal')) {
  console.error('🔴 OBJECT REMOVAL MODEL ERROR');
  console.error('Model:', model);
  console.error('Error:', error.message);
  console.error('💡 Possible Solutions:');
  console.error('   1. Model may require different parameters');
  console.error('   2. Try more specific prompt');
  console.error('   3. Model may need mask/coordinates');
  console.error('   4. Check if model expects "text" instead of "prompt"');
}
```

---

## 🧪 **How to Debug:**

### **Step 1: Restart Server dengan Logging Enabled**

```bash
npm run dev
```

### **Step 2: Test Object Removal**

1. Go to Dashboard
2. Select type: **"Edit Image"**
3. Select model: **"Object Removal"** (`fal-ai/image-editing/object-removal`)
4. Upload image dengan objek yang jelas (contoh: person, car, building)
5. Try different prompts:
   - **Option A:** "Remove person"
   - **Option B:** "Remove the car in the center"
   - **Option C:** Leave empty (use default)
6. Click **"Generate"**

### **Step 3: Check Server Console**

Look for these log messages:

```
🛠️  Image editing model detected - using minimal parameters
🎯 Object Removal Model:
   - Image URL provided: true
   - Prompt: "Remove person"
   ⚠️  Note: If this fails, model may require mask/coordinates instead of text prompt

🎨 Calling FAL.AI model: fal-ai/image-editing/object-removal
   Input params: {
     "prompt": "Remove person",
     "image_url": "data:image/jpeg;base64,..."
   }
```

### **Step 4: Check for Errors**

If error occurs, look for:

```
🔴 OBJECT REMOVAL MODEL ERROR
═══════════════════════════════════════════════
Model: fal-ai/image-editing/object-removal
Error: [Error message from FAL.AI]

💡 Possible Solutions:
   1. Model may require different parameters than prompt
   2. Try using a more specific prompt
   3. Model may need mask/coordinates instead of text
   4. Check if model expects "text" instead of "prompt"
═══════════════════════════════════════════════
```

**IMPORTANT:** Copy the full error message (especially validation errors) to understand what FAL.AI expects!

---

## 🔬 **Possible Parameter Formats:**

Object removal models can work in different ways:

### **Format 1: Text-Based (Current Implementation)**
```javascript
{
  image_url: "data:image/jpeg;base64,...",
  prompt: "Remove person in red shirt"
}
```

### **Format 2: Text Field Instead of Prompt**
```javascript
{
  image_url: "data:image/jpeg;base64,...",
  text: "Remove person"  // Instead of "prompt"
}
```

### **Format 3: Coordinate-Based**
```javascript
{
  image_url: "data:image/jpeg;base64,...",
  point_coords: [[x, y]],  // Click coordinates
  point_labels: [1]         // 1 = foreground, 0 = background
}
```

### **Format 4: Mask-Based**
```javascript
{
  image_url: "data:image/jpeg;base64,...",
  mask_url: "data:image/png;base64,..."  // Mask image
}
```

### **Format 5: Auto-Detection (No Prompt)**
```javascript
{
  image_url: "data:image/jpeg;base64,..."
  // Model automatically detects and removes objects
}
```

---

## 📋 **Debugging Checklist:**

When testing, collect this information:

- [ ] **Model ID:** `fal-ai/image-editing/object-removal`
- [ ] **Prompt Used:** (what you typed)
- [ ] **Error Status Code:** (422, 500, etc)
- [ ] **Error Message:** (full message from FAL.AI)
- [ ] **Validation Errors:** (if status 422, what fields are invalid?)
- [ ] **Image Size:** (width x height)
- [ ] **Image Format:** (JPEG, PNG, etc)

---

## 🎯 **Next Steps Based on Error:**

### **If Error: "prompt is not valid"**
Try changing parameter name:
```javascript
// Change from:
input.prompt = "Remove person";

// To:
input.text = "Remove person";
// OR
delete input.prompt; // Remove prompt completely
```

### **If Error: "missing required field"**
Check what field is missing and add it:
```javascript
// Example: If it requires "point_coords"
input.point_coords = [[100, 100]];
input.point_labels = [1];
```

### **If Error: "invalid parameter"**
Remove the prompt and try image-only:
```javascript
delete input.prompt;
// Only send image_url
```

---

## 💡 **Temporary Workaround:**

If object-removal model doesn't work with prompt, consider these alternatives:

### **Option 1: Use FLUX Inpainting Instead**
```javascript
Model: fal-ai/flux-pro/inpainting
Prompt: "Remove [object name] from image"
// This model definitely works with text prompts
```

### **Option 2: Use Background Removal + Mask**
```javascript
// Step 1: Remove background
Model: fal-ai/imageutils/rembg

// Step 2: Manual masking (future feature)
// Or use other editing tools
```

### **Option 3: Wait for API Documentation**
Check FAL.AI documentation at:
- https://fal.ai/models/fal-ai/image-editing/object-removal/api
- Look for "Playground" or "Try it" section
- See actual working parameters

---

## 📝 **How to Report Findings:**

After testing, please provide:

1. **Console logs** (full output with errors)
2. **Exact prompt** you used
3. **Error message** from FAL.AI (especially validation errors)
4. **Screenshot** of the error (if any)

This will help us fix the exact parameter format needed!

---

## ✅ **If It Works:**

If object-removal starts working after these changes, document:

1. **What prompt format worked?**
   - Example: "Remove [object]"
   - Example: "Delete [object] from image"
   
2. **Any special parameters needed?**
   - Did you need to add anything besides image_url and prompt?

3. **Limitations discovered?**
   - Does it only work with certain object types?
   - Does it need specific prompt format?

---

## 🚀 **Testing Commands:**

```bash
# Restart server
npm run dev

# Watch logs
tail -f logs/app.log  # if you have logging

# Test with different prompts
# Try: "Remove person"
# Try: "Delete car"
# Try: "Erase building"
# Try: "" (empty, use default)
```

---

## 📊 **Expected vs Actual:**

| Step | Expected | Actual (Fill This In) |
|------|----------|----------------------|
| Upload image | ✅ Success | ? |
| Set prompt | ✅ "Remove person" | ? |
| Call FAL.AI | ✅ Processing | ? |
| Receive result | ✅ Object removed | ? |
| Display result | ✅ Shown to user | ? |

---

## 🔄 **Update This Guide:**

After successful testing, update this file with:
- ✅ Confirmed working parameter format
- ✅ Example prompts that work
- ✅ Any limitations or gotchas
- ✅ Mark as **RESOLVED**

---

**Last Updated:** October 30, 2025  
**Status:** Awaiting test results with enhanced logging

