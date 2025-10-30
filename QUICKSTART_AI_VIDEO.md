# 🎬 Quick Start - PixelNest AI Video Platform

## 🚀 Start dalam 3 Menit!

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Setup Database
```bash
# Buat .env file
cat > .env << 'EOF'
PORT=5005
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pixelnest_db
DB_USER=$(whoami)
DB_PASSWORD=
SESSION_SECRET=pixelnest-secret-change-later
EOF

# Buat database
createdb pixelnest_db

# Initialize database
npm run init-db
```

### Step 3: Build CSS & Start Server
```bash
# Build Tailwind CSS
npm run build:css

# Start development server
npm run dev
```

### Step 4: Open Browser
```
http://localhost:5005
```

---

## 🎨 What You'll See

### 🌟 Ultra Modern Design
- **Holographic Rainbow Gradients** - Shifting colors otomatis
- **Cinematic Scan Lines** - Film-inspired effects
- **Video Grid Background** - Animated timeline grid
- **Film Strip Borders** - Cinema perforation effects
- **Pulse Play Buttons** - Attention-grabbing animations
- **Glass Morphism** - Premium frosted glass effects

### 🎬 AI Video Features Showcase
- Text-to-Video generation
- AI Voice Over dengan 50+ voices
- Smart Auto-Edit tanpa skill
- Unlimited Stock library
- 4K Export quality
- Team Collaboration tools

---

## 📁 Key Files

```
├── public/css/
│   ├── input.css      ← Edit custom styles di sini
│   └── output.css     ← Auto-generated dari Tailwind
│
├── src/views/
│   ├── index.ejs      ← Homepage dengan cinematic hero
│   ├── pricing.ejs    ← Pricing dengan FAQ
│   ├── contact.ejs    ← Contact form
│   └── services.ejs   ← Services grid
│
└── tailwind.config.js ← Tailwind customization
```

---

## 🎯 Unique Features

### 1. **Holographic Text**
```html
<span class="gradient-text-rainbow">
  AI Magic
</span>
```

### 2. **Video Frame Effect**
```html
<div class="video-frame film-strip">
  <!-- Video content -->
</div>
```

### 3. **Play Button Pulse**
```html
<button class="play-button">
  <svg>...</svg>
</button>
```

### 4. **Cinematic Background**
```html
<section class="video-grid-bg">
  <div class="scan-lines"></div>
  <!-- Content -->
</section>
```

---

## 🔧 Development Commands

```bash
# Watch CSS changes (auto-rebuild)
npm run watch:css

# Build CSS untuk production
npm run build:css

# Start server only
npm start

# Start with auto-restart
npm run dev
```

---

## 🎨 Color Codes

```css
/* Brand Colors */
Violet:  #a855f7
Purple:  #9333ea
Fuchsia: #ec4899
Pink:    #ec4899
Blue:    #3b82f6
Green:   #10b981
Orange:  #f59e0b

/* Backgrounds */
Black:   #000000
Glass:   rgba(255,255,255,0.05)
Glow:    rgba(168,85,247,0.3)
```

---

## 📱 Responsive Breakpoints

```
sm:  640px  - Mobile
md:  768px  - Tablet
lg:  1024px - Desktop
xl:  1280px - Large Desktop
2xl: 1536px - Extra Large
```

---

## 🎬 Video-Themed Elements

- **▶️ Play Icons** - Throughout the design
- **🎬 Film Strips** - Border effects
- **📹 Grid Background** - Timeline aesthetic
- **🎥 Scan Lines** - VHS/Cinema effect
- **🌈 Rainbow Gradients** - Holographic text
- **💫 Pulse Animations** - Attention-grabbing

---

## 🚀 Ready to Customize?

### Change Colors
Edit `tailwind.config.js`:
```javascript
theme: {
  extend: {
    colors: {
      'brand': '#your-color',
    }
  }
}
```

### Add Animations
Edit `public/css/input.css`:
```css
@keyframes your-animation {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}
```

### Update Content
Edit `src/views/index.ejs` dan templates lainnya.

---

## 💡 Tips

1. **Use Rainbow Gradient** untuk emphasis pada hero titles
2. **Add Film Strip** borders pada video/image containers
3. **Use Play Button Pulse** untuk CTAs
4. **Apply Video Grid** background pada hero sections
5. **Add Scan Lines** overlay untuk cinematic feel

---

## ❓ Troubleshooting

### CSS tidak update?
```bash
rm public/css/output.css
npm run build:css
```

### Database connection error?
```bash
# Check PostgreSQL running
brew services list

# Restart PostgreSQL
brew services restart postgresql@14
```

### Port sudah digunakan?
Edit `.env`:
```
PORT=8080
```

---

## 📚 Documentation

- `README_TAILWIND.md` - Tailwind usage guide
- `AI_VIDEO_THEME.md` - Design theme documentation
- `DEPLOYMENT_GUIDE.md` - Production deployment
- `DATABASE_SETUP.md` - Database configuration

---

**Selamat! Website AI Video Generation Anda sudah ready! 🎬✨**

*Built with cutting-edge Tailwind CSS and modern web technologies*

