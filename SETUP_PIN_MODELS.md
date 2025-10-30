# 🚀 Quick Setup: Pin Models Feature

## Step-by-Step Setup (5 menit)

### 1️⃣ Run Database Migration

Jalankan migration untuk membuat tabel `pinned_models`:

```bash
# Connect to your PostgreSQL database
psql -U your_username -d pixelnest

# Run migration
\i migrations/add_pinned_models.sql
```

**Atau via terminal langsung:**

```bash
psql -U postgres -d pixelnest -f migrations/add_pinned_models.sql
```

**Verifikasi:**

```sql
-- Check if table exists
\dt pinned_models

-- Check table structure
\d pinned_models
```

---

### 2️⃣ Restart Server

```bash
# Stop current server (Ctrl+C)
# Then restart
npm run dev
```

---

### 3️⃣ Test Feature

1. **Login** ke dashboard
2. **Pilih type** (misal: Text to Image)
3. **Hover** pada model card → Pin button muncul (📌)
4. **Click pin button** → Model di-pin
5. **Pin 2-3 models** untuk testing
6. **Refresh page** → Pinned models tetap di atas

---

## ✅ Feature Checklist

- [x] Database migration created
- [x] API endpoints implemented
- [x] Frontend UI dengan pin button
- [x] Pin/unpin logic dengan 3 pin limit
- [x] Toast notifications
- [x] Visual indicators (yellow border, pin icon)
- [x] Auto-sort pinned models to top
- [x] Pin order management

---

## 🎨 Visual Indicators

### Pinned Model memiliki:
- 📌 **Pin icon** di title
- 🟡 **Yellow border** (rgba(234, 179, 8))
- ⚡ **Pin badge** di icon
- 🔼 **Always on top** of model list

### Pin Button:
- **Hidden** by default
- **Visible** on card hover
- **Yellow** when pinned
- **Gray** when unpinned

---

## 🔑 Key Features

### Max 3 Pins per User
```javascript
// Frontend shows warning toast
"You can only pin up to 3 models!"

// Backend returns 400 error
{
  "success": false,
  "message": "Maximum 3 models can be pinned",
  "max_pins": 3,
  "current_pins": 3
}
```

### Auto-Reorder
Saat unpin, pin_order otomatis di-adjust:
- Pin 1, 2, 3 → Unpin 2 → Menjadi: Pin 1, 2

### Persistent Storage
- Tersimpan di database per user
- Tidak hilang saat refresh/logout-login

---

## 🧪 Quick Test

```bash
# 1. Check if migration applied
psql -d pixelnest -c "SELECT COUNT(*) FROM pinned_models;"

# 2. Test API endpoint (replace session cookie)
curl http://localhost:3000/api/models/pinned/list \
  -H "Cookie: connect.sid=YOUR_SESSION_ID"

# 3. Pin a model
curl -X POST http://localhost:3000/api/models/pin/toggle/1 \
  -H "Cookie: connect.sid=YOUR_SESSION_ID"
```

---

## 🐛 Common Issues

### Issue: "Table doesn't exist"
**Solution:** Run migration:
```bash
psql -d pixelnest -f migrations/add_pinned_models.sql
```

### Issue: "401 Unauthorized"
**Solution:** Login first - pin feature requires authentication

### Issue: Pin button tidak muncul
**Solution:** Clear cache & hard refresh (Ctrl+Shift+R)

### Issue: Pinned models tidak di atas
**Solution:** Restart server untuk reload API query

---

## 📊 Database Queries (Useful)

```sql
-- Get all pinned models
SELECT * FROM pinned_models;

-- Get pinned models for specific user
SELECT 
  u.username,
  m.name as model_name,
  p.pin_order
FROM pinned_models p
JOIN users u ON p.user_id = u.id
JOIN ai_models m ON p.model_id = m.id
WHERE u.id = 1;

-- Count pins per user
SELECT user_id, COUNT(*) as pin_count
FROM pinned_models
GROUP BY user_id;

-- Clear all pins for testing
TRUNCATE TABLE pinned_models;
```

---

## ✨ That's It!

Feature sudah ready to use! 🎉

**Test flow:**
1. Login → Dashboard
2. Hover model → Pin button muncul
3. Click pin → Toast muncul
4. Model ditandai dengan border kuning
5. Refresh → Pinned models tetap di atas

---

## 📚 Documentation

For detailed documentation, see: **PIN_MODELS_FEATURE.md**

**Happy Coding! 🚀**

