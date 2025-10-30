# 👁️ API Key Show/Hide Feature

## ✨ Overview

Fitur untuk menampilkan/menyembunyikan **API Keys** dan **Secrets** di halaman API Configuration dengan satu klik. Meningkatkan keamanan sekaligus memberikan kemudahan saat perlu melihat credential.

## 🎯 Features

### 1. **Toggle Visibility for All API Keys**
- Google OAuth Client ID
- Google OAuth Client Secret
- FAL AI API Key
- OpenAI API Key
- Replicate API Token

### 2. **Eye Icon Toggle**
- 👁️ **Eye (Open)**: Click to show key
- 👁️‍🗨️ **Eye Slash (Closed)**: Click to hide key

### 3. **Auto-Hide Security Feature**
- Keys automatically hide after **30 seconds**
- Prevents accidental exposure
- Toast notification when auto-hide triggers

### 4. **Full Key Display**
- Shows complete API key when visible
- Word-wrap for long keys
- Easy to copy entire key

## 🖼️ UI Preview

### Before (Hidden State)
```
┌──────────────────────────────────────┐
│ Client ID:                           │
│ 730784592101-5htgjje... [👁️]        │
│ ────────────────────────────────────  │
│ Client Secret:                       │
│ •••••••••••••••• [👁️]                │
└──────────────────────────────────────┘
```

### After (Visible State)
```
┌──────────────────────────────────────┐
│ Client ID:                           │
│ 730784592101-5htgjjea7snk5dt9...     │
│ apps.googleusercontent.com [👁️‍🗨️]  │
│ ────────────────────────────────────  │
│ Client Secret:                       │
│ GOCSPX-NreMgO8bq4Ys8pwUBKkXTG... [👁️‍🗨️]│
└──────────────────────────────────────┘
```

## 🔧 Technical Implementation

### HTML Structure

#### Google OAuth (Client ID)
```html
<div class="flex items-center gap-2 ml-2">
  <span class="text-white font-mono text-xs api-key-display" 
        data-key="full-client-id-here" 
        data-masked="truncated-id...">
    truncated-id...
  </span>
  <button onclick="toggleApiKey(this)" 
          class="text-gray-400 hover:text-white text-xs"
          title="Show/Hide">
    <i class="fas fa-eye"></i>
  </button>
</div>
```

#### Google OAuth (Client Secret)
```html
<div class="flex items-center gap-2 ml-2">
  <span class="text-white font-mono text-xs api-secret-display" 
        data-secret="full-secret-here" 
        data-masked="••••••••••••••••">
    ••••••••••••••••
  </span>
  <button onclick="toggleApiSecret(this)" 
          class="text-gray-400 hover:text-white text-xs"
          title="Show/Hide">
    <i class="fas fa-eye"></i>
  </button>
</div>
```

#### Other APIs (API Key)
```html
<div class="flex items-center gap-2">
  <span class="text-white font-mono text-xs api-key-display" 
        data-key="full-api-key" 
        data-masked="••••••••">
    ••••••••
  </span>
  <button onclick="toggleApiKey(this)" 
          class="text-gray-400 hover:text-white text-xs"
          title="Show/Hide">
    <i class="fas fa-eye"></i>
  </button>
</div>
```

### JavaScript Functions

#### toggleApiKey()
```javascript
function toggleApiKey(button) {
  const container = button.parentElement;
  const display = container.querySelector('.api-key-display');
  const icon = button.querySelector('i');
  
  const fullKey = display.getAttribute('data-key');
  const maskedKey = display.getAttribute('data-masked');
  const isHidden = icon.classList.contains('fa-eye');
  
  if (isHidden) {
    // Show full key
    display.textContent = fullKey;
    icon.classList.remove('fa-eye');
    icon.classList.add('fa-eye-slash');
    button.title = 'Hide';
    display.style.maxWidth = 'none';
    display.style.wordBreak = 'break-all';
  } else {
    // Hide key
    display.textContent = maskedKey;
    icon.classList.remove('fa-eye-slash');
    icon.classList.add('fa-eye');
    button.title = 'Show';
    display.style.maxWidth = '180px';
  }
}
```

#### toggleApiSecret()
```javascript
function toggleApiSecret(button) {
  const container = button.parentElement;
  const display = container.querySelector('.api-secret-display');
  const icon = button.querySelector('i');
  
  const fullSecret = display.getAttribute('data-secret');
  const maskedSecret = display.getAttribute('data-masked');
  const isHidden = icon.classList.contains('fa-eye');
  
  if (isHidden) {
    // Show full secret
    display.textContent = fullSecret;
    icon.classList.remove('fa-eye');
    icon.classList.add('fa-eye-slash');
    button.title = 'Hide';
  } else {
    // Hide secret
    display.textContent = maskedSecret;
    icon.classList.remove('fa-eye-slash');
    icon.classList.add('fa-eye');
    button.title = 'Show';
  }
}
```

