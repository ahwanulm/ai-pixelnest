# 🔍 DEBUG: Harga 18.0 Credits

> **Reported:** 3.0 di admin → 18.0 di UI  
> **Need to verify:** Model specs & database values

---

## 📋 **INFO YANG DIBUTUHKAN:**

Tolong berikan informasi berikut:

### **1. Model Information**
- Nama model yang dipilih: ________________
- FAL Price di admin: $________ /s atau flat?
- Pricing Type: [ ] flat  [ ] per_second
- Max Duration: ________ seconds

### **2. Generation Settings**
- Video Type: [ ] Text-to-Video  [ ] Image-to-Video
- Duration selected: ________ seconds
- Quantity: ________

### **3. Screenshot/Console Log**
Buka browser console (F12) dan cari log:
```
📐 Per-second calculation: { ... }
💵 Cost breakdown: { ... }
```

Copy paste hasil log di sini.

---

## 🧮 **PERHITUNGAN MANUAL:**

### **Jika per_second pricing:**

```
Step 1: Database cost
  - Check: SELECT name, fal_price, cost, pricing_type FROM ai_models WHERE name = 'YourModelName';
  - Expected: cost = fal_price × 10

Step 2: Frontend calculation
  - creditsPerSecond = cost (from DB)
  - baseCost = creditsPerSecond × duration
  - totalCost = baseCost × quantity

Example:
  FAL Price: $0.30/s
  DB Cost: 3.0 cr/s (0.30 × 10 = 3.0) ✅
  Duration: 6s
  Calculation: 3.0 cr/s × 6s = 18.0 cr ✅ CORRECT!

Example 2:
  FAL Price: $0.05/s
  DB Cost: 0.5 cr/s (0.05 × 10 = 0.5) ✅
  Duration: 6s
  Calculation: 0.5 cr/s × 6s = 3.0 cr ✅ CORRECT!
```

---

## ✅ **KEMUNGKINAN PENYEBAB:**

### **1. Database Belum Di-Update (PALING MUNGKIN)**
```
Masalah: Model di DB masih pakai nilai lama
Database: cost = 3.0 (seharusnya 0.5 cr/s)
Fix: Run SQL update
```

### **2. Model FAL Price Salah Di-Input**
```
Masalah: Admin input FAL price = $0.30/s padahal seharusnya $0.05/s
Database: cost = 3.0 cr/s (benar untuk $0.30/s)
Fix: Update FAL price di admin
```

### **3. Salah Pilih Model**
```
Masalah: User pikir pilih model murah, tapi pilih model mahal
Model murah: $0.05/s = 0.5 cr/s → 6s = 3.0 cr
Model mahal: $0.30/s = 3.0 cr/s → 6s = 18.0 cr
Fix: Pilih model yang benar
```

---

## 🛠️ **QUICK FIX:**

### **Option 1: Update Database (If not updated yet)**
```sql
-- Check current values first
SELECT name, fal_price, cost, pricing_type 
FROM ai_models 
WHERE type = 'video' AND is_active = true
ORDER BY name;

-- Update all to ×10 formula
UPDATE ai_models
SET cost = GREATEST(0.1, ROUND((fal_price * 10)::numeric, 1))
WHERE fal_price IS NOT NULL AND fal_price > 0;
```

### **Option 2: Check Console Log**
1. Buka dashboard
2. Open DevTools (F12)
3. Go to Console tab
4. Pilih model dan duration
5. Lihat log `📐 Per-second calculation:`
6. Screenshot dan share

---

## 📊 **EXPECTED vs ACTUAL:**

Berdasarkan screenshot Anda, model "Kling v2.5 Turbo" dengan:
- Badge: "3.0 credits"
- Screenshot shows: "21.6 Credits" di UI (sebelum fix)
- Now shows: "18.0 Credits" di UI (setelah fix)

**Analysis:**
- 21.6 → 18.0 = sudah turun 16.7%
- Tapi masih belum 3.0 yang diharapkan
- **Kemungkinan:**
  - Database cost = 3.0 cr/s (masih nilai lama)
  - Duration = 6s
  - Calculation: 3.0 × 6 = 18.0 ✅ (perhitungan BENAR, tapi nilai DB salah)

**Fix:**
```sql
-- Update database untuk model ini
UPDATE ai_models 
SET cost = GREATEST(0.1, ROUND((fal_price * 10)::numeric, 1))
WHERE name LIKE '%Kling%' AND fal_price IS NOT NULL;
```

---

## 🎯 **ACTION REQUIRED:**

1. ☐ Buka `/admin/models`
2. ☐ Find "Kling v2.5 Turbo" (atau model yang dipilih)
3. ☐ Check FAL Price: $______/s
4. ☐ Check Cost: ______ cr/s
5. ☐ Expected Cost: (FAL Price × 10)
6. ☐ If different → Run SQL update
7. ☐ Hard refresh browser
8. ☐ Test lagi

---

**Silakan share info di atas agar saya bisa bantu lebih spesifik!** 🚀

