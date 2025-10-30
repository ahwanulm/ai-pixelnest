# 🎯 TYPE-AWARE PRICING SYSTEM

## 📊 OVERVIEW

System pricing yang **isolated per type** (image vs video) dengan **cheap threshold** untuk model murah.

---

## ⚙️ CONFIGURATION

### IMAGE MODELS:
```
✅ Profit Margin: 20%
✅ Base Credit: $0.05 = 1 credit
✅ Minimum Credits: 0.5 credits
✅ Cheap Threshold: < $0.01 → use minimum
```

### VIDEO MODELS:
```
✅ Profit Margin: 25%
✅ Base Credit: $0.08 = 1 credit
✅ Minimum Credits: 1.0 credits
✅ Cheap Threshold: < $0.05 → use minimum
```

### GLOBAL:
```
✅ Credit Rounding: 0.5 (round to nearest 0.5)
```

---

## 💰 PRICING EXAMPLES

### IMAGE MODELS (Cheap → Expensive):

| Model | FAL Price | Credits | Our Price | Strategy |
|-------|-----------|---------|-----------|----------|
| **Nano Banan** | $0.0150 | **0.5** | $0.0250 | < $0.01 → minimum (cheap!) |
| **FLUX Schnell** | $0.0150 | **0.5** | $0.0250 | < $0.01 → minimum (cheap!) |
| **AuraFlow** | $0.0200 | **0.5** | $0.0250 | < $0.01 → minimum (cheap!) |
| **BG Remover** | $0.0200 | **0.5** | $0.0250 | < $0.01 → minimum (cheap!) |
| **FLUX Dev** | $0.0250 | **0.5** | $0.0250 | < $0.01 → minimum (cheap!) |
| **SD XL** | $0.0300 | **0.5** | $0.0250 | < $0.01 → minimum (cheap!) |
| **Kolors** | $0.0350 | **1.0** | $0.0500 | Normal pricing |
| **Qwen Image** | $0.0400 | **1.0** | $0.0500 | Normal pricing |
| **Dreamina** | $0.0450 | **1.0** | $0.0500 | Normal pricing |
| **Recraft V3** | $0.0500 | **1.0** | $0.0500 | Normal pricing |
| **FLUX Pro** | $0.0550 | **1.5** | $0.0750 | Normal pricing |
| **Imagen 4** | $0.0800 | **2.0** | $0.1000 | Normal pricing |
| **Clarity Upscale** | $0.1000 | **2.5** | $0.1250 | Premium pricing |

### VIDEO MODELS (Cheap → Expensive):

| Model | FAL Price | Credits | Our Price | Strategy |
|-------|-----------|---------|-----------|----------|
| **Stable Video** | $0.1000 | **1.5** | $0.0750 | > threshold, normal |
| **Haiper AI** | $0.1200 | **2.0** | $0.1000 | Normal pricing |
| **Pika Labs** | $0.1500 | **2.5** | $0.1250 | Normal pricing |
| **MiniMax** | $0.1800 | **3.0** | $0.1500 | Normal pricing |
| **Kling v1** | $0.2000 | **3.0** | $0.1500 | Normal pricing |
| **SeeDance** | $0.2000 | **3.0** | $0.1500 | Normal pricing |
| **Luma Dream** | $0.2200 | **3.5** | $0.1750 | Normal pricing |
| **Veo 3** | $0.2500 | **4.0** | $0.2000 | Normal pricing |
| **Kling Pro** | $0.2800 | **4.5** | $0.2250 | Normal pricing |
| **Veo 3.1** | $0.3000 | **4.5** | $0.2250 | Normal pricing |
| **Runway Gen-3** | $0.3500 | **5.5** | $0.2750 | Premium pricing |
| **Sora 2** | $0.5000 | **8.0** | $0.4000 | Premium pricing |

---

## 🎯 KEY BENEFITS

