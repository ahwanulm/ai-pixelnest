# 📁 File Upload Lifecycle - Image-to-Video

## ❓ Pertanyaan: Upload Gambar Harus Dihapus atau Disimpan?

**Jawaban: DIHAPUS SETELAH GENERATE (Temporary Files)**

---

## 🎯 Logika yang Dipilih: **Temporary Upload + Auto Cleanup**

### ✅ Mengapa Hapus Setelah Generate?

1. **💾 Save Storage**
   - File upload hanya dibutuhkan sekali untuk generate
   - Tidak ada alasan simpan permanent
   - Prevent disk full

2. **🔒 Privacy & Security**
   - User's uploaded images tidak disimpan
   - Tidak bisa diakses setelah generate selesai
   - Minimize data exposure

3. **🧹 Clean File System**
   - Folder tidak penuh sampah
   - Easier to manage
   - Better performance

4. **💰 Cost Efficiency**
   - Tidak perlu storage besar
   - Tidak perlu backup uploaded files
   - Reduce server costs

---

## 🔄 File Upload Lifecycle

### 1️⃣ **Upload** (Frontend → Backend)
```
User selects image
    ↓
FormData with file
    ↓
POST /api/queue-generation/create
    ↓
Multer middleware
    ↓
Save to: public/uploads/temp/
```

**Location**: `public/uploads/temp/startImage-1234567890-abc123.jpg`

### 2️⃣ **Process** (Backend → Queue → Worker)
```
File saved in temp folder
    ↓
Job created in database
    ↓
Job enqueued to pg-boss
    ↓
Worker picks up job
    ↓
Read file from temp folder
    ↓
Send to FAL.AI
```

### 3️⃣ **Generate** (Worker → FAL.AI)
```
Worker converts path to URL
    ↓
http://localhost:3000/uploads/temp/startImage-xxx.jpg
    ↓
FAL.AI downloads the image
    ↓
FAL.AI generates video
    ↓
Worker downloads result
```

### 4️⃣ **Cleanup** (Worker → Filesystem)
```
Generation complete (success or failed)
    ↓
finally { cleanupUploadedFiles() }
    ↓
fs.unlink(tempFilePath)
    ↓
File DELETED from temp folder
    ↓
✅ Storage freed
```

---

## 📂 Folder Structure

```
public/
├── uploads/
│   ├── temp/                    ← Uploaded files (TEMPORARY)
│   │   ├── startImage-xxx.jpg   ← Auto-deleted after generate
│   │   └── endImage-xxx.jpg     ← Auto-deleted after generate
│   │
│   ├── users/                   ← User avatars (PERMANENT)
│   │   └── avatar-xxx.jpg       ← Not deleted
│   │
│   └── generations/             ← Generated results (PERMANENT)
│       ├── images/
│       │   └── result-xxx.png   ← Saved forever
│       └── videos/
│           └── result-xxx.mp4   ← Saved forever
```

---

## 💻 Implementation

### 1. **Backend Controller** (`generationQueueController.js`)

```javascript
// Multer config - Save to TEMP folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/temp/'); // ✨ TEMP folder
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Store file paths for cleanup
if (req.files.startImage) {
  uploadedFiles.startImagePath = `/uploads/temp/${req.files.startImage[0].filename}`;
  uploadedFiles.startImageFullPath = req.files.startImage[0].path; // For cleanup
}
```

### 2. **Worker** (`aiGenerationWorker.js`)

```javascript
async function processAIGeneration(jobData, job) {
  const { uploadedFiles } = jobData;
  
  try {
    // ... generation logic ...
    
  } catch (error) {
    // ... error handling ...
    
  } finally {
    // ✨ ALWAYS cleanup, success or fail
    await cleanupUploadedFiles(uploadedFiles);
  }
}

async function cleanupUploadedFiles(uploadedFiles) {
  if (uploadedFiles?.startImageFullPath) {
    await fs.unlink(uploadedFiles.startImageFullPath);
    console.log('🗑️ Cleaned up temp file');
  }
  
  if (uploadedFiles?.endImageFullPath) {
    await fs.unlink(uploadedFiles.endImageFullPath);
    console.log('🗑️ Cleaned up temp file');
  }
}
```

---

## 🆚 Comparison: Temporary vs Permanent

