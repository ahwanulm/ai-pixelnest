/**
 * =========================================
 * Admin Jobs Management Controller
 * =========================================
 * 
 * Manage all generation jobs:
 * - View all jobs (pending, processing, completed, failed)
 * - Cancel pending/processing jobs
 * - Retry failed jobs
 * - Delete jobs
 * - Cleanup expired jobs
 * - Statistics & monitoring
 */

const { pool } = require('../config/database');
const { cleanupExpiredJobs } = require('../scripts/cleanupExpiredJobs');

const adminJobsController = {
  /**
   * Show jobs management page
   */
  async showJobsPage(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const offset = (page - 1) * limit;
      const statusFilter = req.query.status || 'all';
      const typeFilter = req.query.type || 'all';
      const searchQuery = req.query.search || '';
      
      // Build WHERE clause
      let whereConditions = [];
      let queryParams = [];
      let paramIndex = 1;
      
      if (statusFilter !== 'all') {
        whereConditions.push(`status = $${paramIndex}`);
        queryParams.push(statusFilter);
        paramIndex++;
      }
      
      if (typeFilter !== 'all') {
        whereConditions.push(`generation_type = $${paramIndex}`);
        queryParams.push(typeFilter);
        paramIndex++;
      }
      
      if (searchQuery) {
        whereConditions.push(`(prompt ILIKE $${paramIndex} OR job_id ILIKE $${paramIndex})`);
        queryParams.push(`%${searchQuery}%`);
        paramIndex++;
      }
      
      const whereClause = whereConditions.length > 0 
        ? 'WHERE ' + whereConditions.join(' AND ')
        : '';
      
      // Get jobs with pagination
      const jobsQuery = `
        SELECT 
          g.id,
          g.job_id,
          g.user_id,
          g.generation_type,
          g.sub_type,
          g.prompt,
          g.result_url,
          g.status,
          g.progress,
          g.cost_credits,
          g.error_message,
          g.started_at,
          g.completed_at,
          g.created_at,
          u.name as username,
          u.email,
          CASE 
            WHEN g.started_at IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (NOW() - g.started_at))/60 
            ELSE 0 
          END as minutes_elapsed
        FROM ai_generation_history g
        LEFT JOIN users u ON g.user_id = u.id
        ${whereClause}
        ORDER BY g.started_at DESC NULLS LAST
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      
      queryParams.push(limit, offset);
      
      const jobs = await pool.query(jobsQuery, queryParams);
      
      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM ai_generation_history g
        ${whereClause}
      `;
      
      const countResult = await pool.query(countQuery, queryParams.slice(0, -2));
      const totalJobs = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(totalJobs / limit);
      
      // Get statistics
      const statsQuery = `
        SELECT 
          status,
          COUNT(*) as count,
          COUNT(*) FILTER (WHERE started_at > NOW() - INTERVAL '1 hour') as last_hour,
          COUNT(*) FILTER (WHERE started_at > NOW() - INTERVAL '24 hours') as last_24h,
          SUM(cost_credits) as total_credits
        FROM ai_generation_history
        GROUP BY status
      `;
      
      const stats = await pool.query(statsQuery);
      
      // Get type statistics
      const typeStatsQuery = `
        SELECT 
          generation_type,
          COUNT(*) as count,
          COUNT(*) FILTER (WHERE status = 'completed') as completed,
          COUNT(*) FILTER (WHERE status = 'failed') as failed,
          COUNT(*) FILTER (WHERE status IN ('pending', 'processing')) as active
        FROM ai_generation_history
        GROUP BY generation_type
      `;
      
      const typeStats = await pool.query(typeStatsQuery);
      
      // Get stuck jobs (for alerts)
      const stuckJobsQuery = `
        SELECT 
          COUNT(*) FILTER (WHERE status = 'pending' AND started_at < NOW() - INTERVAL '30 minutes') as stuck_pending,
          COUNT(*) FILTER (WHERE status = 'processing' AND started_at < NOW() - INTERVAL '15 minutes') as stuck_processing
        FROM ai_generation_history
      `;
      
      const stuckJobsResult = await pool.query(stuckJobsQuery);
      const stuckPendingCount = parseInt(stuckJobsResult.rows[0]?.stuck_pending || 0);
      const stuckProcessingCount = parseInt(stuckJobsResult.rows[0]?.stuck_processing || 0);
      
      res.render('admin/jobs', {
        title: 'Jobs Management - Admin Panel',
        jobs: jobs.rows,
        stats: stats.rows,
        typeStats: typeStats.rows,
        pagination: {
          page,
          limit,
          totalJobs,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        filters: {
          status: statusFilter,
          type: typeFilter,
          search: searchQuery
        },
        alerts: {
          stuckPending: stuckPendingCount,
          stuckProcessing: stuckProcessingCount
        },
        currentPath: req.path
      });
      
    } catch (error) {
      console.error('Error loading jobs page:', error);
      res.status(500).render('error', {
        title: 'Error',
        message: 'Failed to load jobs management page',
        error: process.env.NODE_ENV === 'development' ? error : null
      });
    }
  },
  
  /**
   * Get job details (AJAX)
   */
  async getJobDetails(req, res) {
    try {
      const { id } = req.params;
      
      const query = `
        SELECT 
          g.*,
          u.name as username,
          u.email,
          CASE 
            WHEN g.started_at IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (NOW() - g.started_at))/60 
            ELSE 0 
          END as minutes_elapsed,
          CASE 
            WHEN g.completed_at IS NOT NULL AND g.started_at IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (g.completed_at - g.started_at))/60 
            ELSE NULL 
          END as processing_duration
        FROM ai_generation_history g
        LEFT JOIN users u ON g.user_id = u.id
        WHERE g.id = $1
      `;
      
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Job not found'
        });
      }
      
      res.json({
        success: true,
        job: result.rows[0]
      });
      
    } catch (error) {
      console.error('Error getting job details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get job details'
      });
    }
  },
  
  /**
   * Cancel a job
   */
  async cancelJob(req, res) {
    try {
      const { id } = req.params;
      
      // Check if job can be cancelled
      const checkQuery = `
        SELECT id, job_id, status, user_id
        FROM ai_generation_history
        WHERE id = $1
      `;
      
      const checkResult = await pool.query(checkQuery, [id]);
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Job not found'
        });
      }
      
      const job = checkResult.rows[0];
      
      if (!['pending', 'processing'].includes(job.status)) {
        return res.status(400).json({
          success: false,
          message: 'Can only cancel pending or processing jobs'
        });
      }
      
      // Update job status
      const updateQuery = `
        UPDATE ai_generation_history
        SET 
          status = 'failed',
          error_message = 'Cancelled by admin',
          completed_at = NOW()
        WHERE id = $1
        RETURNING *
      `;
      
      await pool.query(updateQuery, [id]);
      
      console.log(`✅ Admin cancelled job ${job.job_id} (user: ${job.user_id})`);
      
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
  },
  
  /**
   * Delete a job
   */
  async deleteJob(req, res) {
    try {
      const { id } = req.params;
      
      const deleteQuery = `
        DELETE FROM ai_generation_history
        WHERE id = $1
        RETURNING job_id, user_id
      `;
      
      const result = await pool.query(deleteQuery, [id]);
      
      if (result.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Job not found'
        });
      }
      
      console.log(`✅ Admin deleted job ${result.rows[0].job_id} (user: ${result.rows[0].user_id})`);
      
      res.json({
        success: true,
        message: 'Job deleted successfully'
      });
      
    } catch (error) {
      console.error('Error deleting job:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete job'
      });
    }
  },
  
  /**
   * Bulk cancel jobs
   */
  async bulkCancelJobs(req, res) {
    try {
      const { ids } = req.body;
      
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No jobs selected'
        });
      }
      
      const updateQuery = `
        UPDATE ai_generation_history
        SET 
          status = 'failed',
          error_message = 'Bulk cancelled by admin',
          completed_at = NOW()
        WHERE id = ANY($1)
          AND status IN ('pending', 'processing')
        RETURNING id
      `;
      
      const result = await pool.query(updateQuery, [ids]);
      
      console.log(`✅ Admin bulk cancelled ${result.rowCount} job(s)`);
      
      res.json({
        success: true,
        message: `${result.rowCount} job(s) cancelled successfully`,
        count: result.rowCount
      });
      
    } catch (error) {
      console.error('Error bulk cancelling jobs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to bulk cancel jobs'
      });
    }
  },
  
  /**
   * Bulk delete jobs
   */
  async bulkDeleteJobs(req, res) {
    try {
      const { ids } = req.body;
      
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No jobs selected'
        });
      }
      
      const deleteQuery = `
        DELETE FROM ai_generation_history
        WHERE id = ANY($1)
        RETURNING id
      `;
      
      const result = await pool.query(deleteQuery, [ids]);
      
      console.log(`✅ Admin bulk deleted ${result.rowCount} job(s)`);
      
      res.json({
        success: true,
        message: `${result.rowCount} job(s) deleted successfully`,
        count: result.rowCount
      });
      
    } catch (error) {
      console.error('Error bulk deleting jobs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to bulk delete jobs'
      });
    }
  },
  
  /**
   * Run cleanup (manual trigger)
   */
  async runCleanup(req, res) {
    try {
      const { dryRun } = req.query;
      
      console.log('🧹 Admin triggered manual cleanup...');
      
      // Capture console.log output
      let output = '';
      const originalLog = console.log;
      console.log = (...args) => {
        output += args.join(' ') + '\n';
        originalLog.apply(console, args);
      };
      
      await cleanupExpiredJobs({ 
        dryRun: dryRun === 'true',
        verbose: true 
      });
      
      // Restore console.log
      console.log = originalLog;
      
      res.json({
        success: true,
        message: 'Cleanup completed successfully',
        output: output
      });
      
    } catch (error) {
      console.error('Error running cleanup:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to run cleanup',
        error: error.message
      });
    }
  },
  
  /**
   * Get statistics (AJAX)
   */
  async getStatistics(req, res) {
    try {
      const statsQuery = `
        SELECT 
          COUNT(*) as total_jobs,
          COUNT(*) FILTER (WHERE status = 'pending') as pending,
          COUNT(*) FILTER (WHERE status = 'processing') as processing,
          COUNT(*) FILTER (WHERE status = 'completed') as completed,
          COUNT(*) FILTER (WHERE status = 'failed') as failed,
          COUNT(*) FILTER (WHERE started_at > NOW() - INTERVAL '1 hour') as last_hour,
          COUNT(*) FILTER (WHERE started_at > NOW() - INTERVAL '24 hours') as last_24h,
          SUM(cost_credits) as total_credits_used,
          AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_processing_time
        FROM ai_generation_history
      `;
      
      const result = await pool.query(statsQuery);
      
      res.json({
        success: true,
        statistics: result.rows[0]
      });
      
    } catch (error) {
      console.error('Error getting statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get statistics'
      });
    }
  }
};

module.exports = adminJobsController;

