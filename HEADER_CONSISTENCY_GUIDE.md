# 🎯 Header Consistency Guide - PixelNest

## ✅ Update Selesai

Header dan navigation sekarang memiliki animasi smooth dan konsisten di semua halaman dengan style yang sama seperti di halaman blog.

---

## 🎨 Fitur Header Baru

### **1. Logo Animation**
- ✅ Hover effect dengan gradient text (violet → fuchsia)
- ✅ Image scale animation (1.0 → 1.1)
- ✅ Smooth transitions (300ms)

### **2. Navigation Links**
- ✅ Hover underline animation (expand from center)
- ✅ Active state dengan gradient underline
- ✅ Smooth color transitions
- ✅ Font weight: medium (normal) → semibold (active)

### **3. Header Scroll Effect**
- ✅ Shadow muncul saat scroll
- ✅ Smooth backdrop blur
- ✅ Fixed position optimized

### **4. Mobile Menu**
- ✅ Slide down animation
- ✅ Click outside to close
- ✅ Auto-close on resize
- ✅ Smooth transitions

### **5. Buttons**
- ✅ Hover lift effect (translateY -2px)
- ✅ Shadow glow on hover
- ✅ Gradient background (violet → fuchsia)

---

## 📂 Files Updated

```
src/views/
├── layouts/
│   └── main-layout.ejs        ✅ NEW - Master layout template
└── partials/
    └── header.ejs              ✅ UPDATED - Enhanced animations
```

---

## 🚀 Cara Menggunakan Layout Konsisten

### **Option 1: Gunakan Main Layout (Recommended)**

Untuk halaman baru, gunakan layout template:

```ejs
<!-- Example: src/views/new-page.ejs -->
<% 
const layoutData = {
    title: 'Page Title - PixelNest',
    description: 'Page description for SEO',
    body: `
        <main class="mt-16">
            <section class="section-container py-12">
                <!-- Your content here -->
            </section>
        </main>
    `
};
%>
<%- include('layouts/main-layout', layoutData) %>
```

### **Option 2: Manual Setup (Current Method)**

Untuk halaman yang sudah ada, pastikan menggunakan:

```html
<!DOCTYPE html>
<html lang="id" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Google Fonts (WAJIB) -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Tailwind CSS (WAJIB) -->
    <link rel="stylesheet" href="/css/output.css">
    
    <title>Your Page Title</title>
</head>
<body class="text-white">
    <%- include('partials/header') %>
    
    <main class="mt-16">
        <!-- Your content -->
    </main>
    
    <%- include('partials/footer') %>
    
    <script src="/js/main.js"></script>
</body>
</html>
```

---

## 🎨 CSS Classes yang Wajib

### **Glass Effects:**
```css
.glass           /* Backdrop blur medium */
.glass-strong    /* Backdrop blur heavy */
```

### **Buttons:**
```css
.btn-primary     /* Gradient button (violet → fuchsia) */
.btn-outline     /* Outlined button */
```

### **Spacing:**
```css
.mt-16          /* Main content top margin (64px) */
.py-12          /* Section padding vertical (48px) */
.section-container  /* Container with padding */
```

### **Typography:**
```css
font-family: 'Space Grotesk'  /* Headings & body */
font-family: 'JetBrains Mono' /* Code & badges */
```

---

## 🎭 Animation Classes

### **Scroll Animations:**
```css
.animate-fade-in     /* Fade in from 0 to 1 */
.animate-slide-up    /* Slide up + fade in */
.animate-slide-down  /* Slide down + fade in */
.animate-scale-in    /* Scale up + fade in */
```

### **Active States:**
```css
nav a.active::after  /* Gradient underline indicator */
```

### **Hover Effects:**
```css
nav a:hover::before  /* Expanding underline */
.logo-animate:hover  /* Logo scale effect */
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile First */
Default:    < 768px   (Mobile)
md:         ≥ 768px   (Tablet)
lg:         ≥ 1024px  (Desktop)
xl:         ≥ 1280px  (Large Desktop)
```

### **Header Responsive:**
- Mobile: Hamburger menu
- Desktop: Full navigation

### **Spacing Responsive:**
```css
Mobile:   mt-16 py-12
Tablet:   Same
Desktop:  Same (consistency!)
```

---

## ✨ Header Animation Details

### **1. Logo Hover Animation:**

```css
/* Normal State */
Logo: scale(1.0)
Text: white

/* Hover State */
Logo: scale(1.1) 
Text: gradient(violet → fuchsia)
Transition: 300ms ease
```

### **2. Navigation Link Hover:**

```css
/* Before Hover */
Underline: width 0%, opacity 0, centered

/* On Hover */
Underline: width 100%, opacity 1, gradient
Transition: 300ms ease
```

### **3. Active Link Indicator:**

```css
/* When Active */
After element: 2px height, 100% width
Background: linear-gradient(violet → fuchsia)
Position: bottom -4px
```

### **4. Scroll Effect:**

```css
/* At top (scroll = 0) */
Shadow: none

/* When scrolling (scroll > 0) */
Shadow: 0 4px 6px -1px rgba(0,0,0,0.3)
Transition: all 300ms
```

---

## 🔧 Customization

### **Change Header Height:**

```css
/* In header.ejs */
<nav class="section-container py-4">  /* Default 16px padding */

/* Options: */
py-2  = 8px
py-3  = 12px
py-4  = 16px (current)
py-5  = 20px
py-6  = 24px
```

