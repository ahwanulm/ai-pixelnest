# 💳 Popup Payment Flow - Complete Guide

> **Sistem pembayaran lengkap dalam satu popup modal di dashboard**

---

## 🎉 Fitur Baru

### ✅ Multi-Step Modal Payment
Semua proses payment sekarang dilakukan dalam **SATU POPUP MODAL** tanpa redirect:

```
Step 1: Pilih Credits
    ↓
Step 2: Pilih Payment Method  
    ↓
Step 3: Payment Instructions
```

**Tidak ada redirect ke halaman lain!** Semua dalam popup yang sama.

---

## 🚀 User Flow

### Step 1: Pilih Credits
```
1. User klik tombol + di dashboard
2. Popup muncul (Step 1)
3. User pilih:
   - Quick buttons: 100 atau 200 credits
   - Custom input: masukkan jumlah (min 10)
4. Lihat summary & total harga
5. Klik "Pilih Metode Pembayaran"
```

**UI Elements:**
- Current balance display
- 2 Quick buttons (100, 200 credits)
- Custom input field
- Price summary box
- Button: "Pilih Metode Pembayaran"

### Step 2: Pilih Payment Method
```
6. Popup berubah ke Step 2 (tetap di modal yang sama)
7. Summary credits & amount ditampilkan di atas
8. User lihat payment methods:
   - 💳 Virtual Account (BCA, BRI, Mandiri, dll)
   - 📱 E-Wallet (OVO, DANA, ShopeePay, dll)
   - 📷 QRIS
   - 🏪 Retail (Alfamart, Indomaret)
9. User klik salah satu method
10. Button "Konfirmasi Pembayaran" enabled
11. Klik "Konfirmasi Pembayaran"
```

**UI Elements:**
- Summary box (credits & amount)
- Payment methods list (grouped by type)
- Button "Kembali" (back to step 1)
- Button "Konfirmasi Pembayaran"

### Step 3: Payment Instructions
```
12. Popup berubah ke Step 3 (tetap di modal yang sama)
13. Success message ditampilkan
14. Payment instructions:
    - VA Number (untuk Virtual Account)
    - QR Code (untuk QRIS)
    - Payment code (untuk retail)
15. User dapat:
    - Copy payment code
    - Scan QR code
    - Klik "Bayar Sekarang" (jika ada checkout URL)
16. Credits otomatis masuk setelah bayar ✅
```

**UI Elements:**
- Success notification
- Payment details (method, credits, total)
- Payment code/VA number (with copy button)
- QR Code (if applicable)
- Expiry time
- Button "Bayar Sekarang" (if available)
- Button "Selesai"

---

## 🎨 UI/UX Design

### Modal Size & Position
```css
max-width: 2xl (32rem / 512px)
max-height: 90vh
overflow-y: auto
position: center of screen
backdrop: blur + dark overlay
```

### Dark Theme Consistent
- Background: `gradient-to-br from-zinc-900 to-zinc-950`
- Glass cards: `bg-white/5` with backdrop-filter
- Yellow accent: `from-yellow-500 to-yellow-600`
- Border: `border-white/10`

### Sticky Header
Header tetap di atas saat scroll:
- Title & subtitle berubah per step
- Back button muncul di step 2 & 3
- Close button (X) selalu ada

### Animations
- Smooth transitions antara steps
- Hover effects pada buttons & cards
- Scale transform pada selection
- Shadow glow pada active elements

---

## 💻 Technical Implementation

### HTML Structure

```html
<!-- Modal Container -->
<div id="topUpModal">
  <!-- Modal Card -->
  <div class="max-w-2xl max-h-[90vh]">
    
    <!-- Sticky Header -->
    <div class="sticky top-0">
      <button id="backToCreditsBtn" /> <!-- Back button -->
      <h2 id="modalTitle">Top Up Credits</h2>
      <p id="modalSubtitle">Pilih credits</p>
      <button onclick="closeTopUpModal()" /> <!-- Close (X) -->
    </div>

    <!-- Step 1: Credits Selection -->
    <div id="creditsStep">
      <!-- Current balance, Quick buttons, Custom input, Summary -->
    </div>

    <!-- Step 2: Payment Methods -->
    <div id="paymentMethodsStep" class="hidden">
      <!-- Summary, Payment channels list -->
    </div>

    <!-- Step 3: Instructions -->
    <div id="paymentInstructionsStep" class="hidden">
      <!-- Dynamically filled -->
    </div>
  </div>
</div>
```

