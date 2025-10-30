# 🗄️ Database Setup Guide - PostgreSQL

## Masalah: "role postgres does not exist"

Error ini umum terjadi di macOS karena PostgreSQL tidak membuat default user "postgres".

## ✅ Solusi (Pilih salah satu)

### Opsi 1: Gunakan User macOS Anda (RECOMMENDED)

1. **Cek username macOS Anda:**
```bash
whoami
```

2. **Edit file `.env` dan ganti dengan username Anda:**
```env
DB_USER=ahwanulm  # Ganti dengan hasil dari whoami
DB_PASSWORD=      # Kosongkan jika tidak ada password
```

3. **Buat database dengan user Anda:**
```bash
# Langsung buat database (tidak perlu login ke psql)
createdb pixelnest_db
```

4. **Test koneksi:**
```bash
psql pixelnest_db
# Jika berhasil, ketik \q untuk exit
```

### Opsi 2: Buat User "postgres"

Jika Anda ingin tetap menggunakan user "postgres":

```bash
# 1. Login ke PostgreSQL dengan user macOS Anda
psql postgres

# 2. Buat user postgres dengan password
CREATE USER postgres WITH PASSWORD 'your_password';

# 3. Beri permission superuser
ALTER USER postgres WITH SUPERUSER;

# 4. Buat database
CREATE DATABASE pixelnest_db OWNER postgres;

# 5. Exit
\q
```

Kemudian edit `.env`:
```env
DB_USER=postgres
DB_PASSWORD=your_password
```

### Opsi 3: Update Database Config untuk Auto-detect

Edit `src/config/database.js` untuk menggunakan user sistem:

```javascript
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'pixelnest_db',
  user: process.env.DB_USER || process.env.USER, // Auto-detect user
  password: process.env.DB_PASSWORD || '',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

## 🔍 Troubleshooting

### Cek PostgreSQL berjalan
```bash
brew services list | grep postgresql
# Atau
pg_isready
```

### Start PostgreSQL jika tidak berjalan
```bash
brew services start postgresql@14
```

### Cek user PostgreSQL yang ada
```bash
psql postgres -c "\du"
```

### Cek database yang ada
```bash
psql postgres -c "\l"
```

## 📝 Konfigurasi Lengkap `.env`

Setelah menentukan user yang tepat:

```env
# Server Configuration
PORT=5005
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pixelnest_db
DB_USER=ahwanulm          # Ganti dengan username Anda
DB_PASSWORD=               # Kosongkan jika tidak pakai password

# Session Secret
SESSION_SECRET=pixelnest-secret-key-change-in-production
```

## 🚀 Setelah Setup Database

1. **Initialize database:**
```bash
npm run init-db
```

2. **Start server:**
```bash
npm run dev
```

3. **Open browser:**
```
http://localhost:5005
```

## ❓ Masih Ada Error?

### Error: "database does not exist"
```bash
createdb pixelnest_db
```

### Error: "password authentication failed"
Pastikan password di `.env` sesuai dengan PostgreSQL Anda.

Atau edit `/usr/local/var/postgres/pg_hba.conf`:
```
# Ganti "md5" menjadi "trust" untuk development
local   all             all                                     trust
```

Kemudian restart PostgreSQL:
```bash
brew services restart postgresql@14
```

### Error: "ECONNREFUSED"
PostgreSQL tidak berjalan. Start dengan:
```bash
brew services start postgresql@14
```

## 📌 Quick Fix (Paling Mudah)

Jalankan command ini untuk setup cepat:

```bash
# 1. Buat database dengan user sistem
createdb pixelnest_db

# 2. Edit .env
cat > .env << EOF
PORT=5005
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pixelnest_db
DB_USER=$(whoami)
DB_PASSWORD=
SESSION_SECRET=pixelnest-secret-change-later
EOF

# 3. Initialize
npm run init-db

# 4. Start
npm run dev
```

Selesai! Website Anda seharusnya sudah berjalan di http://localhost:5005

