# 📧 Email Configuration - Admin Panel Guide

Guide lengkap untuk mengatur email activation system melalui Admin Panel.

## 🎯 Overview

Email configuration telah ditambahkan ke **Admin Panel → API Configs**. Admin dapat melihat status email service dan pengaturannya langsung dari dashboard.

---

## 🚀 Setup (One-Time)

### 1️⃣ Initialize Email Config di Database

```bash
npm run init:email-config
```

Output:
```
✅ EMAIL configuration created!
📧 Email User: NOT CONFIGURED
🔑 Email Password: NOT CONFIGURED
🌐 Base URL: http://localhost:3000
✅ Status: Inactive
```

### 2️⃣ Configure .env File

Tambahkan ke file `.env`:

```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
BASE_URL=http://localhost:3000
```

⚠️ **PENTING**: `EMAIL_PASSWORD` harus **Gmail App Password** (16 digit)

#### Cara Generate Gmail App Password:
1. Buka: https://myaccount.google.com/
2. Security → 2-Step Verification (aktifkan dulu)
3. Scroll ke bawah → App passwords
4. Generate untuk "Mail"
5. Copy 16-digit password → paste ke .env

### 3️⃣ Restart Server

```bash
npm run dev
```

### 4️⃣ Re-sync Config

Jalankan lagi untuk update dari .env:

```bash
npm run init:email-config
```

Output:
```
✅ EMAIL configuration updated!
📧 Email User: your-email@gmail.com
🔑 Email Password: SET (hidden)
🌐 Base URL: http://localhost:3000
✅ Status: Active
```

---

## 📊 Melihat Email Config di Admin Panel

### Akses Admin Panel

```
URL: http://localhost:3000/admin/api-configs
```

### Tampilan Email Config Card

```
┌─────────────────────────────────────────┐
│ 📧 EMAIL                      [Active]   │
│ smtp.gmail.com                           │
├─────────────────────────────────────────┤
│ Service: gmail                           │
│ Email User: your-email@gmail.com         │
│ SMTP Server: smtp.gmail.com              │
│ Base URL: http://localhost:3000          │
│ Rate Limit: 100 emails/hour              │
└─────────────────────────────────────────┘
```

### Status Indicators

| Badge | Meaning |
|-------|---------|
| 🟢 **Active** | Email configured dan siap digunakan |
| 🔴 **Inactive** | Email belum dikonfigurasi |
| ⚠️ **Setup Required** | Warning box muncul jika belum setup |

---

## 🔧 Email Configuration Fields

### Informasi yang Ditampilkan:

1. **Service**: Email service provider (gmail)
2. **Email User**: Gmail address untuk mengirim email
3. **SMTP Server**: Server SMTP (smtp.gmail.com)
4. **Base URL**: Base URL aplikasi untuk link di email
5. **Rate Limit**: Batas pengiriman email per jam

### Configuration Storage:

```javascript
// Stored in api_configs table
{
  service_name: "EMAIL",
  api_key: "your-email@gmail.com",  // EMAIL_USER
  api_secret: "••••••••",            // Masked (not shown)
  endpoint_url: "smtp.gmail.com",
  is_active: true,
  rate_limit: 100,
  additional_config: {
    email_user: "your-email@gmail.com",
    service: "gmail",
    base_url: "http://localhost:3000",
    configured: true
  }
}
```

---

## ⚙️ Update Email Configuration

### Via .env dan Re-sync

1. Edit `.env` file
2. Run: `npm run init:email-config`
3. Restart server
4. Refresh Admin Panel

### Via Database (Advanced)

```sql
UPDATE api_configs 
SET 
  api_key = 'new-email@gmail.com',
  additional_config = jsonb_set(
    additional_config, 
    '{email_user}', 
    '"new-email@gmail.com"'
  ),
  updated_at = NOW()
WHERE service_name = 'EMAIL';
```

---

## 🐛 Troubleshooting dari Admin Panel

### ❌ Status "Inactive"

**Penyebab:**
- `EMAIL_USER` atau `EMAIL_PASSWORD` belum diisi di .env
- Config belum di-sync ke database

**Solusi:**
1. Cek `.env` file
2. Pastikan `EMAIL_USER` dan `EMAIL_PASSWORD` terisi
3. Run: `npm run init:email-config`
4. Restart server

### ⚠️ Warning "Setup Required" Muncul

**Artinya:**
Email belum dikonfigurasi dengan benar

**Action:**
Ikuti instruksi di warning box:
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
```

### 🔴 Email Tidak Terkirim (Status Active)

**Debug Steps:**

1. **Test Email Service**
```bash
# Di Node.js console
const emailService = require('./src/services/emailService');
await emailService.verifyConnection();
```

2. **Check Logs**
```bash
# Look for email errors
tail -f logs/server.log | grep email
```

3. **Verify Gmail Settings**
- 2-Step Verification aktif?
- App Password benar (16 digit)?
- Email tidak ke spam?

4. **Check Database**
```sql
SELECT * FROM api_configs WHERE service_name = 'EMAIL';
```

---

## 📈 Monitoring Email Usage

### Admin Panel Stats (Coming Soon)

Fitur yang akan datang:
- Total emails sent
- Success/failure rate
- Last email sent timestamp
- Daily/weekly/monthly stats
- Error logs

### Current Monitoring via Logs

```bash
# Filter email logs
grep "email" logs/server.log

