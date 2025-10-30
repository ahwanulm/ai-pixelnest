# 📝 Cara Setting Suno API Endpoint di Admin Panel

## 🎯 Lokasi Setting

**URL:** `/admin/api-configs`

**Akses:** Login sebagai Admin

---

## ⚙️ Konfigurasi Suno API

### 1. Buka Admin Panel
```
1. Login ke admin account
2. Klik menu "Admin"
3. Pilih "API Configurations"
4. Cari "SUNO" di list
```

### 2. Edit Suno Configuration

**Klik icon "Edit" (✏️) atau "Configure" pada SUNO card**

**Field yang harus diisi:**

#### A. **API Key** (REQUIRED)
```
Field: API Key
Value: [Your Suno API Key from sunoapi.org]

Contoh: sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### B. **Endpoint URL** (DEFAULT)
```
Field: Endpoint URL
Value: https://api.sunoapi.org

⚠️ PENTING: 
- Jangan tambahkan /api/v1 di akhir!
- Jangan tambahkan / di akhir!
- Code akan otomatis menambahkan /api/v1
```

**✅ Benar:**
```
https://api.sunoapi.org
```

**❌ Salah:**
```
https://api.sunoapi.org/api/v1      ← JANGAN seperti ini
https://api.sunoapi.org/api         ← JANGAN seperti ini
https://api.sunoapi.org/            ← JANGAN seperti ini
```

#### C. **Status** (REQUIRED)
```
Toggle: Active ✅
```

---

## 🔧 Default Configuration (Auto-Set)

Database sudah di-setup dengan default value:

```sql
service_name: SUNO
api_key: [empty - harus diisi manual]
endpoint_url: https://api.sunoapi.org  ← Default
is_active: false  ← Harus di-aktifkan setelah isi API key
```

---

## 📋 Step-by-Step Setup

### Step 1: Get Suno API Key
```
1. Buka https://sunoapi.org
2. Sign up / Login
3. Go to API Keys page
4. Copy your API key
```

### Step 2: Configure in Admin Panel
```
1. Login to admin panel
2. Go to /admin/api-configs
3. Find SUNO card
4. Click "Configure" or "Edit"
5. Paste API Key
6. Check Endpoint URL = https://api.sunoapi.org
7. Set Status = Active ✅
8. Click "Save"
```

### Step 3: Verify
```
1. Check console log saat generate music
2. Should show: 
   ✅ Suno service initialized
   Base URL: https://api.sunoapi.org/api/v1
   Full endpoint: https://api.sunoapi.org/api/v1/generate
```

---

## 🔍 How Code Uses Endpoint URL

```javascript
// src/services/sunoService.js

constructor() {
  this.baseUrl = 'https://api.sunoapi.org/api/v1'; // Default
}

async initialize() {
  const config = await Admin.getApiConfig('SUNO');
  
  // Get endpoint from database
  if (config.endpoint_url) {
    // Automatically add /api/v1 if not present
    if (!config.endpoint_url.includes('/api/v1')) {
      this.baseUrl = config.endpoint_url + '/api/v1';
    } else {
      this.baseUrl = config.endpoint_url;
    }
  }
  
  // Final URL for API calls
  const fullUrl = `${this.baseUrl}/generate`;
  // Result: https://api.sunoapi.org/api/v1/generate ✅
}
```

---

## 🎨 UI Form (Admin Panel)

**Saat edit Suno config, akan ada form seperti ini:**

```
┌─────────────────────────────────────────────┐
│  Configure SUNO API                         │
├─────────────────────────────────────────────┤
│                                             │
│  Service Name                               │
│  [SUNO                           ] (locked) │
│                                             │
│  API Key *                                  │
│  [sk-xxxxxxxxxxxxxxxxxxxxx      ]           │
│                                             │
│  Endpoint URL                               │
│  [https://api.sunoapi.org       ]           │
│                                             │
│  Status                                     │
│  [✓] Active                                 │
│                                             │
│  ┌─────────┐  ┌──────────┐                 │
│  │  Save   │  │  Cancel  │                 │
│  └─────────┘  └──────────┘                 │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🔐 Security Notes

### API Key Storage
- ✅ Stored encrypted in database
- ✅ Never shown in frontend
- ✅ Only accessible by admin
- ✅ Used only in backend services

### Endpoint URL
- ✅ Validated before use
- ✅ Checked for HTTPS protocol
- ✅ Logged for debugging

---

## 🧪 Testing Configuration

### After Setup, Test:

```bash
# 1. Generate music dari UI
Go to: /music
Enter prompt: "test music"
Click Generate

# 2. Check console logs (backend)
Should see:
✅ Suno service initialized
   Base URL: https://api.sunoapi.org/api/v1
   Full endpoint: https://api.sunoapi.org/api/v1/generate

# 3. Check for errors
Should NOT see:
❌ 404 Not Found
❌ Invalid API key
❌ Suno API not configured
```

---

## ❓ Troubleshooting

### Problem 1: "Suno API not configured"
**Solution:**
- Go to /admin/api-configs
- Check SUNO status is Active ✅
- Check API key is filled

### Problem 2: "404 Not Found"
**Solution:**
- Check endpoint URL = `https://api.sunoapi.org`
- **NOT** `https://api.sunoapi.org/api/v1`
- Restart server after changing

### Problem 3: "Invalid API key"
**Solution:**
- Verify API key from sunoapi.org
- Copy-paste carefully (no extra spaces)
- Re-enter in admin panel

### Problem 4: Changes not applied
**Solution:**
```bash
# Restart server
pkill -f "node"
npm start
```

---

## 📊 Database Update (Manual)

If you need to update via SQL directly:

```sql
-- Update endpoint URL
UPDATE api_configs 
SET endpoint_url = 'https://api.sunoapi.org'
WHERE service_name = 'SUNO';

-- Update API key
UPDATE api_configs 
SET api_key = 'sk-your-api-key-here'
WHERE service_name = 'SUNO';

-- Activate
UPDATE api_configs 
SET is_active = true
WHERE service_name = 'SUNO';

-- Check config
SELECT service_name, endpoint_url, is_active 
FROM api_configs 
WHERE service_name = 'SUNO';
```

---

## ✅ Checklist Setup

- [ ] API Key obtained from sunoapi.org
- [ ] Login to admin panel
- [ ] Go to /admin/api-configs
- [ ] Find SUNO configuration
- [ ] Enter API Key
- [ ] Set Endpoint URL: `https://api.sunoapi.org`
- [ ] Set Status: Active ✅
- [ ] Save configuration
- [ ] Restart server
- [ ] Test music generation
- [ ] Verify no 404 errors

---

## 🎯 Summary

**Endpoint URL yang BENAR:**
```
https://api.sunoapi.org
```

**Jangan tambahkan:**
- `/api/v1` ← Code akan tambahkan otomatis
- `/` di akhir
- Path apapun

**Code akan membuat:**
```
Input:  https://api.sunoapi.org
Process: + /api/v1
Result:  https://api.sunoapi.org/api/v1
Final:   https://api.sunoapi.org/api/v1/generate ✅
```

---

**Status:** ✅ Default endpoint sudah di-set di database

**Next:** Restart server & test music generation!

**Date:** October 29, 2025

