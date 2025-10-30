# ⚡ Quick Fix - Email Tidak Terkirim Saat Deploy

## 🎯 Masalah
Kode aktivasi tidak dikirim ke email setelah deploy ke production.

## 🚀 Solusi 3 Menit

### 1️⃣ Buat Gmail App Password

```
1. Buka: https://myaccount.google.com/apppasswords
2. Login → Select "Mail" → Type "PixelNest" → Generate
3. Copy password 16 karakter
```

### 2️⃣ Setup di Server

SSH ke server:
```bash
ssh user@your-server-ip
cd /var/www/pixelnest  # atau path project Anda
```

**Opsi A: Gunakan Script Otomatis** ✅
```bash
./setup-email.sh
```

**Opsi B: Manual**
```bash
nano .env
```

Tambahkan:
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
BASE_URL=https://yourdomain.com
```

Save & Set permissions:
```bash
chmod 600 .env
```

### 3️⃣ Restart Server

```bash
# PM2
pm2 restart all

# Systemd
sudo systemctl restart pixelnest
```

### 4️⃣ Test

```bash
# Check config
node check-email-config.js

# Test connection
node test-email-connection.js

# Check logs
pm2 logs pixelnest-server
```

## ✅ Done!

Coba registrasi user baru, email aktivasi harus masuk.

---

## 🆘 Masih Error?

### Cek log:
```bash
pm2 logs --lines 50 | grep -i email
```

### Cek .env terload:
```bash
cat .env | grep EMAIL
```

### Test port SMTP:
```bash
nc -zv smtp.gmail.com 587
```

---

**Dokumentasi Lengkap**: `CARA_FIX_EMAIL_DEPLOY.md`

