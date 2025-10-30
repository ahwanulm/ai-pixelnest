# 🚀 AI Models Management - Quick Start Guide

## ⚡ **5 Minute Setup**

### **Step 1: Run Migration** ✅
```bash
cd /Users/ahwanulm/Desktop/PROJECT/PIXELNEST
npm run migrate:models
```

**Expected:** 32 models added (19 image + 13 video)

### **Step 2: Start Server** ✅
```bash
npm run dev
```

### **Step 3: Access Admin Panel** ✅
```
URL: http://localhost:5005/admin/models
Login: admin@pixelnest.pro / andr0Hardcore
```

---

## 🎯 **What You Can Do**

### **View Models**
- See all 32 AI models
- Image models (FLUX, Imagen 4, Qwen, Dreamina, etc)
- Video models (Veo 3.1, Sora 2, SeeDance, Kling, etc)

### **Add New Model**
1. Click **"Add Model"** button
2. Enter model details:
   ```
   Model ID: fal-ai/model-name (from fal.ai)
   Name: Display name
   Type: image or video
   Category: Select from dropdown
   Cost: Credits (1-10)
   ```
3. Click **"Save Model"**

### **Edit Model**
1. Click **edit icon** (✏️) on any model
2. Update fields
3. Click **"Save Model"**

### **Enable/Disable**
- Click **eye icon** (👁️) to toggle
- Disabled models hidden from users

### **Delete Custom Model**
- Click **trash icon** (🗑️)
- Only custom models can be deleted
- Default models can only be disabled

### **Search & Filter**
- **Search bar**: Type to find models
- **Type filter**: Image / Video / All
- **Status filter**: Active / Trending / Viral

---

## 🌟 **Latest Models Added**

### **Image (2025)**
| Model | Provider | Why It's Hot |
|-------|----------|--------------|
| Imagen 4 | Google | Photorealistic AI |
| Qwen Image | Alibaba | Advanced Chinese AI |
| Dreamina | ByteDance | Unique artistic style |
| FLUX Pro v1.1 | Black Forest | Latest & greatest |

### **Video (2025)**
| Model | Provider | Why It's Hot |
|-------|----------|--------------|
| Veo 3.1 | Google | Cinema-quality |
| Sora 2 | OpenAI | Breakthrough realism |
| SeeDance | SeaweedFS | Dance specialist |
| Kling v1.6 Pro | Kuaishou | 15s max duration |

---

## 🔍 **How to Find Models on fal.ai**

1. **Go to:** https://fal.ai/models
2. **Browse categories:**
   - Image Generation
   - Video Generation
   - Image Editing
   - Upscaling
3. **Note the model ID:**
   - Example: `fal-ai/flux-pro`
   - Example: `fal-ai/google/veo-3`
4. **Add in admin panel!**

---

## 📊 **Model Fields Explained**

| Field | Required | Example | Notes |
|-------|----------|---------|-------|
| **Model ID** | ✅ | `fal-ai/flux-pro` | From fal.ai docs |
| **Name** | ✅ | `FLUX Pro` | Display name |
| **Provider** | ❌ | `Black Forest Labs` | Company name |
| **Description** | ❌ | `State-of-the-art...` | Brief description |
| **Type** | ✅ | `image` or `video` | Media type |
| **Category** | ✅ | `Text-to-Image` | Dropdown |
| **Speed** | ❌ | `fast` | ultra-fast to slow |
| **Quality** | ❌ | `excellent` | excellent to fair |
| **Cost** | ✅ | `1` | Credits (1-10) |
| **Max Duration** | ❌ | `10` | Video only (seconds) |
| **Trending** | ❌ | ☑️ | Currently popular |
| **Viral** | ❌ | ☑️ | Extremely popular |
| **Active** | ✅ | ☑️ | Visible to users |

---

## 💡 **Tips & Tricks**

### **Pricing Guidelines**
```
Image models:     1-2 credits
Basic video:      3-5 credits
Advanced video:   5-10 credits
Premium models:   Can be higher
```

### **When to Mark as Trending**
- ✅ New and popular
- ✅ High usage
- ✅ Positive feedback
- ❌ Update monthly

### **When to Mark as Viral**
- ✅ Extremely popular
- ✅ Proven track record
- ✅ Industry standard
- ❌ Don't overuse

### **Active vs Inactive**
- **Active**: Tested and working ✅
- **Inactive**: Has issues or deprecated ❌
- Test before activating!

---

## 🔌 **API Endpoints Quick Reference**

### **Get Active Models** (for users)
```bash
GET /api/models/all?type=image
GET /api/models/search?q=flux
GET /api/models/dashboard?type=video&limit=10
```

### **Admin Operations** (protected)
```bash
GET    /admin/api/models          # List all
POST   /admin/api/models          # Add new
PUT    /admin/api/models/:id      # Update
PATCH  /admin/api/models/:id/toggle  # Enable/disable
DELETE /admin/api/models/:id      # Delete custom
```

---

## 🐛 **Quick Fixes**

### **Problem: Models not showing in user dashboard**
```bash
# Check database
psql -d pixelnest_db -c "SELECT COUNT(*) FROM ai_models WHERE is_active = true;"

# Check API
curl http://localhost:5005/api/models/all
```

### **Problem: Can't delete model**
**Reason:** Only custom models (added by admin) can be deleted.
**Solution:** Disable it instead (click eye icon)

### **Problem: Model not in dropdown**
**Reason:** Model is inactive.
**Solution:** Go to `/admin/models` and enable it.

---

## ✅ **Checklist**

Before going live:
- [ ] Migration completed (32 models)
- [ ] Can access `/admin/models`
- [ ] Can add custom model
- [ ] Can edit model
- [ ] Can toggle status
- [ ] Search works
- [ ] Filter works
- [ ] Models appear in user dashboard
- [ ] Generation works with new models

---

## 🎯 **Next Steps**

1. **Test the system:**
   - Add a test model
   - Try searching
   - Test in user dashboard

2. **Monitor usage:**
   - Track which models are popular
   - Update trending flags monthly
   - Adjust pricing if needed

3. **Stay updated:**
   - Check fal.ai for new models
   - Read model release notes
   - Test before adding

---

## 📚 **Full Documentation**

For detailed information, see:
- `AI_MODELS_MANAGEMENT.md` - Complete guide
- `API_FIX_GUIDE.md` - API troubleshooting
- `FAL_AI_SUMMARY.md` - Integration overview

---

## 🆘 **Need Help?**

**Check logs:**
```bash
# Terminal where npm run dev is running
[0] Error message here...
```

**Database check:**
```bash
psql -d pixelnest_db -c "\dt ai_models"
psql -d pixelnest_db -c "SELECT * FROM models_stats;"
```

**Test API:**
```bash
curl http://localhost:5005/api/models/all | jq
```

---

## 🎉 **Summary**

**What's Working:**
- ✅ 32 models pre-loaded
- ✅ Admin CRUD interface
- ✅ Search & filter
- ✅ Latest 2025 models (Veo, Sora, Imagen, etc)
- ✅ User dashboard integration
- ✅ API endpoints

**Ready to use! Start managing models now!** 🚀✨

---

**Last Updated:** October 26, 2025  
**Quick Start:** ✅ READY

