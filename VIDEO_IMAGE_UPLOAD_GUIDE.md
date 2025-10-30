# 📸 Video Generation - Image Upload Guide

> **Upload gambar untuk Image-to-Video SUDAH LENGKAP DAN BERFUNGSI!**

---

## ✅ Fitur Yang Sudah Support

### 1. **Image to Video (Start Frame Only)**
- Upload 1 gambar sebagai start frame
- AI akan menganimasikan gambar tersebut
- Prompt menjelaskan bagaimana gambar harus dianimasikan

### 2. **Image to Video (Advanced) - Start & End Frame**
- Upload 2 gambar (start + end frame)
- AI akan membuat transisi smooth dari start ke end
- Perfect untuk morphing & transformasi

---

## 🎯 Cara Menggunakan Upload Image

### **Step-by-Step:**

```
1. Buka Dashboard
   └─> Pilih mode "VIDEO" (tab di sidebar)

2. Pilih Type
   └─> Klik dropdown "Type"
   └─> Pilih "Image to Video" atau "Image to Video (Advanced)"

3. Upload Section Muncul OTOMATIS ✨
   └─> Section upload akan muncul setelah model selector
   
4. Upload Gambar
   Cara 1: Click area upload → pilih file dari komputer
   Cara 2: Paste URL gambar (dari web)
   
5. Isi Prompt (WAJIB!)
   └─> Contoh: "animate this cat walking forward"
   └─> Contoh: "make the water flow naturally"
   
6. Pilih Settings
   └─> Duration: 4s, 6s, atau 8s
   └─> Aspect Ratio: 1:1, 16:9, atau 9:16
   
7. Klik "Run" 🚀
```

---

## 📋 Upload Requirements

### **Supported Formats:**
- ✅ JPG / JPEG
- ✅ PNG
- ✅ WebP
- ✅ GIF

### **File Size:**
- Maximum: **10MB per image**

### **Resolution:**
- Recommended: **512px - 2048px** (width/height)
- Higher resolution = better quality but slower processing

---

## 🖼️ Upload Options

### **Option 1: Upload File**
```
1. Click upload area (dengan icon cloud)
2. Pilih file dari komputer
3. Preview akan muncul setelah upload
```

### **Option 2: Paste URL**
```
1. Cari gambar di internet
2. Copy URL gambar (harus end dengan .jpg, .png, dll)
3. Paste di field "Paste image URL here..."
```

---

## 🎬 Use Cases

### **1. Product Animation**
```
Type: Image to Video
Image: Product photo
Prompt: "360 degree rotation, smooth lighting"
```

### **2. Character Animation**
```
Type: Image to Video
Image: Character portrait
Prompt: "person smiles and waves at camera"
```

### **3. Morphing Effect**
```
Type: Image to Video (Advanced)
Start Image: Person A
End Image: Person B
Prompt: "smooth morphing transition between faces"
```

### **4. Scene Animation**
```
Type: Image to Video
Image: Landscape photo
Prompt: "clouds moving across sky, trees swaying gently"
```

---

## ⚡ Troubleshooting

### **Upload section tidak muncul?**
```
✓ Pastikan sudah pilih mode "VIDEO"
✓ Pastikan pilih type "Image to Video" (bukan "Text to Video")
✓ Refresh halaman kalau masih tidak muncul
```

### **Upload gagal?**
```
✓ Check file size (max 10MB)
✓ Check format (JPG, PNG, WebP)
✓ Pastikan koneksi internet stabil
```

### **Generation gagal?**
```
✓ Pastikan prompt sudah diisi (WAJIB!)
✓ Check credits cukup
✓ Pastikan gambar valid (tidak corrupt)
```

---

## 🔧 Technical Details

### **Frontend:**
- **File:** `src/views/auth/dashboard.ejs` (line 642-698)
- **Upload Section ID:** `video-upload-section`
- **Auto show/hide:** Based on video type selection

### **JavaScript:**
- **File:** `public/js/dashboard-generation.js` (line 775-795)
- **Event:** Video type change triggers upload section visibility
- **FormData:** Automatically attached to request

### **Backend:**
- **Controller:** `src/controllers/generationQueueController.js`
- **Multer:** File upload middleware
- **Storage:** `public/uploads/temp/`
- **Cleanup:** Auto cleanup after processing

### **Worker:**
- **File:** `src/workers/aiGenerationWorker.js`
- **Process:** Converts uploaded files to URLs for FAL.AI
- **Cleanup:** Removes temp files after generation

---

## 📊 Upload Flow Diagram

```
User Selects Type
       ↓
   "Image to Video"
       ↓
Upload Section Appears ✨
       ↓
User Uploads Image (File or URL)
       ↓
User Fills Prompt (REQUIRED!)
       ↓
User Clicks "Run"
       ↓
FormData Created with:
  - prompt
  - model
  - type
  - duration
  - aspectRatio
  - startImage (file)
  - startImageUrl (or URL)
       ↓
Backend Receives Request
       ↓
Multer Saves File to /uploads/temp/
       ↓
Job Created in Queue
       ↓
Worker Processes Job
       ↓
Convert Local Path to Full URL
       ↓
Call FAL.AI with Image URL
       ↓
Download Result Video
       ↓
Save to User Folder
       ↓
Cleanup Temp Files
       ↓
✅ COMPLETE!
```

---

## 🎨 Example Prompts for I2V

### **Good Prompts:**
```
✅ "animate this cat walking forward"
✅ "make the water flow naturally"
✅ "camera slowly zooms in"
✅ "person turns head and smiles"
✅ "leaves gently swaying in wind"
✅ "clouds moving across the sky"
✅ "smooth 360 rotation"
✅ "dramatic lighting change from day to night"
```

### **Bad Prompts:**
```
❌ "" (empty)
❌ "cat" (too vague)
❌ "video" (no instruction)
❌ "good" (not descriptive)
```

---

## 🚀 Advanced Features

### **Multi-Model Support:**
All video models support image-to-video via metadata config:
- `supports_i2v: true` (set in admin panel)
- Model automatically receives `image_url` parameter

### **Flexible Metadata:**
Admin dapat configure per-model:
```json
{
  "aspect_ratio_style": "fal",
  "supports_i2v": true,
  "supports_multi_image": false,
  "custom_parameters": {
    "motion_strength": 0.8,
    "seed": 42
  }
}
```

---

## 📝 Summary

| Feature | Status | Notes |
|---------|--------|-------|
| **Upload File** | ✅ WORKING | Drag & drop + click to upload |
| **Upload URL** | ✅ WORKING | Paste image URL |
| **Preview** | ✅ WORKING | Shows selected file name |
| **Validation** | ✅ WORKING | File size, format check |
| **Backend** | ✅ WORKING | Multer + temp storage |
| **Worker** | ✅ WORKING | Process & cleanup |
| **Multi-image** | ✅ WORKING | Start + End frame |
| **FAL.AI** | ✅ WORKING | Image URL parameter |

---

## 🎉 Kesimpulan

**Upload image untuk video generation SUDAH LENGKAP!**

Kalau user bilang "belum bisa", kemungkinan:
1. Belum pilih "Image to Video" dari dropdown
2. Lupa isi prompt (WAJIB!)
3. File size terlalu besar (max 10MB)

**Solusi:** Ikuti step-by-step guide di atas! 🚀

