# FAL.AI Model Parameters Configuration

**Date:** October 27, 2025  
**Status:** ✅ IMPLEMENTED  
**File:** `/src/services/falAiService.js`

## 📋 Overview

This document describes the model-specific parameter configurations implemented in the FAL.AI service. Each model has different parameter requirements based on FAL.AI's official documentation.

---

## 🖼️ IMAGE MODELS

### 1. **FLUX Models** (Black Forest Labs)
**Models:** `fal-ai/flux-pro`, `fal-ai/flux-pro/v1.1`, `fal-ai/flux-dev`, `fal-ai/flux-realism`, `fal-ai/flux-schnell`

**Parameters:**
```javascript
{
  prompt: string,
  image_size: 'square_hd' | 'square' | 'landscape_16_9' | 'portrait_16_9' | 'landscape_4_3' | 'portrait_4_3',
  num_images: number,
  safety_tolerance: '2',
  output_format: 'jpeg'
}
```

**Notes:**
- Uses `image_size` (NOT `aspect_ratio`)
- ⚠️ **Important:** Format is `orientation_WIDTH_HEIGHT` (smaller number first for portrait)
  - `9:16` aspect ratio → `portrait_16_9` (NOT `portrait_9_16`)
  - `3:4` aspect ratio → `portrait_4_3` (NOT `portrait_3_4`)
- Safety tolerance set to '2' for balanced filtering
- Output format standardized to JPEG
- Default to `square_hd` for best quality

---

### 2. **Stable Diffusion / SDXL**
**Models:** `fal-ai/stable-diffusion`, `fal-ai/sdxl`

**Parameters:**
```javascript
{
  prompt: string,
  image_size: 'square' | 'landscape_16_9',
  num_inference_steps: 50
}
```

**Notes:**
- Limited aspect ratio support
- 50 inference steps for quality

---

### 3. **Google Imagen**
**Models:** `fal-ai/imagen-4`

**Parameters:**
```javascript
{
  prompt: string,
  aspect_ratio: '1:1' | '16:9' | '9:16',
  num_images: number (optional)
}
```

**Notes:**
- Uses standard `aspect_ratio` format
- Supports multiple image generation

---

### 4. **Ideogram v2**
**Models:** `fal-ai/ideogram-v2`

**Parameters:**
```javascript
{
  prompt: string,
  aspect_ratio: '1:1' | '16:9' | '9:16',
  magic_prompt_option: 'AUTO'
}
```

**Notes:**
- Magic prompt enhances prompt automatically
- Best for text-in-image generation

---

### 5. **Recraft V3**
**Models:** `fal-ai/recraft-v3`

**Parameters:**
```javascript
{
  prompt: string,
  size: '1024x1024' | '1536x864' | '864x1536' | '1365x1024' | '1024x1365',
  style: 'realistic_image'
}
```

**Notes:**
- Uses explicit width x height format
- Style parameter for output control

---

### 6. **Qwen Image** (Alibaba)
**Models:** `fal-ai/qwen-image`

**Parameters:**
```javascript
{
  prompt: string
}
```

**Notes:**
- Minimal parameters
- Smart defaults built-in

---

### 7. **Generic / Others**
**Models:** Playground, AuraFlow, etc.

**Parameters:**
```javascript
{
  prompt: string,
  aspect_ratio: '1:1' | '16:9' | '9:16' (optional),
  num_images: number (optional)
}
```

**Notes:**
- Generic fallback for unlisted models
- Most models support aspect_ratio

---

## 🎬 VIDEO MODELS

### 1. **Kling Models** (Kuaishou)
**Models:** `fal-ai/kling-video/*`, `fal-ai/kuaishou/kling-video/*`

**Parameters:**
```javascript
{
  prompt: string,
  duration: "5" | "10" | "15",  // STRING format!
  aspect_ratio: '16:9' | '9:16' | '1:1',
  image_url: string (for i2v),
  end_image_url: string (for i2v with end frame)
}
```

**Notes:**
- Duration as STRING (not number)
- Supports image-to-video with `image_url`
- Can have start and end frames

---

### 2. **Google Veo Models**
**Models:** `fal-ai/google/veo-3.1`, `fal-ai/google/veo-3`, `fal-ai/google/veo-2`

**Parameters:**
```javascript
{
  prompt: string,
  duration: 4 | 6 | 8,  // NUMBER format!
  aspect_ratio: '16:9' | '9:16' | '1:1'
}
```

**Notes:**
- Duration as NUMBER (not string)
- Different duration options per model

---

### 3. **Sora Models** (OpenAI)
**Models:** `fal-ai/sora-2`, `fal-ai/sora-2-pro`

