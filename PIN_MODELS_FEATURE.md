# 📌 Pin Models Feature - Complete Guide

## 📋 Overview

Fitur Pin Models memungkinkan user untuk **menyematkan hingga 3 model favorit** mereka untuk akses cepat. Pinned models akan ditampilkan di bagian atas daftar model dan ditandai dengan icon pin.

---

## 🎯 Features

✅ **Pin/Unpin Models** - User dapat pin/unpin models dengan 1 click  
✅ **Max 3 Pins** - Limit maksimal 3 pinned models per user  
✅ **Visual Indicators** - Pinned models memiliki visual yang berbeda (border kuning, icon pin)  
✅ **Auto Sort** - Pinned models otomatis muncul di atas list  
✅ **Persistent** - Pinned models tersimpan di database per user  
✅ **Toast Notifications** - Feedback visual saat pin/unpin  

---

## 🗄️ Database Setup

### 1. Run Migration

Jalankan migration untuk membuat tabel `pinned_models`:

```bash
psql -U your_username -d your_database -f migrations/add_pinned_models.sql
```

**Atau via Node.js:**

```javascript
const { pool } = require('./src/config/database');
const fs = require('fs');

const migration = fs.readFileSync('./migrations/add_pinned_models.sql', 'utf8');
await pool.query(migration);
```

### 2. Table Structure

```sql
pinned_models (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    model_id INTEGER NOT NULL REFERENCES ai_models(id),
    pin_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, model_id)
)
```

---

## 🔌 API Endpoints

### 1. Get Pinned Models

```http
GET /api/models/pinned/list
Authorization: Required (User must be logged in)
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "pinned_models": [
    {
      "id": 1,
      "name": "FLUX.1 Pro",
      "model_id": "fal-ai/flux-pro",
      "pin_order": 0,
      "pinned_at": "2025-10-26T10:00:00Z"
    }
  ]
}
```

### 2. Pin a Model

```http
POST /api/models/pin/:modelId
Authorization: Required
```

**Success Response:**
```json
{
  "success": true,
  "message": "Model pinned successfully",
  "current_pins": 2,
  "max_pins": 3
}
```

**Error (Max Pins Reached):**
```json
{
  "success": false,
  "message": "Maximum 3 models can be pinned. Please unpin another model first.",
  "max_pins": 3,
  "current_pins": 3
}
```

### 3. Unpin a Model

```http
DELETE /api/models/pin/:modelId
Authorization: Required
```

**Response:**
```json
{
  "success": true,
  "message": "Model unpinned successfully",
  "current_pins": 1,
  "max_pins": 3
}
```

### 4. Toggle Pin (Recommended)

```http
POST /api/models/pin/toggle/:modelId
Authorization: Required
```

**Response:**
```json
{
  "success": true,
  "action": "pinned", // or "unpinned"
  "message": "Model pinned successfully"
}
```

---

## 🎨 Frontend Implementation

### Visual Indicators

**Pinned models memiliki:**
1. **Yellow Border** - Border warna kuning (rgba(234, 179, 8))
2. **Pin Icon** - Icon thumbtack di title dan di icon badge
3. **Pin Button** - Tombol pin yang muncul saat hover
4. **Toast Notifications** - Feedback saat pin/unpin

### Pin Button Behavior

- **Hover** - Pin button muncul di pojok kanan atas card
- **Click** - Toggle pin status
- **Loading** - Spinner animation saat API call
- **Disabled** - Button disable saat loading

### Auto-Reload

Setelah pin/unpin, model list akan otomatis reload untuk mengurutkan ulang dengan pinned models di atas.

---

## 💻 Code Examples

### Frontend: Toggle Pin

```javascript
// Call window.togglePin function
window.togglePin(modelId, 'image', buttonElement);
```

### Backend: Check Pin Count

```javascript
const pinCount = await pool.query(
  'SELECT COUNT(*) as count FROM pinned_models WHERE user_id = $1',
  [userId]
);

if (parseInt(pinCount.rows[0].count) >= 3) {
  // Max pins reached
}
```

### Get Models with Pin Status

