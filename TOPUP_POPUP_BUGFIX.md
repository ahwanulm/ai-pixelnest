# 🐛 Top Up Popup - JavaScript Bug Fix

## ❌ Error Yang Terjadi

```
dashboard:1042 Uncaught TypeError: Cannot read properties of null (reading 'querySelector')
    at updateSummary (dashboard:1042:59)
    at selectCredits (dashboard:899:13)
    at HTMLButtonElement.onclick (dashboard:624:239)
```

## 🔍 Root Cause

Ketika mengubah CSS dari `space-y-2` menjadi `space-y-1.5`, JavaScript masih mencari selector lama:

```javascript
// ❌ OLD - Selector tidak ditemukan karena class sudah berubah
const summaryContainer = document.querySelector('#priceSummary .space-y-2');
const existingDiscount = summaryContainer.querySelector('.promo-discount-row'); // summaryContainer is null!
```

## ✅ Solusi

### 1. **Update Selector & Add Null Check**

```javascript
// ✅ NEW - Gunakan selector yang benar dan tambah null check
const summaryContainer = document.querySelector('#priceSummary .space-y-1\\.5');
if (summaryContainer) {
    const existingDiscount = summaryContainer.querySelector('.promo-discount-row');
    if (existingDiscount) {
        existingDiscount.remove();
    }
}
```

**Note:** Perlu escape `.` dengan `\\.` karena CSS class contains dot.

### 2. **Add Null Check for Discount Row Insertion**

```javascript
// ✅ Check summaryContainer sebelum digunakan
if (appliedPromo && discount > 0 && summaryContainer) {
    const originalTotal = selectedCreditsAmount * creditPriceIDR;
    const discountRow = document.createElement('div');
    discountRow.className = 'promo-discount-row';
    discountRow.innerHTML = `...`;
    
    // ✅ Check separator juga
    const separator = summaryContainer.querySelector('.h-px');
    if (separator) {
        separator.insertAdjacentElement('beforebegin', discountRow);
    }
}
```

### 3. **Update Font Size untuk Consistency**

```javascript
// ✅ Update text-sm menjadi text-xs untuk match compact design
discountRow.innerHTML = `
    <div class="flex justify-between text-xs">  <!-- Changed from text-sm -->
        <span class="text-gray-400">Harga Awal:</span>
        <span class="text-white font-semibold">Rp ${originalTotal.toLocaleString('id-ID')}</span>
    </div>
    <div class="flex justify-between text-xs">  <!-- Changed from text-sm -->
        <span class="text-purple-400">
            <i class="fas fa-tag mr-1"></i>
            Diskon (${appliedPromo.code}):
        </span>
        <span class="text-purple-400 font-semibold">-Rp ${discount.toLocaleString('id-ID')}</span>
    </div>
`;
```

## 📋 Changes Made

### File: `src/views/auth/dashboard.ejs`

**Line ~1043:**
```javascript
// Before:
const summaryContainer = document.querySelector('#priceSummary .space-y-2');
const existingDiscount = summaryContainer.querySelector('.promo-discount-row');

// After:
const summaryContainer = document.querySelector('#priceSummary .space-y-1\\.5');
if (summaryContainer) {
    const existingDiscount = summaryContainer.querySelector('.promo-discount-row');
    if (existingDiscount) {
        existingDiscount.remove();
    }
}
```

**Line ~1051:**
```javascript
// Before:
if (appliedPromo && discount > 0) {
    // ... create discountRow ...
    summaryContainer.querySelector('.h-px').insertAdjacentElement('beforebegin', discountRow);
}

// After:
if (appliedPromo && discount > 0 && summaryContainer) {
    // ... create discountRow ...
    const separator = summaryContainer.querySelector('.h-px');
    if (separator) {
        separator.insertAdjacentElement('beforebegin', discountRow);
    }
}
```

**Line ~1056-1066:**
```javascript
// Before:
<div class="flex justify-between text-sm">

// After:
<div class="flex justify-between text-xs">
```

## 🧪 Testing

1. ✅ Open top up modal
2. ✅ Click any credit template (10, 20, 50, 100, 200)
3. ✅ Verify no console errors
4. ✅ Verify summary displays correctly
5. ✅ Apply promo code
6. ✅ Verify discount row appears
7. ✅ Verify font sizes are consistent (text-xs)
8. ✅ Change credit amount
9. ✅ Verify old discount row is removed and new one added

## 🎯 Why This Happened

Saat melakukan redesign untuk membuat popup lebih compact:

1. CSS class `space-y-2` diubah menjadi `space-y-1.5`
2. JavaScript tidak diupdate untuk menggunakan selector baru
3. `querySelector` return `null` saat mencari `.space-y-2`
4. Attempt to call `querySelector` on `null` menyebabkan error

## 💡 Lessons Learned

### Best Practices:

1. **Gunakan ID atau Data Attributes untuk JS Selection**
   ```html
   <!-- Better approach -->
   <div id="priceSummary" class="...">
     <div id="summaryContent" class="space-y-1.5">
       <!-- content -->
     </div>
   </div>
   ```
   
   ```javascript
   // More stable selector
   const summaryContainer = document.getElementById('summaryContent');
   ```

2. **Always Add Null Checks**
   ```javascript
   const element = document.querySelector('.some-class');
   if (element) {
       // safe to use element
   }
   ```

3. **Use Data Attributes for JS Hooks**
   ```html
   <div data-js="summary-container" class="space-y-1.5">
   ```
   
   ```javascript
   const summaryContainer = document.querySelector('[data-js="summary-container"]');
   ```

## ✅ Status

- [x] Error fixed
- [x] Null checks added
- [x] Font sizes updated for consistency
- [x] No linter errors
- [x] Tested and working

---

**Last Updated:** October 26, 2025  
**Status:** ✅ **FIXED** - JavaScript error resolved, popup working correctly!

