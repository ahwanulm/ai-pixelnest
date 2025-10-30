# ⚡ Quick Start: Duration Configuration

## 🚀 3 Steps to Enable

### **Step 1: Run Migration** (2 seconds)

```bash
cd /Users/ahwanulm/Desktop/PROJECT/PIXELNEST
psql $DATABASE_URL -f migrations/add_duration_fields.sql
```

### **Step 2: Restart Server** (5 seconds)

```bash
pm2 restart pixelnest
# or
npm run dev
```

### **Step 3: Test** (30 seconds)

```
1. Open: http://localhost:5005/admin/models
2. Click any video model → Edit
3. See new "Duration Configuration" section! ✅
```

---

## ✨ What You Can Do Now

### **Configure Durations Per Model:**

```
Kling Video:
- Available Durations: 5,10
- Price Per Second: 0.01

Result:
✅ 5s = 2 credits
✅ 10s = 4 credits
```

### **Real-Time Preview:**

Type durations → See credits instantly calculated!

```
Input: 4s,6s,8s
Price/s: 0.08

Preview:
4s → $0.32 → 11 cr
6s → $0.48 → 16 cr
8s → $0.64 → 21 cr
```

---

## 📁 Files Changed

✅ `migrations/add_duration_fields.sql` - Database schema  
✅ `src/views/admin/models.ejs` - UI with duration fields  
✅ `public/js/admin-models.js` - Duration preview logic

---

## 🎯 Why This Matters

**Before:**
```
User selects 6s for Kling → ERROR ❌
"unexpected value; permitted: '5', '10'"
```

**After:**
```
Admin sets: Available Durations = 5,10
User selects 6s → Auto-map to 5s ✅
No errors, accurate pricing!
```

---

## ✅ Done!

**Total Time:** < 1 minute  
**Action:** Run migration → Restart → Test

**Full Docs:** `ADMIN_DURATION_UPDATE_COMPLETE.md`

---

**Status:** ✅ READY  
**Date:** Oct 28, 2025

