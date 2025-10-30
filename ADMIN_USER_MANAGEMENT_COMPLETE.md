# 🎯 Admin User Management - Complete Guide

> **Halaman admin/users dengan fitur lengkap untuk mengelola user, credits, dan melihat konten yang digenerate**

---

## ✨ Fitur Lengkap

### 1. **Lihat Semua User** (`/admin/users`)
- ✅ Tabel daftar semua users
- ✅ Search by name/email
- ✅ Filter by role (user/admin)
- ✅ Filter by status (active/inactive)
- ✅ Pagination
- ✅ Quick view credits dan generation count

### 2. **Detail User** (`/admin/users/:id`)

#### **A. User Information Card**
```
┌─────────────────────────────────────────┐
│ 👤 Avatar   Name                        │
│             Email                       │
│             [User/Admin] [Active]       │
│                                         │
│  Credits: 150    Generations: 42       │
│  Joined: 1/1/24  Last Login: Today     │
└─────────────────────────────────────────┘
```

**Action Buttons:**
- 🔵 **Edit User** - Update name, email, role, status
- 🟢 **Edit Credits** - Add/subtract credits
- 🔴 **Delete User** - Remove user permanently

---

#### **B. Tab: Generated Content**

**Features:**
- ✅ Gallery view semua video/gambar yang digenerate user
- ✅ Grid layout responsive (auto-fit 250px)
- ✅ Filter: All / Images / Videos
- ✅ Preview thumbnail untuk images
- ✅ Video autoplay on hover
- ✅ Badge type (image/video)
- ✅ Info: prompt, model, credits used, date
- ✅ Click untuk view fullscreen

**Gallery Card:**
```
┌────────────────────┐
│ [Image/Video]  🏷️ │
│                    │
│                    │
│ Prompt: "..."      │
│ Model  |  Credits  │
│ Date               │
└────────────────────┘
```

**Fullscreen Modal:**
- ✅ Large preview (image/video dengan controls)
- ✅ Full prompt
- ✅ Model info, credits, date
- ✅ Click outside atau ESC untuk close

---

#### **C. Tab: Activity History**

Show recent 20 activities:
```
📍 login
   User logged in from Chrome
   2 hours ago

📍 generation_completed
   Generated image with flux-pro
   5 hours ago

📍 credit_purchase
   Purchased 100 credits via QRIS
   Yesterday
```

---

#### **D. Tab: Credit History**

Show credit transactions:
```
┌──────────────────────────────────────┐
│ + Top-up via QRIS        +100 ↗️     │
│   Balance: 250                       │
│   2 hours ago                        │
├──────────────────────────────────────┤
│ - Used for image (flux-pro)  -2 ↘️   │
│   Balance: 150                       │
│   5 hours ago                        │
└──────────────────────────────────────┘
```

---

## 🔧 Modal Dialogs

### 1. **Edit Credits Modal**

```
╔══════════════════════════════════╗
║  Edit User Credits              ×║
╠══════════════════════════════════╣
║  Current Credits: 150            ║
║                                  ║
║  Amount to Add/Subtract:         ║
║  [_____] (+ to add, - to remove) ║
║                                  ║
║  Description:                    ║
║  [Bonus for testing]             ║
║                                  ║
║  [Save Changes] [Cancel]         ║
╚══════════════════════════════════╝
```

**Example:**
- Add 100: Enter `100`
- Remove 50: Enter `-50`

---

### 2. **Edit User Modal**

```
╔══════════════════════════════════╗
║  Edit User Information          ×║
╠══════════════════════════════════╣
║  Name: [John Doe]                ║
║  Email: [john@example.com]       ║
║  Role: [User ▼]                  ║
║  Status: [Active ▼]              ║
║  Phone: [+62812345]              ║
║                                  ║
║  [Save Changes] [Cancel]         ║
╚══════════════════════════════════╝
```

---

## 🎨 UI Features

### **Interactive Elements:**

1. **Credits Card** - Click to open edit modal
   ```
   ┌─────────────────────┐
   │ Credits             │
   │ 150 💰              │
   │ ✏️  Click to edit   │
   └─────────────────────┘
   ```

2. **Generation Grid** - Hover effects
   - Image/Video zooms slightly
   - Shadow increases
   - Video plays on hover

3. **Filter Buttons** - Active state
   - Active: Purple background
   - Inactive: Gray background

4. **Tab Navigation** - Visual indicator
   - Active tab: Purple underline
   - Smooth transitions

---

## 🔌 API Endpoints

### **User Management:**

```javascript
// Get user details with generations
GET /admin/users/:id

// Update user info
PUT /admin/users/:id
Body: { name, email, role, is_active, phone }

// Add/subtract credits
POST /admin/users/:id/credits
Body: { amount, description }

// Delete user
DELETE /admin/users/:id
```

---

## 📦 Data Structure

### **userDetails Object:**
```javascript
{
  user: {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    role: "user",
    credits: 150,
    is_active: true,
    created_at: "2024-01-01",
    last_login: "2024-10-26",
    avatar_url: "https://...",
    phone: "+6281234567890"
  },
  
  generations: [
    {
      id: 1,
      generation_type: "image",    // or "video"
      sub_type: "flux-pro",
      prompt: "A beautiful sunset",
      result_url: "https://...",
      credits_cost: 2,
      status: "completed",
      created_at: "2024-10-26"
    }
  ],
  
  activities: [
    {
      activity_type: "login",
      description: "User logged in",
      created_at: "2024-10-26"
    }
  ],
  
  creditHistory: [
    {
      amount: 100,
      balance_after: 250,
      description: "Top-up via QRIS",
      created_at: "2024-10-26"
    }
  ]
}
```

