# 🚀 Quick Setup: Admin Credits Control

## ✅ Setup Lengkap - Admin Punya Full Control!

---

## 📋 Langkah Setup (3 Menit)

### **Step 1: Initialize Settings**
```bash
npm run init:credits-settings
```

Expected output:
```
✅ Default credits settings initialized!
📊 Current Configuration:
   - Give Default Credits: ✅ Enabled
   - Default Amount: 💰 100 credits
```

### **Step 2: Give Credits ke Existing Users**
```bash
npm run give:credits
```

Expected output:
```
✅ Successfully updated X user(s)!
Users can now generate images and videos! 🚀
```

### **Step 3: Start Server**
```bash
npm start
# atau
npm run dev
```

---

## 🎛️ Cara Menggunakan Admin Panel

### **1. Login as Admin**
```
URL: http://localhost:5005/admin
Email: admin@pixelnest.id
Password: [your admin password]
```

### **2. Go to System Settings**
```
Admin Panel → Settings
atau langsung: http://localhost:5005/admin/settings
```

### **3. Configure Default Credits**

**Toggle ON/OFF:**
```
Give Default Credits to New Users: [Toggle]
  ✅ Enabled  = User baru dapat credits
  ❌ Disabled = User baru dapat 0 credits
```

**Set Amount:**
```
Default Credits Amount: [Input]
  Quick buttons: 10 | 50 | 100 | 500
  atau ketik manual: 0 - unlimited
```

**Save:**
```
Click: "Save Settings"
Result: ✅ Settings saved successfully!
```

---

## 🧪 Testing

### **Test 1: Register User Baru (Enabled)**
```
1. Set: Enabled, Amount: 100
2. Register user baru
3. Check dashboard → Seharusnya tampil: 100.0 Credits ✅
```

### **Test 2: Disable Credits**
```
1. Set: Disabled
2. Save Settings
3. Register user baru
4. Check dashboard → Seharusnya tampil: 0.0 Credits ✅
```

### **Test 3: Custom Amount**
```
1. Set: Enabled, Amount: 50
2. Save Settings
3. Register user baru
4. Check dashboard → Seharusnya tampil: 50.0 Credits ✅
```

---

## 🎯 Business Models yang Bisa Dipakai

### **Model 1: Freemium (Recommended)**
```
Settings:
  ✅ Enabled
  💰 100 credits

User Experience:
  - Sign up gratis
  - Dapat 100 credits
  - Test generate ~20-50 videos
  - Setelah habis → beli credits
```

### **Model 2: Paid Only**
```
Settings:
  ❌ Disabled
  💰 0 credits

User Experience:
  - Sign up gratis
  - Dapat 0 credits
  - Harus beli credits dulu
  - Premium feel, no freebies
```

### **Model 3: Limited Trial**
```
Settings:
  ✅ Enabled
  💰 10 credits

User Experience:
  - Sign up gratis
  - Dapat 10 credits
  - Test 2-5 videos
  - Quick hook → buy more
```

### **Model 4: Generous Trial**
```
Settings:
  ✅ Enabled
  💰 500 credits

User Experience:
  - Sign up gratis
  - Dapat 500 credits
  - Generate 100+ videos
  - Build loyalty → convert
```

---

## 💡 Tips untuk Admin

### **Monitoring**
```
- Check berapa user baru sign up per hari
- Calculate total credits given per hari
- Monitor conversion rate (free → paid)
```

### **A/B Testing**
```
Week 1: 100 credits → Track conversions
Week 2: 50 credits  → Compare results
Week 3: 10 credits  → Compare again
Choose best performing amount
```

### **Seasonal Promotions**
```
Normal: 100 credits
Promo: 500 credits (holiday season)
Black Friday: 1000 credits
Back to normal setelah promo
```

---

## 📊 What Users Get with Credits

```
Credits Guide:
  - Image (text-to-image):    ~1 credit
  - Image (upscale):          ~2 credits
  - Video 5s:                 ~2-5 credits
  - Video 10s:                ~4-10 credits

With 100 Credits User Can:
  ✅ ~100 images
  ✅ ~20-50 videos (5s)
  ✅ ~10-25 videos (10s)
  ✅ Mix of both
```

---

## ✅ Checklist Post-Setup

Admin Side:
- [ ] Can access /admin/settings
- [ ] Can see toggle & amount input
- [ ] Can save settings
- [ ] Settings persist after reload

User Side:
- [ ] New user gets correct credits
- [ ] Credits display in dashboard header
- [ ] Can generate when has credits
- [ ] Gets "Insufficient credits" error when 0 credits

Database:
- [ ] Settings in pricing_config table
- [ ] New users have credits column populated correctly

---

## 🆘 Troubleshooting

### **Problem: User baru masih dapat 0 credits**
```
Solution:
1. Check admin settings: /admin/settings
2. Verify toggle is ON (enabled)
3. Verify amount > 0
4. Save settings again
5. Register new test user
```

### **Problem: Settings tidak save**
```
Solution:
1. Check browser console for errors
2. Verify admin is logged in
3. Check server logs
4. Try refresh page & save again
```

### **Problem: Existing users masih 0 credits**
```
Solution:
Run script untuk give credits:
npm run give:credits
```

---

## 🎉 Done!

**ADMIN SEKARANG PUNYA FULL CONTROL!**

You can:
- ✅ Enable/disable default credits
- ✅ Set custom amount (0-unlimited)
- ✅ Update instantly via UI
- ✅ Change anytime without code changes

No more hardcoded values!  
Admin is in complete control! 🎛️

---

## 📞 Next Steps

1. **Setup Payment System** (optional)
   - Integrate Midtrans/Stripe
   - Allow users to buy credits

2. **Promo Codes** (optional)
   - Create promo codes
   - Give extra credits via codes

3. **Referral System** (optional)
   - Refer friend → both get bonus credits
   - Track referrals

4. **Analytics**
   - Track credit usage per user
   - Monitor generation patterns
   - Optimize pricing

---

**Happy Generating! 🚀**

