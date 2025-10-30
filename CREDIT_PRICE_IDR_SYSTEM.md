# 💳 Credit Price (IDR) System - Complete Guide

> **Purpose**: Allow users to top-up credits using Indonesian Rupiah (IDR) and see pricing in their local currency.

---

## 🎯 **SYSTEM OVERVIEW**

### **Flow:**
```
1. Admin sets Credit Price (IDR) in Pricing Settings
   └─ Default: Rp 1,300 per credit
   └─ Minimum: Rp 1,000 per credit

2. User sees prices in Rupiah in Dashboard
   └─ Example: "Sora 2 - Rp 12,350 (9.5 credits)"

3. User tops up using Rupiah
   └─ Input: Rp 100,000
   └─ Calculator: 100,000 / 1,300 = 76.9 credits
   └─ User gets: 76 credits (rounded down)

4. User can generate content
   └─ Sora 2: 76 / 9.5 = ~8 videos
```

---

## 💰 **PRICING FORMULA**

### **Admin Side (USD → Credits):**
```
FAL.AI Price (USD) → PixelNest Credits

Example (Sora 2):
$0.50 → 9.5 credits

Calculation:
credits = (fal_price / base_credit_usd) × (1 + profit_margin)
credits = ($0.50 / $0.08) × (1 + 0.48)
credits = 6.25 × 1.48
credits = 9.25 → 9.5 credits (rounded)
```

### **User Side (Credits → IDR):**
```
PixelNest Credits → Rupiah (IDR)

Example (Sora 2):
9.5 credits → Rp 12,350

Calculation:
price_idr = credits × credit_price_idr
price_idr = 9.5 × Rp 1,300
price_idr = Rp 12,350
```

### **Top-up (IDR → Credits):**
```
Rupiah (IDR) → PixelNest Credits

Example:
Rp 100,000 → 76 credits

Calculation:
credits = topup_amount_idr / credit_price_idr
credits = Rp 100,000 / Rp 1,300
credits = 76.92 → 76 credits (floor)
```

---

## 🛠️ **IMPLEMENTATION**

### **1. Database**
```sql
-- pricing_config table
INSERT INTO pricing_config (config_key, config_value, description)
VALUES ('credit_price_idr', '1300', 'Harga 1 credit dalam Rupiah (minimum Rp 1,000)');
```

### **2. Admin Pricing Settings**
```
src/views/admin/pricing-settings.ejs
├─ Input: credit_price_idr (number, min: 1000)
├─ Preview: Sora 2 example (9.5 credits × price = Rp ...)
└─ Validation: Minimum Rp 1,000 per credit
```

### **3. User Dashboard**
```
src/views/dashboard.ejs
├─ Show prices in Rupiah
├─ Example: "Sora 2 - Rp 12,350 (9.5 credits)"
└─ Top-up calculator widget
```

### **4. Top-up Calculator**
```javascript
// public/js/topup-calculator.js
function calculateCreditsFromIDR(amountIDR, creditPriceIDR) {
  const credits = Math.floor(amountIDR / creditPriceIDR);
  return {
    credits,
    actualCost: credits * creditPriceIDR,
    remaining: amountIDR - (credits * creditPriceIDR)
  };
}

// Example:
// Input: Rp 100,000 @ Rp 1,300/credit
// Output: 76 credits, cost: Rp 98,800, remaining: Rp 1,200
```

---

## 📊 **EXAMPLES**

### **Example 1: Sora 2 (Video 20s)**
```
FAL.AI Price: $0.50
Credits: 9.5 credits
Price IDR @ Rp 1,300: Rp 12,350

User needs 10 videos:
Total: 10 × 9.5 = 95 credits
Total IDR: 95 × Rp 1,300 = Rp 123,500
```

### **Example 2: Flux Pro (Image)**
```
FAL.AI Price: $0.055
Credits: 2.0 credits
Price IDR @ Rp 1,300: Rp 2,600

User needs 50 images:
Total: 50 × 2.0 = 100 credits
Total IDR: 100 × Rp 1,300 = Rp 130,000
```

### **Example 3: Top-up Rp 500,000**
```
Credit Price: Rp 1,300/credit
Credits: 500,000 / 1,300 = 384.6 → 384 credits
Actual Cost: 384 × 1,300 = Rp 499,200
Remaining: Rp 800 (not enough for 1 credit)

What user can do:
- Sora 2 videos: 384 / 9.5 = 40 videos
- Flux Pro images: 384 / 2.0 = 192 images
- Mix of both!
```

---

## 🎨 **UI COMPONENTS**

