# 🎛️ Admin Full Control: Default Credits System

## ✅ SELESAI - Admin Punya Full Control!

### **Fitur Baru:**
Admin sekarang punya **kontrol penuh** atas credits yang diberikan ke user baru melalui **System Settings** di admin panel.

---

## 🎯 Apa yang Bisa Admin Kontrol?

### **1. Enable/Disable Default Credits**
Admin bisa **menyalakan atau mematikan** pemberian credits otomatis saat user register.

**Opsi:**
- ✅ **Enabled**: User baru dapat credits otomatis
- ❌ **Disabled**: User baru dapat 0 credits (harus beli)

### **2. Jumlah Credits**
Admin bisa **set berapa credits** yang user baru terima (jika enabled).

**Range:**
- Minimum: **0 credits**
- Maximum: **Unlimited** (admin bebas set)
- Suggestions: 10, 50, 100, 500 credits

---

## 📍 Lokasi Setting

### **Admin Panel → System Settings**
```
URL: /admin/settings
```

**Tampilan:**
```
⚙️ System Settings
└── User Registration Settings
    ├── Give Default Credits to New Users: [Toggle ON/OFF]
    └── Default Credits Amount: [Input Number]
        └── Suggestions: [10] [50] [100] [500]
```

---

## 🔄 Cara Kerja

### **1. Database Storage**
Settings disimpan di table `pricing_config`:
```sql
| config_key            | config_value | description                                    |
|-----------------------|--------------|------------------------------------------------|
| give_default_credits  | "true"       | Give credits to new users on registration      |
| default_user_credits  | "100"        | Default credits amount for new users           |
```

### **2. User Registration Flow**

**Ketika User Baru Register:**
```javascript
1. User mengisi form registrasi
2. System cek setting dari database:
   - give_default_credits = true? 
   - default_user_credits = 100
3. User dibuat dengan credits sesuai setting:
   - Jika enabled: User dapat 100 credits
   - Jika disabled: User dapat 0 credits
4. User bisa langsung generate (jika punya credits)
```

### **3. Admin Update Settings**

**Ketika Admin Update:**
```javascript
1. Admin buka /admin/settings
2. Admin toggle ON/OFF atau ubah jumlah
3. Admin klik "Save Settings"
4. Settings tersimpan di database
5. User baru berikutnya dapat credits sesuai setting baru
```

---

## 💻 Technical Implementation

### **1. System Settings Page**
**File:** `src/views/admin/settings.ejs`
```html
<!-- Toggle Switch -->
<input type="checkbox" id="give_default_credits" checked>

<!-- Credits Amount Input -->
<input type="number" id="default_user_credits" value="100" min="0">

<!-- Quick Suggestions -->
<button onclick="setCredits(10)">10 credits</button>
<button onclick="setCredits(50)">50 credits</button>
<button onclick="setCredits(100)">100 credits</button>
<button onclick="setCredits(500)">500 credits</button>
```

### **2. API Endpoints**
**File:** `src/routes/admin.js` & `src/controllers/adminController.js`

**Get Settings:**
```javascript
GET /admin/api/settings/registration
Response: {
  success: true,
  settings: {
    give_default_credits: true,
    default_user_credits: 100
  }
}
```

**Update Settings:**
```javascript
POST /admin/api/settings/registration
Body: {
  give_default_credits: false,  // or true
  default_user_credits: 50       // any number >= 0
}
Response: {
  success: true,
  message: "Settings saved successfully"
}
```

### **3. User Model**
**File:** `src/models/User.js`

**Get Default Credits from Database:**
```javascript
async getDefaultCredits() {
  // Query database for settings
  const settings = await pool.query(...);
  
  // Check if admin enabled default credits
  if (!giveCredits) return 0;
  
  // Return amount set by admin
  return creditsAmount;
}
```

**Create User with Dynamic Credits:**
```javascript
async createWithPassword(userData) {
  // Get credits from admin settings (not hardcoded!)
  const defaultCredits = await this.getDefaultCredits();
  
  // Create user with dynamic credits
  await pool.query(`
    INSERT INTO users (..., credits)
    VALUES (..., $8)
  `, [..., defaultCredits]);
}
```

---

## 📊 Skenario Penggunaan

### **Skenario 1: Freemium Model (Default)**
```
Admin Setting:
  ✅ Give Default Credits: Enabled
  💰 Amount: 100 credits

Result:
  - User baru dapat 100 credits gratis
  - Bisa generate ~20-50 videos atau ~100 images
  - Setelah habis, harus beli credits
```

### **Skenario 2: Paid Only (No Free Trial)**
```
Admin Setting:
  ❌ Give Default Credits: Disabled
  💰 Amount: 0 credits

Result:
  - User baru dapat 0 credits
  - Tidak bisa generate sama sekali
  - Harus beli credits dulu untuk mulai
```

