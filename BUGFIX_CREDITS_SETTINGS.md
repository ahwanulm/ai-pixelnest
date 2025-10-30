# 🐛 Bugfix: Credits Settings Type Error

## ❌ Error yang Terjadi:

### Error 1: Invalid Input Syntax for Type Numeric
```
error: invalid input syntax for type numeric: "true"
```

### Error 2: Pool is Not Defined
```
ReferenceError: pool is not defined
at getSettings (adminController.js:384:29)
```

---

## ✅ Root Cause:

### **1. Column Type Mismatch**
Table `pricing_config` memiliki kolom:
```sql
config_value DECIMAL(10, 4) NOT NULL
```

**Masalah:** Code mencoba save string `'true'` ke kolom DECIMAL!

### **2. Missing Import**
`adminController.js` tidak import `pool` dari database.

---

## ✅ Solusi yang Diterapkan:

### **1. Fix Data Type - Gunakan 1/0 untuk Boolean**

**Before:**
```javascript
// ❌ SALAH - String ke DECIMAL column
INSERT INTO pricing_config (config_key, config_value)
VALUES ('give_default_credits', 'true')  // ERROR!
```

**After:**
```javascript
// ✅ BENAR - Number ke DECIMAL column
INSERT INTO pricing_config (config_key, config_value)
VALUES ('give_default_credits', 1)  // 1 = true, 0 = false
```

### **2. Fix Parsing dari Database**

**Before:**
```javascript
// ❌ Parse as string
settings.give_default_credits = row.config_value === 'true' || row.config_value === '1';
```

**After:**
```javascript
// ✅ Parse as number
settings.give_default_credits = parseFloat(row.config_value) === 1;
```

### **3. Add Missing Import**

**Before:**
```javascript
// ❌ Missing import
const Admin = require('../models/Admin');
```

**After:**
```javascript
// ✅ Add pool import
const { pool } = require('../config/database');
const Admin = require('../models/Admin');
```

---

## 📁 Files Modified:

1. ✅ `src/controllers/adminController.js`
   - Added: `const { pool } = require('../config/database')`
   - Fixed: Parse DECIMAL values correctly (line 398, 450, 498)

2. ✅ `src/models/User.js`
   - Fixed: Parse DECIMAL values correctly (line 112, 114)

3. ✅ `src/scripts/initDefaultCreditsSettings.js`
   - Fixed: Use numeric values instead of strings (line 30, 38)

---

## 🚀 Test Sekarang:

### Step 1: Initialize Settings
```bash
npm run init:credits-settings
```

**Expected Output:**
```
✅ Default credits settings initialized!
📊 Current Configuration:
   - Give Default Credits: ✅ Enabled
   - Default Amount: 💰 100 credits
```

### Step 2: Give Credits to Existing Users
```bash
npm run give:credits
```

### Step 3: Start Server
```bash
npm start
# atau
npm run dev
```

### Step 4: Test Admin Panel
```
1. Go to: http://localhost:5005/admin/settings
2. Should load without errors ✅
3. Try toggle ON/OFF
4. Try change amount
5. Save Settings
6. Reload page - settings should persist ✅
```

---

## 💡 Key Takeaway:

### **Database Column Types Matter!**

**Table Schema:**
```sql
CREATE TABLE pricing_config (
  config_key VARCHAR(100),
  config_value DECIMAL(10, 4)  -- ⚠️ This is NUMERIC!
)
```

**Code Must Match:**
```javascript
// For boolean: Use 1 or 0
give_default_credits: 1  // true
give_default_credits: 0  // false

// For numbers: Use numbers directly
default_user_credits: 100

// When reading: Parse as float
const value = parseFloat(row.config_value);
```

---

## ✅ Status:

**FIXED!** ✅

All type mismatches resolved. System ready to use!

---

**Fixed:** October 26, 2025  
**Issue:** Type mismatch & missing import  
**Status:** ✅ RESOLVED

