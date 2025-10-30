# 🚀 Quick Start - Audio Integration Migrations

## Step-by-Step Migration Guide

### 1️⃣ Connect to Database

**Method A - Using psql**:
```bash
psql -d pixelnest_db
```

**Method B - Using pgAdmin or any SQL client**:
- Connect to your `pixelnest_db` database
- Open SQL query window

---

### 2️⃣ Run Migration 1: Add Audio Models

Copy and paste the content of **`migrations/add_audio_models.sql`** into your SQL client and execute.

**Or run directly**:
```bash
psql -d pixelnest_db -f migrations/add_audio_models.sql
```

**Expected Result**:
```
INSERT 0 8
```
(8 audio models inserted)

**Verify**:
```sql
SELECT name, type, category FROM ai_models WHERE type = 'audio';
```

You should see 8 audio models:
1. ElevenLabs TTS v2
2. XTTS v2
3. Bark
4. MusicGen
5. AudioLDM 2
6. Whisper Large v3
7. RVC v2
8. Stable Audio

---

### 3️⃣ Run Migration 2: Update Stats View

Copy and paste the content of **`migrations/update_models_stats_audio.sql`** into your SQL client and execute.

**Or run directly**:
```bash
psql -d pixelnest_db -f migrations/update_models_stats_audio.sql
```

**Expected Result**:
```
DROP VIEW
CREATE VIEW
```

**Verify**:
```sql
SELECT 
  total_models, 
  image_models, 
  video_models, 
  audio_models, 
  trending_models 
FROM models_stats;
```

You should see `audio_models` column with a count (should be 8 if you just added them).

---

### 4️⃣ Restart Application

```bash
# If using npm
npm run dev

# If using PM2
pm2 restart pixelnest

# If using nodemon (auto-restart)
# Just save any file or restart manually
```

---

### 5️⃣ Test the Integration

#### Test Dashboard:
1. Open browser: `http://localhost:3000/dashboard`
2. Click **Audio** tab
3. Select **Text-to-Speech** type
4. Verify models load in the cards area
5. Click a model (should highlight with violet border)
6. Enter prompt and adjust duration
7. Check that everything works smoothly

#### Test Admin Panel:
1. Open: `http://localhost:3000/admin/models`
2. Check **Audio** stats card (should show count: 8)
3. Use filter dropdown: Select **"Audio"**
4. Verify 8 audio models are displayed
5. Click on a model to view/edit details
6. Test search functionality

---

## 🔍 Troubleshooting

### Migration Failed?

**Check if tables exist**:
```sql
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'ai_models';
```

**Check if view exists**:
```sql
SELECT viewname FROM pg_views 
WHERE schemaname = 'public' AND viewname = 'models_stats';
```

**If ai_models table doesn't exist**:
You need to run the initial models migration first:
```bash
node src/config/migrateModels.js
```

---

### Audio Models Not Showing?

**Check database**:
```sql
SELECT COUNT(*) FROM ai_models WHERE type = 'audio';
```

Should return **8**. If not, re-run migration 1.

**Check API endpoint**:
```bash
curl http://localhost:3000/api/models/dashboard?type=audio
```

Should return JSON with audio models.

**Check browser console**:
- Open DevTools (F12)
- Go to Console tab
- Look for any errors when switching to Audio tab

---

### Stats Not Updating in Admin?

**Check view**:
```sql
SELECT * FROM models_stats;
```

If `audio_models` column doesn't exist or shows NULL:
- Re-run migration 2
- Make sure you DROPPED the old view first

**Clear cache**:
- Hard refresh browser: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
- Or clear browser cache completely

---

## ✅ Success Checklist

- [ ] Migration 1 executed (8 audio models inserted)
- [ ] Migration 2 executed (models_stats view updated)
- [ ] Application restarted
- [ ] Dashboard Audio tab shows models
- [ ] Model cards display correctly
- [ ] Can select models (violet border highlight)
- [ ] Admin panel shows audio stats
- [ ] Admin filter works for audio type
- [ ] Search works in both dashboard and admin

---

## 📞 Still Having Issues?

1. **Check server logs**: Look for any errors when loading models
2. **Check database connection**: Ensure app can connect to PostgreSQL
3. **Check FAL_API_KEY**: Ensure it's set in `.env` file
4. **Restart everything**: Sometimes a full restart helps
   ```bash
   # Stop server
   # Stop database (if running locally)
   # Start database
   # Start server
   ```

---

## 🎉 You're Done!

Once all checks pass, audio generation is fully integrated and ready to use!

Next steps:
- Test actual audio generation (requires FAL.AI API key with credits)
- Customize audio models (add/remove via admin panel)
- Adjust pricing per model if needed

---

**Need Help?** Check `AUDIO_INTEGRATION_COMPLETE.md` for detailed documentation.

