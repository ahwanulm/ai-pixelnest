# 🪄 Cara Setup & Menggunakan Auto Prompt Enhancement

## 📋 Ringkasan
Fitur Auto Prompt Enhancement menggunakan Groq AI untuk menyempurnakan prompt Anda secara otomatis, menghasilkan gambar/video/audio yang lebih berkualitas dengan detail yang lebih lengkap.

---

## 🔧 Setup Admin (Sekali Saja)

### Langkah 1: Dapatkan Groq API Key (GRATIS!)

1. **Buka** [https://console.groq.com](https://console.groq.com)
2. **Sign up** dengan email (gratis, tidak perlu kartu kredit)
3. **Login** ke Groq Console
4. **Klik** "API Keys" di sidebar
5. **Klik** "Create API Key"
6. **Beri nama** (contoh: "PixelNest Auto Prompt")
7. **Copy** API key (dimulai dengan `gsk_...`)

> ⚠️ **PENTING:** Simpan API key ini, tidak akan ditampilkan lagi!

### Langkah 2: Konfigurasi di PixelNest Admin

1. **Login** sebagai Admin ke PixelNest
2. **Buka** menu **Admin → API Configs**
3. **Klik** tombol "**Add New API Config**"
4. **Isi form:**
   ```
   Service Name: GROQ (AI Prompt Enhancement)
   API Key: gsk_xxxxxxxxxxxxxx (paste dari step 1)
   Default Model: llama-3.3-70b-versatile (biarkan default)
   Endpoint URL: https://api.groq.com/openai/v1 (biarkan default)
   ✅ Enable this API service (pastikan tercentang)
   ```
5. **Klik** "**Add Configuration**"
6. **Done!** ✅

---

## 🎨 Cara Menggunakan (User)

### Step-by-Step

1. **Buka Dashboard** PixelNest
2. **Pilih mode:**
   - Image Generation
   - Video Generation
   - Audio Generation

3. **Aktifkan Auto Prompt** (toggle akan muncul di atas kolom prompt):
   
   ```
   🪄 Auto Prompt Enhancement [ON/OFF]
   Automatically enhance your prompts for better results
   ```

4. **Ketik prompt sederhana**, contoh:
   ```
   "a beautiful sunset"
   ```

5. Prompt akan **otomatis di-enhance** menjadi:
   ```
   "A breathtaking sunset over a tranquil ocean, with vibrant 
   shades of orange, pink, and purple painting the sky. Wispy 
   clouds catching the golden light, creating a dramatic contrast 
   against the deepening blue. Sun rays piercing through scattered 
   clouds, casting a shimmering path across calm waters. 
   Professional photography, HDR, cinematic composition, 
   ultra-realistic details, 8K quality"
   ```

6. **Klik "Generate"** atau **"Run"**

7. Card generation akan menampilkan badge:
   ```
   ✨ Auto-Enhanced Prompt
   ```

8. **Hasil lebih berkualitas!** 🎉

---

## 🎯 Kapan Toggle Muncul?

### ✅ Toggle MUNCUL jika:
- Groq API sudah dikonfigurasi di admin
- Model memerlukan prompt (text-to-image, text-to-video, dll)
- Service Groq dalam keadaan aktif

### ❌ Toggle TIDAK MUNCUL jika:
- Groq API belum dikonfigurasi
- Model tidak memerlukan prompt (upscaler, remove background, dll)
- Service Groq tidak aktif/error

### Model yang TIDAK perlu prompt (auto-hide):
- Image Upscaler
- Background Remover
- Face to Sticker
- Dan model sejenis lainnya

---

## 💡 Tips & Trik

### 1. **Prompt Sederhana? No Problem!**
   ```
   Tanpa Auto Prompt: "cat in space"
   
   Dengan Auto Prompt: "A majestic orange tabby cat floating 
   gracefully in the cosmic void of deep space, surrounded by 
   twinkling stars and distant nebulae. The cat wears a reflective 
   astronaut helmet with a gentle blue glow illuminating its curious 
   face. Photorealistic style, cinematic lighting, ultra-detailed 
   fur texture, 8K quality, NASA-inspired composition, 
   awe-inspiring atmosphere"
   ```

### 2. **Masih Bisa Edit Manual**
   - Setelah di-enhance, Anda masih bisa edit prompt sebelum generate
   - Cocok untuk fine-tuning hasil enhancement

### 3. **Hemat Credits**
   - Prompt yang detail = hasil lebih baik
   - Hasil lebih baik = less retries
   - Less retries = hemat credits!

### 4. **Experiment!**
   - Coba generate dengan/tanpa auto-prompt
   - Bandingkan hasilnya
   - Pilih yang terbaik untuk kebutuhan Anda

---

## 🔄 Alur Kerja

```
1. User ketik prompt sederhana
   ↓
2. Toggle Auto Prompt ON
   ↓
3. AI (Groq) enhance prompt
   ↓ (animasi smooth, glow effect)
4. Prompt jadi detail & descriptive
   ↓
5. User klik Generate
   ↓
6. Loading card tampilkan badge "Auto-Enhanced Prompt"
   ↓
7. Hasil generation lebih berkualitas!
```

---

## ❓ FAQ

### Q: Apakah gratis?
**A:** Ya! Groq menyediakan free tier yang sangat generous. Cocok untuk personal use dan testing.

### Q: Berapa lama proses enhancement?
**A:** Sangat cepat! Biasanya 1-3 detik. Groq terkenal dengan inference speed yang sangat cepat.

### Q: Apakah harus selalu aktif?
**A:** Tidak. Anda bisa toggle ON/OFF kapan saja. Settings tersimpan per mode (image/video/audio).

### Q: Bisa pakai dalam Bahasa Indonesia?
**A:** Saat ini enhancement dalam Bahasa Inggris untuk hasil optimal. Support bahasa Indonesia bisa ditambahkan nanti.

### Q: Prompt saya sudah bagus, masih perlu auto-prompt?
**A:** Jika prompt Anda sudah detail dan descriptive, auto-prompt optional. Tapi tidak ada salahnya dicoba untuk perbandingan!

### Q: Kenapa toggle tidak muncul?
**A:** Pastikan:
   - Groq API sudah configured di Admin
   - Service Groq dalam status "Active"
   - Model yang dipilih memerlukan prompt
   - Refresh browser jika perlu

---

## 🎨 Contoh Sebelum vs Sesudah

### Image Generation

**Sebelum (tanpa auto-prompt):**
```
"forest at night"
```

**Sesudah (dengan auto-prompt):**
```
"An enchanted mystical forest at midnight, illuminated by ethereal moonlight 
filtering through dense canopy of ancient trees. Bioluminescent mushrooms 
glowing softly along the forest floor, creating a magical blue-green ambiance. 
Wisps of mist swirling between massive tree trunks, fireflies dancing in the air. 
Fantasy atmosphere, professional digital art, highly detailed foliage, 
dramatic lighting with god rays, cinematic composition, 4K quality"
```

### Video Generation

**Sebelum:**
```
"car racing"
```

**Sesudah:**
```
"High-speed racing car tearing down a professional circuit track at sunset, 
camera following from dramatic low angle. Tire smoke trailing behind, 
motion blur on background spectators, vibrant sponsor livery catching 
golden hour light. Dynamic camera movement with smooth tracking, 
cinematic color grading, 4K quality, fast-paced action, adrenaline-inducing 
atmosphere, professional motorsport cinematography"
```

### Audio/Music Generation

**Sebelum:**
```
"relaxing music"
```

**Sesudah:**
```
"Peaceful ambient meditation music featuring gentle piano melodies 
layered over warm string pads and subtle nature sounds. Slow tempo 
around 60 BPM, reverb-rich production creating spacious atmosphere. 
Soft rain and distant thunder in background, occasional wind chimes. 
Relaxing and calming mood perfect for meditation, yoga, or sleep. 
Professional studio quality, 3-minute duration, seamless loop-ready"
```

---

## 🛠️ Troubleshooting

### Problem: Toggle tidak muncul
**Solusi:**
1. Check di Admin → API Configs apakah Groq sudah configured
2. Pastikan status "Active" (hijau)
3. Refresh halaman dashboard
4. Clear browser cache jika perlu

### Problem: Enhancement failed
**Solusi:**
1. Check koneksi internet
2. Verify Groq API key masih valid
3. Cek apakah prompt terlalu panjang (max 1000 karakter)
4. Coba lagi beberapa saat (mungkin API sedang sibuk)

### Problem: Hasil enhancement tidak sesuai
**Solusi:**
1. Coba edit manual hasil enhancement
2. Atau disable auto-prompt dan tulis prompt manual
3. Berikan feedback ke admin untuk improvement

---

## 📊 Model Groq yang Tersedia

Di halaman Admin API Configs, Anda bisa pilih model:

1. **Llama 3.3 70B Versatile** ⭐ (Default - Recommended)
   - Kualitas terbaik
   - Balanced antara speed & quality
   - Paling cocok untuk prompt enhancement

2. **Llama 3.1 8B Instant** ⚡
   - Paling cepat
   - Good untuk quick enhancement
   - Cocok jika prioritas kecepatan

3. **Mixtral 8x7B 32768**
   - Context window besar
   - Bagus untuk prompt yang panjang

4. **Gemma 2 9B**
   - Lightweight
   - Fast inference
   - Good balance

> 💡 **Rekomendasi:** Pakai Llama 3.3 70B untuk hasil terbaik

---

## 🎉 Keuntungan Auto Prompt

### Untuk User:
- ✨ Tidak perlu mikir prompt panjang
- 🎨 Hasil generation lebih berkualitas
- ⚡ Hemat waktu
- 🎯 Output lebih sesuai ekspektasi
- 💰 Hemat credits (less retries)

### Untuk Admin:
- 🔧 Mudah setup (hanya 5 menit)
- 💵 Gratis (Groq free tier)
- 🚀 Fast (Groq inference sangat cepat)
- 📊 Full control (enable/disable kapan saja)

---

## 📞 Butuh Bantuan?

Jika ada kendala:
1. Check dokumentasi lengkap: `AUTO_PROMPT_FEATURE.md`
2. Verify setup di Admin → API Configs
3. Check browser console untuk error messages
4. Contact admin sistem

---

**Happy Creating! 🎨🎬🎵**

_Dengan Auto Prompt Enhancement, ide sederhana bisa jadi karya luar biasa!_

---

Last Updated: October 29, 2025

