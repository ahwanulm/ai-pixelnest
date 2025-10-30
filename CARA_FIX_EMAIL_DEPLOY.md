# 🚨 Cara Memperbaiki Email Tidak Terkirim Saat Deploy

## ❌ Masalah
Setelah deploy ke server production, **kode aktivasi tidak bisa dikirim** ke email user saat registrasi.

## 🔍 Penyebab
Email service membutuhkan konfigurasi **EMAIL_USER** dan **EMAIL_PASSWORD** di file `.env`, tetapi file ini **tidak ada atau belum dikonfigurasi** di server production.

---

## ✅ Solusi Cepat (3 Langkah)

### **Step 1: Buat Gmail App Password**

1. Buka: https://myaccount.google.com/security
2. Aktifkan **"2-Step Verification"** (jika belum)
3. Buka: https://myaccount.google.com/apppasswords
4. Pilih **"Mail"** dan **"Other (Custom name)"**
5. Ketik **"PixelNest"** lalu klik **"Generate"**
6. Copy password 16 karakter (format: `xxxx xxxx xxxx xxxx`)

⚠️ **PENTING**: Ini bukan password Gmail biasa, tapi **App Password** khusus!

---

### **Step 2: Setup di Server Production**

**Opsi A: Gunakan Script Otomatis (RECOMMENDED)** ✅

SSH ke server:
```bash
ssh user@your-server-ip
cd /var/www/pixelnest  # atau path project Anda
```

Jalankan setup script:
```bash
./setup-email.sh
```

Script akan meminta:
- Gmail address
- Gmail App Password
- Kemudian otomatis setup .env file

**Opsi B: Manual Setup** 📝

SSH ke server:
```bash
ssh user@your-server-ip
cd /var/www/pixelnest
```

Buat/edit file .env:
```bash
nano .env
```

Tambahkan konfigurasi email:
```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx

# Base URL (ganti dengan domain Anda)
BASE_URL=https://yourdomain.com

# Node Environment
NODE_ENV=production
```

Save file (Ctrl+O, Enter, Ctrl+X di nano)

Set permissions:
```bash
chmod 600 .env
```

---

### **Step 3: Restart Server**

**Jika menggunakan PM2:**
```bash
pm2 restart all
# atau spesifik app:
pm2 restart pixelnest-server
```

**Jika menggunakan systemd:**
```bash
sudo systemctl restart pixelnest
```

**Jika manual:**
```bash
# Kill existing process
pkill -f "node.*server.js"
# Start again
npm start
```

---

## 🧪 Test Email Service

### 1. Test Koneksi Email

```bash
node test-email-connection.js
```

Output yang diharapkan:
```
📧 Email Connection Diagnostic Tool
1️⃣  Checking Environment Variables...
   EMAIL_USER: ✅ your-email@gmail.com
   EMAIL_PASSWORD: ✅ Set (length: 16)
   ✅ Environment variables configured

2️⃣  Testing Gmail SMTP (Port 587 - TLS)...
   ✅ SUCCESS! Connected in 245ms

4️⃣  Sending Test Email...
   ✅ Email sent successfully!
```

### 2. Test Registrasi User

1. Buka website Anda
2. Daftar akun baru
3. Cek email inbox/spam
4. ✅ Kode aktivasi harus masuk!

---

## 🔍 Diagnosa Masalah

### Cek apakah .env sudah benar:

```bash
cat .env | grep EMAIL
```

Output seharusnya:
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
```

❌ Jika kosong atau tidak ada, berarti .env belum dikonfigurasi!

### Cek log server:

**PM2:**
```bash
pm2 logs pixelnest-server --lines 50
```

**Systemd:**
```bash
sudo journalctl -u pixelnest -f
```

**Cari log ini:**
```
✅ Email service initialized with: your-email@gmail.com
📨 Activation email queued for: user@example.com
✅ Activation email sent to: user@example.com
```

❌ **Jika muncul warning:**
```
⚠️  Email not configured! Set EMAIL_USER and EMAIL_PASSWORD in .env file
```
Berarti .env belum diload atau salah!

### Test SMTP Port:

```bash
# Test port 587 (TLS)
nc -zv smtp.gmail.com 587

