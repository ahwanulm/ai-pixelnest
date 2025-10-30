# 🚀 Smart Prompt UI - Quick Start Guide

> **Prompt otomatis disembunyikan untuk model yang tidak memerlukannya**

---

## ✨ Apa yang Baru?

Sekarang UI dashboard **otomatis menyesuaikan** field yang ditampilkan berdasarkan model yang dipilih, seperti fal.ai sandbox!

### **Model Upload-Only:**
- ✅ Prompt field **DISEMBUNYIKAN**
- ✅ Upload section **DITAMPILKAN**
- ✅ Info message: "No Prompt Required"
- ✅ Button text berubah (e.g., "Remove Background")

### **Model Standard:**
- ✅ Prompt field **DITAMPILKAN**
- ❌ Upload section **DISEMBUNYIKAN** (untuk text-to-image/video)
- ✅ Button text: "Run"

---

## 🎯 Cara Pakai

### **1. Remove Background (No Prompt!)**

```
1. Buka Dashboard → Tab Image
2. Pilih model "Background Remover"
3. ✨ Prompt field otomatis HILANG
4. Upload gambar
5. Klik "Remove Background"
6. Selesai! 🎉
```

### **2. Upscale Image (No Prompt!)**

```
1. Buka Dashboard → Tab Image
2. Pilih model "Clarity Upscaler"
3. ✨ Prompt field otomatis HILANG
4. Upload gambar low-res
5. Klik "Upscale Image"
6. Selesai! 🎉
```

### **3. Generate Image (With Prompt)**

```
1. Buka Dashboard → Tab Image
2. Pilih model "FLUX Pro"
3. ✅ Prompt field MUNCUL
4. Tulis prompt kreatif
5. Klik "Run"
6. Selesai! 🎉
```

---

## 📊 Model List

### **No-Prompt Models (Upload Saja)**

| Model | Button Text | What to Upload |
|-------|-------------|----------------|
| Background Remover | "Remove Background" | Any image |
| Clarity Upscaler | "Upscale Image" | Low-res image |
| Face to Sticker | "Create Sticker" | Photo with face |

### **Standard Models (Prompt Required)**

| Model | Type | Needs Upload? |
|-------|------|---------------|
| FLUX Pro | Text-to-Image | ❌ No |
| Imagen 4 | Text-to-Image | ❌ No |
| Recraft V3 | Text-to-Image | ❌ No |
| Veo 3.1 | Text-to-Video | ❌ No |
| Sora 2 | Text-to-Video | ❌ No |

---

## 🧪 Test Sekarang!

### **Quick Test:**

```bash
# 1. Start server (if not running)
npm start

# 2. Open browser
http://localhost:5005/dashboard

# 3. Test Background Remover:
- Select "Background Remover" model
- Check: Prompt field hidden? ✅
- Check: Upload section shown? ✅
- Check: Info message displayed? ✅
- Upload an image
- Click "Remove Background"
- Check: Works without prompt? ✅

# 4. Test FLUX Pro (comparison):
- Select "FLUX Pro" model
- Check: Prompt field shown? ✅
- Check: Upload section hidden? ✅
- Enter prompt
- Click "Run"
- Check: Works normally? ✅
```

---

## 🔧 Menambah Model Baru

### **Step 1: Edit Configuration**

Edit file: `public/js/smart-prompt-handler.js`

```javascript
const NO_PROMPT_MODELS = {
    // Add new model here
    'fal-ai/your-model-id': {
        requiresUpload: true,
        requiresPrompt: false,
        uploadLabel: 'Upload Your Image',
        generateButtonText: 'Process Image'
    }
};
```

### **Step 2: Restart Server**

```bash
# Restart to load new config
npm start
```

### **Step 3: Test**

```
1. Go to dashboard
2. Select your new model
3. Check UI updates correctly
4. Test generation
```

---

## 🎨 UI Changes

### **Before (❌):**
```
┌─────────────────────────────┐
│ Model: Background Remover   │
├─────────────────────────────┤
│ Prompt: [                 ] │ ← Why prompt for BG remover?
│         "remove background" │ ← User confused
├─────────────────────────────┤
│ Upload Image:               │
│ [Drop file here]            │
├─────────────────────────────┤
│ [      Run      ]           │
└─────────────────────────────┘
```

### **After (✅):**
```
┌─────────────────────────────┐
│ Model: Background Remover   │
├─────────────────────────────┤
│ ℹ️ No Prompt Required        │
│ Just upload & generate!     │
├─────────────────────────────┤
│ Upload Image:               │
│ [Drop file here]            │
├─────────────────────────────┤
│ [ Remove Background ]       │ ← Clear action!
└─────────────────────────────┘
```

---

## 💡 Tips

### **For Users:**
1. ✅ Look for info message if prompt not needed
2. ✅ Button text tells you what will happen
3. ✅ Upload-only models are faster to use
4. ✅ No need to think of creative prompts!

### **For Developers:**
1. ✅ Add models to config easily
2. ✅ No backend changes needed
3. ✅ UI updates automatically
4. ✅ Validation handled automatically

---

## 📁 Files Modified

```
✅ public/js/smart-prompt-handler.js     (NEW - Main handler)
✅ public/js/dashboard-generation.js     (UPDATED - Validation)
✅ src/views/auth/dashboard.ejs          (UPDATED - Script include)
✅ SMART_PROMPT_UI_GUIDE.md              (NEW - Full documentation)
✅ SMART_PROMPT_QUICKSTART.md            (NEW - This file)
```

---

## ❓ FAQ

### **Q: Prompt field tidak muncul untuk model yang butuh prompt?**
A: Cek browser console, refresh page, clear cache.

### **Q: Validation error meskipun upload sudah ada?**
A: Pastikan model ID sesuai dengan config di `smart-prompt-handler.js`.

### **Q: Button text tidak berubah?**
A: Cek `generateButtonText` di config model.

### **Q: Info message tidak muncul?**
A: Cek prompt section ada di DOM, coba refresh page.

---

## 🎉 Summary

### **What Changed:**
- ✅ Prompt field adaptif (hide/show otomatis)
- ✅ Validasi pintar (sesuai model type)
- ✅ Info messages (guide user)
- ✅ Button text adaptif (clear actions)

### **Benefits:**
- 🚀 Faster workflow (skip prompt untuk simple tasks)
- 😊 Less confusion (only see what's needed)
- ⭐ Better UX (like fal.ai sandbox)
- 🎯 Professional look (matches industry standards)

---

## 🔗 Related Docs

- 📖 **Full Guide:** `SMART_PROMPT_UI_GUIDE.md`
- 🔧 **Technical Docs:** See full guide for detailed implementation
- 🎨 **UI Examples:** Check full guide for screenshots

---

**Ready to use! 🚀**

Test it now:
```bash
npm start
# Then go to: http://localhost:5005/dashboard
```

---

**File:** `SMART_PROMPT_QUICKSTART.md`  
**Created:** 2025  
**Status:** ✅ **READY TO USE**