### JavaScript Functions

#### Step Navigation
```javascript
// Show step 2
function showPaymentMethodsStep() {
  // Hide step 1, show step 2
  // Update header title & subtitle
  // Load payment channels
}

// Show step 1 (back)
function showCreditsStep() {
  // Show step 1, hide others
  // Reset header
}
```

#### Payment Methods
```javascript
// Load from API
async function loadPaymentChannels() {
  const response = await fetch('/api/payment/channels');
  renderPaymentChannels(data);
}

// Render grouped channels
function renderPaymentChannels() {
  // Group: Virtual Account, E-Wallet, QRIS, Retail
  // Render as clickable cards
}

// Select method
function selectPaymentMethod(code, name) {
  selectedPaymentMethod = { code, name };
  // Highlight selected card
  // Enable confirm button
}
```

#### Create Payment
```javascript
async function createPayment() {
  const amount = selectedCreditsAmount * creditPriceIDR;
  
  const response = await fetch('/api/payment/create', {
    method: 'POST',
    body: JSON.stringify({ amount, paymentMethod })
  });
  
  if (success) {
    showPaymentInstructions(paymentData);
  }
}
```

#### Show Instructions
```javascript
function showPaymentInstructions(paymentData) {
  // Hide step 2, show step 3
  // Update header
  // Build HTML:
  //   - Success message
  //   - Payment details
  //   - VA number / QR code
  //   - Copy button
  //   - Action buttons
}
```

#### Helper Functions
```javascript
// Copy to clipboard
function copyToClipboard(text) {
  navigator.clipboard.writeText(text);
  alert('✅ Kode berhasil dicopy!');
}

// Format group name
function formatGroupName(group) {
  const names = {
    'Virtual Account': '💳 Virtual Account',
    'E-Wallet': '📱 E-Wallet',
    'Retail': '🏪 Retail',
    'QRIS': '📷 QRIS'
  };
  return names[group] || group;
}

// Reset form
function resetForm() {
  selectedCreditsAmount = 0;
  selectedPaymentMethod = null;
  showCreditsStep(); // Back to step 1
}
```

---

## 🔄 State Management

### Global Variables
```javascript
let selectedCreditsAmount = 0;      // Credits yang dipilih
let selectedPaymentMethod = null;   // { code, name }
let creditPriceIDR = 2000;          // Default price
let paymentChannels = {};           // Loaded channels
```

### Button States
```javascript
// Step 1
proceedPaymentBtn.disabled = selectedCreditsAmount < 10;

// Step 2
confirmPaymentBtn.disabled = !selectedPaymentMethod;
```

### Visual States
```javascript
// Selected credit button
.classList.add('border-yellow-500', 'bg-yellow-500/10')

// Selected payment method
.classList.add('border-yellow-500', 'bg-yellow-500/10')
```

---

## 📊 API Endpoints Used

### 1. Get Credit Price
```http
GET /api/payment/credit-price

Response:
{
  "success": true,
  "price": 2000
}
```

### 2. Get Payment Channels
```http
GET /api/payment/channels

Response:
{
  "success": true,
  "data": {
    "Virtual Account": [...],
    "E-Wallet": [...],
    ...
  }
}
```

### 3. Create Payment
```http
POST /api/payment/create
Content-Type: application/json

Body:
{
  "amount": 200000,
  "paymentMethod": "BRIVA"
}

Response:
{
  "success": true,
  "data": {
    "reference": "T123...",
    "paymentName": "BRI Virtual Account",
    "creditsAmount": 100,
    "amountReceived": 200000,
    "payCode": "70018123...",
    "qrUrl": "https://...",
    "checkoutUrl": "https://...",
    "expiredTime": 1234567890
  }
}
```

---

## 🎯 Benefits

