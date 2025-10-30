# 💰 Pop-up Add Credits Feature - Complete Guide

> **Fitur popup simple dan keren di dashboard untuk top-up credits dengan harga yang bisa diatur admin**

---

## 🎉 Fitur yang Dibuat

### ✅ User Side (Dashboard):
1. **Popup Modal Add Credits**
   - Design modern sesuai tema dark dashboard
   - Backdrop blur effect
   - Smooth animations
   
2. **Pilihan Credits:**
   - Quick buttons: **100 Credits** dan **200 Credits**
   - **Input manual** untuk custom amount (min 10 credits)
   - Auto-calculate price real-time
   
3. **Price Summary:**
   - Tampilkan jumlah credits
   - Harga per credit
   - Total pembayaran
   - Example calculations

4. **Flow Integration:**
   - Click tombol + → Popup muncul
   - Pilih/input credits → Lihat summary
   - Click "Lanjutkan Pembayaran" → Redirect ke halaman payment dengan credits pre-selected

### ✅ Admin Side (Settings):
1. **Credit Price Management**
   - Set harga per credit (default: Rp 2.000)
   - Minimum: Rp 1.000
   - Quick select buttons: 1000, 1500, 2000, 2500, 3000
   - Live preview dengan contoh perhitungan
   
2. **Admin Control:**
   - Update harga kapan saja
   - Auto-save ke database
   - Activity logging
   - Real-time sync ke user popup

---

## 🚀 Cara Setup

### 1. Initialize Credit Price Config

Run script untuk set default price (Rp 2.000):

```bash
npm run init:credit-price
```

**Output:**
```
✅ Credit price config initialized successfully!
   Default price: Rp 2.000 per credit
```

### 2. Test User Flow

1. **Login sebagai user**
2. **Buka dashboard**: `/dashboard`
3. **Klik tombol + (kuning)** di header
4. **Popup akan muncul**
5. **Pilih credits:**
   - Click "100 Credits" → Otomatis calculate: Rp 200.000
   - Click "200 Credits" → Otomatis calculate: Rp 400.000
   - Atau input manual: 150 → Rp 300.000
6. **Click "Lanjutkan Pembayaran"**
7. **Redirect ke halaman payment** dengan credits pre-selected

### 3. Test Admin Control

1. **Login sebagai admin**
2. **Buka settings**: `/admin/settings`
3. **Scroll ke section "Credit Price (Top-Up)"**
4. **Update harga:**
   - Ganti dari Rp 2.000 ke Rp 2.500
   - Click "Update Price"
   - Success message muncul
5. **Test di user side:**
   - Buka dashboard user
   - Click + → Popup shows new price
   - 100 credits now = Rp 250.000

---

## 💻 Technical Implementation

### Files Created/Modified:

#### 1. Database Config Script
```
src/scripts/initCreditPriceConfig.js
```
- Initialize default credit price
- Insert to `pricing_config` table
- Key: `credit_price_idr`, Value: `2000`

#### 2. Payment Controller Updates
```
src/controllers/paymentController.js
```
**New Endpoint:**
- `GET /api/payment/credit-price` - Get current price

**Updated:**
- `renderTopUpPage()` - Handle credits parameter

#### 3. Payment Routes
```
src/routes/payment.js
```
**Added:**
```javascript
router.get('/credit-price', ensureAuthenticated, paymentController.getCreditPrice);
```

#### 4. Admin Controller
```
src/controllers/adminController.js
```
**New Functions:**
- `getCreditPrice()` - Get credit price (admin)
- `updateCreditPrice()` - Update credit price

#### 5. Admin Routes
```
src/routes/admin.js
```
**Added:**
```javascript
router.get('/api/credit-price', adminController.getCreditPrice);
router.put('/api/credit-price', adminController.updateCreditPrice);
```

#### 6. Dashboard UI
```
src/views/auth/dashboard.ejs
```
**Changes:**
- Button `<a>` changed to `<button onclick="openTopUpModal()">`
- Added full popup modal HTML
- Added JavaScript functions for modal management

#### 7. Admin Settings UI
```
src/views/admin/settings.ejs
```
**Added:**
- New section "Credit Price (Top-Up)"
- Price input with live preview
- Example calculations
- Save functionality

---

## 🎨 UI/UX Design

### Popup Modal Design:

**Header:**
- 💰 Icon with gradient yellow background
- Title: "Top Up Credits"
- Subtitle: "Pilih atau masukkan jumlah credits"
- Close button (X)

