# 📸 Assets/Images Setup Guide

## ✅ **COMPLETED! Asset Structure Created**

### **Folder Structure:**
```
public/assets/img/
├── logo/           # Brand logos (3 files needed)
├── models/         # AI model previews (9 files needed)
├── icons/          # UI icons (4 files needed)
├── placeholders/   # Placeholders (4 files needed)
└── README.md       # Documentation
```

---

## 🎯 **Required Images:**

### **1. Logo Files (3 files):**
```
📁 public/assets/img/logo/

pixelnest-logo.png
- Size: 512x512px
- Use: Main brand logo
- Transparent background
- White/Violet gradient

pixelnest-icon.png  
- Size: 192x192px
- Use: Favicon, app icon
- Transparent background
- Just the icon part

pixelnest-full.png
- Size: 2048x512px
- Use: Hero section, full brand
- Transparent background
- Icon + Text
```

### **2. AI Model Previews (9 files):**
```
📁 public/assets/img/models/

veo-2.jpg           # Google Veo 2 example output
sora-2.jpg          # OpenAI Sora 2 example output
gen-3-alpha.jpg     # Runway Gen-3 example output
kling-ai.jpg        # Kling AI example output
pika-2.jpg          # Pika 2.0 example output
dalle-3.jpg         # DALL·E 3 example output
midjourney-v6.jpg   # Midjourney v6 example output
sdxl.jpg            # Stable Diffusion XL example output
flux-pro.jpg        # Flux Pro example output

All:
- Size: 800x600px (4:3 ratio)
- Format: JPG optimized
- Quality: 80-85%
- File size: <200KB each
```

### **3. Icons (4 files):**
```
📁 public/assets/img/icons/

video-icon.svg      # Video generation icon
image-icon.svg      # Image generation icon
chat-icon.svg       # Chat icon (if needed)
credit-icon.svg     # Credit/coin icon

All:
- Format: SVG (preferred)
- Size: 64x64px viewBox
- Colors: Violet/White theme
- Consistent style
```

### **4. Placeholders (4 files):**
```
📁 public/assets/img/placeholders/

video-placeholder.jpg    # Default video thumbnail
image-placeholder.jpg    # Default image thumbnail
avatar-placeholder.png   # Default user avatar
empty-state.svg          # Empty state illustration

Sizes vary by use case
Professional, minimal style
```

---

## 🎨 **Where to Use Images:**

### **Logo:**
```html
<!-- Header (partials/header.ejs) -->
<img src="/assets/img/logo/pixelnest-icon.png" 
     alt="PixelNest" 
     class="w-10 h-10">

<!-- Login Page -->
<img src="/assets/img/logo/pixelnest-full.png" 
     alt="PixelNest" 
     class="h-12">

<!-- Favicon (layout.ejs) -->
<link rel="icon" href="/assets/img/logo/pixelnest-icon.png">
```

### **AI Models (Homepage):**
```html
<!-- index.ejs - AI Models Preview Section -->
<div class="model-preview">
    <img src="/assets/img/models/veo-2.jpg" 
         alt="Google Veo 2" 
         loading="lazy"
         class="w-full h-48 object-cover rounded-xl">
    <h3>Google Veo 2</h3>
    <p>Photorealistic video generation...</p>
</div>
```

### **Services Page:**
```html
<!-- services.ejs - Model Showcase -->
<div class="model-card">
    <img src="/assets/img/models/sora-2.jpg" 
         alt="OpenAI Sora 2"
         class="w-full h-64 object-cover rounded-lg">
    <div class="model-info">
        <h3>Sora 2</h3>
        <span class="badge">VIDEO</span>
    </div>
</div>
```

### **Dashboard Empty State:**
```html
<!-- dashboard.ejs - No creations yet -->
<img src="/assets/img/placeholders/empty-state.svg" 
     alt="No generations yet"
     class="w-32 h-32 mx-auto opacity-50 mb-4">
```

---

## 📝 **How to Add Images:**

### **Step 1: Prepare Images**
```bash
# Create or download your images
# Optimize file sizes:
# - Use TinyPNG.com for compression
# - Use Squoosh.app for WebP conversion
# - Keep file sizes small (<200KB)
```

### **Step 2: Place in Folders**
```bash
# Copy to correct locations:
cp your-logo.png public/assets/img/logo/pixelnest-logo.png
cp veo-preview.jpg public/assets/img/models/veo-2.jpg
# ... etc
```

### **Step 3: Update Code**
```bash
# Example: Update header logo
# Edit: src/views/partials/header.ejs

# Before (using SVG):
<svg class="w-5 h-5">...</svg>

# After (using image):
<img src="/assets/img/logo/pixelnest-icon.png" 
     alt="PixelNest" 
     class="w-10 h-10">
```

---

## 🚀 **Quick Start Examples:**

