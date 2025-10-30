# ✅ Minimum Purchase Updated - 1 Credit

## 🎯 Changes Overview

Updated minimum purchase dari **10 credits** menjadi **1 credit** untuk memberikan fleksibilitas lebih kepada user.

---

## 📝 Changes Made

### 1. **Frontend (Dashboard)** ✅

#### File: `src/views/auth/dashboard.ejs`

**Custom Input Field:**
```html
<!-- Before -->
<input 
  type="number" 
  id="customCredits" 
  min="10"
  placeholder="Minimal 10 credits"
  ...
>

<!-- After -->
<input 
  type="number" 
  id="customCredits" 
  min="1"
  step="1"
  placeholder="Minimal 1 credit"
  ...
>
```

**JavaScript Validation:**
```javascript
// Before
if (selectedCreditsAmount >= 10) {
  // Enable payment
}

// After
if (selectedCreditsAmount >= 1) {
  // Enable payment
}
```

**Summary Display with Proper Pluralization:**
```javascript
// Before
document.getElementById('summaryCredits').textContent = `${selectedCreditsAmount} Credits`;

// After
document.getElementById('summaryCredits').textContent = `${selectedCreditsAmount} Credit${selectedCreditsAmount > 1 ? 's' : ''}`;
```

**Examples:**
- 1 credit → "1 Credit" (singular)
- 2 credits → "2 Credits" (plural)
- 10 credits → "10 Credits" (plural)

---

### 2. **Backend (Payment Controller)** ✅

#### File: `src/controllers/paymentController.js`

**Before:**
```javascript
// Hardcoded minimum Rp 10.000
if (amount < 10000) {
  return res.status(400).json({
    success: false,
    message: 'Minimum amount is Rp 10.000'
  });
}

// Get credit price after validation
const creditPriceIDR = parseInt(priceResult.rows[0]?.config_value || 1300);

// Check if creditsAmount === 0
if (creditsAmount === 0) {
  return res.status(400).json({
    success: false,
    message: `Amount too small. Minimum Rp ${creditPriceIDR} for 1 credit`
  });
}
```

**After:**
```javascript
// Get credit price FIRST
const creditPriceIDR = parseInt(priceResult.rows[0]?.config_value || 2000);

// Dynamic minimum based on credit price
if (amount < creditPriceIDR) {
  return res.status(400).json({
    success: false,
    message: `Minimum pembelian 1 credit (Rp ${creditPriceIDR.toLocaleString('id-ID')})`
  });
}

// Calculate credits
const creditsAmount = credits || Math.floor(amount / creditPriceIDR);

// Safety check with proper message
if (creditsAmount < 1) {
  return res.status(400).json({
    success: false,
    message: `Minimum pembelian 1 credit (Rp ${creditPriceIDR.toLocaleString('id-ID')})`
  });
}
```

**Key Improvements:**
1. ✅ **Dynamic validation** - Based on actual credit price dari database
2. ✅ **Better error messages** - Menampilkan harga dalam Rupiah yang benar
3. ✅ **Updated default** - 1300 → 2000 untuk match current system
4. ✅ **Proper flow** - Get price first, then validate

---

## 🔄 Validation Flow

### Frontend Flow:
```
User Input → Validation (>= 1) → Update Summary → Enable Button
```

### Backend Flow:
```
Request → Get Credit Price → Validate Amount (>= creditPriceIDR) 
→ Calculate Credits → Validate Credits (>= 1) → Create Transaction
```

---

## 💰 Pricing Examples

Assuming credit price = **Rp 2.000** per credit:

| Credits | Amount (Rp) | Valid? |
|---------|-------------|--------|
| 1 | 2.000 | ✅ Valid |
| 2 | 4.000 | ✅ Valid |
| 5 | 10.000 | ✅ Valid |
| 10 | 20.000 | ✅ Valid |
| 0.5 | 1.000 | ❌ Below minimum |
| 0 | 0 | ❌ Invalid |

---

## 🧪 Testing Checklist

### Frontend Testing:

- [ ] Open top up modal
- [ ] Try entering **1** in custom input
  - [ ] Verify summary shows "1 Credit" (singular)
  - [ ] Verify button is enabled
  - [ ] Verify price calculated correctly
- [ ] Try entering **2** in custom input
  - [ ] Verify summary shows "2 Credits" (plural)
- [ ] Try entering **0.5**
  - [ ] Should not allow (min="1" in input)
- [ ] Click template button (10, 20, 50, etc)
  - [ ] All should work normally

### Backend Testing:

```bash
# Test 1: Buy 1 credit (should succeed)
curl -X POST http://localhost:5005/api/payment/create \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION" \
  -d '{
    "credits": 1,
    "amount": 2000,
    "paymentMethod": "BRIVA"
  }'

# Expected: Success with transaction created

# Test 2: Buy with amount < 1 credit (should fail)
curl -X POST http://localhost:5005/api/payment/create \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION" \
  -d '{
    "amount": 1000,
    "paymentMethod": "BRIVA"
  }'

# Expected: Error "Minimum pembelian 1 credit (Rp 2.000)"

# Test 3: Buy 10 credits (should succeed as before)
curl -X POST http://localhost:5005/api/payment/create \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION" \
  -d '{
    "credits": 10,
    "amount": 20000,
    "paymentMethod": "BRIVA"
  }'

# Expected: Success with transaction created
```

---

## 📊 Before vs After

