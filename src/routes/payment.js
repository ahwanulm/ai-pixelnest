const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { ensureAuthenticated } = require('../middleware/auth');

/**
 * Payment Routes
 * Handle all payment and top-up operations
 */

// ============ USER ROUTES (Authenticated) ============

// Get credit price
router.get('/credit-price', ensureAuthenticated, paymentController.getCreditPrice);

// Render top-up page
router.get('/top-up', ensureAuthenticated, paymentController.renderTopUpPage);

// Get payment channels
router.get('/channels', ensureAuthenticated, paymentController.getPaymentChannels);

// Calculate payment fee
router.post('/calculate-fee', ensureAuthenticated, paymentController.calculateFee);

// Check pending transactions
router.get('/check-pending', ensureAuthenticated, paymentController.checkPendingTransactions);

// Validate promo code
router.post('/validate-promo', ensureAuthenticated, paymentController.validatePromoCode);

// Create payment transaction
router.post('/create', ensureAuthenticated, paymentController.createPayment);

// Get payment history (MUST be before /:reference to avoid route collision)
router.get('/history', ensureAuthenticated, paymentController.getPaymentHistory);

// Get payment detail
router.get('/detail/:reference', ensureAuthenticated, paymentController.getPaymentDetail);
router.get('/:reference', ensureAuthenticated, paymentController.getPaymentDetail);

// Check payment status
router.get('/:reference/status', ensureAuthenticated, paymentController.checkPaymentStatus);

// Manual sync payment status
router.post('/sync/:reference', ensureAuthenticated, paymentController.syncPaymentStatus);

// ============ CALLBACK ROUTE (Public - dari Tripay) ============

// Payment callback (no auth required - akan verify signature)
router.post('/callback', paymentController.handleCallback);

module.exports = router;