**Parameters:**
```javascript
{
  prompt: string,
  duration: number,
  aspect_ratio: '16:9' | '9:16' | '1:1',
  resolution: '1080p'
}
```

**Notes:**
- Includes resolution parameter
- High-quality output

---

### 4. **Runway Gen-3**
**Models:** `fal-ai/runway-gen3/*`

**Parameters:**
```javascript
{
  prompt: string,
  duration: number,
  aspect_ratio: '16:9' | '9:16',
  image: string (for i2v)  // NOT image_url!
}
```

**Notes:**
- Uses `image` parameter (not `image_url`)
- Industry-standard quality

---

### 5. **Luma Dream Machine**
**Models:** `fal-ai/luma-dream-machine`

**Parameters:**
```javascript
{
  prompt: string,
  aspect_ratio: '16:9' | '9:16',
  keyframes: {
    frame0: { type: 'image', url: string }
  }
}
```

**Notes:**
- Uses keyframes for i2v
- Unique parameter structure

---

### 6. **Minimax, Haiper, Pika**
**Models:** `fal-ai/minimax-video`, `fal-ai/haiper-video/*`, `fal-ai/pika-*`

**Parameters:**
```javascript
{
  prompt: string,
  duration: "5" | "10",  // STRING format
  aspect_ratio: '16:9' | '9:16',
  image_url: string (optional)
}
```

**Notes:**
- Generic Chinese AI models
- Duration as string

---

### 7. **Stable Video Diffusion**
**Models:** `fal-ai/stable-video-diffusion`

**Parameters:**
```javascript
{
  image: string,  // REQUIRED!
  prompt: string,
  motion_bucket_id: 127,
  cond_aug: 0.02
}
```

**Notes:**
- Requires image input (image-to-video only)
- Motion control parameters

---

## 🔧 Implementation Details

### Parameter Detection Logic

```javascript
// 1. Check model name/ID
if (model.includes('flux')) {
  // Use FLUX-specific params
}
else if (model.includes('dreamina')) {
  // Use minimal params
}
// ... etc
```

### Aspect Ratio Mapping

```javascript
// FLUX models (format: orientation_WIDTH_HEIGHT)
'1:1'  → 'square_hd'      // High-def square (preferred over 'square')
'16:9' → 'landscape_16_9' // Wide landscape
'9:16' → 'portrait_16_9'  // Tall portrait ⚠️ NOTE: 16_9 NOT 9_16!
'4:3'  → 'landscape_4_3'  // Standard landscape
'3:4'  → 'portrait_4_3'   // Standard portrait ⚠️ NOTE: 4_3 NOT 3_4!

// Recraft models
'1:1'  → '1024x1024'
'16:9' → '1536x864'
'9:16' → '864x1536'
// ... etc
```

### Error Handling

All model calls include:
- Detailed input parameter logging
- 422 Validation error detection
- Field-specific error messages
- Model-specific error context

---

## 📝 Usage Examples

### Image Generation

```javascript
// FLUX Pro
await falAiService.generateImage('fal-ai/flux-pro', 'A beautiful sunset', {
  aspectRatio: '16:9',
  quantity: 1
});

// Qwen Image (minimal params)
await falAiService.generateImage('fal-ai/qwen-image', 'A beautiful sunset', {
  // Model handles defaults
});
```

### Video Generation

```javascript
// Kling
await falAiService.generateVideo('fal-ai/kling-video/v1/standard/text-to-video', 
  'Flying through clouds', {
  duration: 5,
  aspectRatio: '16:9'
});

// Runway (with image-to-video)
await falAiService.generateVideo('fal-ai/runway-gen3/turbo/video-generation',
  'Make it move', {
  duration: 5,
  aspectRatio: '16:9',
  image_url: 'https://example.com/image.jpg'
});
```

---

## ✅ Testing Checklist

- [x] FLUX models with image_size
- [x] Qwen with minimal params
- [x] Ideogram with magic_prompt
- [x] Recraft with size format
- [x] Kling with string duration
- [x] Veo with number duration
- [x] Runway with image param
- [x] Luma with keyframes
- [x] Error logging for 422 errors
- [x] Fallback to generic params
- [x] Removed deprecated models (Dreamina - 404 error)

---

## 🚀 Benefits

1. **Model-Specific Accuracy** - Each model gets correct parameters
2. **Error Prevention** - No more 422 validation errors
3. **Better Performance** - Models work as designed
4. **Easy Maintenance** - Clear documentation per model
5. **Extensible** - Easy to add new models

---

## 📚 References

- FAL.AI Official Models: https://fal.ai/models
- Model Database: `/src/data/falAiModelsComplete.js`
- Service Implementation: `/src/services/falAiService.js`

