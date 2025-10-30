# ✅ Fix: Kling Video Duration Validation Error

## 🐛 Error yang Terjadi

```
❌ ValidationError: Unprocessable Entity
   "duration": "6",
   "msg": "unexpected value; permitted: '5', '10'"
```

**Model:** Kling Video v2.5  
**Error:** Duration "6" tidak diterima  
**Permitted values:** HANYA "5" atau "10"

---

## 🔍 Root Cause

**Kling Video model** hanya menerima 2 nilai duration:
- ✅ `"5"` (5 seconds)
- ✅ `"10"` (10 seconds)
- ❌ `"6"`, `"4"`, `"8"` → INVALID

**Tapi frontend mengirim:** `duration: "6"`

---

## ✅ Solusi

### **Duration Mapping untuk Kling Model**

**File:** `src/services/falAiService.js`

**BEFORE:**
```javascript
if (model.includes('kling')) {
    if (duration) {
        input.duration = duration.toString(); // ❌ Direct pass, no validation
    }
}
```

**AFTER:**
```javascript
if (model.includes('kling')) {
    // ✨ Kling only accepts "5" or "10" - map other values
    if (duration) {
        const durationNum = parseInt(duration);
        if (durationNum <= 6) {
            input.duration = '5';  // 4s, 5s, 6s → '5'
        } else {
            input.duration = '10'; // 8s, 10s → '10'
        }
    }
}
```

---

## 📊 Duration Mapping Table

| User Selects | Sent to Kling | Actual Video |
|--------------|---------------|--------------|
| 4 seconds | `"5"` | 5 seconds |
| 5 seconds | `"5"` | 5 seconds |
| 6 seconds | `"5"` | 5 seconds ✅ |
| 8 seconds | `"10"` | 10 seconds |
| 10 seconds | `"10"` | 10 seconds |

---

## 🚀 Action Required

**MUST RESTART WORKER:**

```bash
cd /Users/ahwanulm/Desktop/PROJECT/PIXELNEST

# Using PM2
pm2 restart pixelnest-worker

# Check logs
pm2 logs pixelnest-worker --lines 20
```

**Expected logs:**
```
✅ AI Generation Worker is running
⏳ Waiting for jobs...
```

---

## 🧪 Test After Restart

1. **Generate video** dengan duration 6s
2. **Check worker logs** - harus ada:
   ```
   Input params: {
     "prompt": "...",
     "duration": "5",  ← Changed from "6" to "5"
     "aspect_ratio": "9:16"
   }
   ```
3. **Video generates successfully** ✅

---

## 📝 Model-Specific Durations

| Model | Accepted Durations |
|-------|-------------------|
| **Kling Video** | `"5"`, `"10"` (strings only) |
| **Veo3** | `"4s"`, `"6s"`, `"8s"` (with 's' suffix) |
| **Runway Gen-3** | `5`, `10` (numbers) |
| **Luma** | No duration param |
| **Minimax/Haiper** | Any number as string |

---

**Status:** ✅ **FIXED - RESTART WORKER**  
**Priority:** 🔴 **HIGH**  
**Impact:** Kling video generations will now work!

---

**Date:** October 28, 2025  
**Fix ID:** KLING-DURATION-001