### **Change Animation Speed:**

```css
/* In main-layout.ejs styles */
transition: all 0.3s ease;  /* Default 300ms */

/* Options: */
0.2s = fast
0.3s = normal (current)
0.4s = slow
0.5s = very slow
```

### **Change Logo Gradient:**

```css
/* In header.ejs */
group-hover:from-violet-400 group-hover:to-fuchsia-400

/* Custom gradient examples: */
from-blue-400 to-cyan-400      /* Blue theme */
from-green-400 to-emerald-400  /* Green theme */
from-orange-400 to-red-400     /* Warm theme */
```

---

## 📋 Checklist Konsistensi

### **Untuk Setiap Halaman Baru:**

- [ ] Menggunakan `html lang="id" class="dark"`
- [ ] Include Google Fonts (Space Grotesk + JetBrains Mono)
- [ ] Include `/css/output.css`
- [ ] Include `partials/header`
- [ ] Main content `class="mt-16"`
- [ ] Section padding `py-12` (atau py-10 untuk compact)
- [ ] Include `partials/footer`
- [ ] Include `/js/main.js`

### **Untuk Header Updates:**

- [ ] Logo hover animation working
- [ ] Navigation links underline on hover
- [ ] Active link indicator showing
- [ ] Mobile menu toggle working
- [ ] Scroll shadow effect working
- [ ] All transitions smooth (300ms)

### **Untuk Responsive:**

- [ ] Mobile menu accessible
- [ ] Desktop navigation showing at lg:
- [ ] Logo readable on all screens
- [ ] Touch targets ≥ 44px on mobile
- [ ] No horizontal scroll

---

## 🐛 Troubleshooting

### **Problem: Animations not working**

**Solution:**
- Check if `/css/output.css` loaded
- Check if Tailwind compiled with animations
- Clear browser cache
- Check console for errors

### **Problem: Font not loading**

**Solution:**
```html
<!-- Add to <head> -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### **Problem: Glass effect not showing**

**Solution:**
```css
/* Ensure these classes exist in output.css */
.glass {
    background: rgba(17, 24, 39, 0.7);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
}
```

### **Problem: Mobile menu not toggling**

**Solution:**
- Check if `main.js` loaded
- Check if IDs match: `navbarToggle` and `navbarMenu`
- Check console for JavaScript errors
- Verify click handler attached

---

## 🎯 Best Practices

### **DO's ✅**

1. **Always use consistent spacing**
   ```css
   mt-16 for main content
   py-12 for sections
   ```

2. **Always include header & footer**
   ```ejs
   <%- include('partials/header') %>
   <%- include('partials/footer') %>
   ```

3. **Use semantic HTML**
   ```html
   <header>, <nav>, <main>, <section>, <footer>
   ```

4. **Maintain animation consistency**
   ```css
   transition: all 0.3s ease
   ```

5. **Test on multiple devices**
   - Mobile (375px)
   - Tablet (768px)
   - Desktop (1024px+)

### **DON'Ts ❌**

1. **Don't skip fonts**
   ```html
   <!-- WRONG: No fonts -->
   <link rel="stylesheet" href="/css/output.css">
   
   <!-- RIGHT: Fonts included -->
   <link href="...Google Fonts..." rel="stylesheet">
   <link rel="stylesheet" href="/css/output.css">
   ```

2. **Don't use inconsistent spacing**
   ```css
   /* WRONG: Random values */
   mt-20, py-16, mb-14
   
   /* RIGHT: Consistent system */
   mt-16, py-12, mb-12
   ```

3. **Don't override header styles**
   ```css
   /* WRONG: Custom header styles per page */
   header { background: red; }
   
   /* RIGHT: Use the global header */
   <%- include('partials/header') %>
   ```

4. **Don't forget mobile menu script**
   ```html
   <!-- WRONG: No script -->
   </body>
   
   <!-- RIGHT: Include main.js -->
   <script src="/js/main.js"></script>
   </body>
   ```

---

## 📊 Performance Tips

### **1. Preconnect to Fonts**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
```

### **2. Optimize CSS**
```bash
# Purge unused CSS in production
npm run build:css
```

### **3. Defer Non-Critical JS**
```html
<script src="/js/main.js" defer></script>
```

### **4. Use Will-Change Sparingly**
```css
/* Only for frequently animated elements */
.logo-animate {
    will-change: transform;
}
```

---

## 📖 Examples

### **Halaman dengan Header Konsisten:**

✅ Blog List (`/blog`)
✅ Blog Post (`/blog/[slug]`)
✅ Terms of Service (`/terms-of-service`)
✅ Privacy Policy (`/privacy-policy`)

### **Halaman yang Perlu Update:**

⚠️ Landing page (`/`)
⚠️ Services (`/services`)
⚠️ Pricing (`/pricing`)
⚠️ Contact (`/contact`)

---

## 🎉 Summary

**Header sekarang memiliki:**
- ✨ Logo hover animation dengan gradient
- 🔗 Navigation links dengan expanding underline
- 📍 Active link indicator dengan gradient
- 📱 Mobile menu smooth toggle
- 🎭 Scroll shadow effect
- ⚡ Optimized performance
- 🎨 Consistent design system

**Semua halaman baru HARUS mengikuti pattern ini untuk konsistensi!**

---

**Created:** October 26, 2025  
**Status:** ✅ Production Ready  
**Version:** 2.0