### **1. Homepage Hero Logo:**
```html
<!-- Replace in index.ejs -->
<div class="text-center mb-12">
    <img src="/assets/img/logo/pixelnest-full.png" 
         alt="PixelNest AI Video Studio" 
         class="h-16 mx-auto mb-6">
    <h1 class="text-6xl font-black mb-6">
        Create Stunning Videos with AI
    </h1>
</div>
```

### **2. Model Preview Cards:**
```html
<!-- Add to index.ejs -->
<div class="grid grid-cols-3 gap-6">
    <!-- Model 1 -->
    <div class="group cursor-pointer">
        <div class="relative overflow-hidden rounded-xl mb-3">
            <img src="/assets/img/models/veo-2.jpg" 
                 alt="Google Veo 2"
                 class="w-full h-48 object-cover transform group-hover:scale-105 transition-transform">
        </div>
        <h3 class="font-bold">Google Veo 2</h3>
        <p class="text-sm text-gray-400">4K Ultra HD Video</p>
    </div>
    
    <!-- Model 2 -->
    <div class="group cursor-pointer">
        <div class="relative overflow-hidden rounded-xl mb-3">
            <img src="/assets/img/models/sora-2.jpg" 
                 alt="OpenAI Sora 2"
                 class="w-full h-48 object-cover transform group-hover:scale-105 transition-transform">
        </div>
        <h3 class="font-bold">OpenAI Sora 2</h3>
        <p class="text-sm text-gray-400">60s Video Generation</p>
    </div>
    
    <!-- Add more... -->
</div>
```

### **3. Dashboard User Avatar:**
```html
<!-- Update dashboard.ejs -->
<% if (user && user.avatar_url) { %>
    <img src="<%= user.avatar_url %>" 
         alt="<%= user.name %>" 
         class="w-8 h-8 rounded-full">
<% } else { %>
    <img src="/assets/img/placeholders/avatar-placeholder.png" 
         alt="Default Avatar"
         class="w-8 h-8 rounded-full">
<% } %>
```

---

## 🎨 **Image Creation Tips:**

### **Logo Design:**
```
Tools:
- Figma (free, professional)
- Canva (quick & easy)
- LogoMakr (online logo creator)

Style:
- Modern, minimal
- Play icon for video theme
- Violet gradient
- Clean typography
```

### **Model Previews:**
```
Options:
1. Generate with AI tools
   - Use DALL·E, Midjourney, etc.
   - Create example outputs
   
2. Screenshot from demos
   - Visit model websites
   - Take screenshots
   - Crop and optimize
   
3. Stock photos
   - Unsplash.com
   - Pexels.com
   - AI-related images
```

### **Icons:**
```
Resources:
- Heroicons.com (Tailwind icons)
- Icons8.com
- Flaticon.com
- FontAwesome

Export as SVG for best quality
```

---

## ✅ **Checklist:**

```
Logo:
⬜ Create/design PixelNest logo
⬜ Export in 3 sizes (512, 192, 2048x512)
⬜ Save to /logo/ folder
⬜ Update header.ejs
⬜ Update favicon

Models:
⬜ Gather 9 AI model preview images
⬜ Resize to 800x600px
⬜ Optimize file sizes
⬜ Save to /models/ folder
⬜ Update index.ejs
⬜ Update services.ejs

Icons:
⬜ Download/create 4 SVG icons
⬜ Match violet theme
⬜ Save to /icons/ folder
⬜ Replace inline SVGs

Placeholders:
⬜ Create empty state graphic
⬜ Create default avatar
⬜ Save to /placeholders/ folder
⬜ Update dashboard.ejs

Testing:
⬜ Test all pages
⬜ Check mobile responsive
⬜ Verify image loading
⬜ Test lazy loading
⬜ Check alt text
```

---

## 📁 **File Paths Reference:**

### **Public Access:**
```
All images in public/assets/img/ are accessible via:
/assets/img/path/to/image.ext

Examples:
/assets/img/logo/pixelnest-logo.png
/assets/img/models/veo-2.jpg
/assets/img/icons/video-icon.svg
/assets/img/placeholders/empty-state.svg
```

### **In EJS Templates:**
```html
<!-- Absolute path (recommended) -->
<img src="/assets/img/logo/pixelnest-logo.png">

<!-- Or use variable -->
<% const assetPath = '/assets/img'; %>
<img src="<%= assetPath %>/logo/pixelnest-logo.png">
```

---

## 🎉 **Result:**

**Asset structure ready:**
```
✅ Folder structure created
✅ Documentation complete
✅ Usage examples provided
✅ Optimization tips included
✅ Checklist ready
✅ Ready for images
```

**Next Steps:**
```
1. Create/gather your images
2. Optimize file sizes
3. Place in folders
4. Update code references
5. Test in browser
```

---

**Folder structure `public/assets/img/` siap digunakan! Tinggal tambahkan gambar sesuai guidelines!** 📸✨

