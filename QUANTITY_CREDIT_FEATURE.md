# 🎯 Quantity Selector & Credit Calculator Feature

## ✅ **COMPLETED! Dashboard Enhanced with Smart Features**

### **3 Major Improvements:**

```
1. ✅ Fixed Video Tab (now clickable)
2. ✅ Quantity Selector (1x - 10x)
3. ✅ Real-time Credit Calculator
```

---

## 🔢 **QUANTITY SELECTOR (1x - 10x):**

### **UI Layout:**
```
Bottom of Sidebar:
┌──────────────────────────────────┐
│ Total Cost: 5 Credits            │ ← Yellow box
│ 5x generation × 1 credit each    │
├──────────────────────────────────┤
│ [1x][2x][3x][4x][5x]             │ ← 10 buttons
│ [6x][7x][8x][9x][10x]            │
├──────────────────────────────────┤
│ [▶ RUN]                          │
└──────────────────────────────────┘
```

### **Button Behavior:**
```css
Default:
  bg: rgba(255,255,255,0.03)
  border: rgba(255,255,255,0.1)
  text: gray-400

Active (Green):
  bg: rgba(5,150,105,0.2)
  border: rgba(34,197,94,0.5)
  text: green-300
```

### **Click Behavior:**
```
1. User clicks any 1x-10x button
2. Previous active → deactivates
3. Clicked button → green highlight ✅
4. Credit cost → recalculates immediately
5. Credit breakdown → updates
```

---

## 💰 **CREDIT COST CALCULATOR:**

### **Display Box (Yellow):**
```
┌─────────────────────────────────┐
│ Total Cost: 5 Credits           │
│ 5x generation × 1 credit each   │
└─────────────────────────────────┘
```

### **Pricing Logic:**

**IMAGE MODE:**
```javascript
Text to Image:      1 credit  × quantity
Edit Image:         1 credit  × quantity
Edit Multi Image:   2 credits × quantity
Upscale:           2 credits × quantity
Remove Background:  1 credit  × quantity
```

**VIDEO MODE:**
```javascript
Text to Video (5s):   3 credits × quantity
Text to Video (10s):  5 credits × quantity
Image to Video (5s):  4 credits × quantity
Image to Video (10s): 6 credits × quantity
```

### **Real-time Updates:**
```
Calculator triggers on:
✅ Mode change (Image ↔ Video)
✅ Type change (Text to Image, Upscale, etc)
✅ Duration change (5s ↔ 10s)
✅ Quantity change (1x - 10x)
```

---

## 🎬 **VIDEO TAB FIX:**

### **Problem:**
```
❌ Video tab tidak bisa diklik
❌ Event tidak trigger dengan benar
```

### **Solution:**
```javascript
// Added event handlers:
e.preventDefault();
e.stopPropagation();

// Added state management:
let currentMode = 'image';

// Update on tab click:
currentMode = mode;
calculateCreditCost();
```

### **Now Working:**
```
✅ Video tab clickable
✅ Smooth transition
✅ Credit calculator updates
✅ All controls work
```

---

## 💻 **JavaScript Logic:**

### **1. State Management:**
```javascript
let currentQuantity = 1;  // Default 1x
let currentMode = 'image'; // Default image mode
```

### **2. Quantity Selector:**
```javascript
const quantityBtns = document.querySelectorAll('.quantity-btn');

// Set 1x as default active
if (quantityBtns.length > 0) {
    quantityBtns[0].classList.add('active');
}

quantityBtns.forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Deactivate all
        quantityBtns.forEach(b => b.classList.remove('active'));
        
        // Activate clicked
        this.classList.add('active');
        
        // Update quantity
        currentQuantity = parseInt(this.getAttribute('data-qty'));
        
        // Recalculate
        calculateCreditCost();
    });
});
```

### **3. Credit Calculator:**
```javascript
function calculateCreditCost() {
    const mode = currentMode; // 'image' or 'video'
    const quantity = currentQuantity; // 1-10
    
    let baseCost = 1;
    
    if (mode === 'image') {
        const type = document.getElementById('image-type').value;
        
        if (type === 'text-to-image') baseCost = 1;
        else if (type === 'edit-image') baseCost = 1;
        else if (type === 'edit-multi') baseCost = 2;
        else if (type === 'upscale') baseCost = 2;
        else if (type === 'remove-bg') baseCost = 1;
        
    } else if (mode === 'video') {
        const type = document.getElementById('video-type').value;
        const activeDuration = document.querySelector('.duration-btn.active');
        const duration = parseInt(activeDuration.getAttribute('data-duration'));
        
        if (type === 'text-to-video') {
            baseCost = duration === 5 ? 3 : 5;
        } else if (type === 'image-to-video') {
            baseCost = duration === 5 ? 4 : 6;
        }
    }
    
    const totalCost = baseCost * quantity;
    
    // Update display
    document.getElementById('credit-cost').textContent = 
        `${totalCost} ${totalCost === 1 ? 'Credit' : 'Credits'}`;
    
    document.getElementById('credit-breakdown').textContent = 
        `${quantity}x generation × ${baseCost} ${baseCost === 1 ? 'credit' : 'credits'} each`;
}
```

