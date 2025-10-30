# ⚡ Header Quick Reference - PixelNest

## 🚀 Quick Setup untuk Halaman Baru

### **Template Minimal:**

```html
<!DOCTYPE html>
<html lang="id" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Title - PixelNest</title>
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/css/output.css">
</head>
<body class="text-white">
    <%- include('partials/header') %>
    
    <main class="mt-16">
        <!-- Content here -->
    </main>
    
    <%- include('partials/footer') %>
    <script src="/js/main.js"></script>
</body>
</html>
```

---

## 🎨 CSS Classes Essentials

```css
/* Spacing */
.mt-16          /* Main margin top: 64px */
.py-12          /* Section padding: 48px */
.py-10          /* Compact section: 40px */

/* Glass Effects */
.glass          /* Backdrop blur medium */
.glass-strong   /* Backdrop blur heavy */

/* Buttons */
.btn-primary    /* Gradient button */
.btn-outline    /* Outline button */

/* Container */
.section-container  /* Max-width container with padding */
```

---

## ✨ Animations

```css
/* Fade & Slide */
.animate-fade-in      /* Opacity 0→1 */
.animate-slide-up     /* Y+20→0 + fade */
.animate-slide-down   /* Y-10→0 + fade */
.animate-scale-in     /* Scale 0.95→1 + fade */

/* Navigation */
nav a.active          /* Has gradient underline */
nav a:hover::before   /* Expanding underline */
.logo-animate:hover   /* Logo scale + gradient */
```

---

## 📏 Standard Spacing

```
Header Height:    64px (py-4)
Main Top Margin:  64px (mt-16)
Section Padding:  48px (py-12) or 40px (py-10)

Total Gap:        112px - 128px
```

---

## 🎯 Header Features

| Feature | Effect | Duration |
|---------|--------|----------|
| Logo Hover | Scale + Gradient Text | 300ms |
| Link Hover | Expanding Underline | 300ms |
| Active Link | Gradient Underline | - |
| Scroll | Shadow Appears | 300ms |
| Mobile Menu | Slide Down | 300ms |
| Buttons | Lift + Shadow | 300ms |

---

## 📱 Responsive

```css
Mobile:   < 768px   (Hamburger menu)
Tablet:   ≥ 768px   (Hamburger menu)  
Desktop:  ≥ 1024px  (Full navigation)
```

---

## ✅ Checklist

```
[ ] HTML lang="id" class="dark"
[ ] Google Fonts loaded
[ ] /css/output.css loaded
[ ] include('partials/header')
[ ] main class="mt-16"
[ ] section class="py-12"
[ ] include('partials/footer')
[ ] /js/main.js loaded
```

---

## 🐛 Common Issues

**Problem:** Animations not working  
**Fix:** Check `/css/output.css` and clear cache

**Problem:** Fonts not loading  
**Fix:** Add Google Fonts preconnect + link

**Problem:** Mobile menu not working  
**Fix:** Ensure `main.js` loaded and IDs correct

---

## 🎨 Color System

```css
Primary:   violet-600 → fuchsia-600
Glass:     gray-900 + 70% opacity + blur
Text:      white (headings), gray-300/400 (body)
Border:    white/10 (10% opacity)
```

---

**Quick Access:** `/HEADER_CONSISTENCY_GUIDE.md` (Full Documentation)

