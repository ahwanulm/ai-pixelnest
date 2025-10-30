# 💳 API Configs - Tripay Complete Setup

> **Halaman API Configs sekarang menampilkan semua kolom Tripay dengan lengkap dan bekerja**

---

## ✅ Fitur Lengkap Tripay

### Kolom yang Ditampilkan:

1. ✅ **Kode Merchant** - Merchant code dari Tripay
2. ✅ **Nama Merchant** - Nama merchant Anda
3. ✅ **API Key** - API Key dari Tripay (dengan show/hide)
4. ✅ **Private Key** - Private Key dari Tripay (dengan show/hide)
5. ✅ **Callback URL** - URL untuk webhook Tripay (dengan copy button)
6. ✅ **Endpoint** - Sandbox atau Production URL

---

## 🎨 UI Design

### Card Display (Grid View)

```
┌────────────────────────────────────────────┐
│  💳 TRIPAY                      🟢 Active  │
│  https://tripay.co.id/api-sandbox          │
├────────────────────────────────────────────┤
│  Kode Merchant:      T41400                │
│  Nama Merchant:      Merchant Sandbox      │
│  API Key:            DEV-gvVnL... 👁️       │
│  Private Key:        ••••••••••••• 👁️      │
│  Callback URL:       http://...  📋 Copy   │
│  Endpoint:           Sandbox               │
├────────────────────────────────────────────┤
│  [ ⚙️ Configure ]  [ ❌ Disable ]          │
└────────────────────────────────────────────┘
```

### Visual Elements:

- **Icon**: 💳 Yellow credit card icon
- **Background**: Yellow-themed (`bg-yellow-500/20`)
- **Status Badge**: Green (Active) or Red (Inactive)
- **Show/Hide Buttons**: Eye icon for API Key & Private Key
- **Copy Button**: For Callback URL
- **Separator Lines**: Between each field

---

## 🔧 Modal Form (Edit/Configure)

### Form Fields:

```html
┌──────────────────────────────────────────────────┐
│  Configure TRIPAY                           ✕   │
├──────────────────────────────────────────────────┤
│                                                  │
│  Kode Merchant *                                 │
│  ┌──────────────────────────────────────────┐   │
│  │ T41400                                   │   │
│  └──────────────────────────────────────────┘   │
│  Merchant code dari Tripay Dashboard            │
│                                                  │
│  Nama Merchant                                   │
│  ┌──────────────────────────────────────────┐   │
│  │ Merchant Sandbox                         │   │
│  └──────────────────────────────────────────┘   │
│  Nama merchant Anda                              │
│                                                  │
│  API Key *                                       │
│  ┌──────────────────────────────────────────┐   │
│  │ ••••••••••••                            │   │
│  └──────────────────────────────────────────┘   │
│  Leave empty to keep current value               │
│                                                  │
│  Private Key *                                   │
│  ┌──────────────────────────────────────────┐   │
│  │ ••••••••••••                            │   │
│  └──────────────────────────────────────────┘   │
│  Leave empty to keep current value               │
│                                                  │
│  Callback URL *                                  │
│  ┌──────────────────────────────────────────┐   │
│  │ http://localhost:5005/api/payment/...  📋│   │
│  └──────────────────────────────────────────┘   │
│  ⚠️ IMPORTANT: Copy this exact URL               │
│  Paste ke URL Callback di Tripay Dashboard      │
│                                                  │
│  Endpoint URL *                                  │
│  ┌──────────────────────────────────────────┐   │
│  │ ▼ Sandbox (Testing)                      │   │
│  │   Production (Live)                      │   │
│  └──────────────────────────────────────────┘   │
│  Pilih Sandbox untuk testing                    │
│                                                  │
│  ℹ️ Setup Tripay Payment Gateway:                │
│  1. Login ke Tripay Dashboard                   │
│  2. Get API Credentials                          │
│  3. Copy Merchant Code                           │
│  4. Set Callback URL                             │
│  5. Choose Environment                           │
│                                                  │
│  ☑ Enable this API service                      │
│                                                  │
│  [ Cancel ]              [ 💾 Save ]            │
└──────────────────────────────────────────────────┘
```

---

## 💻 Technical Implementation