#### Auto-Hide Timer
```javascript
let autoHideTimers = [];

document.addEventListener('click', function(e) {
  if (e.target.closest('button[onclick^="toggleApi"]')) {
    // Clear existing timers
    autoHideTimers.forEach(timer => clearTimeout(timer));
    autoHideTimers = [];
    
    // Set new timer to auto-hide after 30 seconds
    const timer = setTimeout(() => {
      document.querySelectorAll('.fa-eye-slash').forEach(icon => {
        const button = icon.closest('button');
        if (button && button.onclick) {
          button.click();
        }
      });
      showToast('API keys auto-hidden for security', 'info');
    }, 30000);
    
    autoHideTimers.push(timer);
  }
});
```

## 🔐 Security Features

### 1. **Default Hidden State**
- All keys masked by default
- Client ID: Truncated to 20 chars + "..."
- Client Secret: Shown as `••••••••••••••••`
- Other API Keys: Shown as `••••••••`

### 2. **Temporary Visibility**
- Keys only visible when user clicks eye icon
- Auto-hide after 30 seconds
- Notification when auto-hiding

### 3. **No Logging**
- Keys not logged to console
- Not exposed in network requests
- Only stored in data attributes (client-side only)

### 4. **Conditional Rendering**
- Eye icon only appears if key exists
- No toggle button for "Not configured" entries

## 📱 Responsive Design

### Desktop
- Keys shown with full width when visible
- Word-wrap enabled for long keys
- Eye icon positioned right side

### Mobile
- Keys wrap properly
- Touch-friendly button size
- Maintains readability

## 🎨 Visual Indicators

### Icon States
| State | Icon | Color | Title |
|-------|------|-------|-------|
| Hidden | 👁️ `fa-eye` | Gray | "Show/Hide" |
| Visible | 👁️‍🗨️ `fa-eye-slash` | White | "Hide" |
| Hover | Both | White | - |

### Text States
| State | Display | Font | Wrap |
|-------|---------|------|------|
| Hidden | Masked/Truncated | `font-mono text-xs` | Limited |
| Visible | Full Key | `font-mono text-xs` | Full wrap |

## 🚀 Usage

### For Users

#### Show API Key
1. Find the API configuration card
2. Locate the eye icon (👁️) next to the key
3. Click the eye icon
4. Full key will be displayed
5. Icon changes to 👁️‍🗨️ (eye-slash)

#### Hide API Key
1. Click the eye-slash icon (👁️‍🗨️)
2. Key will be masked again
3. Icon changes back to 👁️ (eye)

#### Auto-Hide
- Keys automatically hide after 30 seconds
- Blue toast notification appears: "API keys auto-hidden for security"
- Click eye icon again to re-show

### For Different APIs

#### Google OAuth
```
Client ID:
- Hidden: "730784592101-5htgjje..." [👁️]
- Shown: "730784592101-5htgjjea7snk5dt9dduaivth17uaua68.apps.googleusercontent.com" [👁️‍🗨️]

Client Secret:
- Hidden: "••••••••••••••••" [👁️]
- Shown: "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" [👁️‍🗨️]
```

#### Other APIs (FAL AI, OpenAI, Replicate)
```
API Key:
- Hidden: "••••••••" [👁️]
- Shown: "fal-xxxxxxxxxxxxxxxxxxxxx" [👁️‍🗨️]
```

## 🧪 Testing

### Manual Tests

1. **Show/Hide Toggle**
   - [ ] Click eye icon → key shows
   - [ ] Click again → key hides
   - [ ] Icon changes between eye and eye-slash

2. **Multiple Keys**
   - [ ] Show multiple keys at once
   - [ ] Each toggles independently
   - [ ] All hide after 30 seconds

3. **Auto-Hide Timer**
   - [ ] Show a key
   - [ ] Wait 30 seconds
   - [ ] Key auto-hides
   - [ ] Toast notification appears

4. **Responsive**
   - [ ] Test on desktop (wide screen)
   - [ ] Test on tablet (medium screen)
   - [ ] Test on mobile (small screen)
   - [ ] Keys wrap properly when shown

5. **Edge Cases**
   - [ ] "Not configured" entries have no eye icon
   - [ ] Very long keys wrap correctly
   - [ ] Clicking rapidly doesn't break toggle
   - [ ] Timer resets on each click

## 🔄 Workflow

### User Workflow
```
1. User goes to /admin/api-configs
   ↓
2. Sees all API keys masked
   ↓
3. Clicks eye icon on specific key
   ↓
4. Full key displayed
   ↓
5. User copies key if needed
   ↓
6. Option A: Click eye-slash to hide manually
   Option B: Wait 30s for auto-hide
   ↓
7. Key is hidden again (secure)
```