### Minimum Purchase:
| Aspect | Before | After | Change |
|--------|--------|-------|--------|
| Min Credits | 10 | 1 | -90% |
| Min Amount (@ Rp 2K) | Rp 20.000 | Rp 2.000 | -90% |
| Frontend Validation | >= 10 | >= 1 | ✅ |
| Backend Validation | Rp 10.000 | Dynamic | ✅ |
| Error Messages | Generic | Specific | ✅ |
| Input Placeholder | "Minimal 10 credits" | "Minimal 1 credit" | ✅ |
| Singular/Plural | Always "Credits" | Smart detection | ✅ |

---

## 🎯 Benefits

### For Users:
1. ✅ **Lower barrier to entry** - Can buy just 1 credit to test
2. ✅ **More flexibility** - Buy exact amount needed
3. ✅ **Less waste** - No need to buy 10 credits when only need 3
4. ✅ **Better UX** - Clearer error messages

### For Business:
1. ✅ **More conversions** - Lower minimum increases purchases
2. ✅ **Better retention** - Users can top up small amounts
3. ✅ **Flexible pricing** - Minimum adjusts with credit price
4. ✅ **Scalable** - Works with any credit price setting

---

## ⚠️ Important Notes

### 1. **Credit Price Dependency:**
The minimum amount is **dynamically calculated** based on `credit_price_idr` in database:

```javascript
const creditPriceIDR = parseInt(priceResult.rows[0]?.config_value || 2000);
```

If credit price changes, minimum amount changes automatically:
- Credit price Rp 1.500 → Min amount Rp 1.500
- Credit price Rp 2.000 → Min amount Rp 2.000
- Credit price Rp 3.000 → Min amount Rp 3.000

### 2. **Tripay Minimum:**
Check Tripay payment gateway minimum limits! Some payment methods might have their own minimums (e.g., Virtual Account min Rp 10.000).

**Recommendation:**
```javascript
// In paymentController.js, add payment method validation
const paymentMethodMinimums = {
  'BRIVA': 10000,
  'BCAVA': 10000,
  'MANDIRIVA': 10000,
  'QRIS': 1000,  // Lower minimum for QRIS
  'OVO': 10000,
  'GOPAY': 1000,
  'SHOPEEPAY': 1000
};

const methodMinimum = paymentMethodMinimums[paymentMethod] || 1000;
if (amount < methodMinimum) {
  return res.status(400).json({
    success: false,
    message: `Minimum for ${paymentMethod}: Rp ${methodMinimum.toLocaleString('id-ID')}`
  });
}
```

### 3. **Decimal Credits:**
With min=1 and step=1, users can only buy whole credits (1, 2, 3, etc).

To allow decimal:
```html
<input 
  type="number" 
  id="customCredits" 
  min="1"
  step="0.1"  <!-- Allow 1.5, 2.3, etc -->
  ...
>
```

---

## 🔮 Future Enhancements (Optional)

### 1. Add 1 Credit Template Button:
```html
<button onclick="selectCredits(1)" class="credit-btn ...">
  <span class="text-xl">1</span>
  <span class="text-[10px]">Credit</span>
  <span class="text-xs">Rp 2K</span>
</button>
```

### 2. Smart Minimum Based on Payment Method:
```javascript
function updateMinimumByPaymentMethod(method) {
  const minimums = {
    'QRIS': 1,
    'GOPAY': 1,
    'SHOPEEPAY': 1,
    'BRIVA': 5,  // Virtual accounts typically have higher minimums
    'BCAVA': 5,
    'MANDIRIVA': 5
  };
  
  const minCredits = minimums[method] || 1;
  document.getElementById('customCredits').min = minCredits;
  // Update placeholder and validation
}
```

### 3. Show Remaining Credits Needed:
```javascript
// If user has 8 credits, show "Need 2 more for feature X"
const userCredits = <%= user.credits %>;
const neededForFeature = 10;
const remaining = Math.max(0, neededForFeature - userCredits);

if (remaining > 0) {
  showMessage(`Buy ${remaining} more credit${remaining > 1 ? 's' : ''} to unlock Feature X!`);
}
```

---

## ✅ Status

- [x] Frontend input validation updated (min="1")
- [x] Frontend JavaScript validation updated (>= 1)
- [x] Frontend singular/plural handling added
- [x] Backend validation updated (dynamic based on price)
- [x] Error messages improved (Indonesian + formatted)
- [x] Default credit price updated (1300 → 2000)
- [x] No linter errors
- [ ] **Test with real payment** ⚠️ Important!
- [ ] **Check Tripay minimums** ⚠️ Important!

---

## 🚀 Next Steps

1. **Test thoroughly:**
   - Buy 1 credit via each payment method
   - Verify Tripay accepts the amount
   - Check transaction completes successfully

2. **Monitor:**
   - Track conversion rates
   - Check average purchase size
   - Monitor payment failures

3. **Adjust if needed:**
   - If certain payment methods fail, add method-specific minimums
   - If too many small purchases, consider adding small purchase fee

---

**Last Updated:** October 26, 2025  
**Status:** ✅ **COMPLETE** - Ready for testing!

---

## 📞 Support

If payment fails with error "Amount too small":
1. Check Tripay payment method minimums
2. Verify credit_price_idr in database
3. Check if payment method supports small amounts

**Database Query:**
```sql
SELECT config_value FROM pricing_config WHERE config_key = 'credit_price_idr';
```

**Update if needed:**
```sql
UPDATE pricing_config 
SET config_value = '2000' 
WHERE config_key = 'credit_price_idr';
```

