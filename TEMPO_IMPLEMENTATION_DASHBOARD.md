# 🎵 Tempo Implementation (Dashboard)

## 📋 Overview

Implementasi tempo slider dengan opsi **Auto / Slow / Medium / Fast** untuk Suno music generation di **Dashboard** (bukan halaman /music).

---

## ✅ Yang Sudah Diimplementasikan

### 1. **HTML UI** ✅
Location: `src/views/auth/dashboard.ejs` (Line 1222-1255)

```html
<!-- Tempo Selection (Only for Suno/Music) -->
<div id="audio-tempo-container" style="display: none;">
    <label class="control-label">
        <i class="fas fa-gauge-high text-orange-400 mr-1"></i>
        Tempo (Speed)
    </label>
    <div class="grid grid-cols-4 gap-2">
        <!-- 4 buttons: Auto, Slow, Medium, Fast -->
        <button onclick="selectAudioTempo('')" data-tempo="">Auto</button>
        <button onclick="selectAudioTempo('slow')" data-tempo="slow">Slow (60-80 BPM)</button>
        <button onclick="selectAudioTempo('medium')" data-tempo="medium">Medium (90-120 BPM)</button>
        <button onclick="selectAudioTempo('fast')" data-tempo="fast">Fast (130+ BPM)</button>
    </div>
    <input type="hidden" id="audio-tempo" value="">
</div>
```

**Features:**
- ✅ 4 tempo options dengan icon yang berbeda
- ✅ Hidden by default (`display: none`)
- ✅ Hidden input untuk store selected tempo

### 2. **CSS Styling** ✅
Location: `src/views/auth/dashboard.ejs` (Line 203-237)

```css
.audio-tempo-btn {
    /* Gradient background */
    /* Orange border on active */
    /* Hover animations */
    /* Min height 85px */
}

.audio-tempo-btn:hover {
    /* Orange glow */
    /* Transform translateY(-2px) */
}

.audio-tempo-btn.active {
    /* Orange background & border */
    /* Shadow effect */
}
```

**Features:**
- ✅ Orange theme (rgb(251, 146, 60))
- ✅ Smooth hover/active transitions
- ✅ Consistent with vocal gender button style

### 3. **JavaScript Logic** ✅
Location: `src/views/auth/dashboard.ejs` (Line 4363-4404)

```javascript
// Update duration visibility
function updateDurationVisibility() {
    if (shouldHideDuration()) {
        audioDurationContainer.style.display = 'none';
        audioTempoContainer.style.display = 'block'; // ✅ Show tempo
    } else {
        audioDurationContainer.style.display = 'block';
        audioTempoContainer.style.display = 'none'; // ✅ Hide tempo
    }
}

// Select tempo function
window.selectAudioTempo = function(tempo) {
    // Update button states
    // Update hidden input
    // Log selection
};
```

**Features:**
- ✅ Auto show/hide based on audio type
- ✅ Show tempo when Suno selected
- ✅ Hide tempo for other audio types
- ✅ Button state management
- ✅ Console logging for debugging

---

## ❌ Yang Belum Diimplementasikan

### **Backend Integration** ❌

Tempo belum dikirim ke backend dan belum ditambahkan ke style description.

**What needs to be done:**

1. **Find audio generation submit handler** (di dashboard.ejs atau dashboard-generation.js)
2. **Extract tempo value** from `#audio-tempo` hidden input
3. **Add tempo to formData or settings**
4. **Append tempo to style/tags field**

**Example logic needed:**
```javascript
// When submitting audio generation
const tempo = document.getElementById('audio-tempo')?.value || '';

// Option 1: Add to settings
settings.tempo = tempo;

// Option 2: Append to style/tags (RECOMMENDED for Suno)
if (tempo && audioType === 'text-to-music') {
    let tags = formData.tags || '';
    if (tempo === 'slow') tags += ', slow tempo';
    if (tempo === 'medium') tags += ', medium tempo';
    if (tempo === 'fast') tags += ', fast tempo';
    formData.tags = tags.replace(/^,\s*/, ''); // Remove leading comma
}
```

---

## 🔍 Where to Add Backend Logic

### Step 1: Find Audio Submit Handler

Search in `dashboard.ejs` or `dashboard-generation.js` for:
```javascript
// Look for patterns like:
- runBtn.addEventListener('click', ...
- form submit for audio
- /api/generate endpoint call
- FormData creation for audio
```

### Step 2: Extract Tempo

```javascript
const tempo = document.getElementById('audio-tempo')?.value || '';
```

### Step 3: Add to Request

**For Suno (text-to-music):**
```javascript
if (audioType === 'text-to-music' && tempo) {
    // Append to tags/style field
    const tempoText = {
        'slow': 'slow tempo',
        'medium': 'medium tempo',
        'fast': 'fast tempo'
    }[tempo] || '';
    
    if (tempoText) {
        formData.tags = formData.tags ? `${formData.tags}, ${tempoText}` : tempoText;
    }
}
```

### Step 4: Backend Processing

In `src/services/sunoService.js`:
```javascript
// Tempo is already included in 'tags' which maps to 'style'
requestBody.style = tags; // Contains genre + mood + tempo
```

**No changes needed in sunoService.js** - tempo will be part of style description!

---

## 🎯 Testing Checklist

### Frontend (Already Working) ✅
- [x] Tempo container hidden by default
- [x] Tempo shown when select "Text to Music"
- [x] Tempo hidden when select "Text to Speech" or "Text to Audio"
- [x] Tempo buttons clickable and change active state
- [x] Hidden input updated on selection
- [x] CSS styling looks good (orange theme)
- [x] Responsive on mobile

### Backend (TODO) ❌
- [ ] Tempo value extracted from form
- [ ] Tempo added to tags/style field
- [ ] Tempo sent to Suno API as part of style
- [ ] Generated music reflects selected tempo
- [ ] Console logs show tempo in request

---

## 💡 Implementation Notes

### Why Append to Tags/Style?

Suno API doesn't have explicit `tempo` parameter. Instead, tempo is described textually in the `style` field:

```
style: "pop, upbeat, fast tempo" ← Works!
```

This is how Suno interprets tempo:
- "slow tempo" → 60-80 BPM ballads
- "medium tempo" → 90-120 BPM standard pop/rock
- "fast tempo" → 130+ BPM dance/electronic

### Auto Option

When tempo is set to "Auto" (empty string), don't append anything to tags. Let Suno decide based on genre and mood.

---

## 📁 Files Modified

1. **`src/views/auth/dashboard.ejs`**
   - Line 1202-1255: Tempo HTML UI
   - Line 203-237: Tempo CSS styling
   - Line 4363-4404: Tempo JavaScript logic

2. **Next: Need to modify form submission** (location TBD)
   - Extract tempo value
   - Append to tags/style
   - Send to backend

---

## 🚀 Deployment

### Completed:
1. ✅ HTML UI added
2. ✅ CSS styling added
3. ✅ JavaScript show/hide logic added
4. ✅ Button state management added

### Remaining:
5. ❌ Backend integration (append tempo to tags)
6. ❌ Test with actual Suno generation

### How to Complete:

1. Find audio generation submit function
2. Add 3-5 lines of code to extract tempo and append to tags
3. Test generation with each tempo option
4. Verify music reflects selected tempo

---

**Status**: 🟡 80% Complete (UI done, backend pending)  
**Created**: October 30, 2025  
**Next Step**: Find and update audio generation submit handler