**Body:**
```
┌────────────────────────────────────┐
│ Saldo Saat Ini: 50 Credits        │ (Yellow gradient box)
├────────────────────────────────────┤
│ Pilih Jumlah Credits:              │
│ ┌──────────┐  ┌──────────┐        │
│ │   100    │  │   200    │        │ (Clickable cards)
│ │ Credits  │  │ Credits  │        │
│ │Rp 200.000│  │Rp 400.000│        │
│ └──────────┘  └──────────┘        │
├────────────────────────────────────┤
│ Atau Masukkan Jumlah Custom       │
│ [150 Credits          ]            │ (Number input)
├────────────────────────────────────┤
│ Jumlah Credits: 150 Credits       │ (Summary box)
│ Harga per Credit: Rp 2.000        │ (Blue gradient)
│ ───────────────────────────        │
│ Total Pembayaran: Rp 300.000      │
└────────────────────────────────────┘

[Batal] [Lanjutkan Pembayaran]
```

**Styling:**
- Dark theme matching dashboard
- Gradient backgrounds (yellow for credits, blue for summary)
- Smooth hover effects
- Scale animations on hover
- Border highlight on selection

---

## 🔧 API Endpoints

### User Endpoints:

#### Get Credit Price
```http
GET /api/payment/credit-price
Authorization: Required (user logged in)

Response:
{
  "success": true,
  "price": 2000
}
```

#### Top-Up with Credits Pre-selected
```http
GET /api/payment/top-up?credits=100
Authorization: Required

Response: HTML page with 100 credits pre-selected
```

### Admin Endpoints:

#### Get Credit Price
```http
GET /admin/api/credit-price
Authorization: Required (admin only)

Response:
{
  "success": true,
  "price": 2000
}
```

#### Update Credit Price
```http
PUT /admin/api/credit-price
Authorization: Required (admin only)
Content-Type: application/json

Body:
{
  "price": 2500
}

Response:
{
  "success": true,
  "message": "Credit price updated successfully",
  "price": 2500
}
```

---

## 🗄️ Database Schema

### Table: `pricing_config`

**Config untuk Credit Price:**
```sql
INSERT INTO pricing_config (config_key, config_value, description)
VALUES (
  'credit_price_idr',
  '2000',
  'Harga per 1 credit dalam Rupiah (untuk top-up)'
);
```

**Fields:**
- `config_key`: `'credit_price_idr'`
- `config_value`: `'2000'` (string, will be parsed to int)
- `description`: Description text

**Query Examples:**
```sql
-- Get current price
SELECT config_value FROM pricing_config 
WHERE config_key = 'credit_price_idr';

-- Update price
UPDATE pricing_config 
SET config_value = '2500', updated_at = CURRENT_TIMESTAMP
WHERE config_key = 'credit_price_idr';
```

---

## 📊 Price Calculation Logic

### User Input → Amount:
```javascript
const credits = 100;  // User input
const pricePerCredit = 2000;  // From database

const totalAmount = credits * pricePerCredit;
// 100 × 2000 = 200,000
```

### Amount → Credits (di halaman payment):
```javascript
const amount = 200000;  // User payment
const pricePerCredit = 2000;  // From database

const credits = Math.floor(amount / pricePerCredit);
// 200,000 ÷ 2000 = 100 credits
```

**Note:** Pembulatan menggunakan `Math.floor()` untuk memastikan tidak over-credit.

---

## 🎯 User Flow Diagram

```
User Dashboard
     ↓
Click + button (Top Up)
     ↓
Popup Modal Muncul
     ↓
Select Credits:
  • Click 100 → Price: Rp 200.000
  • Click 200 → Price: Rp 400.000
  • Input 150 → Price: Rp 300.000
     ↓
Click "Lanjutkan Pembayaran"
     ↓
Redirect to: /api/payment/top-up?credits=150
     ↓
Payment Page (pre-selected 150 credits)
     ↓
Select Payment Method (VA, E-Wallet, QRIS, dll)
     ↓
Complete Payment
     ↓
Credits Added Automatically ✅
```

---

## 🛠️ Admin Flow Diagram

```
Admin Settings (/admin/settings)
     ↓
Scroll to "Credit Price (Top-Up)"
     ↓
Current Price: Rp 2.000
     ↓
Update Price:
  • Input: 2500
  • Or click quick button: [Rp 2.500]
     ↓
See Live Preview:
  • 100 credits = Rp 250.000
  • 200 credits = Rp 500.000
  • 500 credits = Rp 1.250.000
     ↓
Click "Update Price"
     ↓
Success! ✅
     ↓
Activity Logged to database
     ↓
All user popups now show new price
```