### User Experience
✅ **No page reload** - Semua dalam satu popup
✅ **Fast navigation** - Step switching instant
✅ **Clear progress** - User tahu di step mana
✅ **Easy back** - Bisa kembali ke step sebelumnya
✅ **Consistent UI** - Tema dark matching dashboard

### Technical
✅ **Clean code** - Modular step functions
✅ **State management** - Clear variable tracking
✅ **Error handling** - Try-catch pada API calls
✅ **Loading states** - Spinner saat load data
✅ **Responsive** - Mobile friendly

### Performance
✅ **Lazy loading** - Payment channels loaded on demand
✅ **No full page load** - Faster UX
✅ **Minimal DOM** - Only one modal, show/hide steps
✅ **Efficient updates** - Only update changed elements

---

## 🔧 Customization

### Change Quick Button Values
Edit `dashboard.ejs` step 1:
```html
<button onclick="selectCredits(100)">100 Credits</button>
<button onclick="selectCredits(200)">200 Credits</button>
<!-- Add more: -->
<button onclick="selectCredits(500)">500 Credits</button>
```

### Change Modal Size
Edit modal container class:
```html
<!-- Current -->
<div class="max-w-2xl max-h-[90vh]">

<!-- Larger -->
<div class="max-w-4xl max-h-[95vh]">

<!-- Smaller -->
<div class="max-w-xl max-h-[85vh]">
```

### Add Animation
Edit CSS:
```css
.payment-method-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.payment-method-card:hover {
  transform: translateY(-2px) scale(1.02);
}
```

---

## 🐛 Troubleshooting

### Problem: Modal tidak muncul
**Check:**
```javascript
console.log(typeof openTopUpModal); // Should be "function"
```

### Problem: Payment channels tidak load
**Check:**
1. API endpoint: `/api/payment/channels`
2. Payment channels synced? Run: `npm run sync:tripay-channels`
3. Check console for errors

### Problem: Create payment gagal
**Check:**
1. Selected credits >= 10?
2. Selected payment method?
3. Check network tab for API response
4. Verify Tripay credentials in database

### Problem: Steps tidak switch
**Check:**
```javascript
// Debug step visibility
console.log('Step 1:', !creditsStep.classList.contains('hidden'));
console.log('Step 2:', !paymentMethodsStep.classList.contains('hidden'));
console.log('Step 3:', !paymentInstructionsStep.classList.contains('hidden'));
```

---

## ✅ Testing Checklist

### Step 1
- [ ] Popup opens on + button click
- [ ] Current balance shows correct credits
- [ ] Quick buttons work (100, 200)
- [ ] Custom input works (min 10)
- [ ] Summary updates real-time
- [ ] Button enabled when credits >= 10
- [ ] Can close modal

### Step 2
- [ ] Switches from step 1 smoothly
- [ ] Summary displays selected credits & amount
- [ ] Payment channels load
- [ ] Channels grouped correctly
- [ ] Can select a payment method
- [ ] Selected method highlighted
- [ ] Confirm button enabled after selection
- [ ] Back button works

### Step 3
- [ ] Switches from step 2 smoothly
- [ ] Success message shows
- [ ] Payment details correct
- [ ] VA number/QR code displays
- [ ] Copy button works
- [ ] Checkout URL opens (if available)
- [ ] Expiry time shows
- [ ] "Selesai" button works

---

## 📈 Future Enhancements

### Possible Improvements:
1. **Progress indicator** - Show step 1/3, 2/3, 3/3
2. **Animations** - Slide transition between steps
3. **Save payment method** - Remember last used method
4. **Payment history** - Show in modal
5. **Auto-refresh balance** - After payment success
6. **Push notification** - When payment confirmed
7. **Countdown timer** - Show time until expired

---

## 🎊 Summary

**What We Built:**
- ✅ Multi-step payment flow dalam satu popup
- ✅ Step 1: Credits selection
- ✅ Step 2: Payment method selection  
- ✅ Step 3: Payment instructions
- ✅ Smooth navigation (forward & back)
- ✅ Consistent dark theme
- ✅ Mobile responsive
- ✅ Copy payment code feature
- ✅ QR code display
- ✅ Real-time updates

**Result:**
🎉 **User-friendly payment experience** tanpa meninggalkan dashboard!

---

**Happy Coding! 💰✨**

