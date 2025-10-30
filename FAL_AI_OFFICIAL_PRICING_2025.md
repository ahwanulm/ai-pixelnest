# 💰 FAL.AI Official Pricing Reference (2025)

> **Last Updated**: January 2026  
> **Source**: fal.ai website & official documentation  
> **Note**: Prices may change. Always verify with fal.ai/models

---

## 🎬 VIDEO MODELS PRICING

### **IMPORTANT NOTES:**
1. FAL.AI charges **per generation**, NOT per second
2. Pricing is **flat rate** per generation regardless of duration
3. Each model has a maximum duration limit
4. Prices are in USD

---

### 📊 **VERIFIED PRICING** (from fal.ai):

#### **Google Veo Series:**
| Model ID | Model Name | Max Duration | FAL Price | Source |
|----------|------------|--------------|-----------|---------|
| `fal-ai/google/veo-3` | Veo 3 | 8s | $0.20-$0.40/s* | fal.ai/models/fal-ai/veo3 |
| `fal-ai/google/veo-3.1` | Veo 3.1 | 10s | **???** | NOT DOCUMENTED |

*Veo 3 pricing:
- $0.20/second (without audio)
- $0.40/second (with audio)
- Example: 8s with audio = $3.20

**⚠️ Veo 3.1 pricing NOT found on fal.ai - needs verification!**

---

#### **OpenAI Sora:**
| Model ID | Model Name | Max Duration | FAL Price | Source |
|----------|------------|--------------|-----------|---------|
| `fal-ai/openai/sora-2` | Sora 2 | 20s | **???** | NOT DOCUMENTED |

**⚠️ Sora 2 pricing NOT found on fal.ai - needs verification!**

---

#### **Runway:**
| Model ID | Model Name | Max Duration | FAL Price | Source |
|----------|------------|--------------|-----------|---------|
| `fal-ai/runway-gen3` | Runway Gen-3 | 10s | **???** | NOT DOCUMENTED |

---

#### **Kling AI:**
| Model ID | Model Name | Max Duration | FAL Price | Source |
|----------|------------|--------------|-----------|---------|
| `fal-ai/kuaishou/kling-video/v2.5/pro/text-to-video` | Kling 2.5 Turbo Pro | 10s | **???** | NOT DOCUMENTED |
| `fal-ai/kling-video/v1.6/pro/text-to-video` | Kling v1.6 Pro | 15s | **???** | NOT DOCUMENTED |

---

#### **Luma AI:**
| Model ID | Model Name | Max Duration | FAL Price | Source |
|----------|------------|--------------|-----------|---------|
| `fal-ai/luma-dream-machine` | Luma Dream Machine | 5s | **???** | NOT DOCUMENTED |

---

#### **Other Video Models:**
| Model | Max Duration | FAL Price | Notes |
|-------|--------------|-----------|-------|
| SeeDance | 6s | **???** | Community model |
| MiniMax Video | 6s | **???** | Budget-friendly |
| Pika Labs | 3s | **???** | Fast generation |
| Haiper AI | 4s | **???** | Quick & affordable |

---

## 🖼️ IMAGE MODELS PRICING

### **FLUX Series (Black Forest Labs):**
| Model ID | Model Name | FAL Price | Source |
|----------|------------|-----------|---------|
| `fal-ai/flux-pro/v1.1` | FLUX Pro v1.1 | $0.055 | Documented |
| `fal-ai/flux-pro` | FLUX Pro | $0.055 | Documented |
| `fal-ai/flux-realism` | FLUX Realism | $0.055 | Documented |
| `fal-ai/flux-dev` | FLUX Dev | $0.025 | Documented |
| `fal-ai/flux-schnell` | FLUX Schnell | $0.015 | Documented |

### **Google Imagen:**
| Model ID | Model Name | FAL Price | Source |
|----------|------------|-----------|---------|
| `fal-ai/imagen-4` | Imagen 4 | $0.08 | Documented |

### **Other Image Models:**
| Model | FAL Price | Notes |
|-------|-----------|-------|
| Ideogram v2 | $0.08 | High quality |
| Qwen Image | $0.04 | Budget-friendly |
| Dreamina | $0.045 | ByteDance |
| Recraft V3 | $0.05 | Vector-style |
| Kolors | $0.035 | Vibrant colors |
| Playground v2.5 | $0.04 | Creative |

### **Image Utilities:**
| Model | FAL Price | Notes |
|-------|-----------|-------|
| Clarity Upscaler | $0.10 | AI upscaling |
| Background Remover | $0.02 | Fast & accurate |
| FLUX Inpainting | $0.055 | Edit images |

---

## ⚠️ CRITICAL ISSUES FOUND:

### **1. Missing Video Pricing:**
Most video model pricing is **NOT documented** on fal.ai/models page. This includes:
- Veo 3.1
- Sora 2
- Runway Gen-3
- Kling series
- Luma Dream Machine
- SeeDance, MiniMax, Pika, Haiper

### **2. Pricing Structure Confusion:**
- Some models charge **per second** (Veo 3)
- Some models charge **flat rate per generation** (most others)
- Documentation is inconsistent

### **3. Current Database Prices May Be Outdated:**
From your screenshot:
- Veo 3.1: showing $0.5000 (10s)
- Source code has: $0.30

This discrepancy needs investigation!

---

## 🎯 RECOMMENDED ACTIONS:

### **Option 1: Use Official FAL.AI API** ✅
Query pricing directly from FAL.AI API:
```bash
curl https://api.fal.ai/models/pricing
```

### **Option 2: Manual Verification** 📋
Visit each model page on fal.ai and record pricing:
1. Go to fal.ai/models
2. Click each model
3. Look for pricing section
4. Record actual cost per generation

### **Option 3: Conservative Estimation** 💡
For undocumented models, use conservative estimates:
- Budget video models: $0.10-$0.20
- Mid-tier video models: $0.25-$0.35
- Premium video models: $0.40-$0.60
- Flagship models (Sora 2): $0.50-$1.00

### **Option 4: Contact FAL.AI Support** 📧
Email: support@fal.ai
Ask for complete pricing documentation

---

## 📝 NOTES:

1. **FAL.AI prices change frequently** - implement auto-sync system
2. **Per-second vs per-generation** - clarify pricing structure for each model
3. **Audio pricing** - Veo 3 has different pricing with/without audio
4. **Resolution pricing** - some models may charge more for HD/4K
5. **Beta models** - pricing may change when released

---

## 🔗 USEFUL LINKS:

- FAL.AI Models: https://fal.ai/models
- FAL.AI Docs: https://fal.ai/docs
- FAL.AI Pricing: https://fal.ai/pricing
- FAL.AI Blog: https://blog.fal.ai

---

**CONCLUSION:**

**Anda BENAR** bahwa ada ketidaksesuaian harga! Pricing di database perlu diverifikasi dan diupdate dengan harga actual dari FAL.AI. 

Saya akan membuat script untuk:
1. Fetch actual pricing from FAL.AI API
2. Update database dengan harga yang benar
3. Log semua perubahan untuk review

