# 🎭 Multi-Tier Pricing System - Audio & Type Variants

**Created:** October 27, 2025  
**Status:** ✅ COMPLETE  
**Purpose:** Support complex FAL.AI pricing (audio on/off, text-to-video vs image-to-video)

---

## 🎯 Problem Solved

FAL.AI memiliki pricing yang kompleks untuk beberapa model:

### Veo 3 Standard (Text-to-Video)
```
Without Audio: $0.50/s
With Audio:    $0.75/s

Example: 5s video with audio = $3.75
```

### Veo 3 Fast (Text-to-Video)
```
Without Audio: $0.25/s
With Audio:    $0.40/s
```

### Veo 3 Fast (Image-to-Video)
```
Without Audio: $0.10/s
With Audio:    $0.15/s
```

**Problem:** Sistem lama hanya support 1 harga per model ❌  
**Solution:** Multi-tier pricing support 4 variants per model ✅

---

## ✨ Features

### 4 Pricing Variants Per Model

| Variant | Description | Example (Veo 3 Standard) |
|---------|-------------|-------------------------|
| **Text-to-Video + No Audio** | Default video generation | $0.50/s |
| **Text-to-Video + With Audio** | Video with audio track | $0.75/s |
| **Image-to-Video + No Audio** | Animate image without audio | $0.10/s |
| **Image-to-Video + With Audio** | Animate image with audio | $0.15/s |

### Auto-Calculate All Variants
```
Admin Input (Veo 3 Standard, 8s max):
  • Text-to-Video No Audio:    $0.50/s
  • Text-to-Video With Audio:  $0.75/s
  • Image-to-Video No Audio:   $0.10/s
  • Image-to-Video With Audio: $0.15/s

System Auto-Calculate:
  📹 Text-to-Video (No Audio)
     → 5s: 80 credits, 8s: 128 credits
  
  📹🎵 Text-to-Video (With Audio)
     → 5s: 120 credits, 8s: 192 credits
  
  🖼️➡️📹 Image-to-Video (No Audio)
     → 5s: 16 credits, 8s: 26 credits
  
  🖼️➡️📹🎵 Image-to-Video (With Audio)
     → 5s: 24 credits, 8s: 38 credits
```

---

## 🎨 UI/UX

### Add Model Form

#### Toggle Multi-Tier Pricing
```
☑ Multi-Tier Pricing
  Model has different prices (audio on/off, text-to-video vs image-to-video)
```

#### Simple Pricing (Default)
```
┌─ FAL Price ($) ─┬─ Pricing Type ─┬─ Max Duration ─┐
│  0.055          │  Flat Rate     │  10s          │
└─────────────────┴────────────────┴───────────────┘
```

#### Multi-Tier Pricing (When Enabled)
```
┌─────────────────────────────────────────────────────┐
│ 📊 Multi-Tier Pricing (e.g., Veo 3)                │
├─────────────────────────────────────────────────────┤
│ TEXT-TO-VIDEO                                       │
│ ├─ Without Audio ($/s): [0.50]                     │
│ └─ With Audio ($/s):    [0.75]                     │
│                                                     │
│ IMAGE-TO-VIDEO                                      │
│ ├─ Without Audio ($/s): [0.10]                     │
│ └─ With Audio ($/s):    [0.15]                     │
│                                                     │
│ Max Duration (seconds): [8]                         │
└─────────────────────────────────────────────────────┘
```

### Live Preview

```
💰 Auto-Calculated Credits

🎭 Multi-Tier Pricing

📹 Text-to-Video (No Audio)
• $0.50/s × 8s = 128 cr
→ 5s: 80 cr, 8s: 128 cr

📹🎵 Text-to-Video (With Audio)
• $0.75/s × 8s = 192 cr
→ 5s: 120 cr, 8s: 192 cr

🖼️➡️📹 Image-to-Video (No Audio)
• $0.10/s × 8s = 26 cr
→ 5s: 16 cr, 8s: 26 cr

🖼️➡️📹🎵 Image-to-Video (With Audio)
• $0.15/s × 8s = 38 cr
→ 5s: 24 cr, 8s: 38 cr

💡 System will charge based on user's selection (type + audio)
```

---

## 📊 Database Schema

```sql
ALTER TABLE ai_models 
ADD COLUMN IF NOT EXISTS price_text_to_video_no_audio DECIMAL(10, 4);
ADD COLUMN IF NOT EXISTS price_text_to_video_with_audio DECIMAL(10, 4);
ADD COLUMN IF NOT EXISTS price_image_to_video_no_audio DECIMAL(10, 4);
ADD COLUMN IF NOT EXISTS price_image_to_video_with_audio DECIMAL(10, 4);
ADD COLUMN IF NOT EXISTS has_multi_tier_pricing BOOLEAN DEFAULT false;
```

### Example Data

**Veo 3 Standard:**
```sql
INSERT INTO ai_models (
  name, 
  has_multi_tier_pricing,
  price_text_to_video_no_audio,
  price_text_to_video_with_audio,
  price_image_to_video_no_audio,
  price_image_to_video_with_audio,
  max_duration
) VALUES (
  'Veo 3 Standard',
  true,
  0.50,   -- text-to-video no audio
  0.75,   -- text-to-video with audio
  0.10,   -- image-to-video no audio
  0.15,   -- image-to-video with audio
  8
);
```

---

## 💰 Pricing Calculation

### Formula for Each Variant

```javascript
// Constants
const USD_TO_IDR = 16000;
const IDR_PER_CREDIT = 500;

// For each variant
function calculateCredits(pricePerSecond, duration) {
  const totalUSD = pricePerSecond * duration;
  const totalIDR = totalUSD * USD_TO_IDR;
  const credits = Math.ceil(totalIDR / IDR_PER_CREDIT);
  return credits;
}
```

