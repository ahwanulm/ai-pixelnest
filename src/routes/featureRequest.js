const express = require('express');
const router = express.Router();
const featureRequestController = require('../controllers/featureRequestController');
const { ensureAuthenticated } = require('../middleware/auth');
const { ensureAdmin } = require('../middleware/admin');

// ============ USER ROUTES ============
// Must be authenticated to access

// Feature request page
router.get('/', ensureAuthenticated, featureRequestController.getRequestPage);

// API endpoints for users
router.post('/api/create', ensureAuthenticated, featureRequestController.createRequest);
router.get('/api/my-requests', ensureAuthenticated, featureRequestController.getMyRequests);
router.get('/api/rate-limit', ensureAuthenticated, featureRequestController.checkRateLimit);

// ============ ADMIN ROUTES ============
// Only admins can access these

// Admin feature requests page
router.get('/admin', ensureAdmin, featureRequestController.getAdminPage);

// Admin API endpoints
router.get('/admin/api', ensureAdmin, featureRequestController.getAllRequests);
router.get('/admin/api/stats', ensureAdmin, featureRequestController.getStats);
router.get('/admin/api/:id', ensureAdmin, featureRequestController.getRequestById);
router.put('/admin/api/:id', ensureAdmin, featureRequestController.updateRequest);
router.post('/admin/api/:id/reward', ensureAdmin, featureRequestController.giveReward);
router.delete('/admin/api/:id', ensureAdmin, featureRequestController.deleteRequest);

module.exports = router;

