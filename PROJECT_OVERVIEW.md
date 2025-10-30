# 🎯 PixelNest - Project Overview

## 📋 Project Summary

**PixelNest** adalah website AI Automation Platform yang dibangun dengan teknologi:
- **Backend**: Node.js + Express.js
- **Frontend**: EJS (Embedded JavaScript Templates)
- **Database**: PostgreSQL
- **Styling**: Custom CSS dengan desain modern dan responsive

Tema website terinspirasi dari https://green-advocate-818432.framer.app/ dengan fokus pada AI automation services.

---

## 📁 Struktur Project

```
PIXELNEST/
│
├── 📂 public/                      # Static files (CSS, JS, Images)
│   ├── css/
│   │   ├── main.css               # Main stylesheet (1400+ lines)
│   │   └── responsive.css         # Responsive design
│   ├── js/
│   │   ├── main.js                # Main JavaScript functionality
│   │   └── pricing.js             # Pricing page specific scripts
│   └── images/                    # Image assets
│
├── 📂 src/                         # Source code
│   ├── config/
│   │   ├── database.js            # PostgreSQL connection config
│   │   └── initDatabase.js        # Database initialization script
│   │
│   ├── controllers/               # Business logic
│   │   ├── indexController.js     # Homepage & general pages
│   │   ├── servicesController.js  # Services pages
│   │   ├── pricingController.js   # Pricing page
│   │   ├── contactController.js   # Contact form handling
│   │   └── blogController.js      # Blog posts
│   │
│   ├── models/                    # Database models
│   │   ├── Service.js             # Services CRUD
│   │   ├── PricingPlan.js         # Pricing plans CRUD
│   │   ├── Testimonial.js         # Testimonials CRUD
│   │   ├── Contact.js             # Contact submissions
│   │   └── BlogPost.js            # Blog posts CRUD
│   │
│   ├── routes/                    # URL routing
│   │   ├── index.js               # Main routes
│   │   ├── services.js            # Service routes
│   │   ├── pricing.js             # Pricing routes
│   │   ├── contact.js             # Contact routes
│   │   └── blog.js                # Blog routes
│   │
│   └── views/                     # EJS templates
│       ├── partials/
│       │   ├── header.ejs         # Reusable header/navbar
│       │   └── footer.ejs         # Reusable footer
│       ├── index.ejs              # Homepage
│       ├── about.ejs              # About page
│       ├── process.ejs            # Our process page
│       ├── services.ejs           # Services listing
│       ├── service-detail.ejs     # Single service page
│       ├── pricing.ejs            # Pricing plans
│       ├── contact.ejs            # Contact form
│       ├── contact-success.ejs    # Contact success page
│       ├── blog.ejs               # Blog listing
│       ├── blog-post.ejs          # Single blog post
│       ├── 404.ejs                # 404 error page
│       └── error.ejs              # Generic error page
│
├── 📄 Configuration Files
│   ├── .env.example               # Environment variables template
│   ├── .gitignore                 # Git ignore rules
│   ├── .cursorignore             # Cursor ignore rules
│   ├── package.json              # Dependencies & scripts
│   └── server.js                 # Application entry point
│
└── 📄 Documentation
    ├── README.md                  # Complete documentation
    ├── QUICKSTART.md             # Quick start guide
    └── PROJECT_OVERVIEW.md       # This file
```

---

## 🎨 Design Features

