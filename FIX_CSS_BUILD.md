# 🔧 Fix CSS Build Error

Jika Anda mendapat error saat build CSS saat deployment:

## Error:
```
npm error could not determine executable to run
```

## Penyebab
Tailwind CSS (devDependency) tidak terinstall karena menggunakan `npm install --production`.

## Solusi

### Di VPS, jalankan sebagai root:

```bash
cd /var/www/pixelnest

# 1. Install devDependencies
npm install --no-audit --no-fund

# 2. Build CSS
npm run build:css

# 3. Remove devDependencies (optional)
npm prune --production

# 4. Continue deployment
sudo bash deploy-pixelnest.sh
```

### Atau skip build CSS dan lanjutkan:

```bash
cd /var/www/pixelnest

# Skip CSS build dan lanjutkan setup database
print_header "Step 14: Setting up Database Tables"

# Setup database
npm run setup-db
npm run populate-models
npm run verify-db

# Continue dengan script deployment...
```

## Alternative: Build CSS Manual

```bash
# Di VPS
cd /var/www/pixelnest

# Install dependencies
npm install

# Build CSS
npm run build:css

# Remove devDependencies
npm prune --production
```

## Prevention

Script deployment sudah diperbaiki untuk:
1. Install semua dependencies (termasuk devDependencies)
2. Build CSS
3. Remove devDependencies setelah build

Script yang sudah diperbaiki ada di: `deploy-pixelnest.sh`

