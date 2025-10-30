const express = require('express');
const router = express.Router();
const generationController = require('../controllers/generationController');
const { ensureAuthenticated } = require('../middleware/auth');

// All routes require authentication
router.use(ensureAuthenticated);

// Image Generation Routes
router.post('/image/generate', 
  generationController.uploadSingle,
  generationController.generateImage
);

// Video Generation Routes
router.post('/video/generate',
  generationController.uploadMultiple,
  generationController.generateVideo
);

// Utility Routes
router.get('/history', generationController.getHistory);
router.delete('/delete/:id', generationController.deleteGeneration);
router.get('/pricing', generationController.getPricing);
router.get('/credits', generationController.getUserCredits);

// Admin Routes
router.get('/balance', generationController.checkApiBalance);

module.exports = router;