### **Skenario 3: Limited Free Trial**
```
Admin Setting:
  ✅ Give Default Credits: Enabled
  💰 Amount: 10 credits

Result:
  - User baru dapat 10 credits
  - Bisa test generate 2-5 videos
  - Cepat habis, dorong untuk beli
```

### **Skenario 4: Generous Free Tier**
```
Admin Setting:
  ✅ Give Default Credits: Enabled
  💰 Amount: 500 credits

Result:
  - User baru dapat 500 credits
  - Bisa generate banyak (100+ videos)
  - Hook users dengan experience bagus
```

---

## 🚀 Cara Setup (First Time)

### **Step 1: Initialize Settings**
```bash
npm run init:credits-settings
```

Output:
```
🎨 Initializing Default Credits Settings...

✅ Default credits settings initialized!

📊 Current Configuration:
   - Give Default Credits: ✅ Enabled
   - Default Amount: 💰 100 credits

💡 Admin can change these settings at: /admin/settings
```

### **Step 2: (Optional) Give Credits to Existing Users**
```bash
npm run give:credits
```

Output:
```
🎁 Giving default credits to existing users...

Found 3 user(s) with 0 or no credits

✅ Successfully updated 3 user(s)!
```

### **Step 3: Login as Admin**
```
1. Go to: http://localhost:5005/admin
2. Navigate to: System Settings
3. Verify settings are loaded correctly
```

### **Step 4: Test Settings**
```
1. Change toggle to disabled → Save
2. Register new test user
3. Check: User should have 0 credits ✅

4. Change toggle to enabled, set 50 credits → Save
5. Register another test user
6. Check: User should have 50 credits ✅
```

---

## 📋 Files Modified/Created

### **Modified:**
1. ✅ `src/models/User.js`
   - Added `getDefaultCredits()` function
   - Updated `createWithPassword()` to use dynamic credits
   - Updated `createFromGoogle()` to use dynamic credits

2. ✅ `src/controllers/adminController.js`
   - Updated `getSettings()` to load registration settings
   - Added `getRegistrationSettings()` API
   - Added `updateRegistrationSettings()` API

3. ✅ `src/routes/admin.js`
   - Added GET `/admin/api/settings/registration`
   - Added POST `/admin/api/settings/registration`

4. ✅ `src/views/admin/settings.ejs`
   - Complete redesign dengan toggle & input
   - Real-time preview
   - Quick suggestions buttons

5. ✅ `package.json`
   - Added script: `npm run init:credits-settings`
   - Added script: `npm run give:credits`

### **Created:**
1. ✅ `src/scripts/initDefaultCreditsSettings.js`
   - Initialize default settings di database

2. ✅ `src/scripts/giveDefaultCredits.js`
   - Give credits to existing users

3. ✅ `ADMIN_DEFAULT_CREDITS_CONTROL.md`
   - Documentation lengkap (this file)

---

## 🎯 Admin Control Summary

| Feature | Before | After |
|---------|--------|-------|
| **Default Credits** | Hardcoded 100 | ✅ Admin control via settings |
| **Enable/Disable** | Not possible | ✅ Toggle ON/OFF |
| **Amount Control** | Not possible | ✅ Set any number (0-∞) |
| **Location** | Code only | ✅ Admin panel UI |
| **Real-time Update** | Need redeploy | ✅ Save & apply instantly |

---

## ✅ Testing Checklist

### **Admin Side:**
- [ ] Can access `/admin/settings`
- [ ] Can see current settings
- [ ] Can toggle ON/OFF
- [ ] Can set custom amount
- [ ] Can save settings
- [ ] Settings persist after reload

### **User Side:**
- [ ] New user with enabled → Gets correct credits
- [ ] New user with disabled → Gets 0 credits
- [ ] New user with custom amount → Gets exact amount
- [ ] Existing users not affected

### **Database:**
- [ ] Settings saved in `pricing_config` table
- [ ] Settings have correct config_key and config_value
- [ ] Settings update timestamp

---

## 🎉 Result

**ADMIN SEKARANG PUNYA FULL CONTROL!**

- ✅ Enable/disable default credits dari UI
- ✅ Set jumlah credits custom (0 - unlimited)
- ✅ Update instant tanpa edit code
- ✅ User baru otomatis dapat credits sesuai setting
- ✅ Flexible untuk business model apapun

**No more hardcoded values!**  
**No more editing code to change settings!**  
**Admin is in complete control! 🎛️**

---

**Created:** October 26, 2025  
**Status:** ✅ COMPLETE  
**Admin Control:** 🎛️ FULL CONTROL