```javascript
const models = await pool.query(`
  SELECT 
    m.*,
    CASE WHEN p.id IS NOT NULL THEN true ELSE false END as is_pinned,
    p.pin_order
  FROM ai_models m
  LEFT JOIN pinned_models p ON m.id = p.model_id AND p.user_id = $1
  WHERE m.is_active = true
  ORDER BY 
    CASE WHEN p.id IS NOT NULL THEN 0 ELSE 1 END,
    p.pin_order ASC NULLS LAST,
    m.name ASC
`, [userId]);
```

---

## 🎯 User Flow

1. **User membuka dashboard**
2. **User memilih type** (Text to Image, etc)
3. **Models load** dengan pinned models di atas
4. **User hover model card** → Pin button muncul
5. **User click pin button** → Model di-pin
6. **Toast notification** muncul
7. **Model list auto-reload** dengan pinned model di atas

---

## ⚠️ Important Notes

### Pin Limit Enforcement

- **Frontend** - Show warning toast jika user mencoba pin lebih dari 3
- **Backend** - Validate di API endpoint sebelum insert
- **Database** - Tidak ada constraint (karena PostgreSQL limitation)

### Pin Order Management

Saat unpin model, pin_order otomatis di-reorder:

```sql
-- After unpinning model with pin_order = 1
UPDATE pinned_models 
SET pin_order = pin_order - 1 
WHERE user_id = $1 AND pin_order > $2
```

### Authentication

Semua pin endpoints **require authentication**:
- User must be logged in
- Uses `req.user.id` from session/JWT

---

## 🧪 Testing

### Manual Testing

1. **Login ke dashboard**
2. **Pilih type** (misal Text to Image)
3. **Hover model card** → Pin button muncul
4. **Click pin** → Toast "Model pinned successfully"
5. **Pin 3 models** → Semua berhasil
6. **Coba pin model ke-4** → Error "Maximum 3 models"
7. **Unpin 1 model** → Toast "Model unpinned"
8. **Refresh page** → Pinned models tetap di atas

### API Testing (Postman/cURL)

```bash
# Pin a model
curl -X POST http://localhost:3000/api/models/pin/1 \
  -H "Cookie: connect.sid=..." \
  -H "Content-Type: application/json"

# Get pinned models
curl http://localhost:3000/api/models/pinned/list \
  -H "Cookie: connect.sid=..."

# Toggle pin
curl -X POST http://localhost:3000/api/models/pin/toggle/1 \
  -H "Cookie: connect.sid=..."
```

---

## 🐛 Troubleshooting

### Issue: Pin button tidak muncul

**Solution:** Pastikan `group/card` class ada di wrapper div

```html
<div class="relative group/card">
  <!-- model card -->
  <button class="pin-btn opacity-0 group-hover/card:opacity-100">
```

### Issue: Pinned models tidak muncul di atas

**Solution:** Check ORDER BY query di backend:

```sql
ORDER BY 
  CASE WHEN p.id IS NOT NULL THEN 0 ELSE 1 END,
  p.pin_order ASC NULLS LAST
```

### Issue: Error "Maximum 3 models"

**Solution:** Normal behavior - unpin 1 model terlebih dahulu

### Issue: Toast notification tidak muncul

**Solution:** Pastikan Font Awesome icons loaded:

```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
```

---

## 📝 Files Modified/Created

### Created:
- `migrations/add_pinned_models.sql` - Database migration
- `PIN_MODELS_FEATURE.md` - Documentation

### Modified:
- `src/routes/models.js` - Added pin/unpin endpoints
- `public/js/model-cards-handler.js` - Added pin UI & logic
- `src/views/auth/dashboard.ejs` - Added pin styling

---

## 🚀 Future Enhancements

- [ ] Drag & drop untuk reorder pinned models
- [ ] Pin models di browse page
- [ ] Pin categories/types
- [ ] Export/import pinned models
- [ ] Share pinned models dengan users lain

---

## 📞 Support

Jika ada pertanyaan atau issues, silakan buat issue ticket atau hubungi developer.

**Happy Pinning! 📌**

