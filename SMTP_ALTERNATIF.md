# 🔥 Solusi SMTP Port Blocked (ETIMEDOUT Error)

## ❌ Error yang Terjadi

```
Error: Connection timeout
code: 'ETIMEDOUT'
command: 'CONN'
```

**Penyebab**: Port 587/465 (SMTP) **DIBLOKIR** oleh firewall atau hosting provider.

---

## ✅ Solusi 1: Buka Port Firewall (Jika Punya Root Access)

### Check Port Status Dulu

```bash
# Test port 587
timeout 5 bash -c "cat < /dev/null > /dev/tcp/smtp.gmail.com/587" && echo "✅ Port 587 OPEN" || echo "❌ Port 587 BLOCKED"

# Test port 465
timeout 5 bash -c "cat < /dev/null > /dev/tcp/smtp.gmail.com/465" && echo "✅ Port 465 OPEN" || echo "❌ Port 465 BLOCKED"
```

### Buka Port (Pilih sesuai firewall Anda)

**UFW (Ubuntu/Debian):**
```bash
sudo ufw allow 587/tcp
sudo ufw allow 465/tcp
sudo ufw reload
sudo ufw status
```

**Firewalld (CentOS/RHEL):**
```bash
sudo firewall-cmd --permanent --add-port=587/tcp
sudo firewall-cmd --permanent --add-port=465/tcp
sudo firewall-cmd --reload
sudo firewall-cmd --list-ports
```

**iptables:**
```bash
sudo iptables -A OUTPUT -p tcp --dport 587 -j ACCEPT
sudo iptables -A OUTPUT -p tcp --dport 465 -j ACCEPT
sudo service iptables save
```

**Cloud Provider Security Group:**
- **AWS**: EC2 → Security Groups → Edit Outbound Rules → Add port 587, 465
- **DigitalOcean**: Droplet → Networking → Firewalls → Add rules
- **Vultr/Linode**: Similar - check firewall/networking settings

### Test Lagi Setelah Buka Port

```bash
node test-email-connection.js
```

---

## ✅ Solusi 2: Gunakan SMTP Relay Service (RECOMMENDED)

Jika port tidak bisa dibuka (provider memblokir), gunakan **SMTP Relay Service**. Ini adalah solusi terbaik untuk production!

### **Option A: SendGrid (12,000 Free/Month)** ⭐ RECOMMENDED

1. **Sign up**: https://sendgrid.com/
2. **Create API Key**: Settings → API Keys → Create API Key
3. **Get SMTP Credentials**:
   - Host: `smtp.sendgrid.net`
   - Port: `587`
   - Username: `apikey`
   - Password: `[Your API Key]`

4. **Update .env**:
```env
EMAIL_USER=apikey
EMAIL_PASSWORD=SG.your-sendgrid-api-key
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
```

5. **Update emailService.js** (lihat code di bawah)

---

### **Option B: Mailgun (5,000 Free/Month)**

1. **Sign up**: https://mailgun.com/
2. **Get SMTP credentials**: Sending → Domain Settings → SMTP
3. **Update .env**:
```env
EMAIL_USER=postmaster@your-domain.mailgun.org
EMAIL_PASSWORD=your-mailgun-smtp-password
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
```

---

### **Option C: Brevo (300 Free/Day)**

1. **Sign up**: https://brevo.com/
2. **Get SMTP credentials**: SMTP & API → SMTP
3. **Update .env**:
```env
EMAIL_USER=your-brevo-login
EMAIL_PASSWORD=your-brevo-smtp-key
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
```

---

### **Option D: Amazon SES (62,000 Free/Month)**

1. **Sign up**: https://aws.amazon.com/ses/
2. **Verify email/domain**
3. **Create SMTP credentials**: SES → SMTP Settings → Create SMTP Credentials
4. **Update .env**:
```env
EMAIL_USER=your-ses-smtp-username
EMAIL_PASSWORD=your-ses-smtp-password
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
```

⚠️ Note: Perlu verifikasi domain untuk production

---

## 🔧 Update Code untuk Support SMTP Relay

Edit `src/services/emailService.js`:

