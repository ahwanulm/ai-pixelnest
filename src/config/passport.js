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

// Function to get Google OAuth config from database or fallback to .env
async function getGoogleOAuthConfig() {
  try {
    const result = await pool.query(
      "SELECT api_key, api_secret, endpoint_url FROM api_configs WHERE service_name = 'GOOGLE_OAUTH' AND is_active = true"
    );
    
    if (result.rows.length > 0 && result.rows[0].api_key) {
      return {
        clientID: result.rows[0].api_key,
        clientSecret: result.rows[0].api_secret,
        callbackURL: result.rows[0].endpoint_url
      };
    }
  } catch (error) {
    console.log('⚠️  Reading Google OAuth from .env (database not configured)');
  }
  
  // Fallback to .env
  return {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5005/auth/google/callback'
  };
}

// Initialize Google OAuth Strategy
(async () => {
  const config = await getGoogleOAuthConfig();
  
  if (!config.clientID || !config.clientSecret) {
    console.log('⚠️  Google OAuth not configured. Please set up in admin panel or .env');
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        ...config,
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

console.log('✅ Google OAuth strategy initialized');
})();

module.exports = passport;

