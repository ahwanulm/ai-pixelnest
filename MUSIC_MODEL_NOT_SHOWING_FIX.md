# 🔴 Model Music Tidak Muncul - FIX

> **Problem:** Model music generation sudah ditambahkan tapi tidak muncul di dashboard  
> **Cause:** Category name tidak sesuai dengan filter

---

## 🔍 **ROOT CAUSE:**

Dashboard filtering menggunakan **EXACT MATCH** untuk category:

```javascript
// File: public/js/dashboard-audio.js (Line 752-756)

const categoryMap = {
    'text-to-speech': ['Text-to-Speech', 'Voice-Conversion'],
    'text-to-music': ['Text-to-Music'],     // ← HARUS PERSIS INI!
    'text-to-audio': ['Text-to-Audio']      // ← HARUS PERSIS INI!
};

// Filter logic:
let filtered = audioModels.filter(model => {
    return categories.some(cat => model.category === cat);  // ← EXACT MATCH!
});
```

**Jadi category di database HARUS:**
- ✅ `Text-to-Music` (dengan dash, capital T dan M)
- ✅ `Text-to-Audio` (dengan dash, capital T dan A)
- ✅ `Text-to-Speech` (dengan dash, capital T dan S)

**BUKAN:**
- ❌ `text-to-music` (lowercase)
- ❌ `Music Generation`
- ❌ `Text to Music` (tanpa dash)
- ❌ `music`

---

## ✅ **SOLUSI:**

### **Opsi 1: Via Admin Panel (Recommended)**

1. **Login Admin:** `http://localhost:3000/admin/models`

2. **Cari model music** yang sudah ditambahkan

3. **Click Edit**

4. **Pastikan field Category PERSIS:**
   ```
   Category: Text-to-Music
   ```
   ⚠️ **Harus case-sensitive!** `Text-to-Music` bukan `text-to-music`

5. **Save**

6. **Refresh dashboard** dan coba lagi

### **Opsi 2: Via SQL**

```sql
-- Update category untuk model music
UPDATE ai_models 
SET category = 'Text-to-Music'
WHERE model_id = 'fal-ai/musicgen';

-- Update category untuk model audio/SFX
UPDATE ai_models 
SET category = 'Text-to-Audio'
WHERE model_id = 'fal-ai/bark';

-- Verify
SELECT model_id, name, category, type, status 
FROM ai_models 
WHERE type = 'audio';
```

---

## 🔎 **DEBUG CHECKLIST:**

### **1. Check Console Logs**

Buka browser console (F12) saat di dashboard audio tab:

```
🔍 Filtered X models for type: text-to-music
```

**Jika X = 0:** Category salah!  
**Jika X > 0:** Model sudah terfilter, cek apakah status = 'active'

### **2. Check Model in Database**

Pastikan model memiliki:
- ✅ `type` = `'audio'`
- ✅ `category` = `'Text-to-Music'` (exact!)
- ✅ `status` = `'active'`
- ✅ `is_default` = `true` (atau salah satu model di category ini harus true)

### **3. Common Issues:**

| Issue | Fix |
|-------|-----|
| Category: `music` | Change to `Text-to-Music` |
| Category: `text-to-music` (lowercase) | Change to `Text-to-Music` |
| Category: `Music Generation` | Change to `Text-to-Music` |
| Status: `inactive` | Change to `active` |
| Type: `other` | Change to `audio` |

---

## 📋 **CORRECT VALUES:**

### **MusicGen (Text-to-Music):**
```
model_id: fal-ai/musicgen
name: MusicGen
provider: Meta
type: audio
category: Text-to-Music         ← IMPORTANT!
status: active
is_default: true
```

### **Bark (Text-to-Audio):**
```
model_id: fal-ai/bark
name: Bark Text-to-Audio
provider: Suno AI
type: audio
category: Text-to-Audio         ← IMPORTANT!
status: active
is_default: true
```

### **ElevenLabs (Text-to-Speech):**
```
model_id: fal-ai/elevenlabs-text-to-speech
name: ElevenLabs TTS
provider: ElevenLabs
type: audio
category: Text-to-Speech        ← IMPORTANT!
status: active
is_default: true
```

---

## 🧪 **VERIFICATION:**

### **Step 1: Check in Admin**
```
http://localhost:3000/admin/models
```
Filter by Type: `audio`

Pastikan ada model dengan category `Text-to-Music` dan status `active`

### **Step 2: Check in Dashboard**
```
http://localhost:3000/dashboard
```

1. Klik tab **"Audio"**
2. Select type **"Text-to-Music"**
3. Model **HARUS MUNCUL** ✅

### **Step 3: Browser Console**

Open console (F12) dan cari log:
```
🔍 Filtered 1 models for type: text-to-music
```

Jika `Filtered 0`, berarti category masih salah!

---

## 🎯 **CATEGORY MAPPING:**

Frontend menggunakan mapping ini:

| User Selects | Category Required | Example Models |
|-------------|-------------------|----------------|
| Text-to-Speech | `Text-to-Speech` atau `Voice-Conversion` | ElevenLabs, Parler-TTS |
| Text-to-Music | `Text-to-Music` | MusicGen, Stable Audio |
| Text-to-Audio | `Text-to-Audio` | Bark, AudioCraft |

**Tidak ada toleransi untuk typo atau case differences!**

---

## 🔧 **QUICK FIX SCRIPT:**

Buat file `fix-music-category.js`:

```javascript
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function fix() {
  try {
    // Fix MusicGen category
    const result = await pool.query(`
      UPDATE ai_models 
      SET 
        category = 'Text-to-Music',
        status = 'active'
      WHERE model_id LIKE '%musicgen%' OR model_id LIKE '%music%'
      RETURNING model_id, name, category
    `);
    
    console.log('✅ Fixed', result.rowCount, 'music models:');
    console.table(result.rows);
    
    // Show all audio models
    const all = await pool.query(`
      SELECT model_id, name, category, status 
      FROM ai_models 
      WHERE type = 'audio'
      ORDER BY category
    `);
    
    console.log('\n📋 All audio models:');
    console.table(all.rows);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

fix();
```

Run:
```bash
node fix-music-category.js
```

---

## 💡 **TIPS:**

1. **Always use exact category names** from the mapping
2. **Case-sensitive!** `Text-to-Music` bukan `text-to-music`
3. **Use dashes!** `Text-to-Music` bukan `Text to Music`
4. **Check console logs** untuk debugging
5. **Refresh dashboard** after making changes

---

## ✅ **AFTER FIX:**

1. ✅ Category = `Text-to-Music` (exact)
2. ✅ Type = `audio`
3. ✅ Status = `active`
4. ✅ Refresh dashboard
5. ✅ Select "Text-to-Music"
6. ✅ Model MUNCUL! 🎉

---

**🎯 Masalah category adalah issue paling umum untuk model tidak muncul!**

**Pastikan category PERSIS seperti di mapping!** ✅

