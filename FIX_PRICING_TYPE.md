# ✅ FIX: Pricing Type di Admin Panel

> **Masalah:** Harga 3.0 di admin → 18.0 di UI  
> **Penyebab:** Pricing Type salah pilih  
> **Solusi:** Ubah Pricing Type atau Cost

---

## 🔍 **APA YANG TERJADI:**

Admin Panel:
```
FAL Price: $0.30 (atau kosong)
Pricing Type: "Per Second" ← MASALAH DI SINI
Cost: 3.0 credits
Max Duration: 10s
```

Frontend Calculate:
```
Read cost: 3.0 cr/s (dari database)
User pilih: 6s duration
Calculate: 3.0 cr/s × 6s = 18.0 credits ❌
```

---

## ✅ **SOLUSI - PILIH SALAH SATU:**

### **Option A: Ubah Pricing Type ke "Flat Rate"**

**Jika 3.0 adalah total cost untuk video:**

1. Buka `/admin/models`
2. Edit model yang bermasalah
3. Cari dropdown **"Pricing Type"**
4. Ubah dari **"Per Second"** → **"Flat Rate"**
5. Save

**Result:**
- Cost: 3.0 credits (flat)
- Duration: 6s (diabaikan untuk flat rate)
- Display: **3.0 credits** ✅

---

### **Option B: Ubah Cost ke Per-Second Rate**

**Jika memang ingin per-second pricing:**

1. Buka `/admin/models`
2. Edit model
3. Keep **"Pricing Type" = "Per Second"**
4. Ubah **Cost** dari `3.0` → `0.5` (untuk 6s video = 3.0)
5. Save

**Calculation:**
- Jika ingin 3.0 credits untuk 6s video:
- Cost per second = 3.0 ÷ 6 = **0.5 cr/s**

**Result:**
- Cost: 0.5 cr/s
- Duration: 6s
- Display: 0.5 × 6 = **3.0 credits** ✅

---

## 📊 **PRICING TYPE EXPLAINED:**

| Pricing Type | Cost Input | Frontend Calculation | Example (6s) |
|--------------|------------|---------------------|--------------|
| **Flat Rate** | 3.0 cr | `cost` (tidak dikali duration) | **3.0 cr** |
| **Per Second** | 0.5 cr/s | `cost × duration` | 0.5 × 6 = **3.0 cr** |
| **Per Second** | 3.0 cr/s | `cost × duration` | 3.0 × 6 = **18.0 cr** |

---

## 🎯 **QUICK FIX CHECKLIST:**

### **For All Video Models:**

1. ☐ Buka `/admin/models`
2. ☐ List semua video models
3. ☐ Untuk setiap model:
   - ☐ Check **Pricing Type**
   - ☐ If "Per Second":
     - ☐ Verify cost makes sense (should be small, like 0.5-5.0 cr/s)
     - ☐ Test: cost × typical duration = expected price?
   - ☐ If "Flat Rate":
     - ☐ Cost = total price (duration diabaikan)
4. ☐ Save changes
5. ☐ Hard refresh browser
6. ☐ Test di dashboard

---

## 🔧 **RECOMMENDED SETUP:**

### **Video Models - Per Second (Kling, VEO, etc):**
```
Pricing Type: "Per Second"
FAL Price: $0.05/s (dari fal.ai docs)
Cost: 0.5 cr/s (auto-calculated: $0.05 × 10)
Max Duration: 10s

User pilih 6s:
Display: 0.5 cr/s × 6s = 3.0 credits ✅
```

### **Video Models - Flat Rate (MiniMax, Runway):**
```
Pricing Type: "Flat Rate"
FAL Price: $0.30 (flat)
Cost: 3.0 cr (auto-calculated: $0.30 × 10)
Max Duration: 6s (informational only)

User pilih any duration:
Display: 3.0 credits (flat) ✅
```

---

## 📝 **SQL TO CHECK:**

```sql
-- Check current pricing types
SELECT 
  name,
  pricing_type,
  ROUND(fal_price::numeric, 4) as fal_usd,
  ROUND(cost::numeric, 2) as cost_cr,
  max_duration,
  CASE 
    WHEN pricing_type = 'per_second' THEN
      CONCAT(cost, ' cr/s (for ', max_duration, 's = ', ROUND((cost * max_duration)::numeric, 1), ' cr)')
    ELSE
      CONCAT(cost, ' cr (flat)')
  END as explanation
FROM ai_models
WHERE type = 'video' 
  AND is_active = true
ORDER BY name;
```

---

## ⚠️ **COMMON MISTAKES:**

### **Mistake 1: Per-Second dengan Cost Terlalu Besar**
```
❌ WRONG:
Pricing Type: Per Second
Cost: 3.0 cr/s
For 6s: 3.0 × 6 = 18.0 credits (TOO EXPENSIVE!)

✅ CORRECT:
Pricing Type: Per Second  
Cost: 0.5 cr/s
For 6s: 0.5 × 6 = 3.0 credits
```

### **Mistake 2: Flat Rate dengan Duration Calculation**
```
❌ User expects:
Pricing Type: Flat Rate
Cost: 3.0 cr
Duration: 6s
Expected: 3.0 credits

❌ But if duration affects price:
Should use "Per Second" instead
```

---

## 🚀 **QUICK FIX (One Model):**

1. Buka admin panel
2. Edit model "Kling v2.5 Turbo" (atau model yang bermasalah)
3. Ubah **Pricing Type** ke **"Flat Rate"**
4. Save
5. Hard refresh dashboard
6. Test → seharusnya 3.0 credits ✅

---

**Silakan cek Pricing Type di admin panel dan ubah sesuai kebutuhan!** 🎯

