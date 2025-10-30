const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require('../controllers/authController');
const generationController = require('../controllers/generationController');
const paymentController = require('../controllers/paymentController');
const { ensureAuthenticated, ensureGuest } = require('../middleware/auth');

// Login page
router.get('/login', ensureGuest, authController.showLogin);

// Register page (with referral code)
router.get('/register', ensureGuest, authController.showRegister);

// Check email (determines if user should login or register)
router.post('/auth/check-email', authController.checkEmail);

// Login with password
router.post('/auth/login-password', authController.loginWithPassword);

// Register new user
router.post('/auth/register', authController.register);

// Email activation routes
router.post('/auth/verify-activation', authController.verifyActivation);
router.post('/auth/resend-activation', authController.resendActivationCode);

// Forgot Password routes
router.get('/forgot-password', authController.showForgotPassword);
router.post('/auth/forgot-password', authController.forgotPassword);
router.get('/reset-password', authController.showResetPassword);
router.post('/auth/reset-password', authController.resetPassword);
router.post('/auth/resend-reset-code', authController.resendResetCode);

// Google OAuth routes
router.get('/auth/google', (req, res, next) => {
  // Save referral code to session before OAuth redirect
  if (req.query.ref) {
    req.session.referralCode = req.query.ref;
    console.log('🔗 Referral code saved to session:', req.query.ref);
  }
  
  passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  })(req, res, next);
});

router.get('/auth/google/callback',
  passport.authenticate('google', { 
    failureRedirect: '/login?error=authentication_failed',
    successRedirect: '/dashboard'
  })
);

// Dashboard (protected)
router.get('/dashboard', ensureAuthenticated, authController.showDashboard);

// Private Gallery - User's Generation History (protected)
router.get('/gallery', ensureAuthenticated, generationController.showGallery);

// Audio Generation Studio (protected) - DEPRECATED: Audio now integrated in dashboard
// router.get('/audio', ensureAuthenticated, authController.showAudioStudio);

// Billing & Transaction History (protected)
router.get('/billing', ensureAuthenticated, paymentController.renderBillingPage);

// Profile (protected)
router.get('/profile', ensureAuthenticated, authController.showProfile);

// Tutorial (protected)
router.get('/tutorial', ensureAuthenticated, authController.showTutorial);

// Usage Statistics (protected)
router.get('/usage', ensureAuthenticated, authController.showUsage);

// Logout
router.get('/logout', authController.logout);

module.exports = router;