# Count emails sent
grep "Activation email sent" logs/server.log | wc -l
```

### Database Queries

```sql
-- Check email config
SELECT 
  service_name,
  is_active,
  rate_limit,
  additional_config->>'email_user' as email_user,
  updated_at
FROM api_configs
WHERE service_name = 'EMAIL';

-- Count pending activations (waiting for email)
SELECT COUNT(*) 
FROM users 
WHERE is_active = FALSE 
  AND activation_code IS NOT NULL;
```

---

## 🔐 Security Best Practices

### ✅ DO:
- ✅ Use Gmail App Password (bukan password biasa)
- ✅ Enable 2-Step Verification
- ✅ Keep .env file secure (never commit)
- ✅ Use dedicated email account untuk app
- ✅ Monitor email logs regularly
- ✅ Set reasonable rate limits

### ❌ DON'T:
- ❌ Jangan share App Password
- ❌ Jangan commit .env ke git
- ❌ Jangan pakai personal email
- ❌ Jangan disable 2-Step Verification
- ❌ Jangan set rate limit terlalu tinggi

---

## 🎨 Customization

### Update Rate Limit

```sql
UPDATE api_configs 
SET rate_limit = 200  -- Change to your limit
WHERE service_name = 'EMAIL';
```

### Change Base URL

```sql
UPDATE api_configs 
SET additional_config = jsonb_set(
  additional_config, 
  '{base_url}', 
  '"https://yourdomain.com"'
)
WHERE service_name = 'EMAIL';
```

### Add Custom Fields

```sql
UPDATE api_configs 
SET additional_config = additional_config || 
  '{"from_name": "PixelNest Team", "reply_to": "support@pixelnest.id"}'::jsonb
WHERE service_name = 'EMAIL';
```

---

## 📊 Admin Actions Available

### Current:
- ✅ View email configuration
- ✅ Check active/inactive status
- ✅ See setup requirements
- ✅ View SMTP details
- ✅ Check rate limits

### Coming Soon:
- 🔜 Edit config via UI (without .env)
- 🔜 Test email sending
- 🔜 View email logs
- 🔜 Email statistics dashboard
- 🔜 Resend failed emails
- 🔜 Email templates management

---

## 🧪 Testing

### Test dari Admin Panel

1. Go to `/admin/api-configs`
2. Cek EMAIL card
3. Pastikan status **Active**
4. Pastikan tidak ada warning

### Test Actual Email Sending

```bash
# Register user baru
# Go to: http://localhost:3000/login
# Input: test@gmail.com
# Fill registration form
# Check email for activation code
```

### Verify Configuration

```bash
# Check if config loaded correctly
npm run init:email-config

# Should show:
# ✅ EMAIL configuration updated!
# 📧 Email User: your-email@gmail.com
# ✅ Status: Active
```

---

## 📋 Checklist Setup Admin

- [ ] ✅ Run `npm run migrate:email-activation`
- [ ] ✅ Run `npm run init:email-config`
- [ ] ✅ Setup EMAIL_USER di .env
- [ ] ✅ Setup EMAIL_PASSWORD di .env
- [ ] ✅ Generate Gmail App Password
- [ ] ✅ Re-sync: `npm run init:email-config`
- [ ] ✅ Restart server
- [ ] ✅ Check Admin Panel → API Configs
- [ ] ✅ Verify status Active
- [ ] ✅ Test registration flow
- [ ] ✅ Confirm email received

---

## 🔗 Related Documentation

- **EMAIL_ACTIVATION_SYSTEM.md** - Full technical documentation
- **EMAIL_ACTIVATION_QUICKSTART.md** - Quick setup guide
- **EMAIL_ACTIVATION_SUMMARY.md** - Implementation summary
- **GMAIL_ACTIVATION_README.md** - User-facing guide

---

## 💡 Tips

### Untuk Production:

1. **Use Dedicated Gmail**
   - Buat Gmail khusus untuk app
   - Jangan campur dengan personal email

2. **Monitor Rate Limits**
   - Gmail free: 500 emails/day
   - Set rate_limit accordingly

3. **Setup Monitoring**
   - Log semua email sent/failed
   - Alert jika failure rate tinggi

4. **Backup SMTP**
   - Consider backup email service
   - SendGrid, Mailgun, AWS SES

5. **Regular Checks**
   - Weekly check di Admin Panel
   - Monitor pending activations
   - Check email logs

---

## ✅ Success Indicators

Konfigurasi berhasil jika:

✅ Email card di Admin Panel status **Active**  
✅ Email User terisi dengan benar  
✅ Tidak ada warning "Setup Required"  
✅ User baru receive activation email  
✅ Email masuk ke inbox (tidak spam)  
✅ Links di email works correctly  
✅ Welcome email sent after activation  

---

## 🆘 Need Help?

### Quick Fixes:

**Email tidak terkirim:**
```bash
# Rerun init
npm run init:email-config

# Check logs
tail -f logs/server.log | grep email

# Test connection
node -e "require('./src/services/emailService').verifyConnection()"
```

**Status Inactive:**
```bash
# Check .env
cat .env | grep EMAIL

# Re-sync
npm run init:email-config
```

**Error di Admin Panel:**
```bash
# Check database
psql -U postgres -d pixelnest -c "SELECT * FROM api_configs WHERE service_name = 'EMAIL';"
```

---

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Last Updated**: October 26, 2025

