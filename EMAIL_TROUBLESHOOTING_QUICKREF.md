# 📧 Email Troubleshooting - Quick Reference

## 🚨 Email Tidak Masuk? Cek Ini!

### ⚡ Quick Diagnosis (30 detik)

```bash
# Check konfigurasi cepat
./check-email-status.sh

# Full diagnosis + test email
node diagnose-sendgrid.js
```

---

## 🔧 Common Fixes

### 1️⃣ SendGrid Not Configured

**Symptoms:**
```
❌ SENDGRID NOT CONFIGURED!
```

**Fix:**
```bash
# Get API Key: https://app.sendgrid.com/settings/api_keys
# Add to .env:
echo "SENDGRID_API_KEY=SG.your-key" >> .env
echo "EMAIL_FROM=noreply@yourdomain.com" >> .env
pm2 restart pixelnest
```

---

### 2️⃣ Email Not Verified

**Symptoms:**
```
❌ EMAIL NOT VERIFIED: noreply@yourdomain.com
Status Code: 403
```

**Fix:**
1. Go: https://app.sendgrid.com/settings/sender_auth
2. Click "Verify a Single Sender"
3. Enter email (same as EMAIL_FROM)
4. Check inbox → Click verification link
5. Test: `node diagnose-sendgrid.js`

---

### 3️⃣ Invalid API Key

**Symptoms:**
```
❌ AUTHENTICATION FAILED
Status Code: 401
```

**Fix:**
1. Go: https://app.sendgrid.com/settings/api_keys
2. Create new API Key (Full Access)
3. Copy key (starts with `SG.`)
4. Update .env or Admin Panel
5. Restart: `pm2 restart pixelnest`

---

### 4️⃣ Permission Denied

**Symptoms:**
```
❌ PERMISSION DENIED
Status Code: 403
```

**Fix:**
1. Create new API Key
2. Select **Full Access** or **Mail Send**
3. Replace old key
4. Restart app

---

### 5️⃣ Email Masuk SPAM

**Symptoms:**
- Email diterima tapi di folder spam
- Low deliverability

**Fix (Quick):**
1. Request recipients mark as "Not Spam"
2. Use professional email template (already done ✅)

**Fix (Production):**
1. Setup Domain Authentication:
   https://app.sendgrid.com/settings/sender_auth
2. Add DNS records (CNAME, SPF, DKIM)
3. Wait 24-48 hours for DNS propagation

---

## 📋 Checklist Debug

- [ ] Run `./check-email-status.sh` → All ✅?
- [ ] Run `node diagnose-sendgrid.js` → SUCCESS?
- [ ] SendGrid API Key starts with `SG.`?
- [ ] EMAIL_FROM verified in SendGrid?
- [ ] Service ACTIVE in database/Admin Panel?
- [ ] Check logs: `pm2 logs pixelnest --lines 50`
- [ ] Check SendGrid Activity Feed (link below)

---

## 🔗 Quick Links

| What | URL |
|------|-----|
| **SendGrid Dashboard** | https://app.sendgrid.com/ |
| **Create API Key** | https://app.sendgrid.com/settings/api_keys |
| **Verify Email** | https://app.sendgrid.com/settings/sender_auth |
| **Activity Feed** | https://app.sendgrid.com/email_activity |
| **Admin Panel** | http://yourdomain.com/admin |

---

## 📊 Log Interpretation

### ✅ SUCCESS Logs:
```
✅ SendGrid API initialized successfully!
📨 Queuing activation email for: user@gmail.com
✅ Activation email SENT successfully!
   Status Code: 202
```
→ **Email sedang dikirim!** Check inbox dalam 1-5 detik

---

### ❌ ERROR: Not Configured
```
❌ SENDGRID NOT CONFIGURED!
```
→ **Fix:** Add SENDGRID_API_KEY to .env

---

### ❌ ERROR: Not Verified
```
❌ EMAIL NOT VERIFIED: noreply@yourdomain.com
Status Code: 403
```
→ **Fix:** Verify sender in SendGrid

---

### ❌ ERROR: Invalid Key
```
❌ AUTHENTICATION FAILED
Status Code: 401
```
→ **Fix:** Create new API Key