### Example: Veo 3 Standard (8s video)

**Text-to-Video + No Audio:**
```
$0.50/s × 8s = $4.00
$4.00 × 16,000 = Rp 64,000
64,000 ÷ 500 = 128 credits
```

**Text-to-Video + With Audio:**
```
$0.75/s × 8s = $6.00
$6.00 × 16,000 = Rp 96,000
96,000 ÷ 500 = 192 credits
```

**Image-to-Video + No Audio:**
```
$0.10/s × 8s = $0.80
$0.80 × 16,000 = Rp 12,800
12,800 ÷ 500 = 25.6 → 26 credits
```

**Image-to-Video + With Audio:**
```
$0.15/s × 8s = $1.20
$1.20 × 16,000 = Rp 19,200
19,200 ÷ 500 = 38.4 → 39 credits
```

---

## 🎮 User Generation Flow

### Step 1: User Selects Model
```
Model: Veo 3 Standard
```

### Step 2: User Chooses Type
```
○ Text-to-Video
● Image-to-Video  ← User selects
```

### Step 3: User Chooses Audio
```
○ Without Audio
● With Audio  ← User selects
```

### Step 4: User Chooses Duration
```
Duration: 5s  ← User selects
```

### Step 5: System Calculates Cost
```
Selected variant: Image-to-Video + With Audio
Price: $0.15/s
Duration: 5s

Calculation:
  $0.15/s × 5s = $0.75
  $0.75 × 16,000 = Rp 12,000
  12,000 ÷ 500 = 24 credits

User is charged: 24 credits ✅
```

---

## 🔧 Implementation

### Migration
```bash
psql -d pixelnest -f migrations/add_multi_tier_pricing.sql
```

### Add Model (Admin)

**For Simple Model (e.g., FLUX Pro):**
```
☐ Multi-Tier Pricing  ← Unchecked
FAL Price: $0.055
Pricing Type: Flat
Result: 2 credits
```

**For Multi-Tier Model (e.g., Veo 3):**
```
☑ Multi-Tier Pricing  ← Checked

Text-to-Video:
  • No Audio:    $0.50/s
  • With Audio:  $0.75/s

Image-to-Video:
  • No Audio:    $0.10/s
  • With Audio:  $0.15/s

Max Duration: 8s

Result: Auto-calculate semua 4 variants
```

---

## 🎯 Use Cases

### Use Case 1: Veo 3 Standard

**Admin Input:**
```javascript
{
  name: "Veo 3 Standard",
  has_multi_tier_pricing: true,
  price_text_to_video_no_audio: 0.50,
  price_text_to_video_with_audio: 0.75,
  price_image_to_video_no_audio: 0.10,
  price_image_to_video_with_audio: 0.15,
  max_duration: 8
}
```

**User Generation Costs (5s video):**
- Text-to-Video + No Audio: 80 cr
- Text-to-Video + With Audio: 120 cr
- Image-to-Video + No Audio: 16 cr
- Image-to-Video + With Audio: 24 cr

### Use Case 2: Runway Gen-3 (Simple)

**Admin Input:**
```javascript
{
  name: "Runway Gen-3",
  has_multi_tier_pricing: false,
  fal_price: 0.15,
  pricing_type: "per_second",
  max_duration: 10
}
```

**User Generation Costs (5s video):**
- Any type/audio: 48 cr (simple calculation)

---

## ⚠️ Important Notes

### Backward Compatibility
✅ **Simple pricing still works**  
✅ **Existing models unaffected**  
✅ **Optional feature**  
✅ **Gradual migration**

### When to Use Multi-Tier

**Use multi-tier for:**
- ✅ Veo 3 series (different audio pricing)
- ✅ Models with image-to-video variants
- ✅ Models with feature-based pricing

**Use simple pricing for:**
- ✅ FLUX series (single price)
- ✅ Kling series (simple per-second)
- ✅ Most image models (flat rate)

---

## 📊 Comparison

### Before (Single Price)

```
Model: Veo 3
Price: $0.50/s  ← Only one price

Problem:
❌ Can't differentiate audio on/off
❌ Can't differentiate text-to-video vs image-to-video
❌ Users pay same price for all variants
```

### After (Multi-Tier)

```
Model: Veo 3
Prices:
  • Text-to-Video No Audio: $0.50/s
  • Text-to-Video With Audio: $0.75/s
  • Image-to-Video No Audio: $0.10/s
  • Image-to-Video With Audio: $0.15/s

Benefits:
✅ Accurate pricing per variant
✅ Fair for users
✅ Matches FAL.AI pricing exactly
```

---

## 📈 Stats

**Number of Variants:** Up to 4 per model  
**Backward Compatible:** 100%  
**Migration Required:** Yes (SQL)  
**UI Changes:** Toggle-based  
**Complexity:** Medium

---

## 🔮 Future Enhancements

Possible additions:
- [ ] More granular duration tiers
- [ ] Quality-based pricing (SD vs HD)
- [ ] Aspect ratio pricing
- [ ] Batch generation discounts

---

## ✅ Setup Checklist

- [ ] Run migration SQL
- [ ] Add multi-tier model (e.g., Veo 3)
- [ ] Test all 4 variants calculation
- [ ] Verify generation charges correctly
- [ ] Update existing Veo models
- [ ] Document model pricing in admin notes

---

**System ready untuk support complex FAL.AI pricing! 🚀**

Admin sekarang bisa input semua variants dan system auto-calculate untuk setiap scenario!

