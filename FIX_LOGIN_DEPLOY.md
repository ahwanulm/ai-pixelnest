# 🔧 Fix: Masalah Login Saat Deploy dengan deploy-pixelnest.sh

## 🔍 Masalah

Ketika deploy menggunakan `deploy-pixelnest.sh`, user **tidak bisa login** karena:

1. ❌ Session cookies tidak berfungsi di belakang Nginx reverse proxy
2. ❌ Express tidak trust X-Forwarded-* headers dari Nginx
3. ❌ Cookie `secure: true` di production memerlukan proper proxy trust

## ✅ Solusi Sudah Diterapkan

### 1. **Trust Proxy Setting**

**File: `server.js`**

Sudah ditambahkan:
```javascript
// Trust proxy (important for cookies behind Nginx)
// This allows Express to trust the X-Forwarded-* headers from Nginx
app.set('trust proxy', 1);
```

**Kenapa penting?**
- Nginx mengirim request dari HTTPS ke HTTP localhost:3000
- Tanpa `trust proxy`, Express menganggap connection tidak secure
- Cookie dengan `secure: true` tidak akan dikirim

---

## 📋 Cara Deploy/Update Setelah Fix

### **Opsi 1: Update Aplikasi yang Sudah Berjalan**

Jika sudah deploy dan aplikasi berjalan:

```bash
# 1. Copy file server.js yang sudah diupdate ke server
# Via SCP atau SFTP

# 2. Di server, restart PM2
pm2 restart pixelnest-server
pm2 save

# 3. Check status
pm2 list
pm2 logs pixelnest-server --lines 50
```

### **Opsi 2: Deploy Ulang dari Awal**

Jika ingin deploy ulang dari awal:

```bash
# Di server (sebagai root atau dengan sudo)
sudo bash deploy-pixelnest.sh
```

Script akan:
1. ✅ Setup system dependencies
2. ✅ Install PostgreSQL & Nginx
3. ✅ Create database & admin user
4. ✅ Setup SSL certificate
5. ✅ Configure Nginx reverse proxy
6. ✅ Start PM2 processes

---

## 🧪 Cara Test Login Setelah Deploy

### **1. Test Login Admin**

```
URL: https://your-domain.com/login
Username: admin
Password: PixelNest@2025
Email: admin@your-domain.com
```

### **2. Check Session Cookie**

Buka Chrome DevTools → Application → Cookies

Pastikan ada cookie:
- **Name:** `connect.sid`
- **HttpOnly:** ✅ (Yes)
- **Secure:** ✅ (Yes, jika HTTPS)
- **SameSite:** None atau Lax

### **3. Check Logs**

```bash
# Check server logs
pm2 logs pixelnest-server --lines 100

# Check Nginx logs
sudo tail -f /var/log/nginx/pixelnest_access.log
sudo tail -f /var/log/nginx/pixelnest_error.log
```

---

## 🔍 Troubleshooting

### **Problem: Masih tidak bisa login setelah fix**

#### **Check 1: Verify Trust Proxy Setting**

```bash
# Di server
cd /path/to/pixelnest
grep -n "trust proxy" server.js
```

Output harus menunjukkan:
```
67:// Trust proxy (important for cookies behind Nginx)
69:app.set('trust proxy', 1);
```

#### **Check 2: Verify Nginx Headers**

File: `/etc/nginx/sites-available/pixelnest`

Pastikan ada:
```nginx
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
```

#### **Check 3: Verify Session Table**

```bash
# Connect to database
PGPASSWORD="your-db-password" psql -h localhost -U pixelnest_user -d pixelnest_db

# Check sessions table
\d sessions
SELECT COUNT(*) FROM sessions;
```

#### **Check 4: Verify SESSION_SECRET**

```bash
# Check .env file
cat .env | grep SESSION_SECRET
```

Harus ada value yang secure (bukan default).

---

## 🔐 Security Notes

### **Trust Proxy = 1**

```javascript
app.set('trust proxy', 1);
```

- **1** = Trust only the first proxy (Nginx)
- Safe untuk setup: `User → Nginx → Node.js`
- Jangan gunakan `true` (trust all proxies) kecuali ada multiple proxies

### **Cookie Secure Flag**

```javascript
cookie: {
  secure: process.env.NODE_ENV === 'production', // true di production
  httpOnly: true,
  maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
}
```

- **secure: true** → Cookie hanya dikirim via HTTPS
- **httpOnly: true** → Tidak bisa diakses via JavaScript (anti XSS)
- **maxAge** → Session expire dalam 7 hari

---

## 🚀 Quick Commands

```bash
# Restart aplikasi setelah update
pm2 restart pixelnest-server
pm2 save

# View real-time logs
pm2 logs pixelnest-server

# Check PM2 status
pm2 list

# Reload Nginx (jika ada perubahan config)
sudo systemctl reload nginx

# Test Nginx config
sudo nginx -t

# Check SSL certificate
sudo certbot certificates
```

---

## 📝 Summary Perubahan

### File yang Dimodifikasi:

1. **`server.js`**
   - ✅ Tambah `app.set('trust proxy', 1);`
   - Lokasi: Setelah view engine setup, sebelum body parser

### Tidak Perlu Diubah:

- ❌ `deploy-pixelnest.sh` (sudah benar)
- ❌ Nginx config (sudah benar)
- ❌ Session config (sudah benar)

---

## ✅ Expected Result

Setelah fix:

1. ✅ Login berfungsi normal
2. ✅ Session persisten setelah login
3. ✅ Cookie secure di HTTPS
4. ✅ Dashboard accessible setelah login
5. ✅ Logout berfungsi
6. ✅ Session bertahan sampai 7 hari

---

## 📞 Need Help?

Jika masih ada masalah:

1. Kirim logs dari `pm2 logs pixelnest-server`
2. Kirim Nginx error logs dari `/var/log/nginx/pixelnest_error.log`
3. Screenshot dari Chrome DevTools → Network tab saat login
4. Screenshot dari Chrome DevTools → Application → Cookies

---

**Last Updated:** 2025-10-29  
**Status:** ✅ Fixed - Ready to Deploy

