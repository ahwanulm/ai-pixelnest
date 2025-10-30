# 🤖 Smart Pricing System - Automatic Validation

## Overview
Sistema pintar untuk **mencegah pricing errors** saat import model baru. Sistem ini **otomatis memvalidasi** harga sesuai dengan fal.ai dan **mencegah kerugian**.

---

## 🎯 Features

### 1. **Automatic Pricing Validation**
✅ Validasi otomatis saat import model baru  
✅ Deteksi pricing patterns (per-second, flat rate, per-megapixel)  
✅ Warning untuk harga yang tidak wajar  
✅ Block import jika ada error kritis  

### 2. **Smart Profit Calculator**
✅ Hitung profit margin otomatis  
✅ Warning jika profit terlalu rendah (<15%)  
✅ Warning jika profit terlalu tinggi (>50%)  
✅ Rounding otomatis untuk akurasi  

### 3. **Pricing Pattern Detection**
Sistema mengenali pattern harga dari fal.ai:

**Video Models:**
- **Per-Second:** $0.05-$0.30/second (e.g., Sora, Kling)
- **Flat Rate:** $0.20-$2.00/video (e.g., Hunyuan, Luma)

**Image Models:**
- **Per-Image:** $0.015-$0.15/image
- **Per-Megapixel:** $0.003-$0.10/MP

### 4. **Sanity Checks**
✅ Deteksi jika salah input per-second vs flat rate  
✅ Warning jika harga terlalu murah atau mahal  
✅ Verifikasi max_duration untuk proportional pricing  

---

## 🚀 How to Use

### Method 1: Validate Before Import (RECOMMENDED)

```bash
node src/scripts/validateModelBeforeImport.js
```

**Interactive prompt:**
1. Masukkan nama model
2. Masukkan type (image/video)
3. Masukkan harga dari fal.ai
4. Masukkan max duration (untuk video)
5. Konfirmasi per-second atau flat rate

**Output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 PRICING REPORT: Sora 2

Type: video
FAL Price: $0.24
Max Duration: 5s

💰 CALCULATED PRICING:
   Credits: 3.8
   User Pays (USD): $0.300
   User Pays (IDR): Rp 5,700
   Profit Margin: 25.0%

✅ VALID - Safe to import
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Method 2: Import with Validation

```bash
node src/scripts/importModelWithValidation.js
```

Edit file tersebut:
```javascript
const newModel = {
  model_id: 'fal-ai/sora-2',
  name: 'Sora 2',
  type: 'video',
  fal_price: 0.24,  // per-second price
  max_duration: 5,
  pricing_type: 'per_second',
  // ... other fields
};
```

**Sistema akan otomatis:**
1. ✅ Validate pricing
2. ✅ Calculate optimal credits
3. ✅ Check profit margin
4. ✅ Insert ke database
5. ✅ Verify final pricing

### Method 3: Via Admin Panel (With Validation)

Sekarang saat import via `/admin/models`, sistem **otomatis validate**:

1. Go to `/admin/models`
2. Click "Add Model"
3. Fill in the form
4. Sistema akan:
   - ✅ Validate pricing
   - ⚠️ Show warnings jika ada
   - ❌ Block jika error kritis
   - ✅ Auto-calculate credits

---

## 📊 Pricing Validation Rules

### Critical Errors (BLOCK IMPORT)
❌ Price = 0 atau negative  
❌ Video model dengan price < $0.10 untuk flat rate  
❌ Profit margin < 5%  

### Warnings (ALLOWED but NOTIFY)
⚠️ Price diluar typical range  
⚠️ Profit margin < 15% atau > 50%  
⚠️ Total cost sangat mahal  
⚠️ Max duration tidak di-set untuk video  

---

## 🔍 Examples

### Example 1: Correct Video Model (Per-Second)
```javascript
{
  name: "Sora 2",
  type: "video",
  fal_price: 0.24,  // $0.24/second
  max_duration: 5,
  pricing_type: "per_second"
}
```

**Calculation:**
- Total FAL cost for 5s: $0.24 × 5 = $1.20
- Credits: ($1.20 / $0.08) × 1.25 = 18.8 credits
- User pays: Rp 28,200
- Profit: 25%

✅ **VALID**

### Example 2: Correct Video Model (Flat Rate)
```javascript
{
  name: "Luma Dream Machine",
  type: "video",
  fal_price: 0.50,  // flat $0.50/video
  max_duration: 5,
  pricing_type: "flat"
}
```

**Calculation:**
- FAL cost: $0.50
- Credits: ($0.50 / $0.08) × 1.25 = 7.8 credits
- User pays: Rp 11,700
- Profit: 25%

✅ **VALID**

### Example 3: ERROR - Wrong Pricing Type
```javascript
{
  name: "Sora 2",
  type: "video",
  fal_price: 0.24,  // This is per-second!
  max_duration: 5,
  pricing_type: "flat"  // ❌ WRONG!
}
```

**Error:**
```
❌ LIKELY ERROR: Price too low for flat rate video
   Did you mean per-second pricing?
   If this is $0.24/second for 5s:
   → Total would be $1.20
```

❌ **BLOCKED**

