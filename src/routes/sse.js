/**
 * ======================================
 * SSE (Server-Sent Events) Routes
 * ======================================
 * 
 * Real-time updates for job completion
 */

const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const sseController = require('../controllers/sseController');

// SSE endpoint for generation updates
// Using Postgres LISTEN/NOTIFY (works with both queue options)
router.get('/generation-updates', 
  ensureAuthenticated, 
  sseController.generationUpdatesWithNotify
);

module.exports = router;

