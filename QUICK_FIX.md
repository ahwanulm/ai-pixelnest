# 🚀 QUICK FIX - Run This Command

## ✅ Copy & Paste Command Ini:

```bash
psql -U ahwanulm -d pixelnest -f run-migration.sql
```

**Atau jika database name berbeda:**

```bash
# Cek dulu database apa yang ada:
psql -U ahwanulm -l

# Lalu jalankan (ganti DATABASE_NAME):
psql -U ahwanulm -d DATABASE_NAME -f run-migration.sql
```

---

## 🔍 Jika Masih Error "database does not exist":

### Step 1: Cek Environment Variables

```bash
cat .env | grep DATABASE
```

**Catat nama database yang digunakan!**

### Step 2: Jalankan dengan Database yang Benar

```bash
# Contoh jika database name: pixelnest_db
psql -U ahwanulm -d pixelnest_db -f run-migration.sql

# Atau jika: pixel_nest
psql -U ahwanulm -d pixel_nest -f run-migration.sql
```

---

## 🎯 Alternative: Run SQL Directly

```bash
# 1. Connect ke database
psql -U ahwanulm -d pixelnest

# 2. Paste command ini:
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS promo_code VARCHAR(50);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_promo_code ON payment_transactions(promo_code);

# 3. Check result:
\d payment_transactions

# 4. Exit:
\q
```

---

## ✅ After Success:

1. **Restart server:**
   ```bash
   # Stop (Ctrl+C) then:
   npm start
   ```

2. **Test promo code** - Should work now! ✅

---

## 📞 Still Error?

Share the output of:
```bash
psql -U ahwanulm -l
cat .env | grep -i database
```

