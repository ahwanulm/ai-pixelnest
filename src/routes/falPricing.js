/**
 * FAL.AI Pricing Verification Routes
 * API endpoints for verifying FAL.AI pricing accuracy
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Verified FAL.AI prices (must be updated manually from fal.ai website)
// Last verified: [Update this date when verified]
const VERIFIED_FAL_PRICES = {
  // VIDEO MODELS
  'fal-ai/kuaishou/kling-video/v2.5/pro/text-to-video': {
    price: 0.32,
    verified_date: '2025-01-27',
    notes: 'https://fal.ai/models/fal-ai/kuaishou/kling-video/v2.5/pro/text-to-video'
  },
  'fal-ai/kuaishou/kling-video/v2.5/standard/text-to-video': {
    price: 0.25,
    verified_date: '2025-01-27',
    notes: 'Check fal.ai/models'
  },
  'fal-ai/minimax-video': {
    price: 0.32,
    verified_date: '2025-01-27',
    notes: 'Check fal.ai/models'
  },
  
  // IMAGE MODELS
  'fal-ai/flux-pro/v1.1': {
    price: 0.055,
    verified_date: '2025-01-27',
    notes: 'Check fal.ai/models'
  },
  'fal-ai/flux/dev': {
    price: 0.025,
    verified_date: '2025-01-27',
    notes: 'Check fal.ai/models'
  },
  'fal-ai/recraft-v3': {
    price: 0.040,
    verified_date: '2025-01-27',
    notes: 'Check fal.ai/models'
  }
  
  // ADD MORE AS NEEDED...
};

/**
 * GET /api/fal-pricing/verify
 * Verify all models pricing against verified prices
 */
router.get('/verify', async (req, res) => {
  try {
    // Get all active models
    const result = await pool.query(`
      SELECT 
        id,
        model_id,
        name,
        type,
        fal_price,
        cost as credits,
        updated_at
      FROM ai_models
      WHERE is_active = true
      ORDER BY type, name
    `);
    
    const models = result.rows;
    
    let matchCount = 0;
    let mismatchCount = 0;
    let unverifiedCount = 0;
    let outdatedCount = 0;
    
    const mismatches = [];
    const unverified = [];
    const outdated = [];
    const matching = [];
    
    // Compare each model
    for (const model of models) {
      const verifiedData = VERIFIED_FAL_PRICES[model.model_id];
      const dbPrice = parseFloat(model.fal_price) || 0;
      
      if (!verifiedData) {
        // Not in verified list
        unverifiedCount++;
        unverified.push({
          id: model.id,
          model_id: model.model_id,
          name: model.name,
          type: model.type,
          dbPrice,
          credits: model.credits
        });
      } else {
        // Check verification age
        const verifiedDate = new Date(verifiedData.verified_date);
        const daysSince = Math.floor((Date.now() - verifiedDate) / (1000 * 60 * 60 * 24));
        
        if (daysSince > 30) {
          outdatedCount++;
          outdated.push({
            id: model.id,
            name: model.name,
            daysSince,
            verifiedDate: verifiedData.verified_date
          });
        }
        
        // Compare prices
        const verifiedPrice = verifiedData.price;
        if (Math.abs(dbPrice - verifiedPrice) < 0.001) {
          // Match!
          matchCount++;
          matching.push({
            id: model.id,
            name: model.name,
            price: dbPrice
          });
        } else {
          // Mismatch!
          mismatchCount++;
          const difference = verifiedPrice - dbPrice;
          const isLoss = difference > 0; // If verified > db, we're losing money
          
          mismatches.push({
            id: model.id,
            model_id: model.model_id,
            name: model.name,
            type: model.type,
            dbPrice,
            verifiedPrice,
            difference,
            isLoss,
            riskLevel: isLoss ? 'high' : 'low',
            notes: verifiedData.notes,
            sqlFix: `UPDATE ai_models SET fal_price = ${verifiedPrice}, updated_at = CURRENT_TIMESTAMP WHERE model_id = '${model.model_id}';`
          });
        }
      }
    }
    
    // Calculate risk level
    let overallRisk = 'low';
    if (mismatchCount > 5 || mismatches.some(m => m.difference > 0.1)) {
      overallRisk = 'critical';
    } else if (mismatchCount > 0 || unverifiedCount > 10) {
      overallRisk = 'medium';
    }
    
    res.json({
      success: true,
      summary: {
        total: models.length,
        matching: matchCount,
        mismatches: mismatchCount,
        unverified: unverifiedCount,
        outdated: outdatedCount,
        risk: overallRisk
      },
      mismatches,
      unverified: unverified.slice(0, 10), // First 10 only
      outdated: outdated.slice(0, 5),
      matching: matching.slice(0, 5),
      message: mismatchCount > 0 
        ? `⚠️ ${mismatchCount} price mismatch(es) found! Some may cause profit loss.`
        : unverifiedCount > 0
        ? `ℹ️ ${unverifiedCount} model(s) not verified yet.`
        : '✅ All verified prices match database!'
    });
    
  } catch (error) {
    console.error('Error verifying FAL pricing:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying pricing: ' + error.message
    });
  }
});

/**
 * POST /api/fal-pricing/apply-fixes
 * Apply pricing fixes for mismatched models
 */
router.post('/apply-fixes', async (req, res) => {
  try {
    const { modelIds } = req.body;
    
    if (!modelIds || !Array.isArray(modelIds) || modelIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No models selected'
      });
    }
    
    let updatedCount = 0;
    const updates = [];
    
    for (const modelId of modelIds) {
      const verifiedData = VERIFIED_FAL_PRICES[modelId];
      
      if (verifiedData) {
        await pool.query(`
          UPDATE ai_models 
          SET fal_price = $1, 
              updated_at = CURRENT_TIMESTAMP 
          WHERE model_id = $2
        `, [verifiedData.price, modelId]);
        
        updatedCount++;
        updates.push({
          modelId,
          newPrice: verifiedData.price
        });
      }
    }
    
    res.json({
      success: true,
      message: `✅ Updated ${updatedCount} model(s) with verified prices`,
      updatedCount,
      updates
    });
    
  } catch (error) {
    console.error('Error applying fixes:', error);
    res.status(500).json({
      success: false,
      message: 'Error applying fixes: ' + error.message
    });
  }
});

module.exports = router;

