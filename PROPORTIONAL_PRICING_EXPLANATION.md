# 📹 Penjelasan Proportional Video Pricing

## ❓ MENGAPA DROPDOWN DAN TOTAL COST BERBEDA?

### **Ini NORMAL dan BENAR! ✅**

**Dropdown menunjukkan:** "Sora 2 - 9.5 credits (20s)"  
**Total Cost menunjukkan:** "2.4 credits"

## 🎯 ALASAN:

Video pricing menggunakan **PROPORTIONAL SYSTEM** = biaya disesuaikan dengan durasi video yang diminta.

### **Contoh Sora 2:**
- **Max Duration:** 20 detik
- **Full Cost:** 9.5 credits (untuk 20s penuh)
- **Cost per detik:** 9.5 / 20 = 0.475 credits/detik

**Jika user pilih:**
- **5s video:**  9.5 × (5/20)  = 2.4 credits ✅
- **10s video:** 9.5 × (10/20) = 4.8 credits ✅
- **20s video:** 9.5 × (20/20) = 9.5 credits ✅

---

## 💡 KENAPA SISTEM INI?

1. **FAIR untuk user:** Tidak perlu bayar full price untuk video pendek
2. **Sesuai FAL.AI:** Beberapa provider charge per-second
3. **Transparan:** User tahu berapa cost untuk durasi yang dipilih

---

## 🔄 SOLUSI:

### **Opsi 1: Update Dropdown Text** (Recommended)
Ubah dari:
```
Sora 2 - 9.5 credits (20s)
```
Jadi:
```
Sora 2 - 9.5 credits (max 20s) • 0.48 credits/s
```

### **Opsi 2: Tambah Tooltip**
Hover dropdown → show tooltip:
```
💡 Video pricing is proportional to duration.
   This shows the maximum cost for full duration.
   Shorter videos cost less!
```

### **Opsi 3: Update Total Cost Display**
Dari:
```
Total Cost: 2.4 Credits
```
Jadi:
```
Total Cost: 2.4 Credits
(5s @ 0.48 credits/s from Sora 2)
```

---

## 📊 COMPARISON WITH ALL DURATIONS:

| Model | Max | Full Cost | 5s | 10s | 15s | 20s |
|-------|-----|-----------|----|----|-----|-----|
| Sora 2 | 20s | 9.5 | 2.4 | 4.8 | 7.1 | 9.5 |
| Veo 3.1 | 10s | 5.5 | 2.8 | 5.5 | - | - |
| Veo 3 | 8s | 4.5 | 2.8 | - | - | - |
| Runway | 10s | 6.5 | 3.3 | 6.5 | - | - |

---

## ✅ CURRENT BEHAVIOR IS CORRECT!

User tidak perlu bayar 9.5 credits untuk video 5 detik.
Mereka hanya bayar 2.4 credits (proportional)!

**Ini MENGUNTUNGKAN user!** 🎉