### 1. Display Card (EJS Template)

```html
<% if (config.service_name === 'TRIPAY') { %>
  <div class="p-3 bg-white/5 rounded-lg space-y-3">
    
    <!-- Kode Merchant -->
    <div class="flex items-start justify-between">
      <span class="text-gray-400 text-xs font-medium">Kode Merchant:</span>
      <span class="text-white font-mono text-xs text-right">
        <%= config.additional_config?.merchant_code || 'Not configured' %>
      </span>
    </div>
    
    <!-- Nama Merchant -->
    <div class="flex items-start justify-between">
      <span class="text-gray-400 text-xs font-medium">Nama Merchant:</span>
      <span class="text-white font-mono text-xs text-right">
        <%= config.additional_config?.merchant_name || 'Not configured' %>
      </span>
    </div>
    
    <!-- API Key (with show/hide) -->
    <div class="flex items-start justify-between">
      <span class="text-gray-400 text-xs font-medium">API Key:</span>
      <div class="flex items-center gap-2">
        <span class="text-white font-mono text-xs api-key-display" 
              data-key="<%= config.api_key || '' %>" 
              data-masked="<%= config.api_key ? config.api_key.substring(0, 15) + '...' : 'Not configured' %>">
          <%= config.api_key ? config.api_key.substring(0, 15) + '...' : 'Not configured' %>
        </span>
        <% if (config.api_key) { %>
          <button onclick="toggleApiKey(this)">
            <i class="fas fa-eye"></i>
          </button>
        <% } %>
      </div>
    </div>
    
    <!-- Private Key (with show/hide) -->
    <div class="flex items-start justify-between">
      <span class="text-gray-400 text-xs font-medium">Private Key:</span>
      <div class="flex items-center gap-2">
        <span class="text-white font-mono text-xs api-secret-display" 
              data-secret="<%= config.api_secret || '' %>" 
              data-masked="••••••••••••••••">
          ••••••••••••••••
        </span>
        <% if (config.api_secret) { %>
          <button onclick="toggleApiSecret(this)">
            <i class="fas fa-eye"></i>
          </button>
        <% } %>
      </div>
    </div>
    
    <!-- Callback URL (with copy button) -->
    <div class="space-y-1">
      <div class="flex items-center justify-between">
        <span class="text-gray-400 text-xs font-medium">Callback URL:</span>
        <button onclick="copyToClipboard('<%= config.additional_config?.callback_url %>')">
          <i class="fas fa-copy"></i> Copy
        </button>
      </div>
      <div class="p-2 bg-yellow-500/10 border border-yellow-500/30 rounded">
        <code class="text-yellow-300 text-xs">
          <%= config.additional_config?.callback_url || 'http://localhost:5005/api/payment/callback' %>
        </code>
      </div>
    </div>
    
    <!-- Endpoint -->
    <div class="flex items-start justify-between">
      <span class="text-gray-400 text-xs font-medium">Endpoint:</span>
      <span class="text-white font-mono text-xs">
        <%= config.endpoint_url || 'Not configured' %>
      </span>
    </div>
    
  </div>
<% } %>
```

### 2. Modal Form Fields (EJS)

