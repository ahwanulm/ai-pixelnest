# 🔧 Email Connection Timeout - Troubleshooting Guide

## ❌ Error You're Experiencing

```
Error: Connection timeout
code: 'ETIMEDOUT',
command: 'CONN'
```

This means your application **cannot connect** to Gmail's SMTP server.

---

## ✅ **SOLUTION 1: Check Email Credentials** (Most Common)

### Step 1: Verify .env File Exists

Create a `.env` file in your project root if it doesn't exist:

```bash
touch .env
```

### Step 2: Add Gmail Credentials

Open `.env` and add:

```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password

# Base URL (optional)
BASE_URL=http://localhost:5005
```

### Step 3: Generate Gmail App Password

⚠️ **Important**: You CANNOT use your regular Gmail password. You need an **App Password**.

**How to get Gmail App Password:**

1. **Enable 2-Step Verification** first:
   - Go to: https://myaccount.google.com/security
   - Enable "2-Step Verification"

2. **Generate App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" as the app
   - Select "Other" as the device
   - Name it "PixelNest"
   - Click **Generate**
   - Copy the 16-character password (format: `xxxx xxxx xxxx xxxx`)

3. **Add to .env**:
   ```env
   EMAIL_USER=yourname@gmail.com
   EMAIL_PASSWORD=abcd efgh ijkl mnop
   ```

### Step 4: Restart Your Server

```bash
# Stop the server (Ctrl+C)
# Then restart
pm2 restart all
# OR
npm start
```

---

## ✅ **SOLUTION 2: Check Network/Firewall**

If credentials are correct but still timeout, your **server/firewall might be blocking SMTP ports**.

### Check if Gmail SMTP ports are accessible:

```bash
# Test port 587 (TLS)
telnet smtp.gmail.com 587

# Test port 465 (SSL)
telnet smtp.gmail.com 465

# Alternative test
nc -zv smtp.gmail.com 587
```

**Expected output** (if working):
```
Connected to smtp.gmail.com
220 smtp.gmail.com ESMTP...
```

**If timeout/failed**: Your firewall/network is blocking SMTP.

### Fix Firewall Issues:

**On VPS/Server:**
```bash
# Allow outbound SMTP ports
sudo ufw allow out 587/tcp
sudo ufw allow out 465/tcp
sudo ufw reload
```

**On Cloud Providers (AWS/GCP/Azure):**
- Check Security Groups/Firewall rules
- Ensure outbound traffic on ports 587 and 465 is allowed

---

## ✅ **SOLUTION 3: Alternative SMTP Providers**

If Gmail is blocked or not working, use alternative SMTP services:

### Option A: SendGrid (Recommended for Production)

1. **Sign up**: https://sendgrid.com/
2. **Get API Key**
3. **Update emailService.js**:

```javascript
// Replace Gmail config with SendGrid
this.transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  secure: false,
  auth: {
    user: 'apikey', // literally "apikey"
    pass: process.env.SENDGRID_API_KEY
  }
});
```

### Option B: Mailtrap (For Testing)

Perfect for development/testing:

1. **Sign up**: https://mailtrap.io/
2. **Get credentials** from inbox settings
3. **Update .env**:

```env
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your-mailtrap-username
EMAIL_PASSWORD=your-mailtrap-password
```

4. **Update emailService.js**:

```javascript
this.transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: emailUser,
    pass: emailPassword
  }
});
```

---

## ✅ **SOLUTION 4: Use Port 465 (SSL) Instead of 587**

If port 587 is blocked, try SSL on port 465:

Update `src/services/emailService.js`:

```javascript
this.transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,           // Change from 587 to 465
  secure: true,        // Change from false to true
  auth: {
    user: emailUser,
    pass: emailPassword
  },
  // ... rest of config
});
```

---

## 🔍 **Debug Mode**

To see detailed SMTP connection logs:

### Add to .env:
```env
NODE_ENV=development
DEBUG=nodemailer:*
```

### Restart server and check logs:
```bash
pm2 logs pixelnest-server
```

You'll see detailed connection attempts and errors.

---

## 🧪 **Test Email Service**

Create a test script to verify email configuration:

**test-email.js**:
```javascript
const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmail() {
  console.log('Testing email configuration...');
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '***set***' : 'NOT SET');

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 15000
  });

  try {
    console.log('Verifying connection...');
    await transporter.verify();
    console.log('✅ Connection successful!');

    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to yourself
      subject: 'Test Email from PixelNest',
      text: 'If you receive this, email service is working!'
    });

    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Code:', error.code);
    console.error('Command:', error.command);
  }
}

testEmail();
```

Run it:
```bash
node test-email.js
```

---

## 📋 **Quick Checklist**

- [ ] `.env` file exists in project root
- [ ] `EMAIL_USER` is set to your Gmail address
- [ ] `EMAIL_PASSWORD` is set to Gmail **App Password** (not regular password)
- [ ] Gmail 2-Step Verification is enabled
- [ ] Port 587 or 465 is not blocked by firewall
- [ ] Server has internet access
- [ ] Server restarted after .env changes

---

## 🆘 **Still Not Working?**

### Check Server Logs:
```bash
pm2 logs pixelnest-server --lines 50
```

### Common Error Messages:

| Error Code | Meaning | Solution |
|------------|---------|----------|
| `ETIMEDOUT` | Connection timeout | Check firewall/network, verify credentials |
| `EAUTH` | Authentication failed | Wrong email/password, generate new App Password |
| `ECONNECTION` | Cannot connect | Port blocked, check firewall rules |
| `ESOCKET` | Socket error | Network issue, check internet connection |

---

## 💡 **Recommended Production Setup**

For **production deployment**, consider:

1. **Use SendGrid or AWS SES** (more reliable than Gmail)
2. **Add retry logic** (already implemented in async methods)
3. **Monitor email delivery** (add logging/alerting)
4. **Use email queue** (Redis + Bull for high volume)

---

## 🎯 **Quick Fix for Development**

If you just want to **test without real emails**:

Update `.env`:
```env
# Mock email sending (no actual emails sent)
MOCK_EMAIL=true
```

Then in `emailService.js`, add at the start of send methods:
```javascript
if (process.env.MOCK_EMAIL === 'true') {
  console.log('📧 [MOCK] Email would be sent to:', email);
  console.log('📧 [MOCK] Activation code:', activationCode);
  return { success: true, mock: true };
}
```

---

## Need More Help?

1. **Check logs**: `pm2 logs pixelnest-server`
2. **Test connection**: Run `test-email.js` script above
3. **Verify credentials**: Double-check Gmail App Password
4. **Try alternative**: Use Mailtrap for testing

