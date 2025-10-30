# 🚀 Quick Start - FAL.AI Integration

## ⚡ Start in 5 Minutes!

### Step 1: Install Dependencies (Already Done ✅)
```bash
# Packages already installed:
# - @fal-ai/serverless-client
# - axios
# - multer
```

### Step 2: Run Database Migration
```bash
npm run migrate:fal
```

**Expected Output:**
```
🔄 Starting fal.ai migration...
📝 Adding FAL_AI configuration...
✅ FAL_AI configuration added
📝 Creating ai_generation_history table...
✅ ai_generation_history table created
📝 Creating indexes...
✅ Indexes created
📝 Adding generation_count to users table...
✅ generation_count column added
📝 Creating generation_stats view...
✅ generation_stats view created
📝 Creating trigger function...
✅ Trigger function created
📝 Creating trigger...
✅ Trigger created

🎉 fal.ai migration completed successfully!
```

### Step 3: Get FAL.AI API Key
1. Go to [https://fal.ai](https://fal.ai)
2. Sign up / Login
3. Go to **Dashboard** → **API Keys**
4. Create new API key or copy existing one

### Step 4: Configure API Key
```bash
# Start server
npm run dev

# Then open browser:
# 1. Login as admin: http://localhost:5005/login
# 2. Go to: http://localhost:5005/admin/api-configs
# 3. Find "FAL_AI" service
# 4. Click "Configure"
# 5. Paste your API key
# 6. Check "Enable this API service"
# 7. Click "Save Configuration"
```

### Step 5: Test Generation! 🎨
```bash
# 1. Logout from admin
# 2. Login as regular user
# 3. Go to: http://localhost:5005/dashboard
# 4. Enter a prompt: "A beautiful sunset over mountains"
# 5. Click "Run"
# 6. Wait 10-30 seconds
# 7. See your generated image! 🎉
```

---

## 🎯 Features Available

### **Image Generation:**
- ✅ Text-to-Image
- ✅ Edit Image (AI editing)
- ✅ Upscale (2x quality)
- ✅ Remove Background

### **Video Generation:**
- ✅ Text-to-Video (5s, 10s)
- ✅ Image-to-Video
- ✅ Image-to-Video with End Frame

### **Admin Features:**
- ✅ Check API Balance
- ✅ View Total Generations
- ✅ Monitor Credits Usage
- ✅ Recent Generations History

---

## 💳 Credit Costs

### **Images:**
```
Text-to-Image:      1 credit
Edit Image:         1 credit
Upscale:            2 credits
Remove Background:  1 credit
```

### **Videos:**
```
Text-to-Video (5s):  3 credits
Text-to-Video (10s): 5 credits
Image-to-Video (5s): 4 credits
Image-to-Video (10s):6 credits
```

---

## 🔧 Troubleshooting

### Migration Failed?
```bash
# Check database connection
psql -d pixelnest_db -c "SELECT NOW();"

# If connection fails, check .env file
cat .env | grep DB_
```

### API Key Not Working?
```bash
# Test API key directly
curl -X GET https://rest.alpha.fal.ai/balance \
  -H "Authorization: Key YOUR_API_KEY"

# Should return: {"balance": 10.00, "currency": "USD"}
```

### Generation Stuck?
```bash
# Check server logs
# Look for error messages in terminal where you ran npm run dev

# Common issues:
# 1. No credits? Add credits in /admin/users
# 2. API key invalid? Re-configure in /admin/api-configs
# 3. Prompt too long? Max 1000 chars for image, 500 for video
```

---

## 🎨 Usage Examples

### **Example 1: Generate Landscape**
```
Mode: Image
Type: Text-to-Image
Prompt: A serene mountain landscape at sunset with a lake
Aspect Ratio: 16:9
Quantity: 1x
Cost: 1 credit
```

### **Example 2: Generate Portrait**
```
Mode: Image
Type: Text-to-Image
Prompt: Professional portrait of a software engineer, studio lighting
Aspect Ratio: 3:4
Quantity: 2x
Cost: 2 credits
```

### **Example 3: Generate Video**
```
Mode: Video
Type: Text-to-Video
Prompt: Ocean waves crashing on a tropical beach at golden hour
Duration: 5 seconds
Aspect Ratio: 16:9
Quantity: 1x
Cost: 3 credits
```

---

## 📊 Admin Dashboard

### **Check Balance:**
```
URL: http://localhost:5005/admin/fal-balance

Shows:
- Current API balance ($XX.XX)
- Total generations count
- Credits distributed
- Recent generations list
- API configuration status
```

### **Manage Users:**
```
URL: http://localhost:5005/admin/users

Actions:
- View all users
- Add/Remove credits
- View generation history
- Check usage stats
```

---

## 🎉 You're Ready!

**System is now configured and ready for:**
- ✅ AI Image Generation
- ✅ AI Video Generation
- ✅ Credit Management
- ✅ Usage Tracking
- ✅ Balance Monitoring

**Start Creating! 🎨🎬✨**

---

## 📚 More Resources

- **Full Documentation:** `FAL_AI_INTEGRATION.md`
- **API Docs:** [https://fal.ai/docs](https://fal.ai/docs)
- **Support:** Check server logs for detailed errors

---

**Happy Generating! 🚀**

