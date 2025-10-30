# ⚡ Quick Start - Buat Deployment ZIP

## 🚀 Cara Cepat

```bash
npm run deploy:zip
```

Itu saja! File ZIP akan dibuat dengan nama `pixelnest-deployment-YYYYMMDD_HHMMSS.zip`

## 📦 Hasil

- ✅ Semua file production-ready sudah include
- ✅ Semua file ada di dalam folder `pixelnest/` (tidak ada di root archive)
- ✅ Auto-generate `.env.example`
- ✅ Include `DEPLOYMENT_README.md`
- ✅ Skip file yang tidak diperlukan (node_modules, logs, dll)
- ✅ Exclude user-generated content (videos, images, uploads - 177MB+)
- ✅ Hanya include static assets (CSS, JS, icons)

## 📁 Struktur ZIP

```
pixelnest-deployment-YYYYMMDD_HHMMSS.zip
└── pixelnest/
    ├── src/
    ├── public/
    ├── migrations/
    ├── scripts/
    ├── examples/
    ├── server.js
    ├── worker.js
    ├── package.json
    ├── .env.example
    ├── .gitignore
    └── DEPLOYMENT_README.md
```

## 🔧 Alternatif Lain

```bash
# Node.js script
node create-deployment-zip.js

# Shell script (Unix/Linux/Mac)
./create-deployment-zip.sh
```

## 📝 Dokumentasi Lengkap

Lihat `DEPLOYMENT_ZIP_GUIDE.md` untuk panduan lengkap.

