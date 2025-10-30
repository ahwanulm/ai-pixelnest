# 🚀 Blog Quick Start - PixelNest

## Install 7 Artikel Blog (5 Menit)

### Option 1: Via psql (Recommended)

```bash
cd /Users/ahwanulm/Desktop/PROJECT/PIXELNEST
psql -U postgres -d pixelnest_db -f migrations/insert-blog-articles.sql
```

### Option 2: Via Node.js

```bash
node -e "const {query} = require('./src/config/database'); const fs = require('fs'); const sql = fs.readFileSync('./migrations/insert-blog-articles.sql', 'utf8'); query(sql).then(() => console.log('✅ 7 articles inserted!')).catch(console.error);"
```

### Verify Installation

```bash
psql -U postgres -d pixelnest_db -c "SELECT id, title, category FROM blog_posts;"
```

Expected: 7 rows

---

## Access Blog

### URLs:
- **Blog List:** http://localhost:3000/blog
- **Single Article:** http://localhost:3000/blog/[slug]

### Example:
```
http://localhost:3000/blog/panduan-pemula-membuat-video-ai-pertama
http://localhost:3000/blog/15-prompt-hacks-video-ai-lebih-baik
```

---

## 7 Artikel yang Tersedia

1. **Strategi Content Marketing** - 7 strategi efektif untuk bisnis
2. **Teknologi AI Video** - Deep dive ke teknologi di balik AI
3. **10 Fakta Mengejutkan** - Fakta menarik tentang AI video 2025
4. **Tutorial Pemula** - Panduan 5 menit membuat video pertama
5. **Tren 2025** - 5 prediksi yang akan mengubah industri
6. **Case Study UMKM** - Brand lokal yang sukses 400%
7. **15 Prompt Hacks** - Tips pro untuk hasil maksimal

---

## Troubleshooting

### Error: "relation blog_posts does not exist"

Buat table dulu:

```sql
CREATE TABLE blog_posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    category VARCHAR(100),
    author VARCHAR(100),
    tags TEXT,
    is_published BOOLEAN DEFAULT false,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Articles not showing?

Check `is_published` status:

```sql
UPDATE blog_posts SET is_published = true WHERE is_published = false;
```

---

## ✅ Done!

Blog system sekarang siap dengan:
- ✨ 7 artikel SEO berbahasa Indonesia
- 🎨 Design modern & responsive  
- 📱 Mobile-friendly
- 🚀 Production-ready

**Enjoy!** 🎉

