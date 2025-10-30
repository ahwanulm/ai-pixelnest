# 🎨 Admin Model Advanced Configuration

**Date:** October 29, 2025  
**Status:** ✅ NEW FEATURE  
**Location:** `/admin/models` - Add/Edit Model Form

## 📋 Overview

Sistem Advanced Configuration memungkinkan admin untuk menyesuaikan model AI secara detail sesuai dengan dokumentasi FAL.AI. Setiap model dari FAL.AI memiliki parameter dan pengaturan yang berbeda-beda, dan fitur ini memudahkan admin untuk mengatur semua parameter tersebut.

---

## 🎯 Fitur Utama

### 1. **Duration Configuration** (Video Models)
Untuk model video, admin dapat mengatur:
- **Available Durations**: Durasi yang tersedia (contoh: `5,10,15` atau `4s,6s,8s`)
- **Price Per Second**: Harga per detik dalam USD
- **Duration Format**: 
  - `Number` - untuk model seperti Google Veo (4, 6, 8)
  - `String` - untuk model seperti Kling ("5", "10", "15")

**Contoh:**
```
Model: Kling Video Pro
Available Durations: 5,10,15
Price Per Second: $0.0100
Duration Format: String
```

### 2. **Advanced Configuration**

#### **Aspect Ratio Style**
Setiap model memiliki cara berbeda untuk mengatur aspect ratio:

| Style | Models | Format | Example |
|-------|--------|--------|---------|
| `aspect_ratio` | Imagen, Ideogram, Veo, Kling | Standard ratio | `16:9`, `9:16`, `1:1` |
| `image_size` | FLUX models | Orientation + size | `square_hd`, `landscape_16_9`, `portrait_16_9` |
| `size` | Recraft, others | Width x Height | `1024x1024`, `1536x864` |

#### **Supported Features**
- ✅ **Image-to-Video**: Model mendukung input gambar untuk video
- ✅ **Multiple Images**: Model dapat generate beberapa gambar sekaligus

#### **Custom Parameters (JSON)**
Parameter tambahan yang spesifik untuk model tertentu. Harus dalam format JSON yang valid.

**Contoh untuk FLUX Pro:**
```json
{
  "safety_tolerance": "2",
  "output_format": "jpeg"
}
```

**Contoh untuk Ideogram v2:**
```json
{
  "magic_prompt_option": "AUTO"
}
```

**Contoh untuk Stable Diffusion:**
```json
{
  "num_inference_steps": 50
}
```

#### **Custom API Endpoint**
Jika model menggunakan endpoint API yang berbeda dari `model_id`, bisa diisi di sini. Biasanya kosong.

---

## 📚 Template Models

Sistem menyediakan template pre-configured untuk model populer. Klik tombol **"Load Template"** untuk memilih template.

### Template yang Tersedia:

#### 🖼️ **Image Models**

**1. FLUX Pro**
- Provider: Black Forest Labs
- Aspect Ratio Style: `image_size`
- Parameters: `safety_tolerance: "2"`, `output_format: "jpeg"`
- Best for: High-quality image generation

**2. Imagen 4**
- Provider: Google
- Aspect Ratio Style: `aspect_ratio`
- Features: Multiple images support
- Best for: Photorealistic images

**3. Ideogram v2**
- Provider: Ideogram
- Aspect Ratio Style: `aspect_ratio`
- Parameters: `magic_prompt_option: "AUTO"`
- Best for: Text-in-image generation

**4. Recraft V3**
- Provider: Recraft
- Aspect Ratio Style: `size`
- Parameters: `style: "realistic_image"`
- Best for: Realistic images with specific dimensions

#### 🎬 **Video Models**

**1. Kling Video Pro**
- Provider: Kuaishou
- Duration Format: String
- Available Durations: 5, 10, 15 seconds
- Features: Image-to-Video support
- Best for: High-quality short videos

**2. Google Veo 3.1**
- Provider: Google
- Duration Format: Number
- Available Durations: 4, 6, 8 seconds
- Best for: Cinema-quality videos

---

## 🚀 Cara Penggunaan

### Menambah Model Baru dengan Template

1. **Klik "Add Manual"** di halaman Models
2. **Isi Model ID** (contoh: `fal-ai/flux-pro/v1.1`)
3. **Klik "Load Template"**
4. Pilih template yang sesuai (atau auto-detect jika Model ID cocok)
5. **Isi FAL Price** dan pricing configuration
6. **Review** Advanced Configuration yang sudah terisi
7. **Klik "Save Model"**

### Mengatur Model Custom

Jika model tidak ada di template:

1. **Isi Basic Information**: Model ID, Name, Provider, Description
2. **Pilih Type & Category**
3. **Set Aspect Ratio Style** berdasarkan dokumentasi FAL.AI:
   - Cek di https://fal.ai/models/[model-name]
   - Lihat parameter apa yang digunakan (`aspect_ratio`, `image_size`, atau `size`)
4. **Isi Custom Parameters** (jika ada):
   - Format: Valid JSON
   - Contoh lihat dokumentasi model
5. **Untuk Video Models**:
   - Isi Available Durations
   - Set Duration Format (String atau Number)
   - Set Price Per Second jika applicable
6. **Save Model**

---

## 📖 Referensi Model-Model Populer

