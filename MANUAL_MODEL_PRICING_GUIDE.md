# 📘 Manual Model Addition - Pricing Structure Guide

## Overview

The enhanced manual model addition form now supports **6 different pricing structures** to match all fal.ai pricing models:

1. **Simple** - Flat rate or per-second
2. **Per-Pixel** - For upscaling models
3. **Per-Megapixel** - For FLUX models
4. **Multi-Tier** - For models with different audio/video options
5. **3D Modeling** - Base price with quality multipliers
6. **Resolution-Based** - Different prices per resolution tier

---

## 🎯 How to Use Each Pricing Structure

### 1. **Simple (Flat/Per-Second)** ⚡

**Use For:** Most standard models (SDXL, Stable Video Diffusion, etc.)

**Fields:**
- **FAL Price ($)**: The price from fal.ai (e.g., `0.025`)
- **Pricing Type**: Select `Flat Rate` or `Per Second`
- **Max Duration (s)**: For video models only (e.g., `10`)

**Examples:**

**Flat Rate (Image Model):**
```
Model: Stable Diffusion XL
FAL Price: $0.015
Pricing Type: Flat Rate
Result: 1 cr per generation
```

**Per-Second (Video Model):**
```
Model: Luma Dream Machine
FAL Price: $0.10 (per second)
Pricing Type: Per Second
Max Duration: 5s
Result: 10 cr for 5s video
```

---

### 2. **Per-Pixel (Upscaling)** 🔍

**Use For:** Image upscaling models that charge based on output pixels

**Fields:**
- **Price per Pixel ($)**: Very small value (e.g., `0.0000023`)
- **Base Resolution**: Starting resolution (e.g., `1920x1080`)
- **Max Upscale Factor**: How much to upscale (e.g., `4`)

**Example:**
```
Model: Real-ESRGAN Upscaler
Price per Pixel: $0.0000023
Base Resolution: 1920x1080
Max Upscale Factor: 4x

Calculation:
- Base pixels: 1920 × 1080 = 2,073,600
- Upscaled pixels: 2,073,600 × (4 × 4) = 33,177,600
- Total cost: $0.0000023 × 33,177,600 = $76.31
- Credits: ~153 cr
```

---

### 3. **Per-Megapixel (FLUX)** 📐

**Use For:** FLUX models that charge per megapixel

**Fields:**
- **Price per MP ($)**: Price per megapixel (e.g., `0.055`)
- **Base Megapixels**: Standard output size (e.g., `1.0`)
- **Max Megapixels**: Maximum supported (e.g., `2.0`)

**Example:**
```
Model: FLUX 1.1 Pro
Price per MP: $0.055
Base Megapixels: 1.0 MP
Max Megapixels: 2.0 MP

Calculation:
- 1 MP generation: $0.055 = 2 cr
- 2 MP generation: $0.110 = 4 cr
```

**Common FLUX Pricing:**
- FLUX Pro: $0.055/MP
- FLUX 1.1 Pro: $0.04/MP
- FLUX 1.1 Pro Ultra: $0.06/MP

---

### 4. **Multi-Tier (Veo)** 📊

**Use For:** Models with different prices based on video type and audio

**Fields:**
- **Text-to-Video (No Audio)**: Price per second (e.g., `0.20`)
- **Text-to-Video (With Audio)**: Price per second (e.g., `0.40`)
- **Image-to-Video (No Audio)**: Price per second (e.g., `0.10`)
- **Image-to-Video (With Audio)**: Price per second (e.g., `0.15`)
- **Max Duration**: Maximum video length (e.g., `8`)

**Example:**
```
Model: Google Veo 3
T2V (No Audio): $0.20/s
T2V (With Audio): $0.40/s
I2V (No Audio): $0.10/s
I2V (With Audio): $0.15/s
Max Duration: 8s

Results (8s video):
- T2V No Audio: $1.60 = 26 cr
- T2V With Audio: $3.20 = 51 cr
- I2V No Audio: $0.80 = 13 cr
- I2V With Audio: $1.20 = 19 cr
```

---

### 5. **3D Modeling** 🎲

**Use For:** 3D generation models with quality tiers

**Fields:**
- **Base Price ($)**: Standard generation cost (e.g., `0.50`)
- **Quality Multiplier**: Choose from:
  - Standard (1x)
  - High (1.5x)
  - Ultra (2x)

**Example:**
```
Model: Meshy 3D Generator
Base Price: $0.50
Quality: High (1.5x)

Calculation:
- Cost: $0.50 × 1.5 = $0.75
- Credits: 12 cr
```

---

### 6. **Resolution-Based** 📏

**Use For:** Models with fixed prices per resolution tier

**Fields:**
- **SD (512x512)**: Price for standard def (e.g., `0.010`)
- **HD (1024x1024)**: Price for high def (e.g., `0.025`)
- **2K (2048x2048)**: Price for 2K (e.g., `0.050`)
- **4K (4096x4096)**: Price for 4K (e.g., `0.100`)