---

## 🚑 Emergency Debug Commands

```bash
# 1. Check configuration
cat .env | grep SENDGRID

# 2. Check database
psql -U pixelnest -d pixelnest_db -c \
  "SELECT * FROM api_configs WHERE service_name='SENDGRID';"

# 3. Check app logs
pm2 logs pixelnest --lines 100

# 4. Restart app
pm2 restart pixelnest

# 5. Test email
node diagnose-sendgrid.js

# 6. Monitor real-time
pm2 logs pixelnest
# Then test user registration in browser
```

---

## 📞 Support Resources

### Documentation (Local)
- `CARA_FIX_EMAIL_AKTIVASI.md` - Complete guide
- `EMAIL_ACTIVATION_FIX_SUMMARY.md` - What was fixed
- `SENDGRID_SETUP.md` - Original setup guide

### Commands
```bash
# Read guide
less CARA_FIX_EMAIL_AKTIVASI.md

# Quick check
./check-email-status.sh

# Full diagnosis
node diagnose-sendgrid.js
```

### SendGrid Resources
- Docs: https://docs.sendgrid.com/
- Support: https://support.sendgrid.com/
- Status: https://status.sendgrid.com/

---

## 💡 Pro Tips

### Tip 1: Monitor Activity Feed
Check real-time delivery status:
https://app.sendgrid.com/email_activity

Filter by:
- Date: Today
- Status: All/Delivered/Bounced
- To Email: user@gmail.com

### Tip 2: Test Before Production
Always run before deploying:
```bash
node diagnose-sendgrid.js
```

### Tip 3: Check SPAM Score
Use: https://www.mail-tester.com/
- Send test email to provided address
- Get spam score (aim for 8+/10)

### Tip 4: Warm Up Domain
For new domains:
- Start with 50 emails/day
- Gradually increase over 2 weeks
- Monitor bounce rate (<5%)

### Tip 5: Use Activity Feed for Debug
Every email attempt logged:
- Timestamp
- Status (Delivered/Bounced/Dropped)
- Error messages
- Recipient details

---

## 🎯 Success Indicators

**Email system working correctly if:**
- ✅ `diagnose-sendgrid.js` returns SUCCESS
- ✅ Status Code: 202 in logs
- ✅ Activity Feed shows "Delivered"
- ✅ Test email received within 5 seconds
- ✅ Not in spam folder

---

## ⏱️ Expected Timeline

| Action | Time |
|--------|------|
| Fix configuration | 2 minutes |
| Verify sender email | 5 minutes |
| DNS propagation | 10 min - 48 hours |
| Test email delivery | 1-5 seconds |
| Domain authentication | 1-2 days |

---

## 🆘 Still Not Working?

### Collect Debug Info:
```bash
# Save diagnosis to file
node diagnose-sendgrid.js > debug.txt

# Add app logs
pm2 logs pixelnest --lines 200 >> debug.txt

# Add config (without sensitive data)
echo "\n=== ENV Config ===" >> debug.txt
cat .env | grep -E "SENDGRID|EMAIL_FROM" >> debug.txt
```

### Create Support Ticket:
1. Attach `debug.txt`
2. Screenshot from SendGrid Activity Feed
3. Steps already tried
4. Expected vs actual behavior

---

**Last Updated:** October 31, 2025  
**Quick Access:** Bookmark this page for fast troubleshooting!

---

## 📱 Mobile-Friendly Checklist

When debugging on mobile/tablet:

**Step 1:** Check configuration
- [ ] .env has SENDGRID_API_KEY
- [ ] .env has EMAIL_FROM

**Step 2:** Verify sender
- [ ] Login SendGrid mobile
- [ ] Settings → Sender Auth
- [ ] Email verified ✅

**Step 3:** Check logs
- [ ] SSH to server
- [ ] `pm2 logs pixelnest`
- [ ] Look for ✅ SUCCESS or ❌ ERROR

**Step 4:** Test
- [ ] Register new user
- [ ] Check logs for "SENT successfully"
- [ ] Check inbox (and spam!)

---

**Print This Page:** Keep as reference for quick troubleshooting! 📄

