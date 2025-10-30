const express = require('express');
const router = express.Router();
const publicGalleryController = require('../controllers/publicGalleryController');
const { ensureAuthenticated } = require('../middleware/auth');

// Public routes (accessible to all)
router.get('/explore', publicGalleryController.showPublicGallery);
router.post('/api/public-gallery/view', publicGalleryController.incrementView);

// Protected routes (require authentication)
router.post('/api/public-gallery/share', ensureAuthenticated, publicGalleryController.shareToPublic);
router.post('/api/public-gallery/unshare', ensureAuthenticated, publicGalleryController.unshareFromPublic);
router.post('/api/public-gallery/like', ensureAuthenticated, publicGalleryController.likeGeneration);
router.post('/api/public-gallery/bookmark', ensureAuthenticated, publicGalleryController.bookmarkGeneration);
router.post('/api/public-gallery/report', publicGalleryController.reportGeneration);
router.get('/api/public-gallery/check-shared', ensureAuthenticated, publicGalleryController.checkSharedStatus);

module.exports = router;

