# 🎯 Panduan Cepat: Admin User Management

> **Cara mengelola user, credits, dan melihat konten yang mereka generate**

---

## 🚀 Quick Access

```
URL: http://localhost:3000/admin/users
```

---

## 📋 Daftar User

### Fitur:
- ✅ Lihat semua user dalam tabel
- ✅ Search by nama atau email
- ✅ Filter by role (User/Admin)
- ✅ Lihat credits dan jumlah generations
- ✅ Status active/inactive

### Cara Pakai:
1. Klik **"Users"** di sidebar admin
2. Gunakan search box untuk cari user
3. Klik nama user untuk lihat detail

---

## 👤 Detail User

### Cara Akses:
```
Admin → Users → [Klik user] → Detail
```

### Yang Bisa Dilakukan:

#### 1. **Edit Credits** 💰
```
Klik tombol "Edit Credits" atau klik langsung pada card Credits
```

**Contoh:**
- Tambah 100 credits: Input `100`
- Kurangi 50 credits: Input `-50`
- Isi deskripsi: "Bonus untuk testing"
- Klik Save

**Hasil:**
- Credits user langsung bertambah/berkurang
- Tercatat di credit history
- User dapat notifikasi

---

#### 2. **Edit User Info** ✏️
```
Klik tombol "Edit User"
```

**Yang Bisa Diubah:**
- ✅ Nama
- ✅ Email
- ✅ Role (User → Admin atau sebaliknya)
- ✅ Status (Active/Inactive)
- ✅ Phone

**Use Case:**
- Upgrade user jadi admin
- Suspend user (set inactive)
- Update info kontak

---

#### 3. **Lihat Generated Content** 🎨

**Tab: Generated Content**

Menampilkan semua gambar dan video yang pernah digenerate oleh user.

**Features:**
- ✅ Grid gallery responsive
- ✅ Preview thumbnail
- ✅ Video autoplay on hover
- ✅ Filter by type (All/Images/Videos)
- ✅ Info: prompt, model, credits used
- ✅ Click untuk fullscreen

**Cara Filter:**
```
All     → Tampilkan semua
Images  → Hanya gambar
Videos  → Hanya video
```

**Cara View Fullscreen:**
```
Klik pada item → Modal fullscreen terbuka
Video: Autoplay dengan controls
Image: Full resolution
ESC atau klik outside untuk close
```

---

#### 4. **Lihat Activity History** 📊

**Tab: Activity**

Show 20 aktivitas terakhir:
- Login/Logout
- Generation completed
- Credit purchases
- Profile updates

---

#### 5. **Lihat Credit History** 💳

**Tab: Credit History**

Semua transaksi credits:
- ✅ Top-up (hijau, +credits)
- ✅ Usage (merah, -credits)
- ✅ Admin adjustment
- ✅ Balance after transaction

---

#### 6. **Delete User** 🗑️
```
Klik tombol "Delete"
```

**⚠️ WARNING:**
- Memerlukan 2x confirmation
- Semua data user akan dihapus:
  - Generations
  - Credit history
  - Activities
  - Profile

**Tidak bisa:**
- Admin tidak bisa delete dirinya sendiri

---

## 💡 Tips & Tricks

### 1. **Quick Credit Edit**
```
Langsung klik pada card Credits di user detail
→ Modal langsung terbuka
```

### 2. **Keyboard Shortcuts**
```
ESC = Close semua modal
```

### 3. **Filter Generations**
```
Jika user punya banyak content, gunakan filter:
- Images only
- Videos only
```

### 4. **Credit Adjustment**
```
Gunakan angka negatif untuk mengurangi:
Amount: -50 → Kurangi 50 credits
```

---

## 🎯 Common Tasks

### Task 1: Berikan Bonus Credits
```
1. Cari user (search by name/email)
2. Klik nama user
3. Klik "Edit Credits" atau click Credits card
4. Input: 100
5. Deskripsi: "Bonus early adopter"
6. Save
✅ User dapat +100 credits
```

### Task 2: Upgrade User jadi Admin
```
1. Buka user detail
2. Klik "Edit User"
3. Role: User → Admin
4. Save
✅ User sekarang bisa akses admin panel
```

### Task 3: Suspend User
```
1. Buka user detail
2. Klik "Edit User"
3. Status: Active → Inactive
4. Save
✅ User tidak bisa login lagi
```

### Task 4: Lihat Hasil Generate User
```
1. Buka user detail
2. Tab "Generated Content" (sudah terbuka default)
3. Scroll untuk lihat semua
4. Filter by Images/Videos jika perlu
5. Klik item untuk fullscreen preview
✅ Bisa lihat semua hasil generate user
```

### Task 5: Check Penggunaan Credits
```
1. Buka user detail
2. Tab "Credit History"
3. Lihat semua transaksi
✅ Bisa tracking kemana credits digunakan
```

---

## 🔍 Informasi Detail

### User Stats Card:
```
┌─────────────────────────────────────┐
│ Credits: 150      (klik untuk edit) │
│ Generations: 42   (total semua)     │
│ Joined: 1/1/24    (tanggal daftar)  │
│ Last Login: Today (terakhir login)  │
└─────────────────────────────────────┘
```

### Generation Item:
```
┌──────────────────┐
│ [Thumbnail]   🏷️ │ ← Badge: image/video
│                  │
│ "A sunset..."    │ ← Prompt
│ flux-pro | 2 cr  │ ← Model | Credits
│ Oct 26, 2024     │ ← Date
└──────────────────┘
```

---

## ⚡ Actions API

Untuk developer yang ingin integrate:

### Add Credits:
```javascript
POST /admin/users/:id/credits
{
  "amount": 100,
  "description": "Bonus"
}
```

### Update User:
```javascript
PUT /admin/users/:id
{
  "name": "New Name",
  "role": "admin",
  "is_active": true
}
```

### Delete User:
```javascript
DELETE /admin/users/:id
```

---

## 🎨 UI Components

### Tabs:
```
[Generated Content (42)] [Activity] [Credit History]
     ↑ Active
```

### Filter Buttons:
```
[All]  [Images]  [Videos]
  ↑ Active (purple)
```

### Modals:
```
╔════════════════════╗
║  Edit Credits     ×║
╠════════════════════╣
║  [Form Fields]     ║
║  [Save] [Cancel]   ║
╚════════════════════╝
```

---

## 🛡️ Keamanan

### Protected Actions:
- ✅ Hanya admin yang bisa akses
- ✅ Activity logging otomatis
- ✅ Double confirmation untuk delete
- ✅ Admin tidak bisa delete diri sendiri

### Logged Activities:
```
✅ update_user
✅ add_credits
✅ delete_user
```

---

## 📱 Mobile Friendly

Semua fitur bekerja di:
- ✅ Desktop
- ✅ Tablet
- ✅ Mobile

Grid generations otomatis adjust:
- Desktop: 3-4 columns
- Tablet: 2-3 columns
- Mobile: 1-2 columns

---

## ✅ Checklist Admin

Sebelum manage user, pastikan:
- [ ] Login sebagai admin
- [ ] Tahu alasan edit/delete
- [ ] Backup data (jika perlu)
- [ ] Inform user (jika perlu)

---

## 🎉 Selesai!

Sekarang kamu bisa:
- ✅ Lihat semua video/gambar yang digenerate user
- ✅ Edit credits user dengan mudah
- ✅ Update info user (role, status, dll)
- ✅ Delete user jika diperlukan
- ✅ Track activity dan credit history
- ✅ Manage user dengan UI yang cantik

**Happy managing!** 🚀

