# FAL.AI API - Quick Start Guide

**5 Menit Setup** ⚡

---

## 🎯 Langkah Setup

### 1️⃣ Dapatkan API Key (2 menit)

1. Buka https://fal.ai/dashboard/keys
2. Login/Register
3. Create new API key
4. Copy API key

### 2️⃣ Configure di Admin Panel (1 menit)

1. Masuk **Admin Panel** → **API Configs**
2. Klik **"Add New API"** atau Edit FAL_AI
3. Isi:
   ```
   Service Name: FAL_AI
   API Key: fal_xxxxxxxxxxxxxxxxxxxxxxxx
   Is Active: ✓
   ```
4. **Save**

### 3️⃣ Test Connection (30 detik)

1. **Admin Panel** → **AI Models**
2. Klik **"Browse FAL.AI Models"**
3. Klik **"Test API"**
4. Lihat status:
   - 🟢 **API Connected** → Success! ✅
   - 🟡 **Not configured** → Ulangi step 2
   - 🔴 **Failed** → Check API key

### 4️⃣ Import Models (1 menit)

1. Browse 100+ models
2. Klik **"Quick Import"** pada model favorit
3. Done! Model siap digunakan

---

## 📊 Status Indicator

| Icon | Status | Action |
|------|--------|--------|
| 🟢 | **API Connected** | Everything OK ✅ |
| 🟡 | **Not configured** | Setup API key |
| 🔴 | **Connection failed** | Check API key validity |
| 🔄 | **Checking...** | Wait... |

---

## 🔧 Troubleshooting

### API Not Working?

**Quick Fix:**
```bash
1. Admin → API Configs
2. Check FAL_AI is Active ✓
3. Verify API key starts with "fal_"
4. Click "Test API" in Browse Models
5. Check server logs if still failing
```

### Need New API Key?

1. Go to https://fal.ai/dashboard/keys
2. Revoke old key (optional)
3. Create new key
4. Update in Admin → API Configs

---

## ✅ Quick Test

**Run this in your browser:**
```javascript
// Open Browse FAL.AI Models modal
// Check if status shows green "API Connected"
// If yes → Working! ✅
// If no → Follow troubleshooting above
```

---

## 🚀 Features Now Available

- ✅ Browse 100+ AI models
- ✅ Real-time API verification  
- ✅ Quick import to your database
- ✅ Live pricing from fal.ai
- ✅ Test API connection anytime
- ✅ Automatic error handling

---

## 📞 Need Help?

**Check:**
1. API status indicator (green = OK)
2. Server logs for errors
3. FAL.AI dashboard for API key status

**Common Issues:**
- API key expired → Create new key
- Network timeout → Check internet
- Not configured → Follow Step 2 above

---

**That's it! 🎉**

Total setup time: **~5 minutes**

Sistem sekarang tersinkronisasi dengan FAL.AI API!

