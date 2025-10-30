/**
 * ======================================
 * Queue-based Generation Routes
 * ======================================
 * 
 * Routes untuk generation menggunakan queue system
 */

const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const generationQueueController = require('../controllers/generationQueueController');

// All routes require authentication
router.use(ensureAuthenticated);

// Create generation job (enqueue)
// ✨ Use uploadMiddleware to handle file uploads (for image-to-video)
router.post('/create', 
  generationQueueController.uploadMiddleware,
  generationQueueController.createJob
);

// Get job status (polling)
router.get('/status/:jobId', generationQueueController.getJobStatus);

// Get all active jobs
router.get('/active', generationQueueController.getActiveJobs);

// Cancel a job
router.post('/cancel/:jobId', generationQueueController.cancelJob);

module.exports = router;

