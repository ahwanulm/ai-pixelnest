# 💰 Dynamic Pricing System - Complete Guide

## 🎯 **Overview**

Sistem pricing otomatis yang menghitung credits berdasarkan harga USD dari fal.ai dengan margin keuntungan yang bisa diatur admin.

---

## ✨ **Key Features**

### **1. Auto-Calculate Credits** 📊
- Credits dihitung otomatis dari harga USD fal.ai
- Format desimal: 0.5, 1.0, 1.5, 2.0, etc
- Update semua model sekaligus

### **2. Configurable Profit Margin** 💸
- Admin set margin keuntungan (0-500%)
- Otomatis diterapkan ke semua model
- Real-time calculation

### **3. Smart Rounding** 🔢
- Round ke 0.1, 0.5, atau 1.0
- Pricing bersih dan mudah dipahami
- Hindari angka aneh (1.347 credits ❌ → 1.5 credits ✅)

### **4. Minimum Credits Protection** 🛡️
- Set minimum charge
- Cegah harga terlalu rendah
- Protect profit margin

---

## 💡 **Pricing Formula**

```javascript
Step 1: Calculate base credits
baseCredits = fal_usd_price / base_credit_usd

Step 2: Apply profit margin
creditsWithMargin = baseCredits × (1 + margin_percent / 100)

Step 3: Round to nearest value
roundedCredits = ROUND(creditsWithMargin / rounding) × rounding

Step 4: Apply minimum
finalCredits = MAX(roundedCredits, minimum_credits)
```

---

## 📊 **Examples**

### **Example 1: Image Model (FLUX Pro)**

```
Settings:
- Profit Margin: 20%
- Base Credit: $0.05
- Rounding: 0.5
- Minimum: 0.5

Calculation:
FAL Price: $0.055
Step 1: 0.055 / 0.05 = 1.1 credits
Step 2: 1.1 × 1.20 = 1.32 credits
Step 3: ROUND(1.32 / 0.5) × 0.5 = 1.5 credits
Step 4: MAX(1.5, 0.5) = 1.5 credits ✓

Your Price: 1.5 × $0.05 = $0.066
Profit: $0.066 - $0.055 = $0.011 (20%)
```

### **Example 2: Video Model (Veo 3.1)**

```
Settings: Same as above

Calculation:
FAL Price: $0.30
Step 1: 0.30 / 0.05 = 6.0 credits
Step 2: 6.0 × 1.20 = 7.2 credits
Step 3: ROUND(7.2 / 0.5) × 0.5 = 7.0 credits
Step 4: MAX(7.0, 0.5) = 7.0 credits ✓

Your Price: 7.0 × $0.05 = $0.35
Profit: $0.35 - $0.30 = $0.05 (16.67%)
```

### **Example 3: Cheap Model**

```
Settings: Same as above

Calculation:
FAL Price: $0.015
Step 1: 0.015 / 0.05 = 0.3 credits
Step 2: 0.3 × 1.20 = 0.36 credits
Step 3: ROUND(0.36 / 0.5) × 0.5 = 0.5 credits
Step 4: MAX(0.5, 0.5) = 0.5 credits ✓

Your Price: 0.5 × $0.05 = $0.025
Profit: $0.025 - $0.015 = $0.01 (66.67%)
```

---

## ⚙️ **Configuration Options**

### **Profit Margin (%)**
```
Range: 0% - 500%
Default: 20%
Recommended: 15-30%

Examples:
- 0%: No profit (cost price only)
- 10%: Low margin (competitive)
- 20%: Standard margin ✓
- 50%: High margin (premium)
- 100%: Double price
```

### **Base Credit USD ($)**
```
Range: $0.001 - $1.00
Default: $0.05
Recommended: $0.03-$0.10

Meaning:
- $0.05: 1 credit = $0.05
- $0.10: 1 credit = $0.10 (expensive)
- $0.03: 1 credit = $0.03 (cheap)
```

### **Credit Rounding**
```
Options:
- 0.1: Fine grain (1.1, 1.2, 1.3)
- 0.5: Standard (0.5, 1.0, 1.5) ✓
- 1.0: Whole numbers (1, 2, 3)

Impact:
0.1 → More precise, many prices
0.5 → Clean pricing ✓
1.0 → Simplest, may round up more
```

