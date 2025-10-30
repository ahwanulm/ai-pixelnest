# ⚡ ACTION REQUIRED: Duration Configuration

## 🚨 CRITICAL: Database Migration Needed!

Sebelum menggunakan fitur duration baru, Anda **HARUS** jalankan migration!

---

## 🎯 QUICK ACTIONS (5 MENIT)

### **Action 1: Run Migration** (WAJIB!)

```bash
cd /Users/ahwanulm/Desktop/PROJECT/PIXELNEST

# Option 1: Using $DATABASE_URL
psql $DATABASE_URL -f migrations/add_duration_fields.sql

# Option 2: Manual connection
psql -h localhost -p 5432 -U postgres -d pixelnest_db -f migrations/add_duration_fields.sql
```

**Expected Output:**
```
ALTER TABLE
COMMENT
ALTER TABLE
COMMENT
UPDATE 3
UPDATE 5
UPDATE 2
...
CREATE INDEX
CREATE INDEX
```

### **Action 2: Verify Installation**

```bash
psql $DATABASE_URL -f verify-duration-fields.sql
```

**Expected Output:**
```
✅ CHECKING COLUMN EXISTENCE
 available_durations | jsonb   | YES
 price_per_second    | numeric | YES

✅ VIDEO MODELS WITH DURATION DATA
 Kling Video | ["5", "10"]      | 0.0100
 Veo 3.1     | ["4s", "6s", "8s"] | 0.0833
```

### **Action 3: Restart Server**

```bash
# If using PM2
pm2 restart pixelnest

# If using npm
# Press Ctrl+C, then
npm run dev
```

### **Action 4: Test Admin Panel**

```
1. Open: http://localhost:5005/admin/models
2. Click any VIDEO model → Edit
3. Look for "⏱️ Duration Configuration" section
4. If you see it → ✅ SUCCESS!
5. If not → ❌ Check previous steps
```

---

## 📊 What Was Changed

### **Database:**
- Added `available_durations` column (JSONB)
- Added `price_per_second` column (NUMERIC)
- Created indexes for performance
- Auto-updated existing video models

### **Backend:**
- Updated `adminController.js` → addModel & updateModel
- Updated `setupDatabase.js` → CREATE & ALTER TABLE

### **Frontend:**
- Updated `models.ejs` → Duration form fields
- Updated `admin-models.js` → Save/load/preview logic

---

## ✅ Verification Checklist

After completing actions above:

- [ ] Migration ran without errors
- [ ] Verification shows 2 columns exist
- [ ] Verification shows video models have duration data
- [ ] Server restarted successfully
- [ ] Admin panel shows "Duration Configuration" section
- [ ] Can edit and save duration values
- [ ] Real-time preview calculates credits

---

## 🆘 Troubleshooting

### **Problem: Migration fails with "database does not exist"**

```bash
# Check DATABASE_URL
echo $DATABASE_URL

# If empty, set it:
export DATABASE_URL="postgres://username:password@localhost:5432/pixelnest_db"

# Then retry migration
```

### **Problem: "Column already exists"**

```
✅ This is FINE! It means columns were added by setupDatabase.js
Just continue to next step.
```

### **Problem: Admin panel doesn't show duration section**

```bash
# 1. Check if server restarted
pm2 status pixelnest

# 2. Clear browser cache
# Chrome: Ctrl+Shift+R (hard reload)

# 3. Check browser console for errors
# F12 → Console tab
```

### **Problem: Can't save durations**

```bash
# Check backend logs
pm2 logs pixelnest --lines 50

# Look for errors mentioning "available_durations"
```

---

## 📁 Documentation Files

| File | Purpose |
|------|---------|
| `QUICK_START_DURATION.md` | Quick start guide (3 steps) |
| `ADMIN_DURATION_UPDATE_COMPLETE.md` | Complete documentation |
| `DATABASE_DURATION_CONSISTENCY.md` | Technical consistency guide |
| `RUN_DURATION_MIGRATION.md` | Migration guide |
| `migrations/add_duration_fields.sql` | Database migration |
| `verify-duration-fields.sql` | Verification script |
| **THIS FILE** | Action checklist |

---

## 🎉 After Success

Once all actions complete:

1. ✅ Duration fields konsisten di database
2. ✅ Admin panel bisa configure durations per model
3. ✅ Real-time preview shows accurate credits
4. ✅ No more validation errors for Kling/Veo durations!

**Example Usage:**

```
1. Go to Admin Panel → AI Models
2. Edit "Kling Video v2.5"
3. Set:
   - Available Durations: 5,10
   - Price Per Second: 0.01
4. See preview:
   5s → $0.05 → 2 credits
   10s → $0.10 → 4 credits
5. Save → Done! ✅
```

---

## 🚀 Next Steps

After migration is complete:

1. **Update existing models** dengan duration yang benar
2. **Test generation** dengan different durations
3. **Monitor** bahwa tidak ada validation errors lagi
4. **Enjoy** accurate pricing per duration! 🎉

---

**Priority:** 🔴 **HIGH - MUST DO BEFORE USING**  
**Time Required:** ~5 minutes  
**Difficulty:** Easy (just run commands)

**Questions?** Check `DATABASE_DURATION_CONSISTENCY.md` untuk details!

