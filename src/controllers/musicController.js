const sunoService = require('../services/sunoService');
const User = require('../models/User');
const { pool } = require('../config/database');

const musicController = {
  /**
   * Generate music from text prompt
   * POST /music/generate
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
        style_weight = 0.7
      } = req.body;

      // ⛔ IMPORTANT: Suno AI NEVER uses auto-prompt enhancement
      // User's exact prompt is used without modification
      // No originalPrompt, no enhancement, direct to Suno API
      
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

      // Get model pricing from database
      const modelQuery = await pool.query(
        'SELECT cost FROM ai_models WHERE model_id = $1 AND is_active = true',
        [`suno-${model}`]
      );
      
      // Calculate credits cost from database or fallback
      const baseCost = modelQuery.rows.length > 0 
        ? parseFloat(modelQuery.rows[0].cost) 
        : 0.5; // Default fallback

      // Check user credits
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

      console.log('🎵 Generating music for user:', userId, {
        prompt: prompt.substring(0, 50) + '...',
        model,
        vocal_gender: vocal_gender || 'auto',
        custom_mode,
        weirdness,
        style_weight
      });

      // Prepare generation parameters
      const isInstrumental = make_instrumental === 'true' || make_instrumental === true;
      const generationParams = {
        prompt,
        make_instrumental: isInstrumental,
        model,
        wait_audio: true,
        custom_mode: custom_mode === 'true' || custom_mode === true,
        instrumental: isInstrumental,
        title,
        tags,
        weirdness: parseFloat(weirdness) || 0.5,
        style_weight: parseFloat(style_weight) || 0.7
      };

      // Add vocal_gender only if not instrumental
      if (!isInstrumental && vocal_gender) {
        generationParams.vocal_gender = vocal_gender;
      }

      // Generate music using Suno API
      const result = await sunoService.generateMusic(generationParams);
      
      // Extract all tracks (Suno returns 2 songs)
      // result can be: array of tracks OR single track with metadata.all_tracks
      let allTracks = [];
      
      if (Array.isArray(result)) {
        // Direct array of tracks
        allTracks = result;
      } else if (result.metadata && Array.isArray(result.metadata.all_tracks)) {
        // Tracks stored in metadata
        allTracks = result.metadata.all_tracks;
      } else {
        // Single track
        allTracks = [result];
      }
      
      console.log(`   📦 Processing ${allTracks.length} track(s) for response`);

      // Deduct credits
      await User.updateCredits(userId, -baseCost, 'Music Generation', `Generated music: ${title || prompt.substring(0, 50)}`);

      // Save generation to history (save primary track)
      const saveQuery = `
        INSERT INTO ai_generation_history 
        (user_id, model_id, model_name, prompt, result_url, result_data, status, credits_used, generation_type)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const primaryTrack = allTracks[0];
      const resultUrl = primaryTrack.audio_url;

      const saveValues = [
        userId,
        `suno-${model}`,
        `Suno ${model.toUpperCase()}`,
        prompt,
        resultUrl,
        JSON.stringify({ all_tracks: allTracks }), // Save all tracks
        'completed',
        baseCost,
        'audio'
      ];

      const saveResult = await pool.query(saveQuery, saveValues);

      res.json({
        success: true,
        message: `Music generated successfully! (${allTracks.length} tracks)`,
        data: {
          data: allTracks // Array of all tracks for frontend
        },
        generation: saveResult.rows[0],
        creditsUsed: baseCost,
        remainingCredits: user.credits - baseCost
      });

    } catch (error) {
      console.error('❌ Music generation error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate music'
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