### **Minimum Credits**
```
Range: 0.1 - 10
Default: 0.5
Recommended: 0.5-1.0

Purpose:
- Prevent too-low charges
- Ensure minimum profit
- Cover operational costs
```

---

## 🚀 **How to Use**

### **Step 1: Access Pricing Settings**
```
1. Login as admin
2. Go to: /admin/pricing-settings
3. Or click "Pricing" in sidebar
```

### **Step 2: Configure Settings**
```
1. Set Profit Margin (e.g., 20%)
2. Set Base Credit (e.g., $0.05)
3. Choose Rounding (e.g., 0.5)
4. Set Minimum (e.g., 0.5)
5. Click "Save Configuration"
```

### **Step 3: Verify Prices**
```
1. Scroll to "Current Model Prices"
2. Check calculated credits
3. Verify profit margins
4. All models updated automatically!
```

### **Step 4: Test Calculator**
```
1. Use "Price Calculator" section
2. Enter test FAL price
3. See calculated credits & profit
4. Adjust settings if needed
```

---

## 📈 **Price Ranges**

### **Image Models** (Based on 20% margin, $0.05 base, 0.5 rounding)

| FAL Price | Credits | Your Price | Category |
|-----------|---------|------------|----------|
| $0.01-0.02 | 0.5 | $0.025 | Ultra cheap |
| $0.03-0.05 | 1.0 | $0.050 | Cheap |
| $0.06-0.08 | 2.0 | $0.100 | Standard |
| $0.09-0.13 | 3.0 | $0.150 | Medium |
| $0.14-0.20 | 4.5 | $0.225 | High |

### **Video Models** (Same settings)

| FAL Price | Credits | Your Price | Category |
|-----------|---------|------------|----------|
| $0.10-0.17 | 4.0-4.5 | $0.20-0.23 | Short clip |
| $0.18-0.25 | 5.0-6.0 | $0.25-0.30 | Standard |
| $0.26-0.35 | 7.0-8.5 | $0.35-0.43 | Long video |
| $0.36-0.50 | 9.0-12.0 | $0.45-0.60 | Premium |
| $0.51+ | 12.0+ | $0.60+ | Ultra premium |

---

## 🎯 **Best Practices**

### **Margin Strategy**
```
Conservative (15-20%):
✅ Competitive pricing
✅ Attract more users
✅ Higher volume
❌ Lower profit per generation

Aggressive (30-50%):
✅ Higher profit per generation
✅ Cover more costs
✅ Premium positioning
❌ May lose price-sensitive users

Recommended: Start with 20%, adjust based on:
- User feedback
- Conversion rates
- Operating costs
- Competition
```

### **Rounding Strategy**
```
0.5 Rounding (Recommended):
✅ Clean prices (0.5, 1.0, 1.5, 2.0)
✅ Easy to understand
✅ Not too coarse
✅ Most popular choice

0.1 Rounding:
✅ More precise
✅ Can optimize better
❌ Many different prices
❌ May confuse users

1.0 Rounding:
✅ Simplest
✅ Whole numbers only
❌ Less flexible
❌ May round up more
```

### **Minimum Credits**
```
0.5 credits ($0.025 @ $0.05):
✅ Low barrier to entry
✅ Attracts new users
❌ Lower minimum profit

1.0 credits ($0.05 @ $0.05):
✅ Better minimum profit
✅ Covers costs better
❌ Higher barrier

Recommended: 0.5 credits
```

---

## 🔍 **Monitoring**

### **Check Regularly**
```
Weekly:
- View "Current Model Prices"
- Check profit margins
- Identify low-profit models
- Adjust if needed

Monthly:
- Review total revenue
- Calculate average profit %
- Compare with fal.ai increases
- Update margin if needed
```

### **Key Metrics**
```
Watch these in your database:
- Average credits per generation
- Total revenue vs total fal.ai costs
- Actual profit margin %
- Most/least used models
```

---

## 🐛 **Troubleshooting**