```html
<div id="tripay-fields" class="hidden space-y-4">
  
  <!-- Kode Merchant -->
  <div>
    <label>Kode Merchant <span class="text-red-500">*</span></label>
    <input type="text" id="edit-tripay-merchant-code" 
           placeholder="T41400"
           class="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white font-mono">
  </div>
  
  <!-- Nama Merchant -->
  <div>
    <label>Nama Merchant</label>
    <input type="text" id="edit-tripay-merchant-name" 
           placeholder="Merchant Sandbox"
           class="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white">
  </div>
  
  <!-- API Key -->
  <div>
    <label>API Key <span class="text-red-500">*</span></label>
    <input type="password" id="edit-tripay-api-key" 
           placeholder="DEV-xxxxxxxxxxxxx"
           class="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white font-mono">
  </div>
  
  <!-- Private Key -->
  <div>
    <label>Private Key <span class="text-red-500">*</span></label>
    <input type="password" id="edit-tripay-private-key" 
           placeholder="xxxxx-xxxxx-xxxxx"
           class="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white font-mono">
  </div>
  
  <!-- Callback URL -->
  <div>
    <label>Callback URL <span class="text-red-500">*</span></label>
    <div class="relative">
      <input type="url" id="edit-tripay-callback-url" 
             placeholder="http://localhost:5005/api/payment/callback"
             class="w-full px-4 py-2 pr-10 rounded-lg bg-white/10 border border-white/20 text-white font-mono">
      <button type="button" onclick="copyTripayCallback()">
        <i class="fas fa-copy"></i>
      </button>
    </div>
    <div class="mt-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
      <p class="text-xs text-amber-300">
        ⚠️ IMPORTANT: Copy this exact URL
      </p>
      <p class="text-xs text-gray-400">
        Paste ke URL Callback di Tripay Dashboard
      </p>
    </div>
  </div>
  
  <!-- Endpoint -->
  <div>
    <label>Endpoint URL <span class="text-red-500">*</span></label>
    <select id="edit-tripay-endpoint"
            class="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white">
      <option value="https://tripay.co.id/api-sandbox">Sandbox (Testing)</option>
      <option value="https://tripay.co.id/api">Production (Live)</option>
    </select>
  </div>
  
</div>
```

### 3. JavaScript Functions

```javascript
// Open edit modal
function editApiConfig(serviceName) {
  const config = API_CONFIGS.find(c => c.service_name === serviceName);
  const isTripay = serviceName === 'TRIPAY';
  
  // Show/hide fields
  document.getElementById('tripay-fields').classList.toggle('hidden', !isTripay);
  
  if (isTripay) {
    // Populate fields
    document.getElementById('edit-tripay-merchant-code').value = 
      config.additional_config?.merchant_code || '';
    document.getElementById('edit-tripay-merchant-name').value = 
      config.additional_config?.merchant_name || '';
    document.getElementById('edit-tripay-api-key').value = '';
    document.getElementById('edit-tripay-private-key').value = '';
    document.getElementById('edit-tripay-callback-url').value = 
      config.additional_config?.callback_url || 'http://localhost:5005/api/payment/callback';
    document.getElementById('edit-tripay-endpoint').value = 
      config.endpoint_url || 'https://tripay.co.id/api-sandbox';
  }
  
  // Show modal
  document.getElementById('editModal').classList.remove('hidden');
  document.getElementById('editModal').classList.add('flex');
}

// Submit form
document.getElementById('editForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const serviceName = document.getElementById('edit-service_name').value;
  const isTripay = serviceName === 'TRIPAY';
  
  if (isTripay) {
    const data = {
      is_active: document.getElementById('edit-is_active').checked
    };
    
    // Get all fields
    const merchantCode = document.getElementById('edit-tripay-merchant-code').value.trim();
    const merchantName = document.getElementById('edit-tripay-merchant-name').value.trim();
    const apiKey = document.getElementById('edit-tripay-api-key').value.trim();
    const privateKey = document.getElementById('edit-tripay-private-key').value.trim();
    const callbackUrl = document.getElementById('edit-tripay-callback-url').value.trim();
    const endpointUrl = document.getElementById('edit-tripay-endpoint').value;
    
    // Build data object
    if (apiKey) data.api_key = apiKey;
    if (privateKey) data.api_secret = privateKey;
    if (endpointUrl) data.endpoint_url = endpointUrl;
    
    // Additional config
    data.additional_config = {};
    if (merchantCode) data.additional_config.merchant_code = merchantCode;
    if (merchantName) data.additional_config.merchant_name = merchantName;
    if (callbackUrl) data.additional_config.callback_url = callbackUrl;
    
    // Validate
    if (!merchantCode && !config.additional_config?.merchant_code) {
      showToast('Kode Merchant is required', 'error');
      return;
    }
    if (!apiKey && !config.api_key) {
      showToast('API Key is required', 'error');
      return;
    }
    
    // Send API request
    const result = await apiRequest('/admin/api-configs/' + serviceName, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    
    showToast('TRIPAY configuration updated successfully!', 'success');
    setTimeout(() => location.reload(), 1500);
  }
});

// Copy Tripay callback URL
function copyTripayCallback() {
  const input = document.getElementById('edit-tripay-callback-url');
  const url = input.value.trim();
  if (!url) {
    showToast('Please enter a callback URL first', 'error');
    return;
  }
  copyToClipboard(url);
}
```

