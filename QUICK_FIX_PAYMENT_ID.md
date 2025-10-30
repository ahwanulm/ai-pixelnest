# 🚀 Quick Fix: Metode Pembayaran Tidak Muncul

## 🎯 Masalah
Metode pembayaran tidak terbaca saat deployment / Tidak muncul di halaman Top Up

## ⚡ Solusi Cepat (1 Command)

### Di Server VPS:

```bash
cd /var/www/pixelnest
git pull origin main
npm run fix:payment-channels
```

**Selesai!** ✅

---

## 📋 Cara Manual (Jika Script Gagal)

### 1. Jalankan Migration Database
```bash
cd /var/www/pixelnest
bash fix-payment-channels-complete.sh
```

### 2. Restart Aplikasi
```bash
pm2 restart pixelnest-server
```

### 3. Sync Payment Channels
```bash
npm run sync:tripay-channels
```

### 4. Test
```bash
curl http://localhost:3000/api/payment/channels
```

---

## 🔍 Troubleshooting

### Masalah: Migration gagal
```bash
# Cek apakah database bisa diakses
psql -U your_user -d pixelnest -c "SELECT 1;"

# Jika gagal, check .env file
cat .env | grep DB_
```

### Masalah: Sync channels gagal
```bash
# Cek konfigurasi Tripay
psql -U your_user -d pixelnest -c "SELECT * FROM api_configs WHERE service_name = 'TRIPAY';"

# Update credentials jika salah (ganti dengan credentials Anda)
psql -U your_user -d pixelnest <<EOF
UPDATE api_configs 
SET api_key = 'YOUR_API_KEY', 
    api_secret = 'YOUR_PRIVATE_KEY'
WHERE service_name = 'TRIPAY';
EOF
```

### Masalah: Channels tetap tidak muncul
```bash
# Clear cache browser
# Kemudian cek di database apakah ada data:
psql -U your_user -d pixelnest -c "SELECT COUNT(*) FROM payment_channels WHERE is_active = true;"

# Jika 0, berarti sync gagal. Coba lagi:
npm run sync:tripay-channels
```

---

## 📖 Dokumentasi Lengkap

Lihat: [SOLUSI_METODE_PEMBAYARAN_DEPLOYMENT.md](./SOLUSI_METODE_PEMBAYARAN_DEPLOYMENT.md)

---

## 💡 Tips

1. **Selalu backup database sebelum migration:**
   ```bash
   pg_dump -U your_user pixelnest > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Monitor logs setelah fix:**
   ```bash
   pm2 logs pixelnest-server --lines 100
   ```

3. **Jika masih ada masalah, restart semua:**
   ```bash
   pm2 restart all
   sudo systemctl restart postgresql
   ```

---

**Need Help?** Baca dokumentasi lengkap atau check PM2 logs untuk detail error.


