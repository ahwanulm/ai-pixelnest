const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const methodOverride = require('method-override');
const passport = require('./src/config/passport');
const { pool } = require('./src/config/database');
const queueManager = require('./src/queue/pgBossQueue');

// Load environment variables
dotenv.config();

// Import routes
const indexRouter = require('./src/routes/index');
const servicesRouter = require('./src/routes/services');
const pricingRouter = require('./src/routes/pricing');
const contactRouter = require('./src/routes/contact');
const blogRouter = require('./src/routes/blog');
const authRouter = require('./src/routes/auth');
const adminRouter = require('./src/routes/admin');
const userRouter = require('./src/routes/user');
const generationRouter = require('./src/routes/generation');
const generationJobRouter = require('./src/routes/generationJob');
const queueGenerationRouter = require('./src/routes/queueGeneration');
const sseRouter = require('./src/routes/sse');
const modelsRouter = require('./src/routes/models');
const paymentRouter = require('./src/routes/payment');
const referralRouter = require('./src/routes/referral');
const audioRouter = require('./src/routes/audio');
const featureRequestRouter = require('./src/routes/featureRequest');
const publicGalleryRouter = require('./src/routes/publicGallery');
const autoPromptRouter = require('./src/routes/autoPrompt');
const musicRouter = require('./src/routes/music');

// Import middleware
const { addUserToViews } = require('./src/middleware/auth');
const { addAdminDataToViews } = require('./src/middleware/admin');
const { secureMediaAccess } = require('./src/middleware/secureMedia');

const app = express();
const PORT = process.env.PORT || 5005;

// ✅ Cache Busting: App version for auto-update without hard refresh
const APP_VERSION = Date.now(); // Timestamp changes on every restart
app.locals.appVersion = APP_VERSION;
console.log('🔄 Cache busting version:', APP_VERSION);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development, configure properly in production
}));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

// Trust proxy (important for cookies behind Nginx)
// This allows Express to trust the X-Forwarded-* headers from Nginx
app.set('trust proxy', 1);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Method override for PUT and DELETE
app.use(methodOverride('_method'));

// Secure media access middleware (must be BEFORE static files)
// This protects /videos and /images folders
app.use('/videos', secureMediaAccess);
app.use('/images', secureMediaAccess);

// ✅ Static files with proper cache control
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0, // 1 day cache in prod, no cache in dev
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    // Development: No cache for JS/CSS (always get fresh files)
    if (process.env.NODE_ENV !== 'production') {
      if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    } else {
      // Production: Short cache for JS/CSS (with version parameter for cache busting)
      if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
        res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour
      }
      // Long cache for images/fonts (rarely change)
      if (filePath.match(/\.(jpg|jpeg|png|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
      }
    }
  }
}));

// Session middleware with PostgreSQL store
app.use(session({
  store: new pgSession({
    pool: pool,                     // Connection pool
    tableName: 'sessions',          // Use existing sessions table
    createTableIfMissing: false     // We already created the table
  }),
  secret: process.env.SESSION_SECRET || 'pixelnest-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // true in production with HTTPS
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Add user to all views
app.use(addUserToViews);

// Add admin data to views
app.use(addAdminDataToViews);

// Global variables middleware
app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  res.locals.year = new Date().getFullYear();
  next();
});

// Routes
app.use('/', authRouter); // Auth routes (login, logout, dashboard)
app.use('/', indexRouter);
app.use('/services', servicesRouter);
app.use('/pricing', pricingRouter);
app.use('/contact', contactRouter);
app.use('/blog', blogRouter);
app.use('/admin', adminRouter); // Admin routes
app.use('/api/user', userRouter); // User API routes (notifications, promo codes)
app.use('/api/generate', generationRouter); // Generation API routes (direct, blocking)
app.use('/api/generation-job', generationJobRouter); // Generation job tracking & polling
app.use('/api/queue-generation', queueGenerationRouter); // Queue-based generation (NEW!)
app.use('/api/sse', sseRouter); // Server-Sent Events for real-time updates (NEW!)
app.use('/api/models', modelsRouter); // Models API routes
app.use('/api/payment', paymentRouter); // Payment routes (Tripay integration)
app.use('/referral', referralRouter); // Referral routes
app.use('/api/audio', audioRouter); // Audio generation routes (TTS, Music, SFX, STT)
app.use('/music', musicRouter); // Music generation routes (Suno AI)
app.use('/feature-request', featureRequestRouter); // Feature request routes
app.use('/', publicGalleryRouter); // Public gallery routes
app.use('/api/auto-prompt', autoPromptRouter); // Auto prompt enhancement routes

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', {
    title: 'Page Not Found',
    message: 'The page you are looking for does not exist.'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  const isDev = process.env.NODE_ENV === 'development';
  res.status(err.status || 500).render('error', {
    title: 'Error',
    message: isDev ? err.message : 'Something went wrong!',
    error: isDev ? err : null,
    stack: isDev ? err.stack : null
  });
});

// Initialize queue manager before starting server
async function startServer() {
  try {
    // Initialize pg-boss queue
    console.log('📦 Initializing queue manager...');
    await queueManager.initialize();
    console.log('✅ Queue manager initialized');

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 PixelNest AI Automation Server running on http://localhost:${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  await queueManager.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  await queueManager.shutdown();
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;