# Test port 465 (SSL)
nc -zv smtp.gmail.com 465
```

Jika gagal, **firewall memblokir port SMTP**.

---

## 🛠️ Troubleshooting

### Problem 1: Email tidak masuk

**Kemungkinan:**
- App Password salah
- Email masuk ke spam
- Gmail memblokir pengiriman

**Solusi:**
1. Cek spam folder
2. Verifikasi App Password benar (tanpa spasi)
3. Coba generate App Password baru
4. Cek Google Account Security Activity

### Problem 2: ETIMEDOUT Error

```
❌ Failed to send activation email: Error: Connection timeout
   Error code: ETIMEDOUT
```

**Kemungkinan:**
- Firewall memblokir port 587/465
- Network issue di server

**Solusi:**
```bash
# Test koneksi
telnet smtp.gmail.com 587

# Jika gagal, buka port di firewall
sudo ufw allow 587/tcp
sudo ufw allow 465/tcp
```

### Problem 3: EAUTH Error

```
❌ Failed to send activation email: Error: Authentication failed
   Error code: EAUTH
```

**Kemungkinan:**
- Email atau password salah
- App Password expired
- 2-Step Verification tidak aktif

**Solusi:**
1. Generate App Password baru
2. Pastikan 2-Step Verification aktif
3. Update .env dengan password baru
4. Restart server

### Problem 4: .env tidak terload

**Check:**
```bash
# Pastikan file ada
ls -la .env

# Pastikan permissions benar
chmod 600 .env

# Pastikan format benar (tidak ada spasi berlebih)
cat .env
```

**Restart server:**
```bash
pm2 restart all
```

---

## 📋 Checklist Lengkap

Setelah setup, pastikan:

- [ ] Gmail App Password sudah dibuat ✅
- [ ] File .env ada di server production ✅
- [ ] EMAIL_USER terisi dengan benar ✅
- [ ] EMAIL_PASSWORD terisi dengan benar ✅
- [ ] File .env permissions 600 ✅
- [ ] Server sudah di-restart ✅
- [ ] Test email connection berhasil ✅
- [ ] Log server tidak ada warning ✅
- [ ] Registrasi user baru berhasil ✅
- [ ] Email aktivasi diterima ✅

**Jika semua ✅, email system sudah bekerja dengan baik!**

---

## 🚀 Deploy Script

Untuk deploy dari local ke server production, gunakan:

```bash
./deploy-email-fix.sh
```

Script akan:
1. Upload file yang diupdate ke server
2. Set permissions
3. Optionally run setup script
4. Restart server

---

## 💡 Tips Production

### Security Best Practices:

1. **Jangan commit .env ke git:**
   ```bash
   # Pastikan .env di .gitignore
   echo ".env" >> .gitignore
   ```

2. **Gunakan environment variables:**
   ```bash
   # Alternatif: set via PM2 ecosystem
   # ecosystem.config.js
   module.exports = {
     apps: [{
       name: 'pixelnest-server',
       script: './server.js',
       env: {
         EMAIL_USER: 'your-email@gmail.com',
         EMAIL_PASSWORD: 'your-app-password'
       }
     }]
   };
   ```

3. **Rotate App Password secara berkala**

4. **Monitor email sending:**
   ```bash
   pm2 logs | grep -i email
   ```

### Backup Configuration:

```bash
# Backup .env file
cp .env .env.backup.$(date +%Y%m%d)

# Encrypt sensitive data
tar czf env-backup.tar.gz .env
openssl enc -aes-256-cbc -salt -in env-backup.tar.gz -out env-backup.tar.gz.enc
rm env-backup.tar.gz
```

---

## 📞 Support

Jika masih ada masalah:

1. **Check logs lengkap:**
   ```bash
   pm2 logs --lines 100
   ```

2. **Run diagnostic tool:**
   ```bash
   node test-email-connection.js
   ```

3. **Read documentation:**
   - `EMAIL_TIMEOUT_FIX.md` - Troubleshooting detail
   - `SETUP_ENV_FILE.md` - Setup guide
   - `EMAIL_NOT_SENDING_FIX.md` - Common issues

---

## ✅ Summary

### Sebelum Fix:
```
❌ .env tidak ada di server
❌ EMAIL_USER dan EMAIL_PASSWORD kosong
❌ Email tidak terkirim
❌ User tidak bisa registrasi
```

### Setelah Fix:
```
✅ .env dikonfigurasi dengan benar
✅ EMAIL_USER dan EMAIL_PASSWORD terisi
✅ Email terkirim otomatis
✅ User bisa registrasi dan aktivasi
```

---

**Status**: ✅ READY TO DEPLOY!  
**Langkah Selanjutnya**: Ikuti Step 1-3 di atas!

---

**Last Updated**: October 29, 2025

