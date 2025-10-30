# 📋 Quick Reference: fal.ai Pricing (October 2025)

## 🎬 Video Models

### Premium Per-Second Models
| Model | Price | Duration | Total Cost | Type |
|-------|-------|----------|------------|------|
| Sora 2 | $0.24/s | 5s max | $1.20 | per_second |
| Kling 2 Master | $0.18/s | 10s max | $1.80 | per_second |
| Kling 1.6 Pro | $0.15/s | 10s max | $1.50 | per_second |

### Standard Flat Rate Models
| Model | Price | Duration | Type |
|-------|-------|----------|------|
| Veo 3.1 | $0.70 | 8s | flat |
| Veo 3 | $0.50 | 8s | flat |
| Runway Gen-3 | $0.50 | 10s | flat |
| Luma Dream Machine | $0.50 | 5s | flat |
| Hunyuan Video | $0.45 | 5s | flat |
| MiniMax Video | $0.40 | 6s | flat |
| Haiper Video 2.0 | $0.25 | 6s | flat |
| Pika Labs | $0.24 | 3s | flat |
| SeaweedFS Seedance | $0.23 | 4s | flat |
| Stable Video Diffusion | $0.20 | 4s | flat |

## 🖼️ Image Models

### FLUX Models (Per-Megapixel)
| Model | Price/MP | Resolution | Estimated Cost |
|-------|----------|------------|----------------|
| FLUX 1.1 Pro Ultra | $0.06/MP | 1MP | ~$0.06 |
| FLUX 1.1 Pro | $0.04/MP | 1MP | ~$0.04 |
| FLUX Pro | $0.055/MP | 1MP | ~$0.055 |

### Standard Image Models (Flat Rate)
| Model | Price | Type |
|-------|-------|------|
| FLUX Dev | $0.025 | flat |
| FLUX Schnell | $0.003 | flat |
| Stable Diffusion 3.5 | $0.025 | flat |
| SDXL | $0.015 | flat |

---

## 🧮 Credit Calculation Formula

### Video Models:
```
If per_second:
  total_fal_cost = price_per_second × duration
  credits = (total_fal_cost / 0.08) × 1.25
  
If flat:
  credits = (fal_price / 0.08) × 1.25
```

### Image Models:
```
credits = (fal_price / 0.05) × 1.20
```

### Rounding:
```
Round to nearest 0.1 credit
```

---

## 📊 Example Calculations

### Example 1: Sora 2 (Per-Second)
```
Price: $0.24/second
Duration: 5 seconds
Type: per_second

Calculation:
- FAL Cost: $0.24 × 5 = $1.20
- Credits: ($1.20 / $0.08) × 1.25 = 18.75
- Rounded: 18.8 credits
- User Pays: 18.8 × Rp 1,500 = Rp 28,200
- Profit: 25%
```

### Example 2: Luma Dream Machine (Flat)
```
Price: $0.50
Duration: 5 seconds
Type: flat

Calculation:
- FAL Cost: $0.50
- Credits: ($0.50 / $0.08) × 1.25 = 7.8 credits
- User Pays: 7.8 × Rp 1,500 = Rp 11,700
- Profit: 25%
```

### Example 3: FLUX 1.1 Pro (Image)
```
Price: $0.04
Type: image

Calculation:
- FAL Cost: $0.04
- Credits: ($0.04 / $0.05) × 1.20 = 0.96
- Rounded: 1.0 credit
- User Pays: 1.0 × Rp 1,500 = Rp 1,500
- Profit: 20%
```

---

## ✅ Validation Checklist

When importing new model:

1. **Check fal.ai page:**
   - [ ] Find model on fal.ai/models
   - [ ] Note the exact price
   - [ ] Check if per-second or flat rate
   - [ ] Check max duration (video)

2. **Run validation:**
   ```bash
   npm run validate:model
   ```

3. **Verify:**
   - [ ] Price matches fal.ai
   - [ ] Type is correct (per_second/flat)
   - [ ] Max duration set (video)
   - [ ] Profit margin 20-25%

4. **Import:**
   - Via admin panel, OR
   - Via `npm run import:model`

---

## 🚨 Common Errors

### Error 1: Per-Second Marked as Flat
```
❌ WRONG:
   Sora 2 at $0.24 flat rate

✅ CORRECT:
   Sora 2 at $0.24 per_second
```

### Error 2: Wrong Price Unit
```
❌ WRONG:
   FLUX Pro at $40 (this is cents!)

✅ CORRECT:
   FLUX Pro at $0.04 (in dollars)
```

### Error 3: Missing Max Duration
```
❌ WRONG:
   Video model without max_duration

✅ CORRECT:
   Video model with max_duration set
```

---

## 📞 Quick Commands

```bash
# Validate before import
npm run validate:model

# Import with validation
npm run import:model

# Update all video models
npm run update:all-video-models

# Fix profit margins
npm run fix:profit-margin

# Fix video pricing
npm run fix:video-pricing
```

---

**Always validate before import! Sistema akan mencegah errors! 🚀**




