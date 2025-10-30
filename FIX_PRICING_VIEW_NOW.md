# 🚨 URGENT FIX: Database View Tidak Aktual!

## 🐛 Root Cause Found!

Database view `model_pricing` menggunakan **WRONG base credit** untuk semua model!

### Problem:
```sql
-- Current view (WRONG!)
ROUND(cost * 0.05, 4) as our_price_usd
```

Ini menggunakan **$0.05 untuk SEMUA model** (image + video), padahal:
- Image seharusnya: $0.05/credit ✅
- Video seharusnya: $0.08/credit ❌ (but using 0.05!)

### Result:
```
Sora 2 (Video):
- Credits: 8.0
- Your Price: 8.0 × $0.05 = $0.40 ❌ WRONG!
- Seharusnya: 8.0 × $0.08 = $0.64 ✅

Profit calculation juga salah karena pakai your_price yang salah!
```

---

## ✅ Solution: Run Fix Script

### Step 1: Stop Server
```bash
# Press Ctrl+C in terminal yang running npm run dev
```

### Step 2: Run Fix Script
```bash
npm run fix:pricing-view
```

### Step 3: Restart Server
```bash
npm run dev
```

### Step 4: Hard Refresh Browser
```bash
# Mac: Cmd + Shift + R
# Windows/Linux: Ctrl + Shift + R
```

### Step 5: Verify Admin Panel
```
1. Go to: http://localhost:5005/admin/pricing-settings
2. Hard refresh (Cmd+Shift+R)
3. Check pricing table:
   - Sora 2: Your Price should be ~$0.64 (not $0.40!)
   - Runway Gen-3: Your Price should be ~$0.44 (not $0.27!)
```

---

## 🔍 What The Fix Does

### New View Query (Type-Aware):
```sql
CREATE VIEW model_pricing AS
SELECT 
  id,
  model_id,
  name,
  type,
  fal_price as usd_price,
  cost as credits,
  -- TYPE-AWARE PRICING!
  ROUND(
    cost * CASE 
      WHEN type = 'image' THEN (SELECT config_value FROM pricing_config WHERE config_key = 'image_base_credit_usd')
      WHEN type = 'video' THEN (SELECT config_value FROM pricing_config WHERE config_key = 'video_base_credit_usd')
      ELSE 0.05
    END,
    4
  ) as our_price_usd,
  -- Profit calculation also uses correct base credit
  ROUND(...) as profit_margin_actual
FROM ai_models
WHERE fal_price > 0
ORDER BY type, fal_price DESC;
```

---

## 📊 Expected Results After Fix

### Video Models:

| Model | Credits | Base Credit | Your Price (Before) | Your Price (After) |
|-------|---------|-------------|---------------------|---------------------|
| **Sora 2** | 8.0 | $0.08 | $0.40 ❌ | **$0.64 ✅** |
| **Runway Gen-3** | 5.5 | $0.08 | $0.28 ❌ | **$0.44 ✅** |
| **Kling 2.5** | 5.0 | $0.08 | $0.25 ❌ | **$0.40 ✅** |
| **Veo 3.1** | 4.5 | $0.08 | $0.23 ❌ | **$0.36 ✅** |

### Image Models (Should stay same):

| Model | Credits | Base Credit | Your Price |
|-------|---------|-------------|------------|
| **FLUX Pro** | 1.5 | $0.05 | $0.075 ✅ (no change) |
| **FLUX Dev** | 0.5 | $0.05 | $0.025 ✅ (no change) |

---

## 🧪 Verification Checklist

After running fix script:

- [ ] Script runs without errors
- [ ] See output: "✅ model_pricing view fixed!"
- [ ] Example table shows:
  - Sora 2: Our Price = ~$0.64
  - FLUX Pro: Our Price = ~$0.075
- [ ] Restart server: `npm run dev`
- [ ] Hard refresh browser
- [ ] Admin panel shows correct prices
- [ ] Profit % looks reasonable (positive numbers)
- [ ] No console errors

---

## 🚨 Common Issues

### Issue 1: "Cannot find module"
**Solution**: Make sure you're in project root directory:
```bash
cd /Users/ahwanulm/Desktop/PROJECT/PIXELNEST
npm run fix:pricing-view
```

### Issue 2: "Database connection error"
**Solution**: Make sure PostgreSQL is running:
```bash
# Check if postgres is running
ps aux | grep postgres

# If not running, start it
brew services start postgresql
# or
sudo systemctl start postgresql
```

### Issue 3: "Permission denied"
**Solution**: Check `.env` file has correct database credentials:
```
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=pixelnest_db
DB_HOST=localhost
DB_PORT=5432
```

### Issue 4: Browser still shows old data
**Solution**: Clear browser cache:
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

Or just:
- Mac: `Cmd + Shift + Delete` → Clear cache
- Windows: `Ctrl + Shift + Delete` → Clear cache

---

## 📝 Script Output Example

When you run `npm run fix:pricing-view`, you should see:

```
🔧 Fixing model_pricing view...

📊 Dropping old view...
  ✓ Old view dropped
📊 Creating new view with type-aware pricing...
  ✓ New view created with type-aware pricing

📋 TESTING NEW VIEW:

┌─────────┬───────────────────┬──────┬────────────┬─────────┬────────────┬──────────┐
│ (index) │       name        │ type │ FAL Price  │ Credits │ Our Price  │ Profit % │
├─────────┼───────────────────┼──────┼────────────┼─────────┼────────────┼──────────┤
│    0    │    'FLUX Pro'     │ 'IMAGE' │ '$0.0550' │  '1.5'  │ '$0.0750' │ '+36.4%' │
│    1    │ 'Kling 2.5 Turbo' │ 'VIDEO' │ '$0.3200' │  '5.0'  │ '$0.4000' │ '+25.0%' │
│    2    │ 'Runway Gen-3'    │ 'VIDEO' │ '$0.3500' │  '5.5'  │ '$0.4400' │ '+25.7%' │
│    3    │     'Sora 2'      │ 'VIDEO' │ '$0.5000' │  '8.0'  │ '$0.6400' │ '+28.0%' │
└─────────┴───────────────────┴──────┴────────────┴─────────┴────────────┴──────────┘

⚙️ CHECKING BASE CREDITS:

┌─────────┬─────────────────────────┬──────────┐
│ (index) │         config          │  value   │
├─────────┼─────────────────────────┼──────────┤
│    0    │ 'image_base_credit_usd' │ '$0.050' │
│    1    │ 'video_base_credit_usd' │ '$0.080' │
└─────────┴─────────────────────────┴──────────┘

✅ model_pricing view fixed!
   Image models now use: $0.050/credit
   Video models now use: $0.080/credit

✅ Done!
```

---

## 💡 Why This Happened

The original `model_pricing` view was created before type-aware pricing was implemented. It used a single `base_credit_usd` value (0.05) for ALL models.

When type-aware pricing was added:
- Database calculations use correct base credits (0.05 for image, 0.08 for video)
- But the VIEW still used old query with hardcoded 0.05
- This caused mismatch between database and admin panel display

**Fix**: Update view to use CASE statement that checks model type and uses appropriate base credit.

---

## 🎯 Summary

**Problem**: Database view using wrong base credit ($0.05 for all models)  
**Impact**: Video models show incorrect "Your Price" (too low)  
**Solution**: Run `npm run fix:pricing-view` to update view with type-aware logic  
**Result**: All prices now correctly calculated and displayed  

**Status**: ✅ Fix ready to apply  
**Action Required**: Run the command above!

---

**RUN NOW:**
```bash
npm run fix:pricing-view
```

Then restart server and hard refresh browser!