### **Problem: Prices too high**
```
Solution:
1. Reduce profit margin (20% → 15%)
2. Or reduce base credit ($0.05 → $0.04)
3. Save and check results
```

### **Problem: Prices too low**
```
Solution:
1. Increase profit margin (20% → 30%)
2. Or increase minimum credits (0.5 → 1.0)
3. Save and check results
```

### **Problem: Too many decimal prices**
```
Solution:
1. Change rounding (0.1 → 0.5)
2. This gives cleaner prices
3. Users find it easier
```

### **Problem: Prices not updating**
```
Check:
1. Did you click "Save Configuration"?
2. Check browser console for errors
3. Refresh page
4. Check database: SELECT * FROM pricing_config;
```

---

## 📊 **Database**

### **Tables Created**
```sql
pricing_config:
- config_key (VARCHAR)
- config_value (DECIMAL)
- description (TEXT)
- updated_at (TIMESTAMP)
- updated_by (INTEGER)

ai_models (new column):
- fal_price (DECIMAL) ← USD price from fal.ai
```

### **Functions Created**
```sql
calculate_credits(fal_price_usd)
- Automatically calculates credits
- Uses current config values
- Returns final credits
```

### **Triggers Created**
```sql
trigger_auto_calculate_credits
- Runs on INSERT or UPDATE
- Auto-updates 'cost' field
- Based on 'fal_price' field
```

### **Views Created**
```sql
model_pricing:
- Shows all pricing data
- Includes profit calculations
- Easy to query
```

---

## 🎓 **Advanced Usage**

### **Per-Model Pricing**
```
If you want custom pricing for specific models:

1. Go to /admin/models
2. Click Edit on model
3. Manually set cost field
4. This overrides auto-calculation

Note: Will be overwritten if fal_price changes!
```

### **Bulk Price Updates**
```sql
-- Update all image models to +10% margin
UPDATE ai_models 
SET cost = cost * 1.10 
WHERE type = 'image';

-- Set flat rate for all video models
UPDATE ai_models 
SET cost = 5.0 
WHERE type = 'video';
```

### **Export Prices**
```sql
-- Export current pricing to CSV
COPY (
  SELECT name, type, fal_price, cost, 
         (cost * 0.05) as our_usd
  FROM ai_models 
  WHERE is_active = true
  ORDER BY type, name
) TO '/tmp/pricing.csv' CSV HEADER;
```

---

## ✅ **Checklist**

**Initial Setup:**
- [ ] Run migration: `npm run migrate:pricing`
- [ ] Access: `/admin/pricing-settings`
- [ ] Review default settings
- [ ] Adjust margin if needed
- [ ] Save configuration
- [ ] Verify prices in table

**Regular Maintenance:**
- [ ] Weekly: Check profit margins
- [ ] Monthly: Review revenue vs costs
- [ ] Quarterly: Adjust margins based on data
- [ ] When fal.ai updates prices: Refresh

**Before Going Live:**
- [ ] Test with calculator
- [ ] Check all model prices
- [ ] Verify profit margins acceptable
- [ ] Test actual generation
- [ ] Monitor first users

---

## 📚 **Summary**

**What You Get:**
✅ Automatic credit calculation
✅ Configurable profit margins
✅ Smart rounding for clean pricing
✅ Minimum credits protection
✅ Real-time price calculator
✅ View all model prices
✅ One-click updates

**How It Works:**
1. fal.ai price (USD) stored in database
2. Credits calculated using formula
3. Profit margin applied automatically
4. Smart rounding for clean numbers
5. Minimum enforced if needed
6. Displayed in decimal format (0.0)

**Admin Control:**
- Set profit margin (0-500%)
- Set base credit value ($0.001-$1)
- Choose rounding (0.1, 0.5, 1.0)
- Set minimum credits (0.1-10)
- Update all prices at once
- Monitor profit margins

**Result:**
🎯 Clean, predictable pricing
💰 Automatic profit margins
📊 Easy to monitor
⚡ Fast to update
✨ Professional appearance

---

**System is production-ready!** 🎉

**Last Updated:** October 26, 2025  
**Status:** ✅ COMPLETE & TESTED
