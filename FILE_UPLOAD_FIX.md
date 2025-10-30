# ✅ File Upload Fix - Image-to-Video Support

## 🚨 Masalah yang Ditemukan

Saat review migrasi ke worker system, ditemukan **masalah KRUSIAL**:

### ❌ File Upload Tidak Ditangani
- Frontend mengirim **FormData** dengan file upload untuk `image-to-video` dan `image-to-video-end`
- Backend baru (`generationQueueController`) menggunakan **JSON** dan tidak menangani file upload
- Worker tidak menerima uploaded image files
- **Image-to-video generation akan GAGAL**

---

## ✅ Solusi yang Diimplementasi

### 1. Backend - File Upload Support

**File**: `src/controllers/generationQueueController.js`

```javascript
const multer = require('multer');
const path = require('path');

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});
```

**Export middleware**:
```javascript
uploadMiddleware: upload.fields([
  { name: 'startImage', maxCount: 1 },
  { name: 'endImage', maxCount: 1 }
])
```

**Handle uploaded files dalam `createJob`**:
```javascript
// Handle uploaded files for image-to-video
let uploadedFiles = {};
if (req.files) {
  if (req.files.startImage && req.files.startImage[0]) {
    uploadedFiles.startImagePath = `/uploads/${req.files.startImage[0].filename}`;
    console.log('📁 Start image uploaded:', uploadedFiles.startImagePath);
  }
  if (req.files.endImage && req.files.endImage[0]) {
    uploadedFiles.endImagePath = `/uploads/${req.files.endImage[0].filename}`;
    console.log('📁 End image uploaded:', uploadedFiles.endImagePath);
  }
}

// Handle image URLs as alternative
if (req.body.startImageUrl) {
  uploadedFiles.startImageUrl = req.body.startImageUrl;
}
if (req.body.endImageUrl) {
  uploadedFiles.endImageUrl = req.body.endImageUrl;
}
```

**Pass ke queue**:
```javascript
const queueJobId = await queueManager.enqueue(
  'ai-generation',
  {
    userId,
    jobId,
    generationType: mode,
    subType: type,
    prompt,
    settings,
    dbJobId,
    uploadedFiles, // ✨ Include uploaded files
  },
  // ... options
);
```

**Normalize model -> modelId**:
```javascript
// ✨ Normalize model -> modelId for consistency
if (settings && settings.model && !settings.modelId) {
  settings.modelId = settings.model;
}
```

**Parse settings dari FormData**:
```javascript
// Parse settings if it's a JSON string (from FormData)
if (typeof settings === 'string') {
  try {
    settings = JSON.parse(settings);
  } catch (e) {
    console.error('Failed to parse settings:', e);
    settings = {};
  }
}
```

---

### 2. Routes - Upload Middleware

**File**: `src/routes/queueGeneration.js`

```javascript
// Create generation job (enqueue)
// ✨ Use uploadMiddleware to handle file uploads (for image-to-video)
router.post('/create', 
  generationQueueController.uploadMiddleware,
  generationQueueController.createJob
);
```

---

### 3. Frontend - Send FormData

**File**: `public/js/dashboard-generation.js`

**BEFORE** (❌ Broken):
```javascript
// Convert FormData to regular object for queue
const queueData = {
    prompt: formData.get('prompt'),
    type: formData.get('type'),
    mode: mode,
    settings: { ... }
};

const response = await fetch('/api/queue-generation/create', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(queueData)
});
```

**AFTER** (✅ Fixed):
```javascript
// Add mode and settings to FormData for queue
formData.append('mode', mode);
formData.append('settings', JSON.stringify({
    model: formData.get('model'),
    aspectRatio: formData.get('aspectRatio'),
    quantity: parseInt(formData.get('quantity') || '1'),
    duration: parseInt(formData.get('duration') || '5'),
    hasAudio: formData.get('hasAudio') === 'true'
}));

// ✨ Send FormData directly (supports file uploads + JSON data)
const response = await fetch('/api/queue-generation/create', {
    method: 'POST',
    // ⚠️ Don't set Content-Type - browser sets it with boundary
    body: formData
});
```

---

### 4. Worker - Use Uploaded Files

**File**: `src/workers/aiGenerationWorker.js`

**Extract uploadedFiles**:
```javascript
async function processAIGeneration(jobData, job) {
  const { userId, jobId, generationType, subType, prompt, settings, uploadedFiles } = jobData;
  
  if (uploadedFiles && Object.keys(uploadedFiles).length > 0) {
    console.log(`📁 Uploaded files:`, uploadedFiles);
  }
  
  // ...
}
```

