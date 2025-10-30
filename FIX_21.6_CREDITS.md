# 🚨 FIX HARGA 21.6 CREDITS - URGENT!

> **Masalah:** Harga 3.0 di admin jadi 21.6 di UI  
> **Penyebab:** Model di database masih pakai nilai `cost` LAMA  
> **Solusi:** Run SQL update (10 detik)

---

## ❌ **APA YANG TERJADI:**

```
Admin menunjukkan: 3.0 credits
UI Dashboard menunjukkan: 21.6 credits
```

**Root Cause:**
- Model di database: `cost = 3.6` (dari formula lama ×32)
- Pricing type: `per_second`
- Duration: 6 seconds
- **Calculation:** 3.6 cr/s × 6s = **21.6 credits** ❌

**Seharusnya:**
- Model di database: `cost = 0.6` (formula baru ×10)
- Duration: 6 seconds
- **Calculation:** 0.6 cr/s × 6s = **3.6 credits** ✅

---

## ✅ **SOLUSI - JALANKAN SQL INI:**

### **Step 1: Connect ke Database**

```bash
# Sesuaikan dengan database config Anda
psql -U your_username -d pixelnest
```

### **Step 2: Copy-Paste SQL Ini**

```sql
-- FIX VIDEO MODELS
UPDATE ai_models
SET 
  cost = GREATEST(0.1, ROUND((fal_price * 10)::numeric, 1)),
  updated_at = CURRENT_TIMESTAMP
WHERE type = 'video'
  AND fal_price IS NOT NULL 
  AND fal_price > 0;

-- FIX IMAGE MODELS
UPDATE ai_models
SET 
  cost = GREATEST(0.1, ROUND((fal_price * 10)::numeric, 1)),
  updated_at = CURRENT_TIMESTAMP
WHERE type = 'image'
  AND fal_price IS NOT NULL 
  AND fal_price > 0;

-- FIX AUDIO MODELS
UPDATE ai_models
SET 
  cost = GREATEST(0.1, ROUND((fal_price * 10)::numeric, 1)),
  updated_at = CURRENT_TIMESTAMP
WHERE type = 'audio'
  AND fal_price IS NOT NULL 
  AND fal_price > 0;
```

### **Step 3: Verify**

```sql
-- Cek beberapa model
SELECT 
  name,
  type,
  ROUND(fal_price::numeric, 4) as fal_usd,
  ROUND(cost::numeric, 1) as cost_cr,
  max_duration,
  CASE 
    WHEN pricing_type = 'per_second' THEN
      CONCAT(cost, ' cr/s')
    ELSE
      CONCAT(cost, ' cr')
  END as rate
FROM ai_models
WHERE is_active = true 
  AND type = 'video'
ORDER BY name
LIMIT 10;
```

---

## 📊 **EXPECTED RESULT:**

### **Before (SALAH):**

| Model | FAL Price | Cost in DB | Display (6s) |
|-------|-----------|------------|--------------|
| Kling | $0.06/s | 3.6 cr/s ❌ | 21.6 cr ❌ |

### **After (BENAR):**

| Model | FAL Price | Cost in DB | Display (6s) |
|-------|-----------|------------|--------------|
| Kling | $0.06/s | **0.6 cr/s** ✅ | **3.6 cr** ✅ |

---

## 🔧 **WHAT WAS FIXED:**

1. ✅ **Removed** multiplier untuk image-to-video di frontend
2. ✅ **Cache busting** updated → `?v=20251029-fix-pricing`
3. ⚠️ **Database needs update** → Run SQL di atas

---

## 🎯 **ACTION CHECKLIST:**

- [ ] Run SQL update (copy-paste dari atas)
- [ ] Hard refresh browser: `Cmd+Shift+R` (Mac) atau `Ctrl+Shift+R` (Windows)
- [ ] Buka `/dashboard`
- [ ] Pilih model image-to-video
- [ ] Check harga - **seharusnya ~3-4 credits untuk 6s** ✅

---

## 📝 **FILES:**

- `URGENT_FIX_PRICING.sql` - SQL script lengkap
- `fix-pricing-database.sql` - SQL dengan verification
- `FIX_21.6_CREDITS.md` - Dokumen ini

---

## 🚀 **QUICK FIX (One-Liner):**

Jika pakai psql:

```bash
psql -U your_user -d pixelnest -c "UPDATE ai_models SET cost = GREATEST(0.1, ROUND((fal_price * 10)::numeric, 1)), updated_at = CURRENT_TIMESTAMP WHERE fal_price IS NOT NULL AND fal_price > 0;"
```

**Done! Harga akan langsung turun ~85%!** ✅

---

**⚠️ JANGAN LUPA:**
1. Backup database dulu
2. Run SQL update
3. Hard refresh browser
4. Test generate

**Setelah itu harga akan benar!** 🎉

