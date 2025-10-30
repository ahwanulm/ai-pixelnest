const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const generationJobController = require('../controllers/generationJobController');

// All routes require authentication
router.use(ensureAuthenticated);

// Create new generation job
router.post('/create', generationJobController.createJob);

// Get job status (for polling)
router.get('/status/:jobId', generationJobController.getJobStatus);

// Get all active jobs
router.get('/active', generationJobController.getActiveJobs);

// Get new (unviewed) count
router.get('/new-count', generationJobController.getNewCount);

// Mark as viewed
router.post('/mark-viewed', generationJobController.markAsViewed);

module.exports = router;

