# 🛡️ Credit Protection - Quick Start Guide

## ✅ Apa yang Sudah Dibuat?

Sistem perlindungan credit yang **TIDAK mengurangi credit user jika generation gagal** dari fal.ai.

---

## 🎯 Masalah yang Diperbaiki

### **SEBELUM (Tidak Fair):**
```
User: 10 credits
Generate image → Costs 2 credits
✅ Credit dikurangi → 8 credits
❌ fal.ai API timeout/error
❌ User kehilangan 2 credits tanpa hasil!
```

### **SEKARANG (Fair):**
```
User: 10 credits
Generate image → Costs 2 credits
⏳ Check credit, jangan kurangi dulu
⏳ Call fal.ai API
❌ fal.ai API timeout/error
✅ Credit TIDAK dikurangi → Masih 10 credits!
```

---

## 🔧 Cara Kerja

### **New Flow:**

1. **Check Credits**
   - Cek apakah user punya cukup credit
   - Jangan kurangi dulu!

2. **Try Generate**
   - Call fal.ai API
   - Tunggu hasil

3. **If Success:**
   - ✅ Kurangi credit
   - ✅ Save result to history
   - ✅ Return result ke user

4. **If Failed:**
   - ❌ JANGAN kurangi credit
   - ❌ Save failed attempt (cost: 0)
   - ❌ Return error + "creditsCharged: false"

---

## 📂 File yang Diubah

### 1. **`src/services/falAiService.js`**
- ✅ Added `refundCredits()` function (untuk edge cases)
- ✅ Function ini bisa refund credit jika needed

### 2. **`src/controllers/generationController.js`**
- ✅ Updated `generateImage()` - deduct credit AFTER success
- ✅ Updated `generateVideo()` - deduct credit AFTER success
- ✅ Added error handling yang proper
- ✅ Save failed attempts dengan `creditsCost: 0`

---

## 🧪 Testing

### **Test Scenario 1: Successful Generation**

```bash
# User starts with 50 credits
curl -X POST http://localhost:5005/api/generate/image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "beautiful sunset",
    "model": "fal-ai/flux-pro",
    "type": "text-to-image",
    "quantity": 1
  }'
```

**Expected:**
```json
{
  "success": true,
  "data": {
    "images": [{"url": "..."}]
  },
  "creditsUsed": 2,
  "creditsRemaining": 48
}
```

**Console Logs:**
```
💰 User has 50 credits, generation will cost 2 credits
✅ Generation successful! Now deducting credits...
```

### **Test Scenario 2: Failed Generation**

Untuk test ini, simulasikan error dengan:
- Disconnect internet
- Use invalid API key
- Atau modify code untuk throw error

**Expected:**
```json
{
  "success": false,
  "message": "Failed to generate image: API timeout",
  "creditsCharged": false  ← Important!
}
```

**Console Logs:**
```
💰 User has 50 credits, generation will cost 2 credits
❌ Generation failed: API timeout
💰 Credits NOT deducted (user still has 50 credits)
```

**Check Database:**
```sql
-- User credits should be unchanged
SELECT credits FROM users WHERE id = 1;
-- Should still be 50

-- Failed generation logged
SELECT * FROM ai_generation_history 
WHERE user_id = 1 
ORDER BY created_at DESC 
LIMIT 1;
-- status: 'failed'
-- credits_cost: 0
-- error_message: 'API timeout'
```

---

## 📊 Response Format

### **Success Response:**
```json
{
  "success": true,
  "data": {...},
  "creditsUsed": 2,
  "creditsRemaining": 48
}
```

### **Error Response:**
```json
{
  "success": false,
  "message": "Error message here",
  "creditsCharged": false  ← NEW!
}
```

---

## 🔍 Verifikasi

### **Check di Database:**

```sql
-- Check user credits
SELECT id, email, credits FROM users;

-- Check credit transactions (only successful charges)
SELECT * FROM credit_transactions 
WHERE user_id = 1 
ORDER BY created_at DESC;

-- Check generation history (includes failed attempts)
SELECT 
  id,
  user_id,
  generation_type,
  status,
  credits_cost,
  error_message,
  created_at
FROM ai_generation_history 
WHERE user_id = 1 
ORDER BY created_at DESC;
```

### **Expected Results:**

**For Successful Generation:**
- ✅ User credits reduced
- ✅ Credit transaction logged (debit)
- ✅ Generation history with status='completed'

**For Failed Generation:**
- ✅ User credits UNCHANGED
- ❌ NO credit transaction logged
- ✅ Generation history with status='failed' and cost=0

---

## 💡 Key Features

### **1. Automatic Protection**
- No manual intervention needed
- Credit automatically protected on failure

### **2. Transparent**
- Response includes `creditsCharged: false`
- User knows they weren't charged

### **3. Logged History**
- Failed attempts saved for debugging
- Can track API issues

### **4. Refund Function Available**
```javascript
// For edge cases, manual refund possible
await FalAiService.refundCredits(
  userId, 
  amount, 
  'Manual refund - API issue'
);
```

---

## 🎯 User Benefits

| Scenario | Old System | New System |
|----------|------------|------------|
| API Timeout | Lose credits ❌ | Keep credits ✅ |
| API Error | Lose credits ❌ | Keep credits ✅ |
| Invalid Input | Lose credits ❌ | Keep credits ✅ |
| Network Issue | Lose credits ❌ | Keep credits ✅ |
| Success | Charged ✅ | Charged ✅ |

---

## 🚀 Ready to Use!

System sudah aktif dan siap digunakan:

1. ✅ **Automatic** - No configuration needed
2. ✅ **Safe** - Users protected from unfair charges
3. ✅ **Transparent** - Clear error messages
4. ✅ **Tracked** - All attempts logged

---

## 📝 Notes

- System applies to BOTH image and video generation
- Works for ALL generation types (text-to-image, upscale, video, etc)
- Failed attempts still logged (for debugging)
- Credit transactions only created on success
- Response includes `creditsCharged: false` on failure

---

## 🎉 Result

**Users are now protected!**
> If fal.ai fails, users DON'T lose credits! 🛡️

**Fair & Transparent:**
> Charge only when successful! 💰✅

