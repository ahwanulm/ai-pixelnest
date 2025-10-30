const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Get models that don't require prompt (for smart-prompt-handler)
router.get('/no-prompt', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT model_id, name, prompt_required 
      FROM ai_models 
      WHERE prompt_required = FALSE 
        AND is_active = TRUE
      ORDER BY name
    `);
    
    res.json({
      success: true,
      count: result.rows.length,
      models: result.rows.map(m => m.model_id)
    });
  } catch (error) {
    console.error('Error getting no-prompt models:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get models',
      error: error.message
    });
  }
});

// Get all models (with optional filtering)
router.get('/all', async (req, res) => {
  try {
    const { type, category, trending, viral } = req.query;
    
    let query = 'SELECT * FROM ai_models WHERE is_active = true';
    const params = [];
    let paramCount = 1;
    
    // Apply filters
    if (type) {
      query += ` AND type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }
    
    if (category) {
      query += ` AND category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }
    
    if (trending === 'true') {
      query += ' AND trending = true';
    }
    
    if (viral === 'true') {
      query += ' AND viral = true';
    }
    
    // Order by viral, trending, then name
    query += ` ORDER BY 
      CASE WHEN viral THEN 0 ELSE 1 END,
      CASE WHEN trending THEN 0 ELSE 1 END,
      name ASC`;
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      count: result.rows.length,
      models: result.rows
    });
  } catch (error) {
    console.error('Error getting models:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Search models
router.get('/search', async (req, res) => {
  try {
    const { q, type, limit = 10 } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter required'
      });
    }
    
    let query = `
      SELECT * FROM ai_models 
      WHERE is_active = true AND (
        name ILIKE $1 OR 
        provider ILIKE $1 OR 
        description ILIKE $1 OR 
        model_id ILIKE $1
      )
    `;
    const params = [`%${q}%`];
    let paramCount = 2;
    
    if (type) {
      query += ` AND type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }
    
    query += ` ORDER BY 
      CASE WHEN viral THEN 0 ELSE 1 END,
      CASE WHEN trending THEN 0 ELSE 1 END,
      name ASC
      LIMIT $${paramCount}`;
    params.push(parseInt(limit));
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      query: q,
      count: result.rows.length,
      models: result.rows
    });
  } catch (error) {
    console.error('Error searching models:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get models for dashboard (with pinned models support)
router.get('/dashboard', async (req, res) => {
  try {
    const { type = 'image', category, limit = 10 } = req.query;
    const userId = req.user?.id; // Get user ID if authenticated
    
    let query = `
      SELECT 
        m.*,
        EXTRACT(EPOCH FROM m.updated_at) as updated_timestamp,
        ${userId ? `CASE WHEN p.id IS NOT NULL THEN true ELSE false END as is_pinned,
        p.pin_order` : 'false as is_pinned, NULL as pin_order'}
      FROM ai_models m
      ${userId ? 'LEFT JOIN pinned_models p ON m.id = p.model_id AND p.user_id = $2' : ''}
      WHERE m.is_active = true AND m.type = $1
    `;
    
    const params = [type];
    let paramCount = userId ? 3 : 2;
    
    if (userId) {
      params.push(userId);
    }
    
    // Add category filter if provided
    if (category) {
      query += ` AND m.category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }
    
    query += `
      ORDER BY 
        ${userId ? 'CASE WHEN p.id IS NOT NULL THEN 0 ELSE 1 END,' : ''}
        ${userId ? 'p.pin_order ASC NULLS LAST,' : ''}
        CASE WHEN m.viral THEN 0 ELSE 1 END,
        CASE WHEN m.trending THEN 0 ELSE 1 END,
        m.name ASC
      LIMIT $${paramCount}
    `;
    
    params.push(parseInt(limit));
    
    const result = await pool.query(query, params);
    
    // Get last pricing update timestamp
    const pricingUpdate = await pool.query(`
      SELECT EXTRACT(EPOCH FROM MAX(updated_at)) as last_pricing_update
      FROM pricing_config
    `);
    
    // Add cache headers to prevent browser caching
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    res.json({
      success: true,
      type,
      category: category || null,
      count: result.rows.length,
      models: result.rows,
      last_pricing_update: pricingUpdate.rows[0]?.last_pricing_update || Date.now() / 1000,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error getting dashboard models:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get trending models
router.get('/trending', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const query = `
      SELECT * FROM ai_models 
      WHERE is_active = true AND trending = true
      ORDER BY name ASC
      LIMIT $1
    `;
    
    const result = await pool.query(query, [parseInt(limit)]);
    
    res.json({
      success: true,
      count: result.rows.length,
      models: result.rows
    });
  } catch (error) {
    console.error('Error getting trending models:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get viral models
router.get('/viral', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const query = `
      SELECT * FROM ai_models 
      WHERE is_active = true AND viral = true
      ORDER BY name ASC
      LIMIT $1
    `;
    
    const result = await pool.query(query, [parseInt(limit)]);
    
    res.json({
      success: true,
      count: result.rows.length,
      models: result.rows
    });
  } catch (error) {
    console.error('Error getting viral models:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get model by ID or model_id
router.get('/:id', async (req, res) => {
  try {
    // Try to find by model_id (fal-ai/flux-pro) or by database id
    const query = `
      SELECT * FROM ai_models 
      WHERE (model_id = $1 OR id::text = $1) AND is_active = true
      LIMIT 1
    `;
    
    const result = await pool.query(query, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Model not found'
      });
    }
    
    res.json({
      success: true,
      model: result.rows[0]
    });
  } catch (error) {
    console.error('Error getting model:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================
// PINNED MODELS ENDPOINTS
// ============================================

// Get user's pinned models
router.get('/pinned/list', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const query = `
      SELECT 
        m.*,
        p.pin_order,
        p.created_at as pinned_at
      FROM pinned_models p
      JOIN ai_models m ON p.model_id = m.id
      WHERE p.user_id = $1 AND m.is_active = true
      ORDER BY p.pin_order ASC
    `;
    
    const result = await pool.query(query, [req.user.id]);
    
    res.json({
      success: true,
      count: result.rows.length,
      pinned_models: result.rows
    });
  } catch (error) {
    console.error('Error getting pinned models:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Pin a model
router.post('/pin/:modelId', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const { modelId } = req.params;
    const userId = req.user.id;
    
    // Check if model exists
    const modelCheck = await pool.query(
      'SELECT id FROM ai_models WHERE id = $1 AND is_active = true',
      [modelId]
    );
    
    if (modelCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Model not found'
      });
    }
    
    // Check current pin count
    const pinCountQuery = await pool.query(
      'SELECT COUNT(*) as count FROM pinned_models WHERE user_id = $1',
      [userId]
    );
    
    const currentPinCount = parseInt(pinCountQuery.rows[0].count);
    
    if (currentPinCount >= 3) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 3 models can be pinned. Please unpin another model first.',
        max_pins: 3,
        current_pins: currentPinCount
      });
    }
    
    // Check if already pinned
    const existingPin = await pool.query(
      'SELECT id FROM pinned_models WHERE user_id = $1 AND model_id = $2',
      [userId, modelId]
    );
    
    if (existingPin.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Model already pinned'
      });
    }
    
    // Pin the model with next order
    const insertQuery = `
      INSERT INTO pinned_models (user_id, model_id, pin_order)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const result = await pool.query(insertQuery, [userId, modelId, currentPinCount]);
    
    res.json({
      success: true,
      message: 'Model pinned successfully',
      pinned_model: result.rows[0],
      current_pins: currentPinCount + 1,
      max_pins: 3
    });
  } catch (error) {
    console.error('Error pinning model:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Unpin a model
router.delete('/pin/:modelId', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const { modelId } = req.params;
    const userId = req.user.id;
    
    // Get the pin to delete
    const pinQuery = await pool.query(
      'SELECT pin_order FROM pinned_models WHERE user_id = $1 AND model_id = $2',
      [userId, modelId]
    );
    
    if (pinQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Model is not pinned'
      });
    }
    
    const deletedOrder = pinQuery.rows[0].pin_order;
    
    // Delete the pin
    await pool.query(
      'DELETE FROM pinned_models WHERE user_id = $1 AND model_id = $2',
      [userId, modelId]
    );
    
    // Reorder remaining pins
    await pool.query(
      'UPDATE pinned_models SET pin_order = pin_order - 1 WHERE user_id = $1 AND pin_order > $2',
      [userId, deletedOrder]
    );
    
    // Get updated pin count
    const pinCountQuery = await pool.query(
      'SELECT COUNT(*) as count FROM pinned_models WHERE user_id = $1',
      [userId]
    );
    
    res.json({
      success: true,
      message: 'Model unpinned successfully',
      current_pins: parseInt(pinCountQuery.rows[0].count),
      max_pins: 3
    });
  } catch (error) {
    console.error('Error unpinning model:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Toggle pin status (pin if unpinned, unpin if pinned)
router.post('/pin/toggle/:modelId', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const { modelId } = req.params;
    const userId = req.user.id;
    
    // Check if already pinned
    const existingPin = await pool.query(
      'SELECT id FROM pinned_models WHERE user_id = $1 AND model_id = $2',
      [userId, modelId]
    );
    
    if (existingPin.rows.length > 0) {
      // Unpin
      const unpinResponse = await pool.query(
        'DELETE FROM pinned_models WHERE user_id = $1 AND model_id = $2 RETURNING pin_order',
        [userId, modelId]
      );
      
      const deletedOrder = unpinResponse.rows[0].pin_order;
      
      // Reorder
      await pool.query(
        'UPDATE pinned_models SET pin_order = pin_order - 1 WHERE user_id = $1 AND pin_order > $2',
        [userId, deletedOrder]
      );
      
      return res.json({
        success: true,
        action: 'unpinned',
        message: 'Model unpinned successfully'
      });
    } else {
      // Pin
      const pinCountQuery = await pool.query(
        'SELECT COUNT(*) as count FROM pinned_models WHERE user_id = $1',
        [userId]
      );
      
      const currentPinCount = parseInt(pinCountQuery.rows[0].count);
      
      if (currentPinCount >= 3) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 3 models can be pinned',
          max_pins: 3,
          current_pins: currentPinCount
        });
      }
      
      await pool.query(
        'INSERT INTO pinned_models (user_id, model_id, pin_order) VALUES ($1, $2, $3)',
        [userId, modelId, currentPinCount]
      );
      
      return res.json({
        success: true,
        action: 'pinned',
        message: 'Model pinned successfully',
        current_pins: currentPinCount + 1,
        max_pins: 3
      });
    }
  } catch (error) {
    console.error('Error toggling pin:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;

