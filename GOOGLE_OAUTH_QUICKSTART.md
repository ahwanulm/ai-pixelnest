# 🚀 Quick Start: Google OAuth via Admin Panel

## ✅ Sudah Selesai!

Google OAuth sekarang bisa dikonfigurasi langsung dari Admin Panel tanpa perlu edit file `.env`!

## 🎯 Cara Menggunakan

### 1. Akses Admin Panel
```
http://localhost:5005/admin
```

### 2. Buka API Configuration
- Klik menu "API Configuration" di sidebar
- Cari card "GOOGLE_OAUTH"

### 3. Klik "Configure"
Form akan menampilkan 3 field khusus untuk Google OAuth:
- **Google Client ID**: Client ID dari Google Cloud Console
- **Google Client Secret**: Client Secret dari Google Cloud Console  
- **Callback URL**: URL redirect (default: `http://localhost:5005/auth/google/callback`)

### 4. Dapatkan Credentials dari Google

#### Langkah Singkat:
1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Buat project baru atau pilih yang sudah ada
3. Enable **Google+ API**
4. Buat **OAuth 2.0 Client ID**:
   - Type: Web application
   - Authorized redirect URIs: `http://localhost:5005/auth/google/callback`
5. Copy **Client ID** dan **Client Secret**

### 5. Masukkan Credentials
- Paste Client ID ke form
- Paste Client Secret ke form
- Pastikan Callback URL benar
- ✅ Centang "Enable this API service"
- Klik **Save Configuration**

### 6. Restart Server
```bash
npm run dev
```

## 🔍 Cek Status

Setelah save, halaman akan reload dan card Google OAuth akan menampilkan:
- ✅ **Badge "Active"** (hijau) = Google OAuth siap digunakan
- Client ID yang ter-truncate (untuk keamanan)
- Callback URL

## 🛠️ Update Credentials

Untuk update credentials (misalnya ganti ke production):
1. Klik "Configure" lagi pada card Google OAuth
2. Update Client ID, Secret, atau Callback URL
3. Save
4. Restart server

**Tips**: Kosongkan field Client Secret jika tidak ingin mengubahnya.

## 📦 Import dari .env (Opsional)

Jika sudah ada credentials di `.env`:

```env
GOOGLE_CLIENT_ID=your-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-secret-here
GOOGLE_CALLBACK_URL=http://localhost:5005/auth/google/callback
```

Jalankan:
```bash
npm run init-admin
```

Credentials akan otomatis ter-import ke database!

## 🎨 Fitur Lain

### Toggle Enable/Disable
- Klik button "Disable" untuk matikan Google OAuth tanpa hapus credentials
- Klik "Enable" untuk nyalakan kembali
- Tidak perlu restart server untuk toggle on/off

### API Lainnya
Halaman yang sama juga bisa configure:
- **FAL_AI**: AI image generation
- **OPENAI**: GPT & DALL-E
- **REPLICATE**: ML models

## 🔐 Keamanan

- ✅ Hanya admin yang bisa akses
- ✅ Client Secret disembunyikan (`••••••••`)
- ✅ Semua perubahan dicatat di Activity Logs
- ✅ Form menggunakan password input untuk Client Secret

## ❓ Troubleshooting

### "Google OAuth not configured" di console
**Solusi**: Pastikan di Admin Panel, Google OAuth:
- Badge statusnya **Active** (hijau)
- Client ID & Secret sudah terisi
- Restart server

### "redirect_uri_mismatch" saat login
**Solusi**: 
1. Copy exact Callback URL dari Admin Panel
2. Paste ke Google Cloud Console → Credentials → Authorized redirect URIs
3. Save dan tunggu 1-2 menit

### Perubahan tidak apply
**Solusi**: Restart server dengan:
```bash
# Stop server (Ctrl+C)
npm run dev
```

## 📚 Dokumentasi Lengkap

Untuk dokumentasi lengkap, lihat: **GOOGLE_OAUTH_ADMIN_CONFIG.md**

## 🎉 Selesai!

Sekarang Google OAuth bisa dikonfigurasi dengan mudah tanpa edit code! 🚀

---

**Developer**: PixelNest AI Team  
**Last Updated**: October 2025

