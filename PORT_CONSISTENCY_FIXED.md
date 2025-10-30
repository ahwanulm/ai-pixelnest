# ✅ Port Consistency - FIXED!

## 🎯 Issue: Port Mismatch

**Problem**: Aplikasi berjalan di port **5005** tapi beberapa konfigurasi masih menggunakan port **3000**

## ⚠️ Dampak Jika Tidak Diperbaiki:

### Email Activation Links ❌
```
Email berisi: http://localhost:3000/...
Aplikasi di: http://localhost:5005/...
Result: 404 NOT FOUND!
```

### Callback URLs ❌
```
Tripay callback: http://localhost:3000/api/payment/callback
Google OAuth: http://localhost:3000/auth/google/callback
Aplikasi: Port 5005
Result: CALLBACK FAILED!
```

---

## ✅ Yang Sudah Diperbaiki

### 1. **Email Configuration**

#### File: `src/scripts/initEmailConfig.js`
```javascript
// BEFORE ❌
const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

// AFTER ✅
const baseUrl = process.env.BASE_URL || 'http://localhost:5005';
```

**Impact**: Activation links di email sekarang menggunakan port 5005!

---

### 2. **Admin Panel - Email Config Display**

#### File: `src/views/admin/api-configs.ejs`

**Display field:**
```ejs
<!-- BEFORE ❌ -->
<%= emailConfig.base_url || 'http://localhost:3000' %>

<!-- AFTER ✅ -->
<%= emailConfig.base_url || 'http://localhost:5005' %>
```

**Form placeholder:**
```html
<!-- BEFORE ❌ -->
<input placeholder="http://localhost:3000">

<!-- AFTER ✅ -->
<input placeholder="http://localhost:5005">
```

**JavaScript default:**
```javascript
// BEFORE ❌
emailConfig.base_url || 'http://localhost:3000'

// AFTER ✅
emailConfig.base_url || 'http://localhost:5005'
```

---

### 3. **Tripay Callback URL**

#### File: `src/views/admin/api-configs.ejs`

```html
<!-- BEFORE ❌ -->
http://localhost:3000/api/payment/callback

<!-- AFTER ✅ -->
http://localhost:5005/api/payment/callback
```

**User sudah fix ini sendiri!** ✅

---

### 4. **Google OAuth Callback**

#### File: `src/views/admin/api-configs.ejs`

```html
<!-- BEFORE ❌ -->
http://localhost:3000/auth/google/callback

<!-- AFTER ✅ -->
http://localhost:5005/auth/google/callback
```

**User sudah fix ini sendiri!** ✅

---

## 📊 Port Consistency Check

| Component | Port | Status |
|-----------|------|--------|
| **Server** | 5005 | ✅ Running |
| **Email BASE_URL** | 5005 | ✅ Fixed |
| **Email Config Display** | 5005 | ✅ Fixed |
| **Email Form Placeholder** | 5005 | ✅ Fixed |
| **Tripay Callback** | 5005 | ✅ Fixed by user |
| **Google OAuth Callback** | 5005 | ✅ Fixed by user |

**Result**: ✅ **SEMUA PORT KONSISTEN DI 5005!**

---

## 🔧 Environment Variable

### File: `.env`

```env
# IMPORTANT: Set this to your actual port!
PORT=5005
BASE_URL=http://localhost:5005

# For production:
# BASE_URL=https://yourdomain.com
```

**Note**: `.env` akan override default values!

---

## 🧪 Testing

### 1. Test Email Links

```bash
# 1. Configure email di admin panel
# 2. Register user baru
# 3. Check email
# 4. Verify link format:
http://localhost:5005/...  # ✅ Correct port!
```

### 2. Test Tripay Callback

```bash
# Check Tripay config in admin panel
Callback URL: http://localhost:5005/api/payment/callback
# ✅ Correct port!
```

### 3. Test Google OAuth

```bash
# Check Google OAuth config
Callback: http://localhost:5005/auth/google/callback
# ✅ Correct port!
```

---

## 📋 Checklist

- [x] ✅ Email BASE_URL default → 5005
- [x] ✅ Email config display → 5005
- [x] ✅ Email form placeholder → 5005
- [x] ✅ Email JS default → 5005
- [x] ✅ Tripay callback → 5005
- [x] ✅ Google OAuth callback → 5005
- [ ] ⚠️ Update .env with BASE_URL=http://localhost:5005

---

## 🚀 Next Steps

### 1. Update .env File

```env
PORT=5005
BASE_URL=http://localhost:5005
```

### 2. Re-sync Email Config

```bash
npm run init:email-config
```

Expected output:
```
✅ EMAIL configuration updated!
🌐 Base URL: http://localhost:5005
📍 Port: 5005
```

### 3. Restart Server

```bash
npm run dev
```

### 4. Verify in Admin Panel

```
http://localhost:5005/admin/api-configs
→ Email card should show: Base URL: http://localhost:5005
```

---

## 🎯 Why Port Consistency Matters

### For Email Activation:

```
Registration Flow:
1. User registers
2. System sends email with link:
   http://localhost:5005/verify?code=123456
3. User clicks link
4. ✅ Opens app on correct port
5. ✅ Activation works!
```

**If port was wrong:**
```
1. Email contains: http://localhost:3000/...
2. User clicks
3. ❌ Browser: "Can't connect to server"
4. ❌ Activation FAILS!
```

### For Payment Callbacks:

```
Payment Flow:
1. User pays via Tripay
2. Tripay sends callback to:
   http://localhost:5005/api/payment/callback
3. ✅ App receives callback
4. ✅ Payment processed!
```

**If port was wrong:**
```
1. Tripay sends to: http://localhost:3000/...
2. ❌ Connection refused
3. ❌ Payment not processed!
4. ❌ User not credited!
```

---

## 💡 Production Considerations

### For Production Deployment:

```env
# .env.production
PORT=80  # or 443 for HTTPS
BASE_URL=https://yourdomain.com

# NO port in URL for standard ports!
```

### Dynamic Port Configuration:

```javascript
// Best practice: Use environment variable
const port = process.env.PORT || 5005;
const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;
```

---

## ✅ Summary

### What Was Wrong:
- ❌ Mixed ports (3000 and 5005)
- ❌ Email links would be broken
- ❌ Callbacks would fail
- ❌ Inconsistent configuration

### What's Fixed:
- ✅ All defaults set to 5005
- ✅ Email links will work
- ✅ Callbacks will work
- ✅ Consistent across all components

### Action Required:
1. Update `.env`: `BASE_URL=http://localhost:5005`
2. Run: `npm run init:email-config`
3. Verify in admin panel
4. Test email activation flow

---

## 🎉 Result

**Semua port sekarang konsisten di 5005!**

✅ Email activation links → Port 5005  
✅ Payment callbacks → Port 5005  
✅ OAuth callbacks → Port 5005  
✅ Admin panel display → Port 5005  

**No more 404 errors!** 🎊

---

**Last Updated**: October 26, 2025  
**Status**: ✅ ALL PORTS CONSISTENT  
**Port**: 5005