### 1. **CHEAP MODELS = CHEAP CREDITS** ✅
   - Image models < $0.01 → **0.5 credits**
   - User dapat generate murah
   - Tetap untung (margin masih ada)

### 2. **TYPE ISOLATION** ✅
   - Image punya profit margin sendiri (20%)
   - Video punya profit margin sendiri (25%)
   - Easy to adjust per type

### 3. **AUTOMATIC CALCULATION** ✅
   - Function: `calculate_credits_typed(price, type)`
   - Trigger auto-update saat fal_price berubah
   - Konsisten & reliable

### 4. **PROFITABLE & COMPETITIVE** ✅
   - Cheap models: Minimum pricing (profitable)
   - Normal models: Standard margin
   - Premium models: Higher margin
   - Tetap competitive vs fal.ai

---

## 🛠️ ADMIN CONFIGURATION

### Update Profit Margin (IMAGE):
```sql
UPDATE pricing_config 
SET config_value = 25.00 
WHERE config_key = 'image_profit_margin';
```

### Update Profit Margin (VIDEO):
```sql
UPDATE pricing_config 
SET config_value = 30.00 
WHERE config_key = 'video_profit_margin';
```

### Update Minimum Credits (IMAGE):
```sql
UPDATE pricing_config 
SET config_value = 0.30 
WHERE config_key = 'image_minimum_credits';
```

### Update Cheap Threshold (IMAGE):
```sql
UPDATE pricing_config 
SET config_value = 0.02 
WHERE config_key = 'image_cheap_threshold';
```

After update, run:
```bash
npm run update:pricing
```

---

## 📊 PRICING FORMULA

### For IMAGE:
```
IF fal_price < $0.01:
  credits = 0.5 (minimum)
ELSE:
  calculated = (fal_price / 0.05) * (1 + 20/100)
  credits = ROUND(calculated / 0.5) * 0.5
  IF credits < 0.5: credits = 0.5
```

### For VIDEO:
```
IF fal_price < $0.05:
  credits = 1.0 (minimum)
ELSE:
  calculated = (fal_price / 0.08) * (1 + 25/100)
  credits = ROUND(calculated / 0.5) * 0.5
  IF credits < 1.0: credits = 1.0
```

---

## 🔄 MAINTENANCE

### Re-calculate all prices:
```bash
npm run update:pricing
```

### Add new model:
```sql
INSERT INTO ai_models (
  name, model_id, type, fal_price, provider
) VALUES (
  'New Model', 'fal-ai/new-model', 'image', 0.045, 'FAL.AI'
);
-- cost will be auto-calculated by trigger
```

### Check current pricing:
```sql
SELECT * FROM model_pricing ORDER BY type, usd_price DESC;
```

---

## ✅ RESULTS

- ✅ **19 image models** updated with type-aware pricing
- ✅ **13 video models** updated with type-aware pricing
- ✅ **Cheap models** (< threshold) use minimum credits
- ✅ **Normal models** use calculated pricing
- ✅ **Decimal support** (0.5, 1.0, 1.5, 2.0, etc)
- ✅ **Auto-update trigger** for new models
- ✅ **View** `model_pricing` for easy monitoring
- ✅ **Isolated** pricing per type (easy to manage)

---

## 🎉 SUMMARY

### BEFORE:
```
❌ Single profit margin untuk semua
❌ Tidak ada cheap threshold
❌ Sulit adjust per type
❌ Model murah kurang profitable
```

### AFTER:
```
✅ Isolated profit margin (image 20%, video 25%)
✅ Cheap threshold untuk model murah
✅ Easy adjust per type di pricing_config
✅ Model murah tetap profitable (0.5 credits minimum)
✅ Decimal credits support (0.5, 1.5, 2.5)
✅ Auto-calculate dengan trigger
✅ Clean & maintainable
```

---

**Last Updated:** 2025-10-26  
**Status:** ✅ Active & Working  
**Script:** `src/config/updatePricingTypeAware.js`
