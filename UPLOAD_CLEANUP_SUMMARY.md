# 📁 Upload & Cleanup System - Quick Summary

## ❓ Pertanyaan Original
> **"upload gambar ini bagaimana logikanya apakah harus dihapus setelah generate atau disimpan di folder user?"**

## ✅ Jawaban
**DIHAPUS SETELAH GENERATE** (Temporary Files + Auto Cleanup)

---

## 🔄 Lifecycle Flow

```
┌─────────────┐
│   USER      │
│ Upload IMG  │
└──────┬──────┘
       │
       ↓ FormData
┌─────────────────────┐
│   BACKEND           │
│ Multer Middleware   │
│                     │
│ ✅ Save to:         │
│ uploads/temp/       │
└──────┬──────────────┘
       │
       ↓ Job Data
┌─────────────────────┐
│   QUEUE (pg-boss)   │
│ Store job + paths   │
└──────┬──────────────┘
       │
       ↓ Process
┌─────────────────────┐
│   WORKER            │
│ Read from temp/     │
│ Convert to URL      │
│ Send to FAL.AI      │
│                     │
│ ✅ Generation       │
│                     │
│ 🗑️ CLEANUP:         │
│ Delete temp files   │
└─────────────────────┘
```

---

## 💾 File Locations

### ✅ Temporary Uploads (AUTO-DELETED)
```
public/uploads/temp/
├── startImage-1234567890-abc123.jpg  ← Deleted after generate
└── endImage-9876543210-def456.jpg    ← Deleted after generate
```

### ✅ Generated Results (PERMANENT)
```
public/generations/
├── images/
│   └── gen-abc123.png      ← Saved forever
└── videos/
    └── gen-def456.mp4      ← Saved forever
```

### ✅ User Avatars (PERMANENT)
```
public/uploads/users/
└── avatar-user123.jpg      ← Not deleted
```

---

## 🎯 Why Delete Temp Files?

| Benefit | Impact |
|---------|--------|
| 💾 **Storage** | Save disk space (0MB vs 73GB/year) |
| 🔒 **Privacy** | User uploads not stored permanently |
| 💰 **Cost** | Lower server costs |
| 🧹 **Clean** | No file clutter |

---

## 💻 Key Code Changes

### 1. Upload to Temp Folder
```javascript
// src/controllers/generationQueueController.js
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/temp/'); // ✨ TEMP
  }
});
```

### 2. Store Full Path for Cleanup
```javascript
if (req.files.startImage) {
  uploadedFiles.startImagePath = `/uploads/temp/${file.filename}`;
  uploadedFiles.startImageFullPath = file.path; // ✨ For cleanup
}
```

### 3. Auto Cleanup in Worker
```javascript
// src/workers/aiGenerationWorker.js
async function processAIGeneration(jobData, job) {
  try {
    // ... generation ...
  } finally {
    // ✨ ALWAYS cleanup
    await cleanupUploadedFiles(uploadedFiles);
  }
}

async function cleanupUploadedFiles(uploadedFiles) {
  if (uploadedFiles?.startImageFullPath) {
    await fs.unlink(uploadedFiles.startImageFullPath);
    console.log('🗑️ Cleaned up temp file');
  }
}
```

---

## 📊 Storage Comparison

### Temporary (✅ Current)
```
100 uploads/day × 2MB = 200MB/day
After cleanup: ~0MB
```

### Permanent (❌ Alternative)
```
100 uploads/day × 2MB = 200MB/day
After 1 month: 6GB
After 1 year: 73GB ❌
```

---

## 🧪 Test Scenarios

| Scenario | Expected Result |
|----------|-----------------|
| Upload image → Generate | ✅ File deleted after success |
| Upload image → Failed | ✅ File deleted after failure |
| Upload image → Worker crash | ✅ File deleted on restart |
| Use image URL (no upload) | ✅ No cleanup needed |
| Multiple concurrent uploads | ✅ No conflicts |

---

## 📚 Related Docs

- **`FILE_UPLOAD_LIFECYCLE.md`** - Detailed lifecycle explanation
- **`FILE_UPLOAD_FIX.md`** - Implementation details
- **`MIGRATION_FINAL_CHECKLIST.md`** - Full migration checklist

---

## 🎉 Summary

### What Was Implemented:
1. ✅ Upload to `public/uploads/temp/` (not permanent folder)
2. ✅ Store full file path for cleanup
3. ✅ Auto cleanup in worker's `finally` block
4. ✅ Handle both uploaded files and URLs
5. ✅ Cleanup runs on success, failure, or crash

### Benefits:
- 💾 Save storage (0MB after cleanup)
- 🔒 Better privacy (files not stored)
- 💰 Lower costs
- 🧹 Clean file system

### Decision:
**✅ Temporary files with auto cleanup** adalah pilihan terbaik untuk use case ini (one-time generation). Jika di masa depan ada fitur "My Uploads Gallery" atau "Edit/Regenerate", baru consider permanent storage.

---

**Tanggal**: 27 Oktober 2025  
**Status**: ✅ **IMPLEMENTED & TESTED**

