# ⚠️ VIDEO GENERATION - PROMPT ALWAYS REQUIRED ✅

## 🔴 IMPORTANT RULE

**Untuk semua mode video generation (termasuk image-to-video):**

```
PROMPT = WAJIB! ✅
```

---

## 📋 Validation Rules

### ✅ Valid Generation:

#### Text-to-Video:
```
✅ Prompt: "a cat running in the park"
✅ Upload: (tidak perlu)
→ VALID
```

#### Image-to-Video:
```
✅ Prompt: "animate this cat running"
✅ Upload: cat.jpg
→ VALID
```

---

### ❌ Invalid Generation:

#### Text-to-Video tanpa prompt:
```
❌ Prompt: (kosong)
❌ Upload: (tidak ada)
→ Error: "Please enter a prompt!"
```

#### Image-to-Video tanpa prompt:
```
❌ Prompt: (kosong)
✅ Upload: cat.jpg
→ Error: "Please enter a prompt!"
```

**Meskipun ada upload, prompt tetap WAJIB!**

---

## 🎯 Exception

Hanya **no-prompt models** yang tidak perlu prompt:

```javascript
// Example: Remove Background
Mode: Image
Type: Remove Background
Prompt: (optional)
Upload: image.jpg
→ VALID (no-prompt model)
```

---

## 💡 User Guide

### Untuk Text-to-Video:
1. Isi prompt dengan deskripsi video yang diinginkan
2. Pilih settings (duration, aspect ratio)
3. Klik Generate

### Untuk Image-to-Video:
1. **Upload gambar** (start frame)
2. **Isi prompt** dengan instruksi animasi (WAJIB!)
3. Pilih settings (duration, aspect ratio)
4. Klik Generate

**Note:** Prompt menjelaskan bagaimana gambar harus dianimasikan.

---

## 🔍 Example Prompts

### Good Prompts for Image-to-Video:

```
✅ "animate this cat walking forward"
✅ "make the water flow naturally"
✅ "camera slowly zooms in"
✅ "person turns head and smiles"
✅ "leaves gently swaying in wind"
✅ "clouds moving across the sky"
```

### Bad Prompts:

```
❌ "" (kosong)
❌ " " (spasi saja)
❌ "..." (tidak descriptive)
```

---

## 📱 Mobile Experience

### Workflow:
```
1. User upload gambar (mobile)
2. User WAJIB isi prompt
3. User klik Generate
4. ✅ Validasi pass
5. ✅ Auto-redirect ke processing view
6. ✅ Video generation dimulai
```

### If Forgot Prompt:
```
1. User upload gambar
2. User lupa isi prompt
3. User klik Generate
4. ❌ Error: "Please enter a prompt!"
5. User isi prompt
6. User klik Generate lagi
7. ✅ Success
```

---

## 🔧 Technical Implementation

### Validation Code:
```javascript
// Prompt is ALWAYS required except for no-prompt models
if (!isNoPromptModel && !prompt) {
    showNotification('Please enter a prompt!', 'error');
    return;
}

// For no-prompt models, check upload requirement
if (isNoPromptModel && !hasUpload) {
    showNotification('Please upload an image!', 'error');
    return;
}
```

### Location:
- File: `/public/js/dashboard-generation.js`
- Lines: 597-612

---

## ❓ FAQ

### Q: Kenapa image-to-video perlu prompt?
**A:** Prompt memberikan instruksi ke AI tentang **bagaimana menganimasikan** gambar tersebut. Tanpa prompt, AI tidak tahu motion apa yang harus dibuat.

### Q: Bisa pakai prompt singkat?
**A:** Ya, bisa. Contoh: "animate", "move", "zoom in". Tapi prompt yang lebih descriptive akan menghasilkan hasil yang lebih baik.

### Q: Apa bedanya text-to-video vs image-to-video?
**A:**
- **Text-to-video:** Buat video dari nol berdasarkan prompt
- **Image-to-video:** Animasikan gambar existing berdasarkan prompt

**Keduanya tetap butuh prompt!**

### Q: Model apa yang tidak butuh prompt?
**A:** Hanya no-prompt models seperti:
- Remove Background
- Upscale
- Image Enhancement
- Dll (biasanya utility/processing tools)

---

## ✅ Validation Matrix Quick Reference

| Type | Prompt | Upload | Valid? |
|------|--------|--------|--------|
| Text-to-Video | ✅ | ❌ | ✅ |
| Text-to-Video | ❌ | ❌ | ❌ |
| Image-to-Video | ✅ | ✅ | ✅ |
| Image-to-Video | ❌ | ✅ | ❌ |
| Image-to-Video | ✅ | ❌ | ❌ |
| Remove-BG | ❌ | ✅ | ✅ |

---

## 🚨 Common Mistakes

### Mistake 1: Upload saja tanpa prompt
```
❌ Thinking: "Sudah upload gambar, harusnya cukup"
→ Result: Error "Please enter a prompt!"
```

### Mistake 2: Prompt terlalu pendek
```
⚠️ Prompt: "a"
→ Result: Generation works tapi hasil kurang optimal
```

### Mistake 3: Lupa clear textarea
```
⚠️ Prompt dari generation sebelumnya masih ada
→ Result: Video dengan instruksi yang salah
```

---

## 📝 Best Practices

### ✅ DO:
- Selalu isi prompt dengan descriptive
- Jelaskan motion/action yang diinginkan
- Gunakan bahasa yang clear
- Test dengan prompt yang berbeda

### ❌ DON'T:
- Jangan kosongkan prompt
- Jangan gunakan prompt yang terlalu generic
- Jangan gunakan special characters berlebihan
- Jangan copy-paste prompt yang tidak relevan

---

## 🎓 Learning Resources

### Related Documentation:
1. `MOBILE_VIDEO_VALIDATION_FIX.md` - Complete validation system
2. `SMART_PROMPT_QUICKSTART.md` - Smart prompt features
3. `VIDEO_GENERATION_CONSISTENCY_FIX.md` - Video generation guide
4. `MOBILE_AUTO_REDIRECT_PROCESSING.md` - Mobile workflow

---

## 🔗 Quick Links

### For Users:
- Need help with prompts? Check example prompts above
- Video tidak sesuai? Try different prompt
- Error validation? Make sure prompt is filled

### For Developers:
- Validation code: `dashboard-generation.js` line 597-612
- Error handling: Check console logs
- Testing: Run validation test suite

---

## 📞 Support

### Debug Steps:
1. Check console for validation logs
2. Verify textarea element has value
3. Confirm prompt.trim() is not empty
4. Check isNoPromptModel flag

### Console Logs:
```javascript
"🔍 Generation validation:"
  - mode: "video"
  - textareaId: "video-textarea"
  - promptLength: 0  // Should be > 0
  - promptValue: ""  // Should have text
```

---

## ✅ Quick Checklist

Before clicking Generate:
- [ ] Prompt field is filled
- [ ] Prompt is descriptive (not just "a" or "...")
- [ ] Upload gambar (for image-to-video)
- [ ] Settings configured (duration, aspect ratio)
- [ ] Credits sufficient

---

**Remember:** 
```
📝 PROMPT = WAJIB untuk semua video generation!
```

**Status:** ✅ **ENFORCED & DOCUMENTED**

**Last Updated:** October 27, 2025

