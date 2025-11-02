const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const { pool } = require('./database');

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    // Validate ID
    if (!id) {
      console.log('⚠️  Passport deserialize: No user ID in session');
      return done(null, false);
    }

    const user = await User.findById(id);
    
    // User not found - session is stale
    if (!user) {
      console.log(`⚠️  Passport deserialize: User ID ${id} not found in database`);
      return done(null, false);
    }

    // User found but inactive
    if (!user.is_active) {
      console.log(`⚠️  Passport deserialize: User ID ${id} is inactive`);
      return done(null, false);
    }

    // Success
    done(null, user);
  } catch (error) {
    console.error('❌ Passport deserialize error:', error.message);
    // Don't pass error to passport, just indicate auth failure
    done(null, false);
  }
});

// Initialize Google Strategy IMMEDIATELY with .env values (synchronous)
// This ensures strategy is registered before routes are loaded
const initialConfig = {
  clientID: process.env.GOOGLE_CLIENT_ID || 'dummy-client-id',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy-secret',
  callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5005/auth/google/callback'
};

// Check if Google OAuth is configured
const isGoogleConfigured = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;

if (!isGoogleConfigured) {
  console.log('⚠️  Google OAuth not configured in .env. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET');
  console.log('⚠️  Using dummy values - Google login will not work until configured');
}

// Register strategy SYNCHRONOUSLY to avoid "Unknown authentication strategy" error
passport.use(
  new GoogleStrategy(
    {
      ...initialConfig,
      passReqToCallback: true // Enable access to req object
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await User.findByGoogleId(profile.id);
        
        if (user) {
          // Update last login
          await User.updateLastLogin(user.id);
          return done(null, user);
        }
        
        // Get referral code from session (if exists)
        const referralCode = req.session?.referralCode || null;
        
        // Create new user with referral code
        user = await User.createFromGoogle(profile, referralCode);
        
        // Clear referral code from session after use
        if (req.session?.referralCode) {
          delete req.session.referralCode;
        }
        
        console.log(`✅ New user created via Google OAuth: ${user.email}${referralCode ? ' with referral code: ' + referralCode : ''}`);
        return done(null, user);
        
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

console.log('✅ Google OAuth strategy registered' + (isGoogleConfigured ? ' with .env config' : ' (not configured)'));

// Function to update Google OAuth config from database (async, happens after startup)
async function updateGoogleOAuthConfig() {
  try {
    const result = await pool.query(
      "SELECT api_key, api_secret, endpoint_url FROM api_configs WHERE service_name = 'GOOGLE_OAUTH' AND is_active = true"
    );
    
    if (result.rows.length > 0 && result.rows[0].api_key) {
      console.log('ℹ️  Google OAuth config found in database');
      console.log('ℹ️  Note: To use database config, restart the server after updating admin panel');
      // We can't hot-reload strategy config, so this is just informational
    }
  } catch (error) {
    // Silent fail - database might not be ready yet
  }
}

// Check database config in background (don't block startup)
updateGoogleOAuthConfig();

module.exports = passport;

