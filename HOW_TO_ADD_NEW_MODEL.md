# 🎯 HOW TO ADD NEW MODEL - Step by Step

## 📋 Quick Guide untuk Import Model Baru

### Method 1: Via Validation Script (RECOMMENDED) ⭐

**Paling aman dan mudah!**

```bash
# Step 1: Run validation script
npm run validate:model
```

**Interactive prompts:**
```
Model Name: [Enter nama model]
Type (image/video): [Enter image atau video]
FAL.AI Price (in USD): $[Enter harga dari fal.ai]
Max Duration (in seconds): [Enter max duration jika video]
Is this per-second pricing? (yes/no): [Enter yes atau no]
```

**System will show:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 PRICING REPORT

💰 CALCULATED PRICING:
   Credits: X.X
   User Pays (IDR): Rp X,XXX
   Profit Margin: XX.X%

⚠️  WARNINGS: (if any)
💡 SUGGESTIONS: (if any)

✅ VALID - Safe to import  (atau ❌ INVALID)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**If VALID → Continue to import:**

```bash
# Step 2: Edit import script
nano src/scripts/importModelWithValidation.js
```

**Update the newModel object:**
```javascript
const newModel = {
  model_id: 'fal-ai/your-model-id',
  name: 'Model Name',
  provider: 'fal.ai',
  description: 'Description from fal.ai',
  category: 'Video Generation', // or 'Image Generation'
  type: 'video', // or 'image'
  fal_price: 0.50, // Price from fal.ai in USD
  max_duration: 5, // For video models only
  pricing_type: 'flat', // 'flat' or 'per_second'
  trending: false,
  viral: false,
  speed: 3,
  quality: 4,
  is_active: true
};
```

```bash
# Step 3: Run import
npm run import:model
```

**Done! ✅**

---

### Method 2: Via Admin Panel

**Quick but with less guidance:**

1. **Check fal.ai first:**
   - Go to https://fal.ai/models
   - Find your model
   - Note: Price, Max Duration, Type

2. **Go to Admin Panel:**
   ```
   URL: /admin/models
   Click: "Add Model" button
   ```

3. **Fill Form:**
   ```
   Model ID: fal-ai/model-name
   Name: Model Name
   Provider: fal.ai
   Type: video (or image)
   Cost: [FAL PRICE from fal.ai]
   Max Duration: [if video]
   ... other fields ...
   ```

4. **Submit:**
   - System will auto-validate
   - If error: Fix and try again
   - If valid: Model added! ✅

---

## 🎬 Example: Adding Sora 2

### Step-by-Step:

**1. Check fal.ai:**
```
URL: https://fal.ai/models/openai/sora-2
Found:
  - Price: $0.24/second
  - Max Duration: 20 seconds
  - Type: Per-second pricing
```

**2. Run validation:**
```bash
npm run validate:model

Model Name: Sora 2
Type: video
FAL.AI Price: $0.24
Max Duration: 20
Per-second pricing? yes
```

**3. Review report:**
```
📊 PRICING REPORT: Sora 2

Type: video
FAL Price: $0.24 per second
Max Duration: 20s

💰 CALCULATED PRICING:
   Credits: 144.0 (for 20s max)
   User Pays (USD): $7.200
   User Pays (IDR): Rp 216,000
   Profit Margin: 25.0%

💡 SUGGESTIONS:
   📊 Credits for 5s: ~18.8 credits
   📊 Credits for 10s: ~37.5 credits

✅ VALID - Safe to import
```

**4. Edit import script:**
```javascript
const newModel = {
  model_id: 'fal-ai/openai/sora-2',
  name: 'Sora 2',
  provider: 'fal.ai',
  description: 'Advanced AI video generation by OpenAI',
  category: 'Premium Video',
  type: 'video',
  fal_price: 0.24,      // $0.24 per second
  max_duration: 20,      // 20 seconds max
  pricing_type: 'per_second', // Per-second billing
  trending: true,
  viral: true,
  speed: 4,
  quality: 5,
  is_active: true
};
```

**5. Import:**
```bash
npm run import:model
```

**6. Verify:**
```
✅ Model imported successfully!
   ID: 123
   Model ID: fal-ai/openai/sora-2
   Name: Sora 2
   Credits: 144.0 (for max 20s)

📊 Final Pricing in Database:
   FAL Price: $0.24
   Credits: 144.0
   Type: per_second
   Max Duration: 20s
```

**Done! ✅**

---

## 🖼️ Example: Adding FLUX Pro

### Step-by-Step:

**1. Check fal.ai:**
```
URL: https://fal.ai/models/fal-ai/flux-pro
Found:
  - Price: $0.04 per image
  - Type: Image generation
```

**2. Run validation:**
```bash
npm run validate:model

Model Name: FLUX 1.1 Pro
Type: image
FAL.AI Price: $0.04
```

**3. Review report:**
```
📊 PRICING REPORT: FLUX 1.1 Pro

Type: image
FAL Price: $0.04

💰 CALCULATED PRICING:
   Credits: 1.0
   User Pays (USD): $0.050
   User Pays (IDR): Rp 1,500
   Profit Margin: 25.0%

✅ VALID - Safe to import
```

