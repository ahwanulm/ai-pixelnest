# 🎨 Tailwind CSS Setup Guide - PixelNest

## 🚀 Quick Setup (5 Minutes)

### Step 1: Install Dependencies

```bash
cd /Users/ahwanulm/Desktop/PROJECT/PIXELNEST

npm install
```

Ini akan menginstall:
- `tailwindcss` - CSS framework
- `autoprefixer` - CSS vendor prefixes
- `postcss` - CSS processor
- `concurrently` - Menjalankan multiple scripts
- Tailwind plugins: `@tailwindcss/forms` dan `@tailwindcss/typography`

### Step 2: Build Tailwind CSS

```bash
npm run build:css
```

Ini akan generate file `public/css/output.css` dari `public/css/input.css`

### Step 3: Start Development Server

```bash
npm run dev
```

Ini akan:
- ✅ Start Node.js server dengan nodemon
- ✅ Watch Tailwind CSS untuk perubahan (auto-compile)
- ✅ Hot reload saat ada perubahan

### Step 4: Open Browser

```
http://localhost:5005
```

## 🎨 Tema Dark Modern

Website sekarang menggunakan:

### Color Palette
- **Background**: Pure Black (`#000000`)
- **Glass Effects**: White dengan opacity rendah + blur
- **Primary Gradient**: Violet → Purple → Fuchsia
- **Text**: White untuk heading, Gray untuk body
- **Accents**: Neon Green, Bright Purple

### Design Features
- ✨ **Glassmorphism**: Background blur effects
- 🌈 **Gradient Text**: Animated gradient pada headings
- 💫 **Smooth Animations**: Float, fade, slide effects
- 🎯 **Glow Effects**: Shadow dengan warna neon
- 📱 **Fully Responsive**: Mobile-first design

## 📁 File Structure

```
public/css/
├── input.css          # Tailwind source (edit this)
└── output.css         # Compiled CSS (auto-generated)

tailwind.config.js     # Tailwind configuration
postcss.config.js      # PostCSS configuration
```

## 🛠️ Development Workflow

### Editing Styles

1. **Edit `public/css/input.css`** untuk custom styles
2. **Edit `tailwind.config.js`** untuk theme customization
3. **Edit EJS templates** untuk menggunakan Tailwind classes

### Build Commands

```bash
# Development (watch mode)
npm run dev

# Production build (minified)
npm run build:css

# Only watch CSS (tanpa server)
npm run watch:css
```

## 🎨 Custom Classes Available

### Glass Effects
```html
<div class="glass">           <!-- Light glass -->
<div class="glass-strong">    <!-- Strong glass -->
```

### Gradient Text
```html
<span class="gradient-text">      <!-- Purple gradient -->
<span class="gradient-text-blue"> <!-- Blue gradient -->
```

### Buttons
```html
<button class="btn-primary">   <!-- Primary gradient button -->
<button class="btn-secondary"> <!-- Glass button -->
<button class="btn-outline">   <!-- Outline button -->
```

### Cards
```html
<div class="card">                  <!-- Basic card -->
<div class="card card-hover-glow">  <!-- Card with glow on hover -->
```

### Inputs
```html
<input class="input-field">  <!-- Styled input -->
```

## 🎯 Custom Animations

```html
<div class="animate-float">      <!-- Floating animation -->
<div class="animate-fade-in">    <!-- Fade in -->
<div class="animate-slide-up">   <!-- Slide up -->
<div class="animate-pulse-slow"> <!-- Slow pulse -->
```

## 🌈 Gradient Backgrounds

```html
<div class="gradient-bg">        <!-- Animated gradient -->
<div class="particle-bg">        <!-- Particle effect background -->
```

## 📱 Responsive Design

Tailwind breakpoints:
- `sm:` - 640px+
- `md:` - 768px+
- `lg:` - 1024px+
- `xl:` - 1280px+
- `2xl:` - 1536px+

Example:
```html
<div class="text-2xl md:text-4xl lg:text-6xl">
    <!-- Responsive text size -->
</div>
```

## 🎨 Customizing Theme

Edit `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      // Add your custom colors
      'brand': '#your-color',
    },
    animation: {
      // Add custom animations
      'custom': 'custom-animation 1s ease',
    }
  }
}
```

## 🔥 Production Build

```bash
# Build minified CSS
npm run build:css

# Start production server
npm start
```

## ❓ Troubleshooting

### CSS tidak update?
```bash
# Restart watch
npm run watch:css
```

### File output.css tidak ada?
```bash
# Manual build
npx tailwindcss -i ./public/css/input.css -o ./public/css/output.css
```

### Tailwind classes tidak work?
1. Pastikan file EJS ada di `content` array di `tailwind.config.js`
2. Rebuild CSS: `npm run build:css`
3. Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+F5)

## 🌟 Key Improvements

### Before (Custom CSS)
- ❌ 1400+ lines CSS manual
- ❌ Hard to maintain
- ❌ Inconsistent spacing
- ❌ Limited responsiveness

### After (Tailwind CSS)
- ✅ Utility-first approach
- ✅ Easy to customize
- ✅ Consistent design system
- ✅ Fully responsive
- ✅ Smaller bundle size (production)
- ✅ Modern dark theme
- ✅ Glass morphism effects
- ✅ Smooth animations

## 📚 Tailwind Resources

- [Tailwind Docs](https://tailwindcss.com/docs)
- [Tailwind Play](https://play.tailwindcss.com/) - Online playground
- [Tailwind UI](https://tailwindui.com/) - Component examples

---

**Enjoy your modern dark theme! 🚀**