### Color Scheme
- **Primary**: Purple gradient (#6366f1)
- **Background**: Dark theme (#0f172a)
- **Accent**: Green (#10b981)
- Modern, professional AI-themed design

### UI Components
- ✅ Responsive navigation with mobile menu
- ✅ Hero section with gradient text
- ✅ Service cards with hover effects
- ✅ Pricing cards (3 tiers)
- ✅ Testimonial cards
- ✅ FAQ accordion
- ✅ Contact form with validation
- ✅ Blog cards
- ✅ Process timeline
- ✅ Stats counters with animation
- ✅ Back to top button
- ✅ Smooth scrolling

---

## 🗄️ Database Schema

### Tables Created

1. **services**
   - Service catalog dengan title, slug, description, icon, features

2. **pricing_plans**
   - Pricing information: name, price, billing_period, features, is_popular

3. **testimonials**
   - Customer testimonials: name, position, company, testimonial, rating

4. **contacts**
   - Contact form submissions: name, email, phone, company, message, status

5. **blog_posts**
   - Blog articles: title, slug, content, author, category, views

6. **newsletter_subscribers**
   - Email subscribers untuk newsletter

---

## 🌐 Available Pages & Routes

### Public Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Homepage | Hero, benefits, services, testimonials, pricing |
| `/about` | About Us | Company info, mission, values, team |
| `/process` | Our Process | 3-step process, timeline, stats |
| `/services` | Services List | All available services |
| `/services/:slug` | Service Detail | Individual service page |
| `/pricing` | Pricing Plans | 3 pricing tiers with FAQ |
| `/contact` | Contact Form | Lead generation form |
| `/blog` | Blog List | All published blog posts |
| `/blog/:slug` | Blog Post | Single blog article |

### Special Pages
- `404 Error` - Custom 404 page
- `Error Page` - Generic error handling
- `Contact Success` - Form submission success

---

## 🚀 Features Implemented

### Frontend Features
- ✅ Server-side rendering dengan EJS
- ✅ Responsive design (mobile-first)
- ✅ Smooth animations & transitions
- ✅ Interactive components (FAQ, navigation)
- ✅ Form validation
- ✅ Loading states
- ✅ SEO-friendly structure

### Backend Features
- ✅ Express.js server dengan middleware
- ✅ PostgreSQL database integration
- ✅ MVC architecture pattern
- ✅ Input validation & sanitization
- ✅ Security headers (Helmet)
- ✅ Session management
- ✅ Error handling
- ✅ Compression & optimization

### Database Features
- ✅ Structured schema
- ✅ Sample data seeding
- ✅ CRUD operations
- ✅ Query optimization
- ✅ Connection pooling

---

## 📦 Dependencies

### Production
```json
{
  "express": "^4.18.2",
  "ejs": "^3.1.9",
  "pg": "^8.11.3",
  "dotenv": "^16.3.1",
  "helmet": "^7.1.0",
  "compression": "^1.7.4",
  "express-validator": "^7.0.1",
  "express-session": "^1.17.3",
  "bcrypt": "^5.1.1",
  "morgan": "^1.10.0",
  "method-override": "^3.0.0"
}
```

### Development
```json
{
  "nodemon": "^3.0.2"
}
```

---

## 🔧 NPM Scripts

```bash
npm start          # Production mode
npm run dev        # Development with auto-reload
npm run init-db    # Initialize database
```

---

## 🎯 Key Sections Breakdown

### 1. Homepage (/)
- Hero section dengan call-to-action
- Analysis section
- Benefits grid (3 cards)
- Services showcase
- Process steps (3 steps)
- Testimonials grid
- Pricing preview
- CTA section

### 2. Services (/services)
- Services listing dengan filter
- Service cards dengan icon & description
- Individual service detail pages

### 3. Pricing (/pricing)
- 3 pricing tiers (Starter, Pro, Enterprise)
- Monthly/Yearly toggle
- Feature comparison
- FAQ accordion (5 questions)

### 4. Contact (/contact)
- Contact form dengan validation
- Contact information display
- Social media links
- Success page setelah submit

### 5. Blog (/blog)
- Blog post listing
- Category filtering
- Individual article pages
- View counter

---

## 🔒 Security Features

- ✅ Helmet.js untuk security headers
- ✅ Input sanitization dengan express-validator
- ✅ SQL injection protection (parameterized queries)
- ✅ XSS protection
- ✅ Session security
- ✅ Environment variables untuk sensitive data

---

## 📱 Responsive Breakpoints

- **Desktop**: > 1024px
- **Tablet**: 768px - 1024px
- **Mobile**: < 768px
- **Small Mobile**: < 480px

---

## 🎨 Customization Guide

### Mengubah Warna
Edit CSS variables di `public/css/main.css`:
```css
:root {
    --primary-color: #6366f1;
    --secondary-color: #10b981;
    --dark-bg: #0f172a;
}
```

### Mengubah Konten
Edit EJS files di `src/views/`

### Mengubah Data
Edit database seed di `src/config/initDatabase.js` atau langsung via PostgreSQL

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env dengan database credentials

# 3. Initialize database
npm run init-db

# 4. Start server
npm run dev

# 5. Open browser
http://localhost:3000
```

---

## 📊 Performance Optimizations

- ✅ Gzip compression
- ✅ Static file caching
- ✅ Database connection pooling
- ✅ Minified CSS & JS (production ready)
- ✅ Lazy loading untuk images
- ✅ Optimized queries

---

## 🔮 Future Enhancements (Opsional)

- [ ] Admin dashboard
- [ ] User authentication
- [ ] Email notifications
- [ ] Payment integration
- [ ] Real-time analytics
- [ ] Multi-language support
- [ ] API endpoints
- [ ] GraphQL implementation

---

## 📞 Support & Contact

Jika ada pertanyaan atau butuh bantuan:
1. Baca `README.md` untuk dokumentasi lengkap
2. Check `QUICKSTART.md` untuk panduan cepat
3. Review code di controllers/models untuk logika

---

## ✅ Project Status

**COMPLETED** ✓

Website sudah production-ready dengan:
- ✅ Full functionality
- ✅ Clean code structure
- ✅ Comprehensive documentation
- ✅ Sample data
- ✅ Responsive design
- ✅ Security features

---

**Built with ❤️ for PixelNest**

*Last updated: October 2025*