**4. Edit import script:**
```javascript
const newModel = {
  model_id: 'fal-ai/flux-pro/v1.1',
  name: 'FLUX 1.1 Pro',
  provider: 'fal.ai',
  description: 'Professional image generation',
  category: 'Image Generation',
  type: 'image',
  fal_price: 0.04,
  pricing_type: 'flat',
  trending: true,
  speed: 4,
  quality: 5,
  is_active: true
};
```

**5. Import:**
```bash
npm run import:model
```

**Done! ✅**

---

## ⚠️ Common Mistakes

### Mistake 1: Wrong Pricing Type

**❌ WRONG:**
```javascript
{
  name: "Sora 2",
  fal_price: 0.24,        // This is per-second!
  pricing_type: "flat"    // But marked as flat!
}
```

**Sistema will detect:**
```
❌ ERROR: $0.24 too low for flat rate!
💡 Did you mean per-second pricing?
```

**✅ CORRECT:**
```javascript
{
  name: "Sora 2",
  fal_price: 0.24,
  pricing_type: "per_second"  // Correctly marked!
}
```

---

### Mistake 2: Wrong Unit

**❌ WRONG:**
```javascript
{
  name: "FLUX Pro",
  fal_price: 40  // This is cents, not dollars!
}
```

**Sistema will warn:**
```
⚠️  $40 is very expensive for image!
💡 Did you mean $0.40 (40 cents)?
```

**✅ CORRECT:**
```javascript
{
  name: "FLUX Pro",
  fal_price: 0.04  // In dollars (4 cents)
}
```

---

### Mistake 3: Missing Max Duration

**❌ WRONG:**
```javascript
{
  type: "video",
  fal_price: 0.50,
  // Missing max_duration!
}
```

**Sistema will warn:**
```
⚠️  Max duration not specified
💡 Set max_duration for proportional pricing
```

**✅ CORRECT:**
```javascript
{
  type: "video",
  fal_price: 0.50,
  max_duration: 5  // Specified!
}
```

---

## 📋 Checklist

**Before importing ANY model:**

- [ ] **Checked fal.ai pricing page**
  - URL: https://fal.ai/models
  - Found the model
  - Noted exact price

- [ ] **Noted pricing details:**
  - [ ] Price in USD (not cents!)
  - [ ] Type: per-second OR flat
  - [ ] Max duration (if video)

- [ ] **Ran validation script:**
  ```bash
  npm run validate:model
  ```

- [ ] **Reviewed pricing report:**
  - [ ] No critical errors
  - [ ] Checked warnings
  - [ ] Profit margin 20-25%

- [ ] **Ready to import:**
  - [ ] All info correct
  - [ ] Validation passed
  - [ ] Model doesn't exist yet

- [ ] **Import method chosen:**
  - [ ] Via script (npm run import:model)
  - [ ] OR via admin panel

- [ ] **After import:**
  - [ ] Verified in database
  - [ ] Tested generation
  - [ ] Checked actual cost

---

## 🚀 Quick Reference

### Pricing Types

**Per-Second (Video):**
```javascript
{
  fal_price: 0.24,        // Price per second
  max_duration: 20,       // Max seconds
  pricing_type: 'per_second'
}

// Total cost = 0.24 × duration
// User pays proportionally
```

**Flat Rate (Video):**
```javascript
{
  fal_price: 0.50,        // Fixed price
  max_duration: 5,
  pricing_type: 'flat'
}

// Same cost for any duration up to max
```

**Image:**
```javascript
{
  fal_price: 0.04,        // Per image
  pricing_type: 'flat'
}

// Fixed price per generation
```

---

### Commands

```bash
# Validate model
npm run validate:model

# Import model (after editing script)
npm run import:model

# Update all video models
npm run update:all-video-models

# Check via admin panel
URL: /admin/models
```

---

## 💡 Tips

### Tip 1: Always Validate First
```
Don't skip validation!
It prevents costly mistakes.
Takes only 30 seconds.
```

### Tip 2: Double-Check fal.ai
```
Pricing can change!
Always check current price.
Don't rely on old data.
```

### Tip 3: Test After Import
```
Generate a test
Verify cost matches
Enable for public only after testing
```

### Tip 4: Monitor First Users
```
Watch first few generations
Check costs are correct
Adjust if needed
```

### Tip 5: Update Documentation
```
Note any special pricing
Add to quick reference
Share with team
```

---

## 🔍 Where to Find Pricing

**fal.ai Models:**
```
Main page: https://fal.ai/models
Model page: https://fal.ai/models/[provider]/[model-name]
Pricing info: Usually on model page or docs
```

**What to Look For:**
- Exact price in USD
- Per-second OR flat rate
- Max duration (video)
- Any special notes

**Example URLs:**
```
Sora 2: https://fal.ai/models/openai/sora-2
FLUX Pro: https://fal.ai/models/fal-ai/flux-pro
Kling: https://fal.ai/models/kling-ai/video
```

---

## 📞 Need Help?

**If validation fails:**
1. Read error messages carefully
2. Check fal.ai pricing again
3. Verify pricing type
4. Fix issues and retry

**If unsure about pricing:**
1. Test on fal.ai directly
2. Check what they charge
3. Input that exact price
4. Let system calculate credits

**If warnings appear:**
1. Review the warnings
2. Verify info is correct
3. If correct, proceed
4. If unsure, investigate more

---

**🎯 Following this guide akan memastikan SEMUA model di-import dengan BENAR! ✅**

**💪 Tidak akan ada lagi pricing errors! 🚀**




