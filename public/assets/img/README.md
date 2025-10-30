# 📸 Assets/Images Directory Structure

## 📁 Folder Organization:

```
public/assets/img/
├── logo/                    # Brand logos and icons
│   ├── pixelnest-logo.png  # Main logo (white)
│   ├── pixelnest-icon.png  # Favicon/icon only
│   └── pixelnest-full.png  # Logo with text
│
├── models/                  # AI model preview images
│   ├── veo-2.jpg           # Google Veo 2 preview
│   ├── sora-2.jpg          # OpenAI Sora 2 preview
│   ├── gen-3-alpha.jpg     # Runway Gen-3 preview
│   ├── kling-ai.jpg        # Kling AI preview
│   ├── pika-2.jpg          # Pika 2.0 preview
│   ├── dalle-3.jpg         # DALL·E 3 preview
│   ├── midjourney-v6.jpg   # Midjourney v6 preview
│   ├── sdxl.jpg            # Stable Diffusion XL preview
│   └── flux-pro.jpg        # Flux Pro preview
│
├── icons/                   # UI icons and decorative elements
│   ├── video-icon.svg      # Video generation icon
│   ├── image-icon.svg      # Image generation icon
│   ├── chat-icon.svg       # Chat icon
│   └── credit-icon.svg     # Credit icon
│
├── placeholders/            # Placeholder and example images
│   ├── video-placeholder.jpg    # Video preview placeholder
│   ├── image-placeholder.jpg    # Image preview placeholder
│   ├── avatar-placeholder.png   # Default avatar
│   └── empty-state.svg          # Empty state illustration
│
└── README.md               # This file
```

---

## 🎯 Image Requirements:

### **Logo Images:**
```
pixelnest-logo.png
- Size: 512x512px
- Format: PNG with transparency
- Colors: White/Violet gradient
- Use: Header, loading screens

pixelnest-icon.png
- Size: 192x192px
- Format: PNG with transparency
- Use: Favicon, app icon

pixelnest-full.png
- Size: 2048x512px
- Format: PNG with transparency
- Use: Hero section, promotional
```

### **AI Model Previews:**
```
All model images:
- Size: 800x600px (4:3 ratio)
- Format: JPG (optimized)
- Quality: 80-85%
- Content: Example output from each model
- Use: Homepage preview, models page
```

### **Icons:**
```
All icons:
- Format: SVG (preferred) or PNG
- Size: 64x64px (if PNG)
- Colors: Match theme (violet/white)
- Style: Consistent line weight
- Use: Feature cards, buttons
```

### **Placeholders:**
```
Placeholders:
- Size: Varies by use case
- Format: JPG/PNG/SVG
- Style: Minimal, professional
- Colors: Grayscale or brand colors
- Use: Empty states, loading
```

---

## 📝 Usage in Code:

### **1. Logo (Header):**
```html
<!-- In partials/header.ejs -->
<a href="/">
    <img src="/assets/img/logo/pixelnest-icon.png" 
         alt="PixelNest Logo" 
         class="w-10 h-10">
    <span>PIXELNEST</span>
</a>
```

### **2. AI Model Previews (Homepage):**
```html
<!-- In index.ejs -->
<img src="/assets/img/models/veo-2.jpg" 
     alt="Google Veo 2" 
     class="w-full h-48 object-cover rounded-xl">
```

### **3. Icons (Features):**
```html
<!-- In services.ejs -->
<img src="/assets/img/icons/video-icon.svg" 
     alt="Video Generation" 
     class="w-16 h-16">
```

### **4. Placeholder (Empty State):**
```html
<!-- In dashboard.ejs -->
<img src="/assets/img/placeholders/empty-state.svg" 
     alt="No generations yet" 
     class="w-40 h-40 mx-auto opacity-50">
```

---

## 🎨 Image Guidelines:

### **Quality:**
```
✅ High resolution (2x for retina)
✅ Optimized file size (<200KB)
✅ Proper compression
✅ WebP format for modern browsers (fallback to JPG/PNG)
```

### **Naming Convention:**
```
✅ lowercase-with-dashes.ext
✅ descriptive-names.ext
❌ CamelCase.ext
❌ spaces in names.ext
❌ special_chars.ext
```

### **Accessibility:**
```
✅ Always include alt text
✅ Meaningful descriptions
✅ Decorative images: alt=""
✅ Important images: descriptive alt
```

---

## 🚀 Optimization Tips:

### **Before Upload:**
```bash
# Compress images
# Use tools like:
- TinyPNG.com (online)
- ImageOptim (Mac)
- Squoosh.app (Google)

# Convert to WebP
npx @squoosh/cli --webp auto image.jpg
```

### **Lazy Loading:**
```html
<img src="/assets/img/models/veo-2.jpg" 
     alt="Google Veo 2"
     loading="lazy"
     class="w-full h-48 object-cover">
```

### **Responsive Images:**
```html
<picture>
  <source srcset="/assets/img/models/veo-2.webp" type="image/webp">
  <source srcset="/assets/img/models/veo-2.jpg" type="image/jpeg">
  <img src="/assets/img/models/veo-2.jpg" alt="Google Veo 2">
</picture>
```

---

## 📋 Current Image Status:

### **Required Images:**
```
Logo:
⬜ pixelnest-logo.png (512x512)
⬜ pixelnest-icon.png (192x192)
⬜ pixelnest-full.png (2048x512)

AI Models (9 images):
⬜ veo-2.jpg
⬜ sora-2.jpg
⬜ gen-3-alpha.jpg
⬜ kling-ai.jpg
⬜ pika-2.jpg
⬜ dalle-3.jpg
⬜ midjourney-v6.jpg
⬜ sdxl.jpg
⬜ flux-pro.jpg

Icons (4 icons):
⬜ video-icon.svg
⬜ image-icon.svg
⬜ chat-icon.svg
⬜ credit-icon.svg

Placeholders (4 images):
⬜ video-placeholder.jpg
⬜ image-placeholder.jpg
⬜ avatar-placeholder.png
⬜ empty-state.svg
```

### **Upload Instructions:**
```
1. Place images in appropriate folders
2. Follow naming convention
3. Optimize before upload
4. Test in browser
5. Check mobile responsive
```

---

## 🔄 Image Sources (Suggestions):

### **Free Resources:**
```
Unsplash.com          - High-quality photos
Pexels.com            - Free stock photos
Pixabay.com           - Free images & vectors
Icons8.com            - Icons and illustrations
Heroicons.com         - SVG icons (Tailwind)
```

### **AI-Generated:**
```
Use your own AI tools:
- Generate example outputs
- Create brand visuals
- Generate model previews
```

### **Design Tools:**
```
Figma                 - Logo design
Canva                 - Quick graphics
Photopea.com          - Online Photoshop
Remove.bg             - Background removal
```

---

## ✅ Next Steps:

1. **Create/Upload Logo:**
   - Design PixelNest logo
   - Export in required sizes
   - Place in `/logo/` folder

2. **Add Model Previews:**
   - Generate or find example images
   - Optimize file sizes
   - Place in `/models/` folder

3. **Add Icons:**
   - Download or create SVG icons
   - Ensure consistent style
   - Place in `/icons/` folder

4. **Add Placeholders:**
   - Create empty state graphics
   - Add default avatars
   - Place in `/placeholders/` folder

5. **Update Code:**
   - Replace SVG with IMG tags where needed
   - Add proper paths
   - Test all pages

---

**Folder structure ready! Add your images to `public/assets/img/` and follow the guidelines above!** 📸✨

