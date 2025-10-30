# PixelNest AI Automation Platform

Modern AI automation website built with Node.js, Express, EJS, and PostgreSQL.

## 🚀 Features

- **Modern UI/UX**: Clean, responsive design inspired by modern AI automation platforms
- **Server-Side Rendering**: Fast page loads with EJS templates
- **PostgreSQL Database**: Robust data management
- **RESTful API**: Clean architecture with MVC pattern
- **Responsive Design**: Mobile-first approach
- **Contact Forms**: Easy lead generation
- **Blog System**: Content management for articles
- **Service Catalog**: Dynamic service listings
- **Pricing Plans**: Flexible pricing display
- **Testimonials**: Social proof sections

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher)
- **PostgreSQL** (v12 or higher)
- **npm** or **yarn**

## 🛠️ Installation

### 1. Clone or navigate to the project

```bash
cd /Users/ahwanulm/Desktop/PROJECT/PIXELNEST
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pixelnest_db
DB_USER=postgres
DB_PASSWORD=your_password_here

# Session Secret
SESSION_SECRET=your_session_secret_here_change_in_production
```

### 4. Set up PostgreSQL database

Create a new PostgreSQL database:

```bash
# Create database (macOS/Linux)
createdb pixelnest_db

# Or using psql
psql -U postgres -c "CREATE DATABASE pixelnest_db;"
```

### 5. Initialize the database

Run the comprehensive database setup script:

```bash
npm run setup-db
```

This will automatically create **ALL** required tables:
- ✅ Authentication tables (users, sessions)
- ✅ Basic tables (contacts, services, blog, etc.)
- ✅ Admin tables (promo codes, notifications, etc.)
- ✅ AI models and generation history
- ✅ Payment and transaction tables
- ✅ Referral system tables

**Verify everything is set up correctly:**

```bash
npm run verify-db
```

This will check if all required tables exist.

## 🚀 Running the Application

### Development Mode

```bash
npm run dev
```

This will start the server with nodemon for auto-reloading on file changes.

### Production Mode

```bash
npm start
```

The application will be available at `http://localhost:5005`

## 🔄 Database Management

### Setup New Database
```bash
npm run setup-db     # Create all tables
npm run verify-db    # Verify all tables exist
```

### Reset Database
```bash
npm run reset-db     # Drop and recreate all tables
```

### Run Specific Migrations
```bash
npm run migrate:auth      # Users & sessions
npm run migrate:models    # AI models
npm run migrate:tripay    # Payment system
npm run init-admin        # Admin tables
```

For detailed deployment instructions, see [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

## 📁 Project Structure

```
PIXELNEST/
├── public/                 # Static files
│   ├── css/               # Stylesheets
│   │   ├── main.css       # Main styles
│   │   └── responsive.css # Responsive styles
│   ├── js/                # Client-side JavaScript
│   │   ├── main.js        # Main scripts
│   │   └── pricing.js     # Pricing page scripts
│   └── images/            # Images and icons
│
├── src/                   # Source files
│   ├── config/           # Configuration files
│   │   ├── database.js   # Database connection
│   │   └── initDatabase.js # Database initialization
│   │
│   ├── controllers/      # Route controllers
│   │   ├── indexController.js
│   │   ├── servicesController.js
│   │   ├── pricingController.js
│   │   ├── contactController.js
│   │   └── blogController.js
│   │
│   ├── models/          # Database models
│   │   ├── Service.js
│   │   ├── PricingPlan.js
│   │   ├── Testimonial.js
│   │   ├── Contact.js
│   │   └── BlogPost.js
│   │
│   ├── routes/          # Route definitions
│   │   ├── index.js
│   │   ├── services.js
│   │   ├── pricing.js
│   │   ├── contact.js
│   │   └── blog.js
│   │
│   └── views/           # EJS templates
│       ├── partials/    # Reusable components
│       │   ├── header.ejs
│       │   └── footer.ejs
│       ├── index.ejs
│       ├── services.ejs
│       ├── pricing.ejs
│       ├── contact.ejs
│       ├── blog.ejs
│       ├── 404.ejs
│       └── error.ejs
│
├── .env.example         # Environment variables template
├── .gitignore          # Git ignore rules
├── package.json        # Dependencies and scripts
├── server.js          # Application entry point
└── README.md          # This file
```

## 🗄️ Database Schema

### Tables

- **services**: Service catalog
- **pricing_plans**: Pricing information
- **testimonials**: Customer testimonials
- **contacts**: Contact form submissions
- **blog_posts**: Blog articles
- **newsletter_subscribers**: Email subscribers

## 🎨 Customization

### Styling

- Main styles: `public/css/main.css`
- Responsive styles: `public/css/responsive.css`
- Color scheme can be customized in CSS variables

### Content

- Edit EJS templates in `src/views/`
- Modify database seed data in `src/config/initDatabase.js`

## 📝 API Endpoints

### Pages

- `GET /` - Home page
- `GET /services` - Services listing
- `GET /services/:slug` - Service detail
- `GET /pricing` - Pricing page
- `GET /contact` - Contact page
- `GET /blog` - Blog listing
- `GET /blog/:slug` - Blog post detail

### Forms

- `POST /contact` - Submit contact form

## 🔒 Security Features

- Helmet.js for security headers
- Input validation with express-validator
- SQL injection protection with parameterized queries
- Session management
- CORS configuration

## 🚀 Deployment

### Environment Variables

Make sure to set all environment variables in production:

```env
NODE_ENV=production
SESSION_SECRET=<strong-random-secret>
DB_HOST=<your-db-host>
DB_PASSWORD=<strong-password>
```

### Database

Ensure PostgreSQL is configured and accessible in production.

### Process Manager

Use PM2 or similar for production:

```bash
npm install -g pm2
pm2 start server.js --name pixelnest
pm2 save
pm2 startup
```

## 📦 Dependencies

### Main Dependencies

- **express**: Web framework
- **ejs**: Template engine
- **pg**: PostgreSQL client
- **dotenv**: Environment variables
- **helmet**: Security headers
- **compression**: Response compression
- **express-validator**: Input validation

### Dev Dependencies

- **nodemon**: Auto-restart server

## 🐛 Troubleshooting

### Database Connection Issues

If you can't connect to PostgreSQL:

1. Check if PostgreSQL is running: `pg_isready`
2. Verify credentials in `.env`
3. Ensure database exists: `psql -U postgres -l`

### Port Already in Use

If port 3000 is in use:

1. Change PORT in `.env`
2. Or kill the process: `lsof -ti:3000 | xargs kill`

## 📄 License

MIT License

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

For questions or support, please contact: hello@pixelnest.ai

---

**Built with ❤️ using Node.js + Express + EJS + PostgreSQL**

# ai-pixelnest
