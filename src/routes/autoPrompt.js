const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const groqService = require('../services/groqService');

/**
 * POST /api/auto-prompt/enhance
 * Enhance a prompt using Groq AI
 */
router.post('/enhance', ensureAuthenticated, async (req, res) => {
  try {
    const { prompt, mode, modelId } = req.body;

    // Validation
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Prompt is required'
      });
    }

    if (prompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Prompt cannot be empty'
      });
    }

    if (prompt.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Prompt is too long (max 1000 characters)'
      });
    }

    // Check if Groq service is available
    const isAvailable = await groqService.isAvailable();
    if (!isAvailable) {
      return res.status(503).json({
        success: false,
        message: 'Auto prompt service is not configured. Please contact administrator.'
      });
    }

    // Enhance the prompt
    const enhancedPrompt = await groqService.enhancePrompt(
      prompt.trim(),
      mode || 'image',
      modelId || ''
    );

    res.json({
      success: true,
      originalPrompt: prompt.trim(),
      enhancedPrompt: enhancedPrompt,
      mode: mode || 'image'
    });

  } catch (error) {
    console.error('Auto prompt enhancement error:', error);
    
    // Return user-friendly error messages
    let message = 'Failed to enhance prompt';
    if (error.message.includes('not configured')) {
      message = 'Auto prompt service is not available';
    } else if (error.message.includes('API')) {
      message = 'Prompt enhancement service temporarily unavailable';
    }

    res.status(500).json({
      success: false,
      message: message,
      error: error.message
    });
  }
});

/**
 * GET /api/auto-prompt/status
 * Check if auto prompt service is available
 */
router.get('/status', ensureAuthenticated, async (req, res) => {
  try {
    const isAvailable = await groqService.isAvailable();
    
    res.json({
      success: true,
      available: isAvailable,
      message: isAvailable 
        ? 'Auto prompt service is available' 
        : 'Auto prompt service is not configured'
    });
  } catch (error) {
    console.error('Auto prompt status check error:', error);
    res.json({
      success: false,
      available: false,
      message: 'Failed to check service status'
    });
  }
});

module.exports = router;