### FLUX Models (Black Forest Labs)
```
Model ID: fal-ai/flux-pro, fal-ai/flux-pro/v1.1, fal-ai/flux-dev, etc.
Aspect Ratio Style: image_size
Parameters:
{
  "safety_tolerance": "2",
  "output_format": "jpeg"
}
Available Image Sizes:
- square_hd
- square
- landscape_16_9
- portrait_16_9
- landscape_4_3
- portrait_4_3
```

### Kling Models (Kuaishou)
```
Model ID: fal-ai/kling-video/*, fal-ai/kuaishou/kling-video/*
Aspect Ratio Style: aspect_ratio
Duration Format: string
Available Durations: "5", "10", "15"
Features: Image-to-Video
```

### Google Veo Models
```
Model ID: fal-ai/google/veo-3.1, fal-ai/google/veo-3, fal-ai/google/veo-2
Aspect Ratio Style: aspect_ratio
Duration Format: number
Available Durations: 4, 6, 8
```

### Imagen 4 (Google)
```
Model ID: fal-ai/imagen-4
Aspect Ratio Style: aspect_ratio
Features: Multiple images
Available Ratios: 1:1, 16:9, 9:16
```

### Ideogram v2
```
Model ID: fal-ai/ideogram-v2
Aspect Ratio Style: aspect_ratio
Parameters:
{
  "magic_prompt_option": "AUTO"
}
```

---

## 💡 Tips & Best Practices

### 1. **Selalu Cek Dokumentasi FAL.AI**
Sebelum menambahkan model baru:
- Kunjungi: https://fal.ai/models/[model-id]
- Baca parameter yang required
- Perhatikan format duration (string vs number)
- Cek apakah ada parameter khusus

### 2. **Gunakan Template Jika Tersedia**
Template sudah dikonfigurasi dengan benar berdasarkan dokumentasi resmi FAL.AI.

### 3. **Validasi JSON Custom Parameters**
- Pastikan JSON valid (gunakan validator online jika perlu)
- Test parameter di FAL.AI playground dulu
- Catat hasilnya di Custom Parameters

### 4. **Duration Configuration**
- **Kling, Runway**: Gunakan format String ("5", "10")
- **Veo, Sora**: Gunakan format Number (4, 6, 8)
- **Cek pricing**: Per-second atau flat rate?

### 5. **Aspect Ratio Naming**
- **FLUX**: `portrait_16_9` bukan `portrait_9_16` (smaller number first!)
- **Standard**: `9:16` untuk portrait, `16:9` untuk landscape
- **Size**: Always width x height (1024x1024)

---

## 🔍 Troubleshooting

### Error: "Invalid JSON in Custom Parameters"
**Solusi:**
- Copy JSON ke validator online (jsonlint.com)
- Pastikan:
  - Gunakan double quotes (`"`) bukan single quotes (`'`)
  - No trailing comma
  - Keys dan string values dalam quotes

**❌ Wrong:**
```json
{
  safety_tolerance: '2',
  output_format: 'jpeg',
}
```

**✅ Correct:**
```json
{
  "safety_tolerance": "2",
  "output_format": "jpeg"
}
```

### Model tidak bisa generate
**Cek:**
1. Aspect Ratio Style sudah benar?
2. Duration format sudah sesuai (string vs number)?
3. Custom parameters sesuai dokumentasi?
4. Cek console browser untuk error message

### Template tidak muncul
**Solusi:**
- Refresh halaman
- Clear browser cache
- Cek console untuk JavaScript errors

---

## 📝 Metadata Structure

Data disimpan di database dalam field `metadata` (JSONB):

```json
{
  "aspect_ratio_style": "image_size",
  "duration_format": "string",
  "supports_i2v": true,
  "supports_multi_image": false,
  "custom_parameters": {
    "safety_tolerance": "2",
    "output_format": "jpeg"
  },
  "custom_api_endpoint": ""
}
```

---

## 🎯 Contoh Kasus Nyata

### Case 1: Menambah Model FLUX Pro v1.1
```
1. Model ID: fal-ai/flux-pro/v1.1
2. Name: FLUX Pro v1.1
3. Click "Load Template" → Auto-detect FLUX Pro
4. FAL Price: $0.055
5. Review:
   - Aspect Ratio Style: image_size ✓
   - Custom Parameters: 
     {
       "safety_tolerance": "2",
       "output_format": "jpeg"
     }
6. Save Model ✓
```

### Case 2: Menambah Kling Video 1.6 Pro
```
1. Model ID: fal-ai/kling-video/v1.6/pro
2. Click "Load Template" → Select "Kling Video Pro"
3. Duration Config:
   - Available Durations: 5,10,15
   - Price Per Second: $0.0120
   - Duration Format: String
4. Advanced:
   - Aspect Ratio Style: aspect_ratio
   - Supports I2V: ✓ (checked)
5. Save Model ✓
```

---

## 📊 Database Schema

```sql
-- ai_models table
metadata JSONB
  ├── aspect_ratio_style: string (aspect_ratio | image_size | size)
  ├── duration_format: string (number | string)
  ├── supports_i2v: boolean
  ├── supports_multi_image: boolean
  ├── custom_parameters: object
  └── custom_api_endpoint: string

available_durations JSONB
  └── ["5", "10", "15"] or [4, 6, 8]

price_per_second NUMERIC(10, 4)
```

---

## 🔗 Links

- **FAL.AI Models**: https://fal.ai/models
- **FAL.AI Docs**: https://fal.ai/docs
- **JSON Validator**: https://jsonlint.com
- **Admin Panel**: http://localhost:5005/admin/models

---

**Last Updated:** October 29, 2025  
**Maintained by:** PixelNest Team

