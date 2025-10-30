# 🚀 Migration: Add Duration Fields

## ⚡ Quick Run

**Di terminal Anda:**

```bash
cd /Users/ahwanulm/Desktop/PROJECT/PIXELNEST

# Run migration
psql $DATABASE_URL -f migrations/add_duration_fields.sql
```

**Or if DATABASE_URL not set:**

```bash
# Replace with your actual DB credentials
psql -h localhost -p 5432 -U postgres -d pixelnest_db -f migrations/add_duration_fields.sql
```

---

## ✅ What This Migration Does

### **1. Adds `available_durations` Column**
- Type: `JSONB`
- Stores array of supported durations
- Examples:
  - Kling: `["5", "10"]`
  - Veo3: `["4s", "6s", "8s"]`
  - Runway: `["5", "10"]`

### **2. Adds `price_per_second` Column**
- Type: `NUMERIC(10, 4)`
- Stores price per second for video models
- Used for accurate credit calculation

### **3. Auto-Updates Existing Models**
- ✅ Kling models → `["5", "10"]`
- ✅ Veo models → `["4s", "6s", "8s"]`
- ✅ Runway models → `["5", "10"]`
- ✅ Luma models → `["5"]`
- ✅ Minimax/Haiper/Pika → `["5", "6", "10"]`

### **4. Creates Indexes**
- GIN index on `available_durations`
- B-tree index on `price_per_second`

---

## 🧪 Verify After Migration

```sql
-- Check updated models
SELECT 
    model_id, 
    name, 
    type, 
    available_durations, 
    price_per_second,
    fal_price
FROM ai_models 
WHERE type = 'video' 
  AND available_durations IS NOT NULL
ORDER BY name;
```

**Expected Output:**
```
model_id                              | name           | available_durations    | price_per_second
--------------------------------------|----------------|------------------------|------------------
fal-ai/kling-video/v2.5...           | Kling Video    | ["5", "10"]            | 0.0100
fal-ai/google-veo/v3.1               | Veo 3.1        | ["4s", "6s", "8s"]     | 0.0833
fal-ai/runway-gen3                   | Runway Gen-3   | ["5", "10"]            | 0.0050
```

---

## 🎉 Next Steps

After running migration:

1. **Restart Server** (if running)
   ```bash
   npm run dev
   ```

2. **Check Admin Panel**
   - Go to: http://localhost:5005/admin/models
   - Click "Edit" on any video model
   - You should see new duration fields!

---

**Status:** ✅ Migration file ready  
**Location:** `migrations/add_duration_fields.sql`  
**Action:** Run the psql command above!