**Example:**
```
Model: Resolution-Tier Image Generator
SD: $0.010 = 1 cr
HD: $0.025 = 1 cr
2K: $0.050 = 2 cr
4K: $0.100 = 3 cr
```

---

## 💰 Credit Calculation Formula

All pricing structures use the same formula to convert USD to credits:

```
Credits = (FAL Price in USD × 16,000) ÷ 500
```

**Constants:**
- USD to IDR: 16,000
- IDR per Credit: 500

**Example:**
```
FAL Price: $0.055
Calculation: ($0.055 × 16,000) ÷ 500 = 1.76 cr
Rounded: 2 cr
```

---

## 📋 Quick Reference: Where to Find Prices

### fal.ai Pricing Pages:

1. **Main Model Browser**: https://fal.ai/models
2. **Pricing Documentation**: Check each model's page
3. **API Response**: Use the Browse feature in admin panel

### Common Pricing Patterns:

**Image Models (Flat Rate):**
- SDXL: $0.015
- Stable Diffusion 3.5: $0.025
- FLUX Dev: $0.025
- FLUX Schnell: $0.003

**Image Models (Per-Megapixel):**
- FLUX Pro: $0.055/MP
- FLUX 1.1 Pro: $0.04/MP
- FLUX 1.1 Pro Ultra: $0.06/MP

**Video Models (Flat Rate):**
- Haiper Video 2.0: $0.25
- Stable Video Diffusion: $0.20

**Video Models (Per-Second):**
- Sora 2: $0.24/s
- Kling 2 Master: $0.18/s
- Kling 1.6 Pro: $0.15/s

---

## ✅ Best Practices

1. **Always Check fal.ai First**: Verify current pricing before adding
2. **Use Browse Feature**: The Browse FAL.AI button has pre-verified data
3. **Test Calculation**: Use the auto-calculator to verify credits
4. **Document Special Cases**: Add notes in description for unusual pricing
5. **Start with Simple**: Most models use Simple pricing structure

---

## 🚨 Common Mistakes to Avoid

1. ❌ **Wrong Decimal Places**: $0.055 vs $0.55 (huge difference!)
2. ❌ **Mixing Per-Second with Flat**: Check if video price is per-second or per-generation
3. ❌ **Forgetting Duration**: Per-second models need max_duration field
4. ❌ **Wrong Resolution Format**: Use `1920x1080` not `1920*1080`
5. ❌ **Ignoring Multi-Tier**: Some models have 4 different prices

---

## 📊 Form Layout

The new compact layout reduces form size by **~40%** while maintaining all functionality:

- **2-column grids** for related fields
- **4-column grid** for Type/Category/Speed/Quality
- **Compact inputs** with smaller padding
- **Smart sections** that only show relevant fields
- **Real-time preview** of credit calculation

---

## 🎓 Training Examples

### Example 1: Adding FLUX 1.1 Pro
```
1. Model ID: fal-ai/flux-pro/v1.1
2. Name: FLUX 1.1 Pro
3. Type: Image
4. Category: Text-to-Image
5. Pricing Structure: Per-Megapixel
6. Price per MP: 0.04
7. Base Megapixels: 1.0
8. Click Save → Calculates 1 cr automatically
```

### Example 2: Adding Upscaling Model
```
1. Model ID: fal-ai/clarity-upscaler
2. Name: Clarity Upscaler
3. Type: Image
4. Category: Upscaling
5. Pricing Structure: Per-Pixel
6. Price per Pixel: 0.0000023
7. Base Resolution: 1920x1080
8. Max Upscale Factor: 4
9. Click Save → Calculates credits based on pixel count
```

### Example 3: Adding Video Model with Audio Options
```
1. Model ID: fal-ai/google/veo-3
2. Name: Google Veo 3
3. Type: Video
4. Category: Text-to-Video
5. Pricing Structure: Multi-Tier
6. T2V No Audio: 0.20
7. T2V With Audio: 0.40
8. I2V No Audio: 0.10
9. I2V With Audio: 0.15
10. Max Duration: 8
11. Click Save → Shows all 4 pricing tiers
```

---

## 🔧 Troubleshooting

**Problem: Credits showing as 1**
- Solution: Enter FAL price, the calculator will auto-update

**Problem: Wrong credit calculation**
- Check decimal places (0.055 not 0.55)
- Verify pricing type matches fal.ai
- For videos, check if per-second or flat

**Problem: Can't find pricing type**
- Use "Simple" for most models
- Only use specialized types when fal.ai explicitly uses them

**Problem: Form not saving**
- Fill all required fields (marked with *)
- Ensure Model ID format: `fal-ai/model-name`
- Check that pricing fields have valid numbers

---

## 📞 Support

If you encounter models with pricing structures not covered here, please:
1. Check fal.ai model page for pricing details
2. Use the Browse FAL.AI feature (auto-verified)
3. Document the special case in model description
4. Contact support if unsure

---

**Version:** 2.0  
**Last Updated:** October 28, 2025  
**Supported Pricing Types:** 6 structures covering all fal.ai models