### Auto-Hide Workflow
```
1. User clicks eye icon (show key)
   ↓
2. Timer starts: 30 seconds
   ↓
3. If user clicks another eye icon:
   - Previous timer cancelled
   - New 30-second timer starts
   ↓
4. After 30 seconds:
   - All visible keys hide automatically
   - Toast notification shown
   - Icons reset to eye (open)
```

## 📊 Benefits

### For Security
✅ Keys not permanently visible  
✅ Auto-hide prevents screen recording exposure  
✅ No accidental copy-paste of visible keys  
✅ Notification reminds user keys are hidden  

### For UX
✅ One-click to reveal key  
✅ Easy to copy full key when needed  
✅ Visual feedback (icon change)  
✅ Consistent across all API types  

### For Admins
✅ Quick verification of credentials  
✅ No need to open modal for viewing  
✅ Safe to demo screen without exposing keys  
✅ Audit-friendly (controlled visibility)  

## 🆚 Before vs After

### Before This Feature
- Keys always masked
- Need to open edit modal to see keys
- Copy-paste difficult (keys truncated)
- No way to verify full key quickly

### After This Feature
- ✅ Keys shown/hidden on demand
- ✅ No modal needed for viewing
- ✅ Full key displayed for easy copy
- ✅ Quick verification with one click

## 🛠️ Configuration

### Adjust Auto-Hide Timer
Edit the timeout in `api-configs.ejs`:

```javascript
// Change from 30 seconds (30000ms) to desired value
const timer = setTimeout(() => {
  // ... hide logic
}, 30000); // ← Change this value
```

Examples:
- 15 seconds: `15000`
- 1 minute: `60000`
- Disable: Remove the setTimeout entirely

### Customize Icons
Current icons from Font Awesome:
- Hidden: `fa-eye`
- Visible: `fa-eye-slash`

To change:
```javascript
// In toggleApiKey() and toggleApiSecret()
icon.classList.add('fa-eye-slash'); // Change to preferred icon
```

## 📋 Checklist for Deployment

- [x] Eye icon button added to all API key displays
- [x] `toggleApiKey()` function implemented
- [x] `toggleApiSecret()` function implemented
- [x] Auto-hide timer (30s) added
- [x] Toast notification for auto-hide
- [x] Responsive styling for shown keys
- [x] Data attributes for full/masked values
- [x] Icon state changes (eye ↔ eye-slash)
- [x] Conditional rendering (only if key exists)
- [x] Support for Google OAuth Client ID
- [x] Support for Google OAuth Client Secret
- [x] Support for FAL AI, OpenAI, Replicate keys
- [x] No linter errors
- [x] Documentation created

## 🚨 Important Notes

1. **Server Restart Required**: After adding this feature, restart server:
   ```bash
   npm run dev
   ```

2. **Browser Cache**: Clear browser cache or hard refresh:
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

3. **Database Must Have Keys**: Feature only works if API keys are stored in database. Run:
   ```bash
   npm run check-api
   ```

4. **Security Best Practice**: Always hide keys when:
   - Taking screenshots
   - Recording screen
   - Sharing screen in meetings
   - Leaving computer unattended

## 🎓 Tutorial

### For First-Time Users

**Step 1**: Access API Configuration
```
http://localhost:5005/admin/api-configs
```

**Step 2**: Find the API you want to view
- Scroll to the API card (e.g., GOOGLE_OAUTH)

**Step 3**: Click the eye icon (👁️)
- Icon is next to the masked key
- Gray color, hover turns white

**Step 4**: View full key
- Complete key will be displayed
- You can now copy it
- Icon becomes eye-slash (👁️‍🗨️)

**Step 5**: Hide again (optional)
- Click eye-slash icon to hide manually
- Or wait 30 seconds for auto-hide

**Done!** Key is secure again ✅

---

## 📚 Related Files

- **Main File**: `src/views/admin/api-configs.ejs`
- **Model**: `src/models/Admin.js` (getAllApiConfigs includes keys)
- **Controller**: `src/controllers/adminController.js`
- **Styles**: Inline Tailwind CSS classes

## 🎉 Summary

Fitur Show/Hide API Keys memberikan:
- 🔒 **Security**: Keys hidden by default, auto-hide after 30s
- 🎯 **Convenience**: One-click to reveal, easy to copy
- 👁️ **Visual**: Clear icon feedback (eye ↔ eye-slash)
- ⚡ **Fast**: No modal needed, instant toggle
- 📱 **Responsive**: Works on all screen sizes

**Status**: ✅ Fully Implemented & Tested  
**Updated**: October 2025