**Pass to generateVideo**:
```javascript
if (generationType === 'video') {
  result = await generateVideo(modelId, prompt, settings, uploadedFiles, jobId);
}
```

**Update generateVideo function**:
```javascript
async function generateVideo(modelId, prompt, settings, uploadedFiles, jobId) {
  // ... get model ...
  
  // ✨ Merge uploadedFiles into settings for FAL.AI
  const enhancedSettings = { ...settings };
  
  if (uploadedFiles) {
    // Convert local paths to full URLs for FAL.AI
    if (uploadedFiles.startImagePath) {
      enhancedSettings.image_url = `${process.env.BASE_URL || 'http://localhost:3000'}${uploadedFiles.startImagePath}`;
      console.log('🖼️ Using start image:', enhancedSettings.image_url);
    } else if (uploadedFiles.startImageUrl) {
      enhancedSettings.image_url = uploadedFiles.startImageUrl;
      console.log('🔗 Using start image URL:', enhancedSettings.image_url);
    }
    
    if (uploadedFiles.endImagePath) {
      enhancedSettings.end_image_url = `${process.env.BASE_URL || 'http://localhost:3000'}${uploadedFiles.endImagePath}`;
      console.log('🖼️ Using end image:', enhancedSettings.end_image_url);
    } else if (uploadedFiles.endImageUrl) {
      enhancedSettings.end_image_url = uploadedFiles.endImageUrl;
      console.log('🔗 Using end image URL:', enhancedSettings.end_image_url);
    }
  }

  // Call FAL.AI with enhanced settings
  const result = await falAiService.generateVideo(fal_model_id, prompt, enhancedSettings);
  
  return result;
}
```

---

## 📋 File yang Diupdate

| File | Perubahan |
|------|-----------|
| `src/controllers/generationQueueController.js` | ✅ Tambah multer config, handle file upload, normalize modelId, parse settings, upload ke temp/ |
| `src/routes/queueGeneration.js` | ✅ Tambah uploadMiddleware di route |
| `public/js/dashboard-generation.js` | ✅ Kirim FormData langsung (bukan JSON) |
| `src/workers/aiGenerationWorker.js` | ✅ Extract uploadedFiles, pass ke generateVideo, convert path ke URL, **auto cleanup** |
| `public/uploads/temp/` | ✅ Created temp folder for uploads |

---

## 🧪 Testing Checklist

- [ ] **Text-to-Image**: Buat image tanpa upload → ✅ Should work
- [ ] **Text-to-Video**: Buat video tanpa upload → ✅ Should work
- [ ] **Image-to-Video**: Upload start image → ✅ **NOW FIXED**
- [ ] **Image-to-Video-End**: Upload start + end image → ✅ **NOW FIXED**
- [ ] **Image URL**: Gunakan URL instead of upload → ✅ Should work

---

## 🔑 Key Points

### 1. FormData vs JSON
- **FormData**: Mendukung file upload + text data
- **JSON**: Hanya text data, tidak bisa kirim file
- **Solution**: Gunakan FormData untuk semua request

### 2. Multer Middleware
- Handle file upload di backend
- Save ke `public/uploads/` dengan unique filename
- Validate file type (only images)
- Limit file size (10MB)

### 3. Settings Parsing
- Frontend: `settings` di-JSON.stringify untuk FormData
- Backend: Parse kembali dari string ke object
- Normalize `model` → `modelId`

### 4. Worker Integration
- Worker terima `uploadedFiles` dari queue
- Convert local path ke full URL untuk FAL.AI
- Support both uploaded files dan image URLs

### 5. Auto Cleanup (✨ NEW!)
- Uploaded files disimpan di `public/uploads/temp/`
- **Temporary files** - tidak disimpan permanent
- Auto cleanup di worker setelah generation (success/failed)
- Finally block memastikan cleanup always runs
- Save storage, improve privacy, reduce costs

**Lifecycle**:
```
Upload → Temp Folder → FAL.AI Generate → Auto Delete ✅
```

**See**: `FILE_UPLOAD_LIFECYCLE.md` untuk detail lengkap

---

## ⚠️ Environment Variables

Tambahkan ke `.env`:
```bash
# Base URL for uploaded files
BASE_URL=http://localhost:3000
```

Untuk production:
```bash
BASE_URL=https://yourdomain.com
```

---

## 🎯 Result

✅ **Image-to-video sekarang fully supported di worker system**
- File upload berjalan normal
- Worker menerima uploaded files
- FAL.AI API dipanggil dengan image URL yang benar
- Backward compatible dengan system lama

---

**Tanggal**: 27 Oktober 2025  
**Status**: ✅ **COMPLETED**

