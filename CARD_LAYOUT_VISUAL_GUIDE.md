# 📐 Generation Card Layout - Visual Guide

## 🔄 Perubahan Layout

### **SEBELUM** (Vertical Layout)
```
Desktop & Mobile (sama):

┌──────────────────────────┐
│                          │
│    Generated Image       │
│      (Full Width)        │
│                          │
├──────────────────────────┤
│  1024×1024               │
│  26 Okt 2025, 10:30      │  ← Tanggal inline
└──────────────────────────┘
```

### **SESUDAH** (Responsive Layout)

#### 🖥️ **Desktop (≥768px)** - HORIZONTAL
```
┌───────────────────────────────────────────────────────────────────┐
│                                                                   │
│   ┌────────────┐     [📷 Image] 1024×1024                        │
│   │            │                                                   │
│   │   Image    │     Generated image with 1024×1024 resolution   │
│   │  Preview   │                                                   │
│   │  256×256   │     ───────────────────────────────────────────  │
│   │            │     🕐 26 Okt 2025, 10:30    💰 Credits used    │
│   └────────────┘                                                   │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
        ↑                              ↑
    Preview Kiri              Info + Date Kanan
```

#### 📱 **Mobile (<768px)** - VERTICAL
```
┌──────────────────────┐
│                      │
│   Image Preview      │
│    (Full Width)      │
│                      │
├──────────────────────┤
│ [📷 Image] 1024×1024 │
│                      │
│ ──────────────────── │  ← Separator
│ 🕐 26 Okt 2025       │  ← Tanggal terpisah
└──────────────────────┘
```

---

## 📊 Struktur Detail

### Desktop Card Structure
```
┌─ Card Container (max-w-6xl) ────────────────────────────────────┐
│ .bg-gradient-to-br.from-zinc-800/50.to-zinc-900/50              │
│ .border.border-white/10                                          │
│ .hover:border-violet-500/30                                      │
│                                                                  │
│  ┌─ Left: Preview (fixed width) ──┐  ┌─ Right: Content (flex-1) ─┐
│  │                                 │  │                            │
│  │  .w-64.h-64 (Image)            │  │  Top Section:              │
│  │  .w-96.h-64 (Video)            │  │  - Type Badge              │
│  │                                 │  │  - Dimensions              │
│  │  [Download Button]              │  │                            │
│  │  [Duration Badge] (video)       │  │  Middle:                   │
│  │                                 │  │  - Description             │
│  │                                 │  │                            │
│  │                                 │  │  Bottom (separated):       │
│  │                                 │  │  ─────────────────────    │
│  │                                 │  │  🕐 Date  |  💰 Credits   │
│  └─────────────────────────────────┘  └────────────────────────────┘
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Design Specs

### Image Card
```css
Container:
  - Background: gradient zinc-800/50 → zinc-900/50
  - Border: white/10 → violet-500/30 (hover)
  - Border radius: xl (12px)
  - Shadow (hover): lg + violet-500/10 glow

Preview (Left):
  - Width: 256px (w-64)
  - Height: 256px (h-64)
  - Object-fit: cover
  - Gradient overlay: black/60 dari bottom

Content (Right):
  - Padding: 16px (p-4)
  - Display: flex column
  - Justify: space-between

Date Section:
  - Margin-top: 16px (mt-4)
  - Padding-top: 12px (pt-3)
  - Border-top: white/10
```

### Video Card
```css
Preview (Left):
  - Width: 384px (w-96)
  - Height: 256px (h-64)
  - Aspect: ~16:9
  - Background: black

Duration Badge:
  - Position: absolute bottom-left
  - Background: black/70 + backdrop-blur
  - Icon: video + duration text

Theme:
  - Primary: purple (vs violet for image)
  - Badge: purple-500/20 bg + purple-500/30 border
```

---

## 🔍 Element Details

### 1. Type Badge
```html
<!-- Image -->
<div class="px-2 py-1 bg-violet-500/20 border border-violet-500/30 rounded">
  <i class="fas fa-image mr-1"></i> Image
</div>

<!-- Video -->
<div class="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded">
  <i class="fas fa-video mr-1"></i> Video
</div>
```

### 2. Date Section (Separated)
```html
<div class="mt-4 pt-3 border-t border-white/10">
  <div class="flex items-center justify-between text-xs text-gray-500">
    <div class="flex items-center gap-1">
      <i class="fas fa-clock"></i>
      <span>26 Okt 2025, 10:30</span>
    </div>
    <div class="flex items-center gap-1 text-yellow-400">
      <i class="fas fa-coins"></i>
      <span>Credits used</span>
    </div>
  </div>
</div>
```

### 3. Download Button (Overlay)
```html
<button class="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 rounded-lg">
  <i class="fas fa-download mr-1"></i> Download
</button>
```

---

## 📐 Responsive Grid

### Container Widths
```css
/* Mobile (default) */
max-width: 100%;

/* Tablet */
@media (min-width: 768px) {
  max-width: 1152px; /* max-w-6xl */
}

