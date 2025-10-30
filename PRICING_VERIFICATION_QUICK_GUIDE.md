# 🚀 Quick Pricing Verification Guide

**For Admin Use - Keep This Handy!**

---

## ⚡ **Quick Commands**

```bash
# 1. Check pricing accuracy (Monthly)
node verify-fal-pricing.js

# 2. View all models and prices
node debug-models.js

# 3. Connect to database
psql -U pixelnest_admin -d pixelnest
```

---

## 📅 **Monthly Checklist** (5 minutes)

```bash
# Day 1 of each month:

[ ] 1. Run verification
node verify-fal-pricing.js

[ ] 2. Check for ❌ MISMATCHES
If found → Go to Step 3

[ ] 3. Verify on FAL.AI
Visit: https://fal.ai/models
Search each mismatched model
Note the REAL price

[ ] 4. Update database
Copy SQL from verification output
Run in database

[ ] 5. Done! ✅
```

---

## 🔍 **How to Verify a Single Model**

### Example: Kling 2.5 Turbo Pro

**Step 1:** Visit FAL.AI
```
https://fal.ai/models
```

**Step 2:** Search "Kling 2.5 Turbo Pro"

**Step 3:** Click model card

**Step 4:** Find pricing:
```
Price: $0.32 per generation  ← COPY THIS!
or
Price: $0.15 per second      ← COPY THIS!
```

**Step 5:** Update database:
```sql
UPDATE ai_models 
SET fal_price = 0.32,  -- ← PASTE VERIFIED PRICE
    updated_at = CURRENT_TIMESTAMP 
WHERE model_id = 'fal-ai/kuaishou/kling-video/v2.5/pro/text-to-video';
```

**Done!** ✅

---

## ⚠️ **WARNING SIGNS**

### When to Re-verify Immediately:

```
🚨 User complains about pricing
🚨 FAL.AI announces price changes
🚨 Unusual high costs in logs
🚨 Profit margin drops unexpectedly
```

**Action:** Run `node verify-fal-pricing.js` NOW!

---

## 💰 **Profit Calculator**

```
FAL.AI Price: $0.32
Our Markup:   25% (recommended)
────────────────────
Sell Price:   $0.40
Credits:      8.0 (at $0.05/credit)

Profit:       $0.08 per generation ✅
```

**Formula:**
```javascript
credits = CEIL((fal_price / 0.05) * 1.25)
// 0.05 = credit value in USD
// 1.25 = 25% profit margin
```

---

## 🆘 **Emergency Fixes**

### If you're losing money:

```sql
-- Increase all video model prices by 20%
UPDATE ai_models 
SET cost = CEIL(cost * 1.2),
    updated_at = CURRENT_TIMESTAMP 
WHERE type = 'video';

-- Increase all image model prices by 15%
UPDATE ai_models 
SET cost = CEIL(cost * 1.15),
    updated_at = CURRENT_TIMESTAMP 
WHERE type = 'image';
```

### Then:
1. Run `node verify-fal-pricing.js`
2. Fine-tune individual models
3. Monitor for 1 week

---

## 📞 **Quick Reference**

| File | Purpose |
|------|---------|
| `verify-fal-pricing.js` | Monthly price check ⭐ |
| `debug-models.js` | Check all models |
| `fix-model-categories.js` | Fix categories bug |
| `FAL_PRICING_ACCURACY_GUIDE.md` | Full documentation |

---

## 🎯 **Success Metrics**

```
✅ Zero price mismatches
✅ All models verified < 30 days
✅ Profit margin ≥ 20%
✅ No user complaints
```

**Check monthly:** `node verify-fal-pricing.js`

---

**Last Updated:** Jan 27, 2025  
**Next Check:** Feb 1, 2025  

**Remember:** 5 minutes/month = $$$$ saved! 💰

