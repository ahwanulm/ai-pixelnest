const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referralController');
const { ensureAuthenticated } = require('../middleware/auth');
const { ensureAdmin } = require('../middleware/admin');

// ========== USER ROUTES ==========

// Referral dashboard
router.get('/dashboard', ensureAuthenticated, referralController.getReferralDashboard);

// Get referral transactions (AJAX)
router.get('/transactions', ensureAuthenticated, referralController.getReferralTransactions);

// Get referred users (AJAX)
router.get('/referred-users', ensureAuthenticated, referralController.getReferredUsers);

// Request payout
router.post('/payout/request', ensureAuthenticated, referralController.requestPayout);

// Get payout history
router.get('/payout/history', ensureAuthenticated, referralController.getPayoutHistory);

// ========== ADMIN ROUTES ==========

// Admin referral dashboard
router.get('/admin/dashboard', ensureAuthenticated, ensureAdmin, referralController.getAdminReferralDashboard);

// Get payout requests
router.get('/admin/payout-requests', ensureAuthenticated, ensureAdmin, referralController.getPayoutRequests);

// Process payout request (approve/reject)
router.post('/admin/payout-requests/:requestId/process', ensureAuthenticated, ensureAdmin, referralController.processPayoutRequest);

// Complete payout request (mark as sent)
router.post('/admin/payout-requests/:requestId/complete', ensureAuthenticated, ensureAdmin, referralController.completePayoutRequest);

// Get payout settings
router.get('/admin/settings', ensureAuthenticated, ensureAdmin, referralController.getPayoutSettings);

// Update payout settings
router.post('/admin/settings', ensureAuthenticated, ensureAdmin, referralController.updatePayoutSettings);

module.exports = router;

