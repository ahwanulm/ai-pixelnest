# ✅ Claim Code Feature Implementation

## 🎯 Overview
Fitur baru di admin panel untuk membuat **Claim Code** yang berbeda dari **Promo Code**:
- **Promo Code**: Memberikan diskon saat pembelian credits
- **Claim Code**: Memberikan credits gratis langsung yang bisa di-claim di halaman billing

---

## 📁 Files Modified/Created

### 1. Migration File
**File**: `migrations/add_claim_codes.sql`

Menambahkan:
- Kolom `code_type` (VARCHAR) - nilai: 'promo' atau 'claim'
- Kolom `credit_amount` (INTEGER) - jumlah credits untuk claim code
- Nullable untuk `discount_type` dan `discount_value` (karena claim code tidak pakai)
- Sample data untuk testing

### 2. Admin Model
**File**: `src/models/Admin.js`

Changes:
- `createPromoCode()`: Support code_type dan credit_amount
- `updatePromoCode()`: Menambahkan code_type dan credit_amount di allowedFields

### 3. Admin Controller
**File**: `src/controllers/adminController.js`

No changes needed - sudah otomatis handle karena menggunakan Admin model.

### 4. Admin View (UI)
**File**: `src/views/admin/promo-codes.ejs`

Changes:
- **2 Tombol berbeda**:
  - 🏷️ "Create Promo Code" (violet) - untuk promo codes
  - 🎁 "Create Claim Code" (green) - untuk claim codes
- Table header menambahkan kolom "Code Type"
- Table body menampilkan badge berbeda untuk promo vs claim
- Modal create/edit berubah dinamis:
  - Promo type: show discount_type & discount_value fields
  - Claim type: show credit_amount field
- Update data attributes di edit button untuk include code_type dan credit_amount

### 5. User Controller
**File**: `src/controllers/userController.js`

New endpoint:
```javascript
async claimCredits(req, res) {
  // Validates claim code
  // Checks usage limits and single_use
  // Adds credits directly to user
  // Logs transaction
  // Increments uses_count
}
```

### 6. User Routes
**File**: `src/routes/user.js`

New route:
```javascript
router.post('/claim-credits', userController.claimCredits);
```

### 7. Billing Page
**File**: `src/views/auth/billing.ejs` (NEEDS RESTORE)

⚠️ File accidentally got cleared. Needs to be restored from backup and add:
- Claim Code Card (green themed)
- Input field for claim code
- Claim button
- Result display
- JavaScript claimCredits() function

---

## 🎨 UI Design

### Admin Panel - Promo Codes Page

```
┌─────────────────────────────────────────────────────────────────┐
│ Promo Code Management                                           │
│                                                                 │
│  [🏷️ Create Promo Code]  [🎁 Create Claim Code]               │
├─────────────────────────────────────────────────────────────────┤
│ Code       │ Code Type │ Type      │ Value        │ Usage │...  │
├─────────────────────────────────────────────────────────────────┤
│ WELCOME10  │ 🏷️ Promo  │ percentage│ 10%          │ 5/100 │...  │
│ BONUS50    │ 🎁 Claim  │ Direct    │ 🪙 50 Credits│ 0/500 │...  │
└─────────────────────────────────────────────────────────────────┘
```

### Billing Page - Claim Section

```
┌──────────────────────────────────────┐
│ 🎁 Claim Free Credits                │
├──────────────────────────────────────┤
│ Punya kode claim?                    │
│ [FREECREDIT100___] [🎁 Claim]        │
│                                      │
│ ✓ Credits Claimed Successfully!     │
│ Dapatkan 100 credit gratis          │
│ [🪙 +100 Credits] [💰 Balance: 500] │
│                                      │
│ ℹ️ Claim code memberikan credits    │
│    gratis langsung ke akun Anda     │
└──────────────────────────────────────┘
```

---

## 🔑 Database Schema Changes

```sql
-- Add new columns to promo_codes table
ALTER TABLE promo_codes 
  ADD COLUMN IF NOT EXISTS code_type VARCHAR(20) DEFAULT 'promo',
  ADD COLUMN IF NOT EXISTS credit_amount INTEGER DEFAULT 0;

-- Make discount fields nullable
ALTER TABLE promo_codes 
  ALTER COLUMN discount_type DROP NOT NULL,
  ALTER COLUMN discount_value DROP NOT NULL;
```

---

## 📋 API Endpoints

### Claim Credits
```
POST /api/user/claim-credits
```

**Request Body**:
```json
{
  "code": "FREECREDIT100"
}
```