---

## 🎯 Data Structure

### Database Schema (api_configs table):

```sql
CREATE TABLE api_configs (
  id SERIAL PRIMARY KEY,
  service_name VARCHAR(100) UNIQUE NOT NULL,
  api_key TEXT,                          -- Tripay API Key
  api_secret TEXT,                       -- Tripay Private Key
  endpoint_url TEXT,                     -- Sandbox or Production URL
  additional_config JSONB,               -- {
                                         --   merchant_code: "T41400",
                                         --   merchant_name: "Merchant Sandbox",
                                         --   callback_url: "http://..."
                                         -- }
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Example Data:

```json
{
  "service_name": "TRIPAY",
  "api_key": "DEV-gvVnLRQQG1drVQq3oCDm5DNmhCf6ZdwmsMc5S3BV",
  "api_secret": "UPr4R-iTY5y-Mhz7I-BfTUS-34dRC",
  "endpoint_url": "https://tripay.co.id/api-sandbox",
  "additional_config": {
    "merchant_code": "T41400",
    "merchant_name": "Merchant Sandbox",
    "callback_url": "http://localhost:5005/api/payment/callback"
  },
  "is_active": true
}
```

---

## 📊 API Request/Response

### Update Tripay Config

**Request:**
```http
PUT /admin/api-configs/TRIPAY
Content-Type: application/json

{
  "api_key": "DEV-gvVnLRQQG1drVQq3oCDm5DNmhCf6ZdwmsMc5S3BV",
  "api_secret": "UPr4R-iTY5y-Mhz7I-BfTUS-34dRC",
  "endpoint_url": "https://tripay.co.id/api-sandbox",
  "additional_config": {
    "merchant_code": "T41400",
    "merchant_name": "Merchant Sandbox",
    "callback_url": "http://localhost:5005/api/payment/callback"
  },
  "is_active": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "API configuration updated successfully",
  "envSynced": true,
  "syncStatus": {
    "inSync": true,
    "message": "Configuration synced with .env"
  }
}
```

---

## 🔐 Security Features

### 1. Show/Hide API Keys
```javascript
function toggleApiKey(button) {
  const display = button.parentElement.querySelector('.api-key-display');
  const icon = button.querySelector('i');
  
  const fullKey = display.getAttribute('data-key');
  const maskedKey = display.getAttribute('data-masked');
  const isHidden = icon.classList.contains('fa-eye');
  
  if (isHidden) {
    display.textContent = fullKey;
    icon.classList.replace('fa-eye', 'fa-eye-slash');
  } else {
    display.textContent = maskedKey;
    icon.classList.replace('fa-eye-slash', 'fa-eye');
  }
}
```

### 2. Auto-Hide After 30 Seconds
```javascript
setTimeout(() => {
  document.querySelectorAll('.fa-eye-slash').forEach(icon => {
    icon.closest('button').click(); // Hide all visible keys
  });
  showToast('API keys auto-hidden for security', 'info');
}, 30000);
```

### 3. Password Input Fields
- API Key and Private Key fields use `type="password"`
- Show placeholder text when empty
- "Leave empty to keep current value" message

---

## ✅ Summary

**What's Included:**

✅ **Complete Tripay Fields Display:**
- Kode Merchant
- Nama Merchant
- API Key (with show/hide)
- Private Key (with show/hide)
- Callback URL (with copy button)
- Endpoint (Sandbox/Production)

✅ **Full Edit Modal:**
- All 6 fields editable
- Validation for required fields
- Helpful placeholders
- Setup instructions

✅ **Security:**
- Show/hide sensitive keys
- Auto-hide after 30 seconds
- Password input fields

✅ **UX Features:**
- Copy to clipboard
- Yellow-themed for Tripay
- Clear labels & descriptions
- Responsive design

---

**File Modified:**
- `src/views/admin/api-configs.ejs` - Complete Tripay integration

**🎉 Halaman API Configs sekarang lengkap dengan semua kolom Tripay yang bekerja!**

