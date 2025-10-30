/**
 * ======================================
 * Generation Queue Controller (pg-boss)
 * ======================================
 * 
 * Controller untuk enqueue generation jobs
 */

const queueManager = require('../queue/pgBossQueue');
const { pool } = require('../config/database');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');

// ===================================
// ===================================
// Multer configuration for file uploads
// ===================================
// Files uploaded to TEMP folder and deleted after generation
const fs = require('fs').promises;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/temp/'); // ✨ TEMP folder
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

const generationQueueController = {
  /**
   * Multer middleware untuk file uploads
   */
  uploadMiddleware: upload.fields([
    { name: 'startImage', maxCount: 1 },
    { name: 'endImage', maxCount: 1 },
    { name: 'images', maxCount: 10 } // For edit-multi (batch processing)
  ]),

  /**
   * Create and enqueue generation job
   */
  async createJob(req, res) {
    try {
      let { prompt, type, mode, settings, advanced, duration, model, originalPrompt } = req.body;
      const userId = req.user.id;

      // ✨✨✨ DEBUG: Log received prompts
      console.log('═══════════════════════════════════════════════');
      console.log('📥 RECEIVED GENERATION REQUEST');
      console.log('   Mode:', mode);
      console.log('   Type:', type);
      console.log('   Prompt (from req.body):', prompt?.substring(0, 100) + (prompt?.length > 100 ? '...' : ''));
      console.log('   Original Prompt (from req.body):', originalPrompt?.substring(0, 100) + (originalPrompt?.length > 100 ? '...' : '') || 'null');
      console.log('   Prompt Length:', prompt?.length, 'chars');
      console.log('═══════════════════════════════════════════════');

      // Parse settings if it's a JSON string (from FormData)
      if (typeof settings === 'string') {
        try {
          settings = JSON.parse(settings);
        } catch (e) {
          console.error('Failed to parse settings:', e);
          settings = {};
        }
      }

      // ✨ Parse advanced options for audio (music generation)
      if (advanced && typeof advanced === 'string') {
        try {
          const parsedAdvanced = JSON.parse(advanced);
          settings.advanced = parsedAdvanced;
          console.log('🎨 Advanced options parsed:', parsedAdvanced);
        } catch (e) {
          console.error('Failed to parse advanced options:', e);
        }
      }

      // ✨ Add duration and model directly to settings for audio
      if (duration) {
        settings.duration = parseInt(duration);
      }
      if (model) {
        settings.modelId = model;
        settings.model = model;
      }

      // ✨ Normalize model -> modelId for consistency
      if (settings && settings.model && !settings.modelId) {
        settings.modelId = settings.model;
      }
      
      // ✨ Add originalPrompt to settings if provided (for auto-prompt feature)
      // Check both req.body.originalPrompt and settings.originalPrompt
      const finalOriginalPrompt = originalPrompt || settings.originalPrompt;
      if (finalOriginalPrompt && finalOriginalPrompt !== prompt) {
        settings.originalPrompt = finalOriginalPrompt;
        console.log('✅ ✅ ✅ AUTO-PROMPT DETECTED:');
        console.log('   Original:', finalOriginalPrompt.substring(0, 80) + '...');
        console.log('   Enhanced:', prompt.substring(0, 80) + '...');
        console.log('   Enhancement ratio:', prompt.length / finalOriginalPrompt.length, 'x');
      } else {
        console.log('ℹ️  No auto-prompt enhancement (using original prompt)');
      }
      
      // Debug log the final settings
      console.log('📦 Final settings being saved to DB:', JSON.stringify(settings).substring(0, 200) + '...');

      // Handle uploaded files for image-to-video (TEMP files)
      let uploadedFiles = {};
      if (req.files) {
        if (req.files.startImage && req.files.startImage[0]) {
          uploadedFiles.startImagePath = `/uploads/temp/${req.files.startImage[0].filename}`;
          uploadedFiles.startImageFullPath = req.files.startImage[0].path; // For cleanup
          console.log('📁 Start image uploaded:', uploadedFiles.startImagePath);
        }
        if (req.files.endImage && req.files.endImage[0]) {
          uploadedFiles.endImagePath = `/uploads/temp/${req.files.endImage[0].filename}`;
          uploadedFiles.endImageFullPath = req.files.endImage[0].path; // For cleanup
          console.log('📁 End image uploaded:', uploadedFiles.endImagePath);
        }
        // ✅ Handle multiple images for edit-multi (batch processing)
        if (req.files.images && req.files.images.length > 0) {
          uploadedFiles.multiImages = req.files.images.map(file => ({
            path: `/uploads/temp/${file.filename}`,
            fullPath: file.path,
            filename: file.filename
          }));
          console.log(`📁 ${uploadedFiles.multiImages.length} images uploaded for batch processing`);
        }
      }

      // Handle image URLs as alternative to file upload
      if (req.body.startImageUrl) {
        uploadedFiles.startImageUrl = req.body.startImageUrl;
        console.log('🔗 Start image URL:', uploadedFiles.startImageUrl);
      }
      if (req.body.endImageUrl) {
        uploadedFiles.endImageUrl = req.body.endImageUrl;
        console.log('🔗 End image URL:', uploadedFiles.endImageUrl);
      }

      // Validate input
      if (!prompt || !type || !mode) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: prompt, type, mode'
        });
      }

      // Generate unique job ID
      const jobId = `job_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;

      // 1. Insert job into database (status: 'pending')
      console.log('💾 SAVING TO DATABASE:');
      console.log('   Prompt to save:', prompt.substring(0, 100) + '...');
      console.log('   Settings.originalPrompt:', settings.originalPrompt ? settings.originalPrompt.substring(0, 50) + '...' : 'null');
      
      const insertQuery = `
        INSERT INTO ai_generation_history 
        (user_id, job_id, generation_type, sub_type, prompt, settings, status, progress, started_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        RETURNING id, job_id
      `;

      const values = [
        userId,
        jobId,
        mode, // 'image' or 'video'
        type, // 'text-to-image', 'text-to-video', etc
        prompt, // ✨ This should be the ENHANCED prompt from frontend
        JSON.stringify(settings),
        'pending',
        0
      ];

      const result = await pool.query(insertQuery, values);
      const dbJobId = result.rows[0].id;

      // 2. Enqueue job to pg-boss (include uploaded files!)
      const queueJobId = await queueManager.enqueue(
        'ai-generation',
        {
          userId,
          jobId,
          generationType: mode,
          subType: type,
          prompt,
          settings,
          dbJobId,
          uploadedFiles, // ✨ Include uploaded image paths/URLs
        },
        {
          priority: 5, // Higher priority for generation jobs
          retryLimit: 2,
          retryDelay: 30,
          expireInSeconds: 60 * 30, // Expire after 30 minutes
        }
      );

      console.log(`📤 Job created: ${jobId} (queue: ${queueJobId})`);

      res.json({
        success: true,
        jobId: result.rows[0].job_id,
        id: result.rows[0].id,
        message: 'Job queued successfully'
      });

    } catch (error) {
      console.error('Error creating generation job:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create generation job',
        error: error.message
      });
    }
  },

  /**
   * Get job status (polling endpoint)
   */
  async getJobStatus(req, res) {
    try {
      const { jobId } = req.params;
      const userId = req.user.id;

      const query = `
        SELECT 
          id,
          job_id,
          generation_type,
          sub_type,
          prompt,
          result_url,
          status,
          progress,
          cost_credits,
          error_message,
          started_at,
          completed_at,
          created_at
        FROM ai_generation_history
        WHERE job_id = $1 AND user_id = $2
      `;

      const result = await pool.query(query, [jobId, userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Job not found'
        });
      }

      const job = result.rows[0];

      res.json({
        success: true,
        job: {
          id: job.id,
          jobId: job.job_id,
          type: job.generation_type,
          subType: job.sub_type,
          prompt: job.prompt,
          resultUrl: job.result_url,
          status: job.status, // 'pending', 'processing', 'completed', 'failed'
          progress: job.progress,
          creditsCost: job.cost_credits,
          errorMessage: job.error_message,
          startedAt: job.started_at,
          completedAt: job.completed_at
        }
      });

    } catch (error) {
      console.error('Error getting job status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get job status'
      });
    }
  },

  /**
   * Get all active jobs
   */
  async getActiveJobs(req, res) {
    try {
      const userId = req.user.id;

      const query = `
        SELECT 
          id,
          job_id,
          generation_type,
          sub_type,
          prompt,
          status,
          progress,
          started_at,
          settings
        FROM ai_generation_history
        WHERE user_id = $1 
          AND status IN ('pending', 'processing')
        ORDER BY started_at DESC
      `;

      const result = await pool.query(query, [userId]);

      res.json({
        success: true,
        jobs: result.rows.map(job => ({
          id: job.id,
          jobId: job.job_id,
          type: job.generation_type,
          subType: job.sub_type,
          prompt: job.prompt,
          status: job.status,
          progress: job.progress,
          startedAt: job.started_at,
          settings: job.settings
        }))
      });

    } catch (error) {
      console.error('Error getting active jobs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get active jobs'
      });
    }
  },

  /**
   * Cancel a job
   */
  async cancelJob(req, res) {
    try {
      const { jobId } = req.params;
      const userId = req.user.id;

      // Check if job exists and belongs to user
      const checkQuery = `
        SELECT id, status FROM ai_generation_history
        WHERE job_id = $1 AND user_id = $2
      `;

      const checkResult = await pool.query(checkQuery, [jobId, userId]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Job not found'
        });
      }

      const currentStatus = checkResult.rows[0].status;

      if (currentStatus === 'completed' || currentStatus === 'failed') {
        return res.status(400).json({
          success: false,
          message: 'Cannot cancel completed or failed job'
        });
      }

      // Cancel in queue (pg-boss)
      // Note: We need to store pg-boss job ID in database to cancel
      // For now, just update status in DB
      await pool.query(`
        UPDATE ai_generation_history
        SET status = 'cancelled', completed_at = NOW()
        WHERE job_id = $1
      `, [jobId]);

      res.json({
        success: true,
        message: 'Job cancelled successfully'
      });

    } catch (error) {
      console.error('Error cancelling job:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel job'
      });
    }
  }
};

module.exports = generationQueueController;

