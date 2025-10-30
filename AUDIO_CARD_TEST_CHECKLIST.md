# ✅ Audio Card Testing Checklist

## 🎯 Quick Test Plan

### Pre-Test Setup
- [ ] Clear browser cache
- [ ] Open browser dev tools (F12)
- [ ] Check console for errors
- [ ] Test on Chrome/Firefox/Safari

---

## 📋 Test Scenarios

### Test 1: **Short Prompt (< 150 chars)** ✅

**Steps:**
1. Go to dashboard → Audio tab
2. Enter prompt: "A peaceful piano melody"
3. Generate audio
4. Wait for result card

**Expected Results:**
- [ ] Badge row shows: [🎵 Audio] [⏱ 5s] [🤖 model-name]
- [ ] Prompt displays fully: "A peaceful piano melody"
- [ ] **NO** "Read more" button appears
- [ ] Credits show as "1.00 credits" (or actual value)
- [ ] Download button shows icon only
- [ ] Delete button shows icon only

**Pass Criteria:** ✅ All items checked

---

### Test 2: **Long Prompt (> 150 chars)** ✅

**Steps:**
1. Go to dashboard → Audio tab
2. Enter prompt:
   ```
   A slow, hypnotic instrumental soundtrack with a very minimal tempo, 
   centered on the soft, breathy sound of bamboo flute. The melody flows 
   gently like a meditative lullaby, weaving long sustained notes that 
   echo in a calm, spacious atmosphere. Background textures include distant 
   rumbling thunder, subtle water dripping, faint crackling fire, and soft 
   ambient drones to create a deeply immersive and tranquil experience.
   ```
3. Generate audio
4. Wait for result card

**Expected Results:**
- [ ] Badge row shows: [🎵 Audio] [⏱ Xs] [🤖 model-name]
- [ ] Prompt truncated at ~150 chars with "..."
- [ ] "Read more →" button appears below prompt
- [ ] Button has cyan color (text-cyan-400)
- [ ] Button has chevron-right icon
- [ ] Credits show actual value (e.g., "1.00 credits")

**Pass Criteria:** ✅ All items checked

---

### Test 3: **Badge Responsiveness** 📱

**Desktop (> 768px):**
- [ ] All 3 badges in one row
- [ ] Badges have proper spacing (gap-1.5)
- [ ] Model name truncates if too long
- [ ] Hover on model badge shows full name (title tooltip)

**Tablet (640px - 768px):**
- [ ] Badges wrap to multiple rows if needed
- [ ] Each badge remains intact (no breaking mid-badge)

**Mobile (< 640px):**
- [ ] Badge layout adjusts properly
- [ ] Text remains readable
- [ ] No horizontal scroll

**Pass Criteria:** ✅ All screen sizes work

---

### Test 4: **Modal Popup Functionality** 🎭

**Steps:**
1. Generate audio with long prompt
2. Click "Read more" button
3. Modal should appear

**Expected Modal Contents:**
- [ ] Modal backdrop fades in smoothly
- [ ] Modal content scales in (animate-scaleIn)
- [ ] Header shows: "🎵 Audio Generation Details"
- [ ] Full prompt displayed (no truncation)
- [ ] Model name shown with mono font
- [ ] Duration displayed (e.g., "5 seconds")
- [ ] Credits shown with 2 decimals (e.g., "1.00")
- [ ] Timestamp in long format (e.g., "28 Oktober 2025, 12:33")
- [ ] Additional settings section (if any)

**Pass Criteria:** ✅ All metadata displayed correctly

---

### Test 5: **Modal Close Functionality** ❌

**Test Close Button:**
- [ ] Click X button in top-right
- [ ] Modal closes immediately
- [ ] No console errors

**Test Click Outside:**
- [ ] Click on dark backdrop (outside modal)
- [ ] Modal closes
- [ ] No console errors

**Test ESC Key:**
- [ ] Press ESC key
- [ ] Modal closes (browser default behavior)

**Pass Criteria:** ✅ All close methods work

---

### Test 6: **Button Hover States** 🎯

**Badges:**
- [ ] No hover effect (static display)

**Read More Button:**
- [ ] Hover changes color: cyan-400 → cyan-300
- [ ] Smooth transition (300ms)
- [ ] Cursor changes to pointer

**Download Button:**
- [ ] Hover scales to 105%
- [ ] Background brightens (cyan-600 → cyan-700)
- [ ] Shadow increases

**Delete Button:**
- [ ] Hover scales to 105%
- [ ] Background brightens (red-600 → red-700)
- [ ] Shadow increases

**Pass Criteria:** ✅ All hovers smooth and consistent

---

### Test 7: **Badge Text & Icons** 🎨

**Type Badge (Audio):**
- [ ] Icon: `fa-music`
- [ ] Text: "Audio" (or subtype like "Text-to-Speech")
- [ ] Color: cyan-300
- [ ] Background: cyan-500/20
- [ ] Border: cyan-500/30

**Duration Badge:**
- [ ] Icon: `fa-clock`
- [ ] Text: "5s" (or actual duration)
- [ ] Color: gray-300
- [ ] Background: gray-700/30
- [ ] Border: gray-600/30

**Model Badge:**
- [ ] Icon: `fa-robot`
- [ ] Text: Model name (truncated if long)
- [ ] Color: gray-400
- [ ] Background: gray-700/30
- [ ] Tooltip shows full name on hover

**Pass Criteria:** ✅ All badges render correctly

---

### Test 8: **Credits Display** 💰

