# 🚀 Quick Start Guide - PixelNest AI Automation

Get your PixelNest website up and running in minutes!

## Prerequisites

- Node.js (v14+)
- PostgreSQL (v12+)
- Terminal/Command Line

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Configure Database

### Option A: Using existing PostgreSQL

1. Create database:
```bash
psql -U postgres
CREATE DATABASE pixelnest_db;
\q
```

2. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

3. Edit `.env` with your database credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pixelnest_db
DB_USER=postgres
DB_PASSWORD=your_password
```

### Option B: First time PostgreSQL user

**macOS (with Homebrew):**
```bash
brew install postgresql
brew services start postgresql
createdb pixelnest_db
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres createdb pixelnest_db
```

**Windows:**
1. Download PostgreSQL from https://www.postgresql.org/download/
2. Install and note your password
3. Open pgAdmin or psql
4. Create database: `CREATE DATABASE pixelnest_db;`

## Step 3: Initialize Database

Run the database setup script:

```bash
npm run init-db
```

This will create tables and insert sample data.

## Step 4: Start the Server

### Development mode (with auto-reload):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

## Step 5: Open in Browser

Visit: **http://localhost:3000**

## 🎉 You're All Set!

Your PixelNest website is now running with:

- ✅ Homepage with hero section
- ✅ Services catalog
- ✅ Pricing plans
- ✅ Contact form
- ✅ Blog system
- ✅ Sample data

## Default Pages

- Home: `http://localhost:3000/`
- Services: `http://localhost:3000/services`
- Pricing: `http://localhost:3000/pricing`
- Contact: `http://localhost:3000/contact`
- Blog: `http://localhost:3000/blog`
- About: `http://localhost:3000/about`
- Process: `http://localhost:3000/process`

## Troubleshooting

### Port 3000 already in use?
Change the PORT in `.env` file:
```env
PORT=8080
```

### Database connection error?
1. Check PostgreSQL is running
2. Verify credentials in `.env`
3. Ensure database exists

### Module not found?
Re-install dependencies:
```bash
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

1. **Customize Content**: Edit EJS files in `src/views/`
2. **Update Styling**: Modify CSS in `public/css/`
3. **Add Data**: Use PostgreSQL to add your content
4. **Deploy**: Ready for production deployment!

## Need Help?

- Check `README.md` for detailed documentation
- Review database schema in `src/config/initDatabase.js`
- Inspect routes in `src/routes/`

---

**Happy Building! 🎨**

