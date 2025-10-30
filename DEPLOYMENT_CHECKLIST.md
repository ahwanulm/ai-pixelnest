# ✅ Deployment Checklist - Payment Channels Fix

## 📋 Pre-Deployment (Local - SELESAI ✅)

- [x] Identifikasi masalah: column mismatch di payment_channels
- [x] Buat migration SQL lengkap
- [x] Update setupDatabase.js dengan struktur yang benar
- [x] Buat deployment script
- [x] Buat dokumentasi lengkap
- [x] Verifikasi tidak ada code lain yang terpengaruh

## 🚀 Deployment (Server - PERLU DILAKUKAN)

### Step 1: Backup Database (RECOMMENDED)
```bash
cd /var/www/pixelnest
pg_dump -h localhost -U pixelnest_user pixelnest_db > backup_before_migration_$(date +%Y%m%d_%H%M%S).sql
```

### Step 2: Pull Latest Code
```bash
cd /var/www/pixelnest
git pull origin main
```

### Step 3: Run Migration
```bash
bash fix-payment-channels-complete.sh
```

**Expected output:**
```
✓ Renamed group_name to group_channel
✓ Added fee_merchant_flat
✓ Added fee_merchant_percent
✓ Added fee_customer_flat
✓ Added fee_customer_percent
✓ Renamed minimum_fee to minimum_amount
✓ Renamed maximum_fee to maximum_amount
✅ Migration completed successfully!
```

### Step 4: Restart Application
```bash
pm2 restart pixelnest-server
pm2 save
```

### Step 5: Verify No Errors
```bash
pm2 logs pixelnest-server --lines 50
```

**Should NOT see:**
- ❌ `column "group_channel" does not exist`
- ❌ `column "fee_merchant_flat" does not exist`

### Step 6: Test Payment Channels Endpoint
```bash
curl http://localhost:3000/api/payment/channels
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "Virtual Account": [...],
    "E-Wallet": [...]
  }
}
```

### Step 7: Sync Payment Channels (Optional)
```bash
npm run sync:tripay-channels
```

atau via Admin Panel:
- Login ke admin
- Payment Management
- Click "Sync Channels"

## 🔍 Post-Deployment Verification

- [ ] Payment channels API working
- [ ] No errors in PM2 logs
- [ ] Database structure correct
- [ ] Admin panel dapat sync channels
- [ ] Users dapat melihat payment options

## 🆘 Rollback Plan (Jika Ada Masalah)

```bash
# Restore dari backup
psql -h localhost -U pixelnest_user pixelnest_db < backup_before_migration_TIMESTAMP.sql

# Restart
pm2 restart pixelnest-server
```

## 📞 Troubleshooting

### Issue: Script tidak jalan
**Solution:** Run manual migration
```bash
PGPASSWORD=your_password psql -h localhost -U pixelnest_user -d pixelnest_db \
  -f migrations/fix_payment_channels_structure_complete.sql
```

### Issue: Permission denied
**Solution:** Run as appropriate user
```bash
sudo -u postgres psql pixelnest_db -f migrations/fix_payment_channels_structure_complete.sql
```

### Issue: Migration sudah pernah dijalankan
**Solution:** It's OK! Migration is idempotent, aman dijalankan ulang.

## ✅ Success Criteria

1. ✅ No database column errors in logs
2. ✅ `/api/payment/channels` endpoint returns data
3. ✅ PM2 status: online
4. ✅ Admin panel working
5. ✅ Users can access payment page

---

**Status:** 🟡 READY TO DEPLOY  
**Risk Level:** 🟢 LOW (migration tested & safe)  
**Estimated Time:** ⏱️ 5 minutes  
**Rollback Available:** ✅ YES