**In Card:**
- [ ] Shows actual credit amount
- [ ] Formatted to 2 decimals (e.g., "1.00")
- [ ] Yellow color (text-yellow-400)
- [ ] Icon: `fa-coins`

**In Modal:**
- [ ] Same value as card
- [ ] Formatted to 2 decimals
- [ ] Larger font (text-lg)
- [ ] Bold (font-bold)

**Pass Criteria:** ✅ Credits accurate and consistent

---

### Test 9: **Multiple Cards** 📚

**Steps:**
1. Generate 3-5 audio files
2. Check result display area

**Expected Results:**
- [ ] All cards display consistently
- [ ] Badge sizes uniform across cards
- [ ] "Read more" appears only for long prompts
- [ ] Each modal shows correct data for its card
- [ ] No layout shift between cards
- [ ] Smooth scrolling through results

**Pass Criteria:** ✅ Consistent display across all cards

---

### Test 10: **Mobile Modal** 📱

**Steps:**
1. Open on mobile device (or Chrome DevTools mobile view)
2. Generate audio with long prompt
3. Click "Read more"

**Expected Mobile Modal:**
- [ ] Modal fits within viewport
- [ ] Content scrollable if too long
- [ ] Close button easily tappable
- [ ] Metadata grid stacks to 1 column
- [ ] Text readable without zoom
- [ ] No horizontal scroll in modal

**Pass Criteria:** ✅ Modal fully functional on mobile

---

## 🐛 Error Scenarios

### Scenario 1: **Missing Metadata**
**Condition:** metadata = null or undefined

**Expected Behavior:**
- [ ] Shows "Generated audio" for prompt
- [ ] Shows "Unknown model" for model
- [ ] Shows "0.00 credits" for cost
- [ ] No crash or console errors

### Scenario 2: **Very Long Model Name**
**Condition:** Model name > 50 characters

**Expected Behavior:**
- [ ] Badge truncates with `truncate` class
- [ ] Tooltip shows full name on hover
- [ ] No layout break
- [ ] Badge stays in badge row

### Scenario 3: **Special Characters in Prompt**
**Condition:** Prompt contains quotes, HTML, emojis

**Expected Behavior:**
- [ ] Prompt displays safely (no XSS)
- [ ] Special chars render correctly
- [ ] Modal shows same content
- [ ] No console errors

---

## 🎨 Visual Inspection Checklist

### Card Layout
- [ ] Badge row clean and aligned
- [ ] Adequate spacing between elements
- [ ] Prompt text has good line height
- [ ] Bottom row (date & credits) separated with border
- [ ] No overlapping elements

### Typography
- [ ] Badge text readable (text-xs)
- [ ] Prompt text clear (text-sm)
- [ ] Date/credits text subtle (text-xs)
- [ ] Font weights appropriate
- [ ] No text cut off

### Colors & Contrast
- [ ] Badge colors distinct but harmonious
- [ ] Text readable against backgrounds
- [ ] Hover states clearly visible
- [ ] Modal backdrop not too dark/light
- [ ] Yellow credits stand out

### Spacing & Padding
- [ ] Badge padding compact but not cramped
- [ ] Gap between badges consistent
- [ ] Card padding comfortable
- [ ] Modal content not touching edges
- [ ] Metadata grid spacing balanced

---

## 🚀 Performance Checks

### Speed
- [ ] Card renders quickly (< 100ms)
- [ ] Modal opens instantly (< 300ms with animation)
- [ ] No lag when scrolling cards
- [ ] Smooth hover transitions

### Console
- [ ] No JavaScript errors
- [ ] No React/Vue warnings (if applicable)
- [ ] No CSS warnings
- [ ] No 404 for assets

### Network
- [ ] CSS loaded successfully
- [ ] Icons (Font Awesome) loaded
- [ ] No unnecessary re-fetches

---

## ✅ Final Acceptance Criteria

All tests must pass for deployment:

- ✅ **Functionality:** All features work as designed
- ✅ **Responsiveness:** Works on all screen sizes
- ✅ **Accessibility:** Keyboard and screen reader friendly
- ✅ **Performance:** Fast and smooth
- ✅ **Visual:** Matches design specifications
- ✅ **Cross-browser:** Chrome, Firefox, Safari compatible
- ✅ **Error handling:** Graceful degradation for missing data
- ✅ **Consistency:** Uniform across multiple cards

---

## 📊 Test Results Template

```
Date: _______________
Tester: _____________
Browser: ____________
Device: _____________

Test Results:
- Test 1 (Short Prompt):        [ PASS / FAIL ]
- Test 2 (Long Prompt):          [ PASS / FAIL ]
- Test 3 (Responsiveness):       [ PASS / FAIL ]
- Test 4 (Modal Open):           [ PASS / FAIL ]
- Test 5 (Modal Close):          [ PASS / FAIL ]
- Test 6 (Hover States):         [ PASS / FAIL ]
- Test 7 (Badge Display):        [ PASS / FAIL ]
- Test 8 (Credits Display):      [ PASS / FAIL ]
- Test 9 (Multiple Cards):       [ PASS / FAIL ]
- Test 10 (Mobile Modal):        [ PASS / FAIL ]

Issues Found:
1. _________________________________
2. _________________________________
3. _________________________________

Overall Status: [ ✅ PASS / ❌ FAIL ]

Notes:
_____________________________________
_____________________________________
```

---

**Ready for Production:** After all tests pass ✅

**Estimated Test Time:** ~30 minutes for complete testing