```javascript
const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
  constructor() {
    const emailUser = process.env.EMAIL_USER || '';
    const emailPassword = process.env.EMAIL_PASSWORD || '';
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');

    if (!emailUser || !emailPassword) {
      console.warn('⚠️  Email not configured!');
    } else {
      console.log(`📧 Email service initialized with: ${emailUser}`);
      console.log(`   SMTP: ${smtpHost}:${smtpPort}`);
    }

    // Configure SMTP - Support both Gmail and SMTP Relay
    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: emailUser,
        pass: emailPassword
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 1000,
      rateLimit: 1,
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 15000,
      tls: {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2'
      },
      debug: process.env.NODE_ENV === 'development',
      logger: process.env.NODE_ENV === 'development'
    });
  }
  
  // ... rest of the code stays the same
}
```

---

## 📋 Comparison SMTP Services

| Service | Free Tier | Setup Difficulty | Recommended For |
|---------|-----------|------------------|-----------------|
| **SendGrid** | 12,000/month | ⭐ Easy | Production (Best) |
| **Mailgun** | 5,000/month | ⭐⭐ Medium | Production |
| **Brevo** | 300/day (9,000/month) | ⭐ Easy | Small projects |
| **Amazon SES** | 62,000/month | ⭐⭐⭐ Hard | Large scale |
| **Gmail SMTP** | ~100/day | ⭐ Easy | Development only |

---

## 🚀 Quick Setup dengan SendGrid (TERCEPAT)

### 1. Daftar SendGrid
```
https://sendgrid.com/
→ Sign up (Free)
→ Verify email
```

### 2. Buat API Key
```
Dashboard → Settings → API Keys
→ Create API Key
→ Full Access
→ Copy key (starts with SG.)
```

### 3. Update .env di Server
```bash
ssh user@your-server
cd /var/www/pixelnest
nano .env
```

Tambahkan/update:
```env
EMAIL_USER=apikey
EMAIL_PASSWORD=SG.your-actual-sendgrid-key-here
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
```

### 4. Update emailService.js
Apply code changes di atas (support SMTP_HOST and SMTP_PORT)

### 5. Restart & Test
```bash
pm2 restart all
node test-email-connection.js
```

---

## 🧪 Test Connection

### Test Manual dengan Curl
```bash
# Test SendGrid
curl -v telnet://smtp.sendgrid.net:587

# Test Mailgun
curl -v telnet://smtp.mailgun.org:587

# Test Gmail
curl -v telnet://smtp.gmail.com:587
```

Should see:
```
* Connected to smtp.sendgrid.net (xxx.xxx.xxx.xxx) port 587
220 SG ESMTP service ready
```

### Test dengan Node.js
```bash
node test-email-connection.js
```

---

## ⚠️ Troubleshooting

### Masih ETIMEDOUT setelah buka firewall?

**Kemungkinan**: Provider memblokir di level network.

**Solusi**:
1. Contact hosting support untuk unblock port 587/465
2. Atau switch ke SMTP relay (SendGrid, etc)

### SendGrid/Mailgun masih timeout?

Check port alternatif:
- Port 587 (TLS)
- Port 2525 (alternative)
- Port 465 (SSL)

Update `.env`:
```env
SMTP_PORT=2525  # Try alternative port
```

### Error: "Too many recipients"

Gmail SMTP limit: ~100 emails/day

**Solusi**: Switch ke SendGrid/Mailgun (production-ready)

---

## 📝 Summary

### Untuk Development (Local):
```env
# Use Gmail SMTP
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
```

### Untuk Production (Server):
```env
# Use SendGrid (RECOMMENDED)
EMAIL_USER=apikey
EMAIL_PASSWORD=SG.your-sendgrid-api-key
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
```

---

## ✅ Action Plan

**Pilih salah satu:**

### Quick Fix (Jika Port Bisa Dibuka):
```bash
sudo ufw allow 587/tcp
sudo ufw allow 465/tcp
sudo ufw reload
pm2 restart all
```

### Production Solution (RECOMMENDED):
1. Sign up SendGrid (5 menit)
2. Get API Key
3. Update .env dengan SendGrid credentials
4. Update emailService.js (support SMTP_HOST)
5. Restart server
6. ✅ Done!

---

**Status**: Ready to fix!  
**Recommended**: Use SendGrid for production  
**ETA**: 10 minutes setup time