/* Desktop Large */
@media (min-width: 1024px) {
  max-width: 1152px; /* same */
}
```

### Card Layout Breakpoint
```css
/* Mobile: Vertical */
@media (max-width: 767px) {
  .md\:flex { display: none; }
  .md\:hidden { display: block; }
}

/* Desktop: Horizontal */
@media (min-width: 768px) {
  .md\:flex { display: flex; }
  .md\:hidden { display: none; }
}
```

---

## 🎯 Key Advantages

### Desktop (Horizontal)
✅ **Lebih Compact**: Card tidak terlalu tinggi  
✅ **Info Terorganisir**: Tanggal terpisah dengan jelas  
✅ **Preview Optimal**: Size fixed, tidak terlalu besar  
✅ **Space Efficient**: Memanfaatkan width screen  
✅ **Professional Look**: Mirip interface pro (fal.ai, etc)  

### Mobile (Vertical)
✅ **Touch-Friendly**: Full width mudah di-tap  
✅ **Scroll Natural**: Vertikal scroll lebih alami  
✅ **Image Priority**: Preview gambar lebih besar  
✅ **Readable**: Text dan info tetap mudah dibaca  

---

## 🎨 Color Coding

### Image Cards
- **Primary**: Violet/Purple (#8b5cf6)
- **Border**: violet-500/30
- **Shadow**: violet-500/10

### Video Cards
- **Primary**: Purple (#a855f7)
- **Border**: purple-500/30
- **Shadow**: purple-500/10

### Neutral Elements
- **Background**: zinc-800/50 → zinc-900/50
- **Text Primary**: white / gray-300
- **Text Secondary**: gray-400 / gray-500
- **Borders**: white/10

---

## 💻 CSS Classes Used

### Flexbox
```
flex, flex-row, flex-col, flex-1
items-center, items-start, justify-between
gap-1, gap-2, gap-3, gap-4
```

### Sizing
```
w-64, h-64 (image: 256×256px)
w-96, h-64 (video: 384×256px)
w-full, h-full, h-auto
flex-shrink-0
```

### Spacing
```
p-4 (padding: 16px)
mt-4, pt-3 (margin/padding top)
mb-2, mb-3 (margin bottom)
```

### Visual
```
rounded, rounded-lg, rounded-xl
border, border-t, border-white/10
bg-gradient-to-br, backdrop-blur-sm
shadow-lg, shadow-violet-500/10
```

### Responsive
```
md:flex, md:flex-row (desktop)
md:hidden (hide on desktop)
hidden (hide default)
```

### Hover States
```
hover:border-violet-500/30
hover:bg-violet-700
hover:scale-105
transition-all duration-300
```

---

## 📱 Mobile-First Approach

### Strategy
1. **Default**: Mobile layout (vertical)
2. **Override**: Desktop layout with `md:` prefix
3. **Hide/Show**: Use `hidden` + `md:flex` / `md:hidden`

### Example
```html
<!-- Desktop Only -->
<div class="hidden md:flex md:flex-row">
  <!-- Horizontal layout -->
</div>

<!-- Mobile Only -->
<div class="md:hidden">
  <!-- Vertical layout -->
</div>
```

---

## 🎬 Animation States

### Hover Effects
```css
.card {
  transition: all 300ms;
}

.card:hover {
  border-color: rgba(139, 92, 246, 0.3);
  box-shadow: 0 10px 15px -3px rgba(139, 92, 246, 0.1);
}

.button:hover {
  transform: scale(1.05);
  background-color: rgb(109, 40, 217);
}
```

### Entry Animation (Future)
```css
@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(100px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
```

---

## 📏 Measurements Summary

| Element | Desktop Width | Desktop Height | Mobile |
|---------|---------------|----------------|--------|
| Container | max-w-6xl (1152px) | auto | full width |
| Image Preview | 256px | 256px | full width |
| Video Preview | 384px | 256px | full width |
| Content Area | flex-1 | auto | full width |
| Date Section | full | 40px | full |

---

## 🔧 Customization Tips

### Adjust Preview Size
```javascript
// Image: Change w-64 h-64 to w-72 h-72 (288px)
<div class="relative w-72 h-72 flex-shrink-0">

// Video: Change w-96 to w-80 (320px)
<div class="relative w-80 h-64 flex-shrink-0 bg-black">
```

### Change Color Theme
```javascript
// Replace violet → blue
bg-violet-500/20 → bg-blue-500/20
border-violet-500/30 → border-blue-500/30
text-violet-300 → text-blue-300
```

### Add More Info
```javascript
// In content section
<div class="text-xs text-gray-400 flex items-center gap-2">
  <span>Model: Flux Pro</span>
  <span>•</span>
  <span>Cost: 5.5 credits</span>
</div>
```

---

## ✅ Quality Checklist

- [x] Responsive design (mobile + desktop)
- [x] Hover states implemented
- [x] Icons consistent (Font Awesome)
- [x] Colors follow theme
- [x] Accessibility (contrast ratios OK)
- [x] Performance (no heavy assets)
- [x] Code clean & readable
- [x] No linting errors

---

**Created**: 26 Oktober 2025  
**Purpose**: Visual documentation untuk horizontal card layout  
**Status**: ✅ Ready for Production