### **4. Auto-recalculate Triggers:**
```javascript
// On type change
document.getElementById('image-type').addEventListener('change', calculateCreditCost);
document.getElementById('video-type').addEventListener('change', calculateCreditCost);

// On duration change
durationBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        // ... toggle logic ...
        calculateCreditCost();
    });
});

// On mode change
tabs.forEach(tab => {
    tab.addEventListener('click', function() {
        currentMode = this.getAttribute('data-mode');
        // ... switch logic ...
        calculateCreditCost();
    });
});

// On quantity change
quantityBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        currentQuantity = parseInt(this.getAttribute('data-qty'));
        calculateCreditCost();
    });
});

// Initial calculation on page load
calculateCreditCost();
```

---

## 🎯 **Use Case Examples:**

### **Example 1: Single Image Generation**
```
Mode: Image
Type: Text to Image
Quantity: 1x
---
Cost: 1 Credit
Breakdown: "1x generation × 1 credit each"
```

### **Example 2: Multiple Upscales**
```
Mode: Image
Type: Upscale
Quantity: 5x
---
Cost: 10 Credits
Breakdown: "5x generation × 2 credits each"
```

### **Example 3: Batch Video Generation**
```
Mode: Video
Type: Text to Video
Duration: 10s
Quantity: 3x
---
Cost: 15 Credits
Breakdown: "3x generation × 5 credits each"
```

### **Example 4: Maximum Quantity**
```
Mode: Video
Type: Image to Video
Duration: 10s
Quantity: 10x
---
Cost: 60 Credits
Breakdown: "10x generation × 6 credits each"
```

---

## 📊 **Pricing Table:**

| Mode | Type | Duration | Base Cost | 5x Quantity | 10x Quantity |
|------|------|----------|-----------|-------------|--------------|
| Image | Text to Image | - | 1 | 5 | 10 |
| Image | Edit Image | - | 1 | 5 | 10 |
| Image | Edit Multi | - | 2 | 10 | 20 |
| Image | Upscale | - | 2 | 10 | 20 |
| Image | Remove BG | - | 1 | 5 | 10 |
| Video | Text to Video | 5s | 3 | 15 | 30 |
| Video | Text to Video | 10s | 5 | 25 | 50 |
| Video | Image to Video | 5s | 4 | 20 | 40 |
| Video | Image to Video | 10s | 6 | 30 | 60 |

---

## 🎨 **UI/UX Details:**

### **Color Scheme:**
```
Quantity Buttons:
  Inactive: White/10 with gray text
  Active: Green/20 with green text ✅
  Hover: White/6 with brighter border

Credit Box:
  Background: Yellow/10
  Border: Yellow/20
  Text: Yellow/400 (bold, mono font)
```

### **Visual Feedback:**
```
✅ Click quantity → Instant green highlight
✅ Change type → Cost updates immediately
✅ Switch mode → Recalculates for new mode
✅ Toggle duration → Updates if video mode
```

### **Responsive Design:**
```
Quantity buttons wrap in 2 rows:
Row 1: [1x][2x][3x][4x][5x]
Row 2: [6x][7x][8x][9x][10x]

All buttons same size (min-width: 36px)
Spacing: gap-1 (4px between buttons)
```

---

## 📁 **Files Modified:**

```
✅ src/views/auth/dashboard.ejs
   - Added credit cost display box
   - Added 10 quantity buttons (1x-10x)
   - Restructured bottom section

✅ public/css/input.css
   - Added .quantity-btn styles
   - Added .quantity-btn.active (green)

✅ public/js/dashboard.js
   - Added currentQuantity state
   - Added currentMode state
   - Added calculateCreditCost() function
   - Added quantity button handlers
   - Fixed video tab click issue
   - Added auto-recalculate triggers

✅ QUANTITY_CREDIT_FEATURE.md
   - This documentation
```

---

## ✅ **What's Working:**

```
✅ Video tab clickable (fixed preventDefault)
✅ Quantity selector 1x-10x
✅ Green highlight on active quantity
✅ Credit cost calculator (real-time)
✅ Smart pricing based on:
   - Mode (image vs video)
   - Type (text, edit, upscale, etc)
   - Duration (5s vs 10s for video)
   - Quantity (1x-10x)
✅ Cost breakdown text
✅ Auto-update on any change
✅ Professional yellow cost display
✅ All interactive elements functional
```

---

## 🚀 **Ready for Production:**

### **Data Available for API:**
```javascript
const generateBtn = document.getElementById('generate-btn');

generateBtn.addEventListener('click', async () => {
    const mode = currentMode; // 'image' or 'video'
    const quantity = currentQuantity; // 1-10
    const cost = calculateTotalCost(); // e.g. 15 credits
    
    // Validate user has enough credits
    if (userCredits < cost) {
        alert(`Insufficient credits. Need ${cost}, have ${userCredits}`);
        return;
    }
    
    // Call API with quantity
    for (let i = 0; i < quantity; i++) {
        await generateContent({
            mode: mode,
            type: getSelectedType(),
            prompt: getPrompt(),
            // ... other params
        });
    }
    
    // Deduct credits
    userCredits -= cost;
    updateCreditDisplay();
});
```

---

## 🎉 **Result:**

**Dashboard sekarang memiliki:**
```
✅ Video tab yang berfungsi dengan baik
✅ Quantity selector 1x-10x dengan visual feedback
✅ Real-time credit calculator
✅ Smart pricing based on configuration
✅ Professional cost display
✅ Instant updates on any change
✅ Ready for batch generation
✅ User-friendly & intuitive
```

---

**All requested features implemented! Video tab fixed, quantity selector added (1x-10x), and real-time credit calculator dengan pricing yang sesuai konfigurasi user!** 💰🎯✨