---

## ⚙️ Configuration

### Default Values:
```javascript
{
  credit_price_idr: 2000,     // Rp 2.000 per credit
  minimum_price: 1000,        // Rp 1.000 (enforced)
  minimum_credits: 10,        // 10 credits minimum order
  quick_buttons: [100, 200]   // Quick select buttons
}
```

### Customization:

**Change Quick Button Values (Dashboard):**
Edit `src/views/auth/dashboard.ejs`:
```html
<button onclick="selectCredits(100)">100 Credits</button>
<button onclick="selectCredits(200)">200 Credits</button>
<!-- Add more buttons: -->
<button onclick="selectCredits(500)">500 Credits</button>
```

**Change Price Suggestions (Admin):**
Edit `src/views/admin/settings.ejs`:
```html
<button onclick="setPrice(1000)">Rp 1.000</button>
<button onclick="setPrice(2000)">Rp 2.000</button>
<!-- Add more: -->
<button onclick="setPrice(5000)">Rp 5.000</button>
```

---

## 📝 NPM Scripts

### New Script:
```bash
npm run init:credit-price
```
**Function:** Initialize credit price config in database (default: Rp 2.000)

**When to run:**
- First time setup
- After database reset
- If config deleted

---

## ✅ Testing Checklist

### User Side:
- [ ] Click + button → Popup opens
- [ ] Click "Batal" → Popup closes
- [ ] Click backdrop → Popup closes
- [ ] Select 100 credits → Shows Rp 200.000
- [ ] Select 200 credits → Shows Rp 400.000
- [ ] Input 150 → Shows Rp 300.000
- [ ] Input < 10 → Button disabled
- [ ] Click "Lanjutkan Pembayaran" → Redirects correctly
- [ ] Payment page shows pre-selected credits

### Admin Side:
- [ ] Open /admin/settings → Credit Price section visible
- [ ] Current price loaded correctly
- [ ] Change price → Live preview updates
- [ ] Click quick button → Price filled
- [ ] Update price < 1000 → Error message
- [ ] Update price ≥ 1000 → Success message
- [ ] Check activity logs → Update logged
- [ ] Open user popup → New price shown

---

## 🐛 Troubleshooting

### Problem: Popup not opening

**Solution:**
```javascript
// Check console for errors
// Verify function exists:
console.log(typeof openTopUpModal);  // Should be "function"
```

### Problem: Price always shows Rp 2.000 in popup

**Solution:**
```bash
# 1. Check if config exists in database
psql -d pixelnest_db -c "SELECT * FROM pricing_config WHERE config_key = 'credit_price_idr';"

# 2. If not exists, run:
npm run init:credit-price

# 3. Or manually insert:
INSERT INTO pricing_config (config_key, config_value, description)
VALUES ('credit_price_idr', '2000', 'Harga per 1 credit dalam Rupiah');
```

### Problem: Admin can't update price

**Solution:**
```bash
# Check admin role:
SELECT id, email, role FROM users WHERE role = 'admin';

# Check route is registered:
# Open server.js and verify admin routes are loaded
```

### Problem: Price not syncing between admin and user

**Solution:**
- Price is fetched on popup open
- If admin updates price, user needs to:
  1. Close popup
  2. Re-open popup (will fetch new price)
- Or refresh page

---

## 🎊 Summary

### What Was Built:

**User Experience:**
- ✅ Simple, keren popup di dashboard
- ✅ Pilihan 100 dan 200 credits
- ✅ Input manual untuk custom amount
- ✅ Real-time price calculation
- ✅ Smooth flow ke payment page

**Admin Control:**
- ✅ Interface untuk set harga credit
- ✅ Harga default: Rp 2.000
- ✅ Admin bisa ubah kapan saja
- ✅ Live preview & examples
- ✅ Activity logging

**Technical:**
- ✅ Database config table
- ✅ API endpoints (user & admin)
- ✅ Controller functions
- ✅ Routes registered
- ✅ UI/UX implementation

---

## 🚀 Next Steps

**For Development:**
1. Run `npm run init:credit-price`
2. Test user flow
3. Test admin flow
4. Verify price sync

**For Production:**
1. Set appropriate price (not default Rp 2.000)
2. Test with real users
3. Monitor payment transactions
4. Adjust price based on market

---

**Fitur sudah SELESAI dan SIAP DIGUNAKAN!** 🎉

*Happy coding! 💰✨*