**Validations**:
1. ✅ Code exists and active
2. ✅ code_type = 'claim'
3. ✅ Valid period (valid_from - valid_until)
4. ✅ Usage limit not exceeded
5. ✅ Single use check (if single_use = true)

**Success Response**:
```json
{
  "success": true,
  "message": "Credits claimed successfully!",
  "credits_claimed": 100,
  "new_balance": 600,
  "description": "Dapatkan 100 credit gratis"
}
```

**Error Response**:
```json
{
  "success": false,
  "message": "Invalid or expired claim code"
}
```

---

## 🚀 How to Use

### Admin Side - Create Claim Code

1. Login as admin
2. Go to `/admin/promo-codes`
3. Click green button **"🎁 Create Claim Code"**
4. Fill the form:
   - Code: `FREECREDIT100` (uppercase)
   - Description: `Dapatkan 100 credit gratis`
   - Credit Amount: `100`
   - Usage Limit: `100` (optional)
   - Single Use: `true` (user can only claim once)
   - Status: `Active`
   - Valid From/Until: (optional date range)
5. Click **"Create Claim Code"**

### User Side - Claim Credits

1. Login as user
2. Go to `/billing`
3. Scroll to **"Claim Free Credits"** card (green card)
4. Enter claim code: `FREECREDIT100`
5. Click **"🎁 Claim"**
6. Credits instantly added! ✨
7. Page reloads to show new balance

---

## 🎯 Key Differences

| Feature | Promo Code 🏷️ | Claim Code 🎁 |
|---------|--------------|--------------|
| **Purpose** | Discount on purchase | Free credits |
| **When Used** | During checkout | Anytime in billing |
| **Admin Button** | Violet "Create Promo Code" | Green "Create Claim Code" |
| **Required Fields** | discount_type, discount_value | credit_amount |
| **Badge Color** | Yellow/Warning | Green/Success |
| **Transaction Type** | 'promo_bonus' | 'claim_code' |
| **Apply Where** | Payment modal | Billing page |

---

## 📝 Example Claim Codes

```sql
-- 100 free credits, single use, 100 people can claim
INSERT INTO promo_codes (
  code, description, code_type, credit_amount,
  single_use, usage_limit, is_active
) VALUES (
  'FREECREDIT100',
  'Dapatkan 100 credit gratis',
  'claim',
  100,
  true,
  100,
  true
);

-- 50 credits, unlimited claims per user, 500 total claims
INSERT INTO promo_codes (
  code, description, code_type, credit_amount,
  single_use, usage_limit, is_active
) VALUES (
  'BONUS50',
  'Bonus 50 credit untuk semua user',
  'claim',
  50,
  false,
  500,
  true
);

-- New user welcome: 200 credits, single use only
INSERT INTO promo_codes (
  code, description, code_type, credit_amount,
  single_use, valid_until, is_active
) VALUES (
  'WELCOME200',
  'Selamat datang! Dapatkan 200 credits gratis',
  'claim',
  200,
  true,
  NOW() + INTERVAL '30 days',
  true
);
```

---

## ✅ Testing Checklist

- [ ] Run migration: `migrations/add_claim_codes.sql`
- [ ] Restore `billing.ejs` from backup
- [ ] Test creating claim code in admin panel
- [ ] Test creating promo code in admin panel
- [ ] Verify both types show different badges in table
- [ ] Test editing claim code
- [ ] Test editing promo code
- [ ] Test deleting both types
- [ ] Test claiming code in billing page
- [ ] Verify credits added to user account
- [ ] Test single_use validation
- [ ] Test usage_limit validation
- [ ] Test expired code validation
- [ ] Check credit_transactions log
- [ ] Check uses_count increments

---

## 🐛 Known Issues

1. ⚠️ **billing.ejs file got cleared** - needs to be restored from backup
2. After restoring, add the Claim Code card HTML and JavaScript function
3. Test the full flow end-to-end

---

## 📚 Related Files

- `PROMO_CODE_FEATURE.md` - Original promo code implementation
- `PROMO_CODES_CRUD_COMPLETE.md` - Promo code CRUD guide
- `ADMIN_PANEL_GUIDE.md` - Admin panel documentation

---

## 🎉 Summary

✅ **Completed**:
1. Migration file for database changes
2. Admin model updated
3. Admin UI with separate buttons and forms
4. API endpoint for claiming credits
5. Routes configured
6. Transaction logging
7. Validation and security checks

⚠️ **To Do**:
1. Restore billing.ejs file
2. Add Claim Code UI card
3. Add claimCredits() JavaScript function
4. Test end-to-end flow

---

**Created**: October 27, 2025  
**Status**: Ready for testing (pending billing.ejs restore)


