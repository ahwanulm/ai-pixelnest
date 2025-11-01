const sunoService = require('../services/sunoService');
const User = require('../models/User');
const { pool } = require('../config/database');
const queueManager = require('../queue/pgBossQueue');
const crypto = require('crypto');

const musicController = {
  /**
   * Generate music from text prompt
   * POST /music/generate
   * 🔄 QUEUE-BASED: Uses worker for consistent async processing
   */
  async generateMusic(req, res) {
    try {
      const userId = req.user.id;
      const {
        prompt,
        make_instrumental = false,
        model = 'v5',
        title = '',
        tags = '',
        custom_mode = false,
        vocal_gender = null,
        weirdness = 0.5,
        style_weight = 0.7,
        tempo = 120
      } = req.body;

      // ⛔ IMPORTANT: Suno AI NEVER uses auto-prompt enhancement
      // User's exact prompt is used without modification
      
      // Validate prompt
      if (!prompt || prompt.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Prompt is required'
        });
      }

      // Check if Suno service is available
      const isAvailable = await sunoService.isAvailable();
      if (!isAvailable) {
        return res.status(503).json({
          success: false,
          message: 'Music generation service is not available. Please contact administrator.'
        });
      }

      // Get model from database
      const modelQuery = await pool.query(
        'SELECT id, model_id, cost, provider FROM ai_models WHERE model_id = $1 AND is_active = true',
        [`suno-${model}`]
      );
      
      if (modelQuery.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: `Model suno-${model} not found`
        });
      }

      const modelData = modelQuery.rows[0];
      const baseCost = parseFloat(modelData.cost);

      // Check user credits (don't deduct yet - worker will handle it)
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (user.credits < baseCost) {
        return res.status(402).json({
          success: false,
          message: `Insufficient credits. You need ${baseCost} credits but have ${user.credits} credits.`,
          required: baseCost,
          available: user.credits
        });
      }

      console.log('🎵 Enqueueing music generation for user:', userId, {
        prompt: prompt.substring(0, 50) + '...',
        model,
        make_instrumental: make_instrumental,
        vocal_gender: vocal_gender || 'auto (not provided)',
        custom_mode,
        weirdness,
        style_weight,
        tempo
      });

      // Prepare settings for worker (matching generationQueueController pattern)
      const isInstrumental = make_instrumental === 'true' || make_instrumental === true;
      const settings = {
        modelId: modelData.model_id, // ✅ CRITICAL: Worker expects modelId in settings
        advanced: {
          make_instrumental: isInstrumental,
          custom_mode: custom_mode === 'true' || custom_mode === true,
          vocal_gender: !isInstrumental && vocal_gender ? vocal_gender : null,
          weirdness: parseFloat(weirdness) || 0.5,
          style_weight: parseFloat(style_weight) || 0.7,
          title: title || '',
          tags: tags || '',
          tempo: parseInt(tempo) || 120
        }
      };

      // Generate unique job ID (matching generationQueueController pattern)
      const jobId = `job_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;

      // Insert to database with 'pending' status (worker will update to 'processing')
      const insertQuery = `
        INSERT INTO ai_generation_history 
        (user_id, job_id, model_used, prompt, status, generation_type, sub_type, settings, progress, started_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING id, job_id
      `;

      const insertValues = [
        userId,
        jobId, // ✅ Use generated jobId
        modelData.model_id,
        prompt,
        'pending', // ✅ Start with 'pending', worker will change to 'processing'
        'audio',
        'text-to-music', // ✅ Match worker's expectation for subType
        JSON.stringify(settings),
        0
      ];

      const insertResult = await pool.query(insertQuery, insertValues);
      const dbId = insertResult.rows[0].id;

      console.log(`   💾 Created generation record: ${dbId} with job_id: ${jobId}`);

      // Small delay to ensure database transaction is committed
      await new Promise(resolve => setTimeout(resolve, 200));

      // Enqueue job to worker (matching generationQueueController pattern)
      const queueJobId = await queueManager.enqueue('ai-generation', {
        userId,
        jobId, // ✅ Pass jobId (string) not generationId (number)
        generationType: 'audio', // ✅ Worker expects 'generationType'
        subType: 'text-to-music', // ✅ Match worker's audio generation logic
        prompt,
        settings, // ✅ Contains modelId and advanced options
        dbJobId: dbId,
        uploadedFiles: {} // ✅ Empty for music (no file uploads)
      }, {
        priority: 5, // Higher priority for music
        retryLimit: 2,
        retryDelay: 30,
        expireInSeconds: 60 * 15 // 15 minutes
      });

      console.log(`   📤 Job enqueued: ${queueJobId}`);

      // Return job info immediately
      res.json({
        success: true,
        message: 'Music generation started',
        jobId: insertResult.rows[0].job_id, // ✅ Return the job_id from database
        id: dbId, // ✅ Also return database ID
        status: 'pending',
        estimatedTime: '30-60 seconds',
        cost: baseCost, // ✅ Include cost for frontend display
        modelName: modelData.model_id
      });

    } catch (error) {
      console.error('❌ Music generation enqueue error:', error);
      
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to start music generation'
      });
    }
  },

  /**
   * Generate lyrics from text prompt
   * POST /music/generate-lyrics
   */
  async generateLyrics(req, res) {
    try {
      const { prompt } = req.body;

      if (!prompt || prompt.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Prompt is required'
        });
      }

      // Check if Suno service is available
      const isAvailable = await sunoService.isAvailable();
      if (!isAvailable) {
        return res.status(503).json({
          success: false,
          message: 'Lyrics generation service is not available. Please contact administrator.'
        });
      }

      const result = await sunoService.generateLyrics(prompt);

      res.json({
        success: true,
        message: 'Lyrics generated successfully',
        data: result
      });

    } catch (error) {
      console.error('❌ Lyrics generation error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate lyrics'
      });
    }
  },

  /**
   * Get music generation details
   * GET /music/details/:taskId
   */
  async getMusicDetails(req, res) {
    try {
      const { taskId } = req.params;

      if (!taskId) {
        return res.status(400).json({
          success: false,
          message: 'Task ID is required'
        });
      }

      const result = await sunoService.getMusicDetails(taskId);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('❌ Get music details error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get music details'
      });
    }
  },

  /**
   * Extend music track
   * POST /music/extend
   */
  async extendMusic(req, res) {
    try {
      const userId = req.user.id;
      const { audio_id, prompt, continue_at } = req.body;

      if (!audio_id) {
        return res.status(400).json({
          success: false,
          message: 'Audio ID is required'
        });
      }

      // Check if Suno service is available
      const isAvailable = await sunoService.isAvailable();
      if (!isAvailable) {
        return res.status(503).json({
          success: false,
          message: 'Music extension service is not available. Please contact administrator.'
        });
      }

      // Cost for music extension
      const extensionCost = 30;

      // Check user credits
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (user.credits < extensionCost) {
        return res.status(402).json({
          success: false,
          message: `Insufficient credits. You need ${extensionCost} credits but have ${user.credits} credits.`,
          required: extensionCost,
          available: user.credits
        });
      }

      const result = await sunoService.extendMusic({
        audio_id,
        prompt,
        continue_at
      });

      // Deduct credits
      await User.updateCredits(userId, -extensionCost, 'Music Extension', `Extended music: ${audio_id}`);

      res.json({
        success: true,
        message: 'Music extension started successfully',
        data: result,
        creditsUsed: extensionCost,
        remainingCredits: user.credits - extensionCost
      });

    } catch (error) {
      console.error('❌ Music extension error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to extend music'
      });
    }
  },

  /**
   * Get Suno API credits
   * GET /music/credits
   */
  async getSunoCredits(req, res) {
    try {
      const result = await sunoService.getRemainingCredits();

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('❌ Get Suno credits error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get Suno credits'
      });
    }
  },

  /**
   * Render music generation page
   * GET /music
   */
  async renderMusicPage(req, res) {
    try {
      // Check if Suno service is available
      const isAvailable = await sunoService.isAvailable();

      // Load Suno models from database
      const modelsQuery = `
        SELECT id, model_id, name, description, cost, quality, speed, 
               max_duration, metadata, trending, is_active
        FROM ai_models 
        WHERE provider = 'SUNO' 
          AND type = 'audio' 
          AND category = 'Music'
          AND is_active = true
        ORDER BY cost DESC
      `;
      
      const modelsResult = await pool.query(modelsQuery);
      const sunoModels = modelsResult.rows.map(row => ({
        ...row,
        metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata
      }));

      res.render('music/generate', {
        title: 'Music Generation',
        pageTitle: 'AI Music Generation',
        user: req.user,
        sunoAvailable: isAvailable,
        sunoModels: sunoModels.length > 0 ? sunoModels : null
      });

    } catch (error) {
      console.error('❌ Render music page error:', error);
      res.status(500).render('error', {
        title: 'Error',
        message: 'Failed to load music generation page',
        error: process.env.NODE_ENV === 'development' ? error : null
      });
    }
  },

  /**
   * Render lyrics generation page
   * GET /music/lyrics
   */
  async renderLyricsPage(req, res) {
    try {
      res.render('music/lyrics', {
        title: 'Lyrics Generation',
        pageTitle: 'AI Lyrics Generation',
        user: req.user
      });
    } catch (error) {
      console.error('❌ Render lyrics page error:', error);
      res.status(500).render('error', {
        title: 'Error',
        message: 'Failed to load lyrics generation page',
        error: process.env.NODE_ENV === 'development' ? error : null
      });
    }
  },

  /**
   * Render music extension page
   * GET /music/extend
   */
  async renderExtendPage(req, res) {
    try {
      res.render('music/extend', {
        title: 'Extend Music',
        pageTitle: 'Extend Your Music',
        user: req.user
      });
    } catch (error) {
      console.error('❌ Render extend page error:', error);
      res.status(500).render('error', {
        title: 'Error',
        message: 'Failed to load music extension page',
        error: process.env.NODE_ENV === 'development' ? error : null
      });
    }
  }
};

module.exports = musicController;