---

## 🎯 Use Cases

### **Scenario 1: Memberikan Bonus Credits**
1. Admin buka halaman user detail
2. Click "Edit Credits" atau click pada Credits card
3. Input: `100`
4. Description: "Bonus for early adopter"
5. Save → User langsung dapat +100 credits

### **Scenario 2: Melihat Konten User**
1. Admin buka user detail
2. Tab "Generated Content" sudah terbuka default
3. Lihat grid semua images/videos
4. Filter by type jika perlu
5. Click untuk fullscreen preview

### **Scenario 3: Upgrade ke Admin**
1. Admin buka user detail
2. Click "Edit User"
3. Change Role: User → Admin
4. Save → User sekarang bisa akses admin panel

### **Scenario 4: Suspend User**
1. Admin buka user detail
2. Click "Edit User"
3. Change Status: Active → Inactive
4. Save → User tidak bisa login

---

## 🔒 Security Features

### **Admin Protection:**
```javascript
// Middleware: ensureAdmin
router.use(ensureAdmin);

// Activity logging
logAdminActivity('update_user')
logAdminActivity('add_credits')
logAdminActivity('delete_user')
```

### **Self-Protection:**
```javascript
// Admin tidak bisa delete diri sendiri
if (userId === req.user.id) {
  return error('Cannot delete your own account');
}
```

### **Double Confirmation:**
```javascript
// Delete user memerlukan 2x konfirmasi
confirm('Are you sure?')
confirm('WARNING: All data will be deleted!')
```

---

## 🎨 CSS Styling

### **Generation Grid:**
```css
.generation-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}
```

### **Hover Effects:**
```css
.generation-item:hover {
  transform: translateY(-4px);
  background: rgba(255,255,255,0.08);
}
```

### **Modal:**
```css
.modal {
  background: rgba(0,0,0,0.8);
  backdrop-filter: blur(5px);
}
```

---

## 📱 Responsive Design

### **Desktop (> 1024px):**
- 4 columns stats cards
- 3-4 generations per row
- Full sidebar visible

### **Tablet (768px - 1024px):**
- 2 columns stats cards
- 2-3 generations per row
- Collapsible sidebar

### **Mobile (< 768px):**
- 2 columns stats cards
- 1-2 generations per row
- Hidden sidebar (burger menu)

---

## 🚀 Performance

### **Optimizations:**
1. ✅ Pagination untuk activity logs (20 items)
2. ✅ Lazy load generations (limit 100)
3. ✅ Video thumbnail preview (tidak langsung load video)
4. ✅ Database indexing pada `user_id`
5. ✅ CDN untuk images/videos (fal.ai)

### **Database Queries:**
```sql
-- User dengan generations (efficient)
SELECT * FROM users WHERE id = $1;
SELECT * FROM ai_generation_history WHERE user_id = $1 LIMIT 100;
SELECT * FROM user_activity_logs WHERE user_id = $1 LIMIT 20;
SELECT * FROM credit_transactions WHERE user_id = $1 LIMIT 20;
```

---

## 📊 Statistics Display

### **Summary Cards:**
```
Credits: Real-time dari database users.credits
Generations: COUNT dari ai_generation_history
Joined: users.created_at
Last Login: users.last_login
```

### **Activity Count:**
```
Tab badges show counts:
Generated Content (42)
Activity
Credit History
```

---

## 🎯 Admin Actions

### **Credit Management:**
```javascript
// Add 100 credits
POST /admin/users/1/credits
{ amount: 100, description: "Bonus" }

// Remove 50 credits
POST /admin/users/1/credits
{ amount: -50, description: "Correction" }
```

### **User Management:**
```javascript
// Update user
PUT /admin/users/1
{ name: "New Name", role: "admin" }

// Delete user
DELETE /admin/users/1
// → Cascade delete generations, activities, credits
```

---

## 🛠️ Troubleshooting

### **Issue: Generations tidak muncul**
**Solution:**
```javascript
// Check generations query
const generationsQuery = `
  SELECT * FROM ai_generation_history 
  WHERE user_id = $1 
  ORDER BY created_at DESC 
  LIMIT 100
`;
```

### **Issue: Credits tidak update**
**Solution:**
```javascript
// Ensure transaction
await client.query('BEGIN');
await client.query('UPDATE users SET credits = credits + $1 WHERE id = $2');
await client.query('INSERT INTO credit_transactions ...');
await client.query('COMMIT');
```

### **Issue: Modal tidak tutup**
**Solution:**
```javascript
// ESC key listener
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeAllModals();
  }
});
```

---

## 🎉 Success!

Halaman admin/users sekarang memiliki:
- ✅ View semua video/gambar yang digenerate user
- ✅ Edit credits dengan modal form
- ✅ Edit user info (name, email, role, status)
- ✅ Delete user dengan double confirmation
- ✅ Activity history
- ✅ Credit transaction history
- ✅ Beautiful UI dengan tabs
- ✅ Responsive design
- ✅ Keyboard shortcuts (ESC)
- ✅ Fullscreen media preview

**Admin sekarang punya kontrol penuh atas user management!** 🚀

