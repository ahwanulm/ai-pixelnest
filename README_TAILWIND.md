# 🎨 PixelNest v2.0 - Tailwind CSS Edition

## 🌟 What's New?

Website PixelNest telah di-transform dengan **Tailwind CSS** untuk memberikan:

### ✨ Modern Dark Theme
- **Pure Black Background** (#000000) dengan efek particle
- **Glassmorphism Effects** (frosted glass blur)
- **Gradient Text** dengan animasi smooth
- **Neon Glow Effects** pada cards dan buttons
- **Smooth Animations** (float, fade, slide, scale)

### 🎯 Design Features
- 💫 **Animated Backgrounds** dengan particle effects
- 🌈 **Dynamic Gradients** (Violet → Purple → Fuchsia)
- ✨ **Glass Cards** dengan backdrop blur
- 🎭 **Hover Effects** yang smooth dan modern
- 📱 **Fully Responsive** - mobile-first approach

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Build Tailwind CSS
```bash
npm run build:css
```

### 3. Start Development
```bash
npm run dev
```

Buka browser: **http://localhost:5005**

---

## 📁 Struktur Project

```
PIXELNEST/
├── public/
│   └── css/
│       ├── input.css       ← Edit custom styles di sini
│       └── output.css      ← Generated (jangan edit)
│
├── src/
│   └── views/              ← EJS templates dengan Tailwind classes
│       ├── partials/
│       │   ├── header.ejs  ← Glass navigation
│       │   └── footer.ejs  ← Modern footer
│       ├── index.ejs       ← Homepage dengan hero section
│       ├── pricing.ejs     ← Pricing dengan FAQ accordion
│       ├── contact.ejs     ← Contact form
│       └── services.ejs    ← Services grid
│
├── tailwind.config.js      ← Tailwind configuration
└── postcss.config.js       ← PostCSS config
```

---

## 🎨 Custom Tailwind Classes

### Glass Effects
```html
<!-- Light glass effect -->
<div class="glass">
  Content dengan frosted glass effect
</div>

<!-- Strong glass effect -->
<div class="glass-strong">
  Glass effect yang lebih strong
</div>
```

### Gradient Text
```html
<!-- Purple gradient -->
<h1 class="gradient-text">
  Purple Gradient Text
</h1>

<!-- Blue gradient -->
<h1 class="gradient-text-blue">
  Blue Gradient Text
</h1>
```

### Buttons
```html
<!-- Primary gradient button dengan shimmer effect -->
<button class="btn-primary">
  Click Me
</button>

<!-- Secondary glass button -->
<button class="btn-secondary">
  Secondary
</button>

<!-- Outline button -->
<button class="btn-outline">
  Outline
</button>
```

### Cards
```html
<!-- Basic card dengan hover effect -->
<div class="card">
  Card content
</div>

<!-- Card dengan glow effect on hover -->
<div class="card card-hover-glow">
  Glowing card
</div>

<!-- Card dengan animated border -->
<div class="card animated-border">
  Animated border card
</div>
```

### Input Fields
```html
<input type="text" class="input-field" placeholder="Email...">
<textarea class="input-field" rows="5"></textarea>
```

---

## 🎭 Animations

### Built-in Animations
```html
<div class="animate-float">      <!-- Floating up/down -->
<div class="animate-fade-in">    <!-- Fade in -->
<div class="animate-slide-up">   <!-- Slide from bottom -->
<div class="animate-slide-down"> <!-- Slide from top -->
<div class="animate-scale-in">   <!-- Scale from small -->
<div class="animate-pulse-slow"> <!-- Slow pulse -->
<div class="animate-bounce-slow"><!-- Slow bounce -->
```

### Custom Delays
```html
<div class="animate-slide-up" style="animation-delay: 0.1s;">
  <!-- Delayed animation -->
</div>
```

---

## 🌈 Background Effects

### Gradient Background
```html
<div class="gradient-bg">
  Animated gradient background
</div>
```

### Particle Background
```html
<section class="particle-bg">
  Section dengan particle effect
</section>
```

---

## 🎯 Color Palette

### Primary Colors
```css
Violet: #a855f7  (violet-500)
Purple: #9333ea  (purple-600)
Fuchsia: #d946ef (fuchsia-500)
```

### Dark Colors
```css
Background: #000000 (black)
Surface: rgba(255,255,255,0.05) (glass)
Text: #ffffff (white)
Secondary Text: #cbd5e1 (gray-300)
Muted Text: #94a3b8 (gray-400)
```

### Accent Colors
```css
Green: #10b981 (success)
Blue: #0ea5e9 (info)
Red: #ef4444 (error)
```

---

## 📱 Responsive Design

### Breakpoints
```
sm:  640px  - Small devices
md:  768px  - Medium devices (tablets)
lg:  1024px - Large devices (desktops)
xl:  1280px - Extra large devices
2xl: 1536px - 2X Extra large devices
```

### Usage
```html
<!-- Responsive text size -->
<h1 class="text-4xl md:text-6xl lg:text-8xl">
  Responsive Heading
</h1>

<!-- Responsive grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <!-- Grid items -->
</div>

<!-- Responsive padding -->
<div class="py-10 md:py-16 lg:py-20">
  Content
</div>
```

---

## 🛠️ Development Commands

### CSS Building
```bash
# Build CSS untuk production (minified)
npm run build:css

# Watch mode (auto-rebuild on changes)
npm run watch:css

# Development dengan server + CSS watch
npm run dev
```

### Server Commands
```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start

# Initialize database
npm run init-db
```

---

## 🎨 Customization Guide

### 1. Mengubah Warna
Edit `tailwind.config.js`:
```javascript
theme: {
  extend: {
    colors: {
      primary: {
        500: '#your-color',
      },
    },
  },
}
```

### 2. Menambah Custom Animation
Edit `tailwind.config.js`:
```javascript
theme: {
  extend: {
    animation: {
      'custom': 'custom-anim 1s ease-in-out infinite',
    },
    keyframes: {
      'custom-anim': {
        '0%, 100%': { transform: 'scale(1)' },
        '50%': { transform: 'scale(1.1)' },
      },
    },
  },
}
```

### 3. Menambah Custom Class
Edit `public/css/input.css`:
```css
@layer components {
  .my-custom-class {
    @apply bg-violet-600 text-white px-4 py-2 rounded-lg;
  }
}
```

Kemudian rebuild:
```bash
npm run build:css
```

---

## 🎯 Component Examples

### Hero Section
```html
<section class="relative min-h-screen flex items-center justify-center particle-bg">
  <div class="max-w-5xl mx-auto text-center">
    <h1 class="text-7xl font-black gradient-text mb-6">
      Your Amazing Title
    </h1>
    <p class="text-xl text-gray-400 mb-8">
      Your subtitle here
    </p>
    <button class="btn-primary">
      Get Started
    </button>
  </div>
</section>
```

### Card Grid
```html
<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
  <div class="card card-hover-glow">
    <div class="text-5xl mb-4">🚀</div>
    <h3 class="text-2xl font-bold mb-3">Feature Title</h3>
    <p class="text-gray-400">Feature description</p>
  </div>
  <!-- More cards -->
</div>
```

### Form
```html
<form class="space-y-6">
  <div>
    <label class="block text-sm font-semibold mb-2">Email</label>
    <input type="email" class="input-field" placeholder="email@example.com">
  </div>
  <button type="submit" class="btn-primary w-full">
    Submit
  </button>
</form>
```

---

## 🚀 Performance Tips

### 1. Production Build
```bash
npm run build:css
```
Output CSS akan di-minify dan di-purge (unused classes dihapus).

### 2. Lazy Load Images
```html
<img src="image.jpg" loading="lazy" alt="Description">
```

### 3. Use Appropriate Image Formats
- WebP untuk photos
- SVG untuk icons
- PNG untuk screenshots

---

## ❓ Troubleshooting

### CSS tidak berubah?
```bash
# Clear cache dan rebuild
rm public/css/output.css
npm run build:css
```

### Tailwind classes tidak work?
1. Pastikan file ada di `content` array di `tailwind.config.js`
2. Rebuild CSS: `npm run build:css`
3. Hard refresh browser (Cmd+Shift+R)

### npm run dev error?
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Resources

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Tailwind Components](https://tailwindcomponents.com/)
- [Headless UI](https://headlessui.com/) - Unstyled components
- [Hero Icons](https://heroicons.com/) - SVG icons

---

## 🎉 What's Different from v1.0?

| Feature | v1.0 (Custom CSS) | v2.0 (Tailwind) |
|---------|-------------------|-----------------|
| Lines of CSS | 1400+ | 200+ (custom) |
| Bundle Size | ~150KB | ~50KB (purged) |
| Maintenance | Hard | Easy |
| Customization | Manual CSS | Utility classes |
| Responsive | Limited | Full support |
| Dark Mode | Manual | Built-in |
| Animations | Custom keyframes | Tailwind utilities |
| Consistency | Manual | Automatic |

---

## 🌟 Key Improvements

### Before (v1.0)
- ❌ Custom CSS dengan 1400+ lines
- ❌ Sulit maintain dan customize
- ❌ Inconsistent spacing dan colors
- ❌ Limited responsive support
- ❌ Manual dark mode implementation

### After (v2.0)
- ✅ Tailwind utility-first approach
- ✅ Easy customization via config
- ✅ Consistent design system
- ✅ Fully responsive out-of-the-box
- ✅ Built-in dark mode support
- ✅ Smaller bundle size (after purge)
- ✅ Modern glassmorphism effects
- ✅ Smooth animations
- ✅ Better performance

---

## 🎯 Next Steps

1. **Customize Colors**: Edit `tailwind.config.js` untuk warna brand
2. **Add Content**: Update EJS templates dengan konten real
3. **Add Images**: Place images di `public/images/`
4. **Deploy**: Ready untuk production deployment!

---

**Enjoy your modern Tailwind-powered website! 🚀✨**

*Made with ❤️ using Tailwind CSS*