### **Admin Pricing Settings:**
```
🇮🇩 Harga Credit (Rupiah)
[Rp] [1300] /credit
     ^^^^^^^^
     Min: Rp 1,000

Preview Sora 2 (20s):
Rp 12,350
9.5 credits
```

### **User Dashboard Dropdown:**
```
Before:
Sora 2 🔥 - 9.5 credits (max 20s) • 0.48cr/s

After:
Sora 2 🔥 - Rp 12,350 (9.5 credits)
           or 9.5 credits (max 20s) • 0.48cr/s
```

### **Top-up Calculator:**
```
💳 Top-up Credits

Masukkan jumlah:
[Rp] [100000]

You will get:
┌─────────────────────┐
│ 76 Credits          │
│ Rp 98,800          │
│                     │
│ Sisa: Rp 1,200     │
└─────────────────────┘

[Lanjutkan Top-up]
```

---

## ✅ **FEATURES COMPLETED**

1. ✅ **Admin can set Credit Price (IDR)**
   - Input field in Pricing Settings
   - Minimum validation: Rp 1,000
   - Real-time preview

2. ✅ **Database storage**
   - `pricing_config` table
   - `config_key`: `credit_price_idr`
   - Default: Rp 1,300

3. ✅ **Backend validation**
   - `adminController.js`
   - Validates minimum Rp 1,000
   - Updates database on save

4. ✅ **Frontend preview**
   - `admin-pricing.js`
   - Real-time calculator
   - Sora 2 example

---

## 🚧 **TODO**

1. ⏳ **Display prices in Rupiah on User Dashboard**
   - Show both IDR and credits
   - Update dropdown format

2. ⏳ **Top-up Calculator Widget**
   - Input: Rupiah amount
   - Output: Credits + breakdown
   - Show what user can generate

3. ⏳ **Admin Profit Analysis in IDR**
   - Show revenue in Rupiah
   - Profit margins in IDR
   - Total earnings dashboard

---

## 📱 **MOBILE RESPONSIVE**

All UI components are mobile-friendly:
- Touch-friendly input fields
- Large buttons for top-up
- Clear typography for pricing
- Collapsible calculators

---

## 🔒 **SECURITY**

1. **Validation:**
   - Minimum Rp 1,000 per credit
   - Maximum Rp 10,000 per credit (to prevent typos)
   - Integer values only

2. **Database:**
   - Stored as INTEGER (not float)
   - No SQL injection (parameterized queries)
   - Admin-only access

3. **Calculations:**
   - Floor division for top-up (no fractional credits)
   - Exact multiplication for pricing
   - No rounding errors

---

## 🎓 **FOR USERS**

### **How to Top-up:**
```
1. Go to Dashboard → Top-up
2. Enter Rupiah amount (e.g., Rp 100,000)
3. See how many credits you'll get (e.g., 76 credits)
4. Choose payment method
5. Complete payment
6. Credits added instantly!
```

### **Understanding Pricing:**
```
Each model shows:
- Price in Rupiah (e.g., Rp 12,350)
- Credits needed (e.g., 9.5 credits)
- What you can generate (e.g., 1 video 20s)

Example:
"Sora 2 - Rp 12,350 (9.5 credits)"
Means: You need 9.5 credits or Rp 12,350 per generation
```

---

## 💡 **ADMIN TIPS**

### **Setting Credit Price:**
1. **Consider:**
   - FAL.AI costs (in USD)
   - Your desired profit margin
   - Market pricing in Indonesia
   - Payment gateway fees

2. **Recommended Range:**
   - Minimum: Rp 1,000/credit (for profitability)
   - Sweet spot: Rp 1,200-1,500/credit
   - Maximum: Rp 2,000/credit (user-friendly)

3. **Adjustment:**
   - Start with Rp 1,300 (default)
   - Monitor user feedback
   - Check competitor pricing
   - Adjust quarterly

---

## 🎉 **BENEFITS**

### **For Users:**
✅ Prices in local currency (easy to understand)
✅ Clear top-up calculator
✅ Know exactly what you can generate
✅ No currency conversion confusion

### **For Admin:**
✅ Easy pricing management
✅ One setting controls all user-facing prices
✅ Profit analysis in IDR
✅ Flexible pricing strategy

---

**STATUS: 60% Complete**
- ✅ Backend: 100%
- ✅ Admin UI: 100%
- ⏳ User Dashboard: 40%
- ⏳ Top-up Calculator: 0%
- ⏳ Profit Analysis: 0%

**NEXT STEPS:**
1. Update user dashboard to show IDR
2. Create top-up calculator widget
3. Add profit analysis in IDR to admin dashboard