### Example 4: Correct Image Model
```javascript
{
  name: "FLUX 1.1 Pro",
  type: "image",
  fal_price: 0.04,
  pricing_type: "flat"
}
```

**Calculation:**
- FAL cost: $0.04
- Credits: ($0.04 / $0.05) × 1.20 = 1.0 credit
- User pays: Rp 1,500
- Profit: 20%

✅ **VALID**

---

## 🛠️ Configuration

### Adjust Profit Margins
Edit `src/utils/pricingValidator.js`:

```javascript
// Line ~170
const baseCredit = type === 'video' ? 0.08 : 0.05;
const profitMargin = type === 'video' ? 0.25 : 0.20;  // 25% for video, 20% for image
const rounding = 0.1;  // Round to 0.1 credits
```

### Adjust Typical Price Ranges
Edit `src/utils/pricingValidator.js`:

```javascript
const PRICING_PATTERNS = {
  PER_SECOND: {
    typical_range: [0.05, 0.30],  // $0.05-$0.30/s
    // ...
  },
  FLAT_RATE: {
    typical_range: [0.20, 2.00],  // $0.20-$2.00/video
    // ...
  },
  // ...
};
```

---

## 📝 NPM Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "validate:model": "node src/scripts/validateModelBeforeImport.js",
    "import:model": "node src/scripts/importModelWithValidation.js"
  }
}
```

Usage:
```bash
npm run validate:model   # Interactive validation
npm run import:model     # Import with validation
```

---

## 🎓 Best Practices

### 1. ALWAYS Validate First
❌ **JANGAN** langsung import model baru  
✅ **SELALU** jalankan validation script dulu  

### 2. Check fal.ai Pricing Page
📖 Buka: https://fal.ai/models  
📖 Cek pricing type: per-second, flat, per-megapixel  
📖 Cek max duration untuk video models  

### 3. Understand Pricing Types

**Per-Second:**
- Sora, Kling, premium models
- Price × Duration = Total cost
- More expensive for longer videos

**Flat Rate:**
- Most video models
- Fixed price regardless of duration
- Same cost for 5s or 10s

### 4. Monitor Profit Margins
🎯 **Target:** 20-25% profit margin  
⚠️ **Warning:** < 15% (too low) or > 50% (too expensive)  

### 5. Test Before Going Live
1. Import model dengan `is_active = false`
2. Test generation
3. Verify costs match fal.ai
4. Enable model

---

## 🚨 Common Mistakes to Avoid

### Mistake 1: Per-Second vs Flat Rate
```javascript
// ❌ WRONG
{
  name: "Sora 2",
  fal_price: 0.24,        // This is $0.24/second
  pricing_type: "flat"    // But marked as flat!
}

// ✅ CORRECT
{
  name: "Sora 2",
  fal_price: 0.24,
  pricing_type: "per_second"  // Correctly marked
}
```

### Mistake 2: Forget Max Duration
```javascript
// ❌ WRONG
{
  name: "Sora 2",
  type: "video",
  fal_price: 0.24,
  // Missing max_duration!
}

// ✅ CORRECT
{
  name: "Sora 2",
  type: "video",
  fal_price: 0.24,
  max_duration: 5,  // Required for proportional pricing
  pricing_type: "per_second"
}
```

### Mistake 3: Wrong Price Unit
```javascript
// ❌ WRONG
{
  name: "FLUX Pro",
  fal_price: 40,  // This is 40 cents, not dollars!
}

// ✅ CORRECT
{
  name: "FLUX Pro",
  fal_price: 0.40,  // Always in dollars
}
```

---

## 🔄 Workflow

### For New Models:

```
1. Check fal.ai pricing
   ↓
2. Run validation script
   ↓
3. Review pricing report
   ↓
4. Fix any errors/warnings
   ↓
5. Import via script or admin panel
   ↓
6. Verify in database
   ↓
7. Test generation
   ↓
8. Enable model
```

### For Price Updates:

```
1. Check new fal.ai pricing
   ↓
2. Update via admin panel or script
   ↓
3. System auto-recalculates credits
   ↓
4. Verify new pricing
   ↓
5. Monitor first few generations
```

---

## 📞 Support

**Jika ada pertanyaan:**
1. Cek validation report
2. Lihat examples di file ini
3. Run validation script untuk guidance

**Jika system block import:**
1. Baca error messages carefully
2. Check fal.ai pricing page
3. Verify pricing type (per-second vs flat)
4. Fix dan try again

---

## ✅ Checklist for New Models

- [ ] Checked fal.ai pricing page
- [ ] Ran validation script
- [ ] No critical errors
- [ ] Profit margin 20-25%
- [ ] Pricing type correct (per-second/flat)
- [ ] Max duration set (for video)
- [ ] Price in USD (not cents)
- [ ] Tested validation report
- [ ] Ready to import!

---

## 🎉 Benefits

### Before This System:
❌ Manual pricing prone to errors  
❌ Risk of financial losses  
❌ Inconsistent profit margins  
❌ No validation  

### After This System:
✅ Automatic validation  
✅ Prevent costly mistakes  
✅ Consistent profit margins  
✅ Smart error detection  
✅ Professional & reliable  

---

**Sistema ini akan OTOMATIS mencegah pricing errors dan memastikan semua model profitable! 🚀**




