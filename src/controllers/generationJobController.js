const { pool } = require('../config/database');
const crypto = require('crypto');

/**
 * Generation Job Controller
 * Handles job tracking and polling for background generation
 */

const generationJobController = {
  /**
   * Create a new generation job
   */
  async createJob(req, res) {
    try {
      const { prompt, type, mode, settings } = req.body;
      const userId = req.user.id;
      
      // Generate unique job ID
      const jobId = `job_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
      
      // Insert job into database
      const query = `
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
        prompt,
        JSON.stringify(settings),
        'pending',
        0
      ];
      
      const result = await pool.query(query, values);
      
      res.json({
        success: true,
        jobId: result.rows[0].job_id,
        id: result.rows[0].id
      });
      
    } catch (error) {
      console.error('Error creating generation job:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create generation job'
      });
    }
  },
  
  /**
   * Get job status (for polling)
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
   * Get all active jobs for user
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
   * Get new (unviewed) generations count
   */
  async getNewCount(req, res) {
    try {
      const userId = req.user.id;
      
      const query = `
        SELECT COUNT(*) as count
        FROM ai_generation_history
        WHERE user_id = $1 
          AND viewed_at IS NULL 
          AND status = 'completed'
      `;
      
      const result = await pool.query(query, [userId]);
      
      res.json({
        success: true,
        count: parseInt(result.rows[0].count)
      });
      
    } catch (error) {
      console.error('Error getting new count:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get new count'
      });
    }
  },
  
  /**
   * Mark generations as viewed
   */
  async markAsViewed(req, res) {
    try {
      const userId = req.user.id;
      
      const query = `
        UPDATE ai_generation_history
        SET viewed_at = NOW()
        WHERE user_id = $1 
          AND viewed_at IS NULL 
          AND status = 'completed'
        RETURNING id
      `;
      
      const result = await pool.query(query, [userId]);
      
      res.json({
        success: true,
        updated: result.rows.length
      });
      
    } catch (error) {
      console.error('Error marking as viewed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark as viewed'
      });
    }
  }
};

module.exports = generationJobController;