| Aspect | Temporary (✅ Chosen) | Permanent |
|--------|----------------------|-----------|
| **Storage** | Minimal | Growing |
| **Privacy** | Good (auto-delete) | Risk (stored forever) |
| **Cost** | Low | High |
| **Maintenance** | None | Need cleanup script |
| **Re-use** | ❌ Can't re-use | ✅ Can re-use |
| **Use Case** | One-time generation | Gallery, editing |

---

## 🔮 Future: Jika Butuh Permanent Storage

### Scenario 1: **My Uploads Gallery**
```javascript
// Save to: public/uploads/users/{userId}/
// Show in "My Uploads" page
// User can delete manually
```

### Scenario 2: **Edit/Regenerate Feature**
```javascript
// Save to: public/uploads/users/{userId}/
// Keep for 7 days
// Auto-cleanup with cron job
```

### Scenario 3: **Variation Generator**
```javascript
// Save original
// Generate multiple variations
// Cleanup after all variations done
```

---

## 🛠️ Maintenance

### Auto Cleanup Script (Optional)

Jika ada file yang gagal di-cleanup:

```bash
#!/bin/bash
# cleanup-temp-uploads.sh

# Delete files older than 1 day
find public/uploads/temp/ -type f -mtime +1 -delete

echo "✅ Cleanup complete"
```

**Cron job** (run daily):
```cron
0 2 * * * /path/to/cleanup-temp-uploads.sh
```

---

## 📊 Storage Comparison

### Temporary (Current):
```
100 generations/day
Each upload: 2MB (average)
Total: 200MB/day
Storage after cleanup: ~0MB ✅
```

### Permanent (Alternative):
```
100 generations/day
Each upload: 2MB (average)
Total: 200MB/day
Storage after 30 days: 6GB ❌
Storage after 1 year: 73GB ❌
```

---

## ⚠️ Important Notes

### 1. **File Names Must Be Unique**
```javascript
// Bad: user might upload same filename
filename: file.originalname

// Good: add timestamp + random
filename: `startImage-${Date.now()}-${randomBytes(8).toString('hex')}.jpg`
```

### 2. **Handle Cleanup Errors**
```javascript
try {
  await fs.unlink(filePath);
} catch (err) {
  // Don't throw - it's okay if file doesn't exist
  if (err.code !== 'ENOENT') {
    console.error('Error:', err);
  }
}
```

### 3. **Cleanup in Finally Block**
```javascript
try {
  // ... generation ...
} catch (error) {
  // ... error handling ...
} finally {
  // ✅ ALWAYS runs, even if error
  await cleanupUploadedFiles(uploadedFiles);
}
```

### 4. **Don't Delete URL Uploads**
```javascript
// Only delete uploaded files
if (uploadedFiles.startImageFullPath) {
  await fs.unlink(...); // ✅ Delete local file
}

// Don't delete URL references
if (uploadedFiles.startImageUrl) {
  // ❌ Don't delete - it's external URL
}
```

---

## 🧪 Testing Checklist

- [ ] Upload image → File saved to `public/uploads/temp/`
- [ ] Generate video → FAL.AI receives correct URL
- [ ] Generation success → File deleted from temp
- [ ] Generation failed → File still deleted (cleanup in finally)
- [ ] Worker crash → Next restart cleans up old files
- [ ] Use URL instead of upload → No cleanup needed
- [ ] Multiple concurrent uploads → No file conflicts

---

## 🔑 Key Takeaways

1. **Upload ke `public/uploads/temp/`** (bukan `public/uploads/`)
2. **Save full path** untuk cleanup (`req.file.path`)
3. **Cleanup di `finally` block** (always runs)
4. **Handle ENOENT error** (file already deleted)
5. **Don't cleanup URL uploads** (only local files)

---

## 📝 Files Modified

| File | Changes |
|------|---------|
| `src/controllers/generationQueueController.js` | Upload to temp/, store full path |
| `src/workers/aiGenerationWorker.js` | Add cleanup logic in finally block |
| `public/uploads/temp/` | Created temp folder |

---

**Kesimpulan**: 
- ✅ **Temporary upload + auto cleanup** adalah pilihan terbaik
- 💾 Save storage, improve privacy, reduce costs
- 🧹 Auto cleanup di worker setelah generation
- 🔄 Bisa diubah ke permanent jika ada use case baru

---

**Tanggal**: 27 Oktober 2025  
**Status**: ✅ **IMPLEMENTED**

