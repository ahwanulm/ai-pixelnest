/**
 * ======================================
 * OPSI 2: Custom Queue (Roll-Your-Own)
 * ======================================
 * 
 * Queue system berbasis Postgres dengan:
 * - FOR UPDATE SKIP LOCKED (untuk lock jobs)
 * - LISTEN/NOTIFY (untuk real-time updates)
 * - Retry mechanism
 * - Priority queue
 * 
 * No external dependencies - pure Postgres!
 */

const { pool } = require('../config/database');

class CustomQueueManager {
  constructor() {
    this.workers = new Map();
    this.isRunning = false;
    this.notifyClient = null;
  }

  /**
   * Initialize queue system
   */
  async initialize() {
    console.log('🔧 Initializing custom queue system...');

    // Log database config
    console.log('📊 Database config:', {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'pixelnest_db',
      user: process.env.DB_USER || 'postgres'
    });

    try {
      // Create jobs table if not exists
      await this.createJobsTable();

      // Initialize LISTEN connection
      await this.initializeNotify();

      this.isRunning = true;
      console.log('✅ Custom queue initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize custom queue:', error);
      throw error;
    }
  }

  /**
   * Create jobs table
   */
  async createJobsTable() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS job_queue (
        id BIGSERIAL PRIMARY KEY,
        
        -- Job identification
        queue_name VARCHAR(100) NOT NULL,
        job_id VARCHAR(255) UNIQUE NOT NULL,
        
        -- Job data
        payload JSONB NOT NULL,
        
        -- Status & scheduling
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        -- Status: 'pending', 'processing', 'completed', 'failed', 'cancelled'
        
        priority INTEGER NOT NULL DEFAULT 0,
        -- Higher number = higher priority
        
        -- Retry logic
        attempts INTEGER NOT NULL DEFAULT 0,
        max_attempts INTEGER NOT NULL DEFAULT 3,
        retry_delay INTEGER NOT NULL DEFAULT 60,
        -- Delay in seconds
        
        -- Progress tracking
        progress INTEGER NOT NULL DEFAULT 0,
        -- 0-100
        
        -- Result & error
        result JSONB,
        error_message TEXT,
        
        -- Timestamps
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        scheduled_for TIMESTAMP NOT NULL DEFAULT NOW(),
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        
        -- Lock mechanism
        locked_until TIMESTAMP,
        locked_by VARCHAR(255),
        
        CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
        CONSTRAINT valid_progress CHECK (progress >= 0 AND progress <= 100)
      );

      -- Indexes for performance
      CREATE INDEX IF NOT EXISTS idx_job_queue_status_priority 
        ON job_queue(status, priority DESC, scheduled_for ASC)
        WHERE status IN ('pending', 'processing');

      CREATE INDEX IF NOT EXISTS idx_job_queue_queue_name 
        ON job_queue(queue_name);

      CREATE INDEX IF NOT EXISTS idx_job_queue_job_id 
        ON job_queue(job_id);

      CREATE INDEX IF NOT EXISTS idx_job_queue_scheduled 
        ON job_queue(scheduled_for) 
        WHERE status = 'pending';
    `);

    console.log('✅ Job queue table ready');
  }

  /**
   * Initialize LISTEN/NOTIFY
   */
  async initializeNotify() {
    this.notifyClient = await pool.connect();

    // Listen to job events
    await this.notifyClient.query('LISTEN new_job');
    await this.notifyClient.query('LISTEN job_completed');
    await this.notifyClient.query('LISTEN job_failed');

    this.notifyClient.on('notification', (msg) => {
      console.log(`📢 Notification: ${msg.channel}`, msg.payload);
    });

    console.log('✅ LISTEN/NOTIFY initialized');
  }

  /**
   * Enqueue a job
   */
  async enqueue(queueName, payload, options = {}) {
    const {
      jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      priority = 0,
      maxAttempts = 3,
      retryDelay = 60,
      scheduledFor = null,
    } = options;

    const query = `
      INSERT INTO job_queue (
        queue_name,
        job_id,
        payload,
        priority,
        max_attempts,
        retry_delay,
        scheduled_for
      ) VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, NOW()))
      RETURNING id, job_id
    `;

    const values = [
      queueName,
      jobId,
      JSON.stringify(payload),
      priority,
      maxAttempts,
      retryDelay,
      scheduledFor,
    ];

    const result = await pool.query(query, values);

    // Notify workers
    await pool.query(`NOTIFY new_job, '${queueName}'`);

    console.log(`📤 Job enqueued: ${queueName} [${jobId}]`);

    return result.rows[0].job_id;
  }

  /**
   * Fetch next job (with lock)
   * Uses FOR UPDATE SKIP LOCKED for concurrency
   */
  async fetchNextJob(queueName, workerId) {
    const query = `
      UPDATE job_queue
      SET 
        status = 'processing',
        started_at = NOW(),
        locked_by = $2,
        locked_until = NOW() + INTERVAL '5 minutes'
      WHERE id = (
        SELECT id
        FROM job_queue
        WHERE queue_name = $1
          AND status = 'pending'
          AND scheduled_for <= NOW()
        ORDER BY priority DESC, scheduled_for ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      )
      RETURNING 
        id,
        job_id,
        queue_name,
        payload,
        attempts,
        max_attempts,
        retry_delay
    `;

    const result = await pool.query(query, [queueName, workerId]);

    if (result.rows.length > 0) {
      const job = result.rows[0];
      console.log(`🔨 Job fetched: ${queueName} [${job.job_id}] by ${workerId}`);
      
      return {
        id: job.id,
        jobId: job.job_id,
        queueName: job.queue_name,
        payload: job.payload,
        attempts: job.attempts,
        maxAttempts: job.max_attempts,
        retryDelay: job.retry_delay,
      };
    }

    return null;
  }

  /**
   * Mark job as completed
   */
  async completeJob(jobId, result = null) {
    const query = `
      UPDATE job_queue
      SET 
        status = 'completed',
        progress = 100,
        result = $2,
        completed_at = NOW(),
        locked_by = NULL,
        locked_until = NULL
      WHERE job_id = $1
      RETURNING queue_name, payload
    `;

    const queryResult = await pool.query(query, [
      jobId,
      result ? JSON.stringify(result) : null
    ]);

    if (queryResult.rows.length > 0) {
      // Notify completion
      const { queue_name, payload } = queryResult.rows[0];
      await pool.query(`NOTIFY job_completed, '${jobId}'`);
      
      console.log(`✅ Job completed: ${jobId}`);
    }
  }

  /**
   * Mark job as failed (with retry logic)
   */
  async failJob(jobId, error) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get current attempts
      const getQuery = `
        SELECT attempts, max_attempts, retry_delay
        FROM job_queue
        WHERE job_id = $1
      `;
      const getResult = await client.query(getQuery, [jobId]);

      if (getResult.rows.length === 0) {
        throw new Error('Job not found');
      }

      const { attempts, max_attempts, retry_delay } = getResult.rows[0];
      const newAttempts = attempts + 1;

      if (newAttempts < max_attempts) {
        // Retry: Reset to pending with delay
        const updateQuery = `
          UPDATE job_queue
          SET 
            status = 'pending',
            attempts = $2,
            error_message = $3,
            scheduled_for = NOW() + INTERVAL '${retry_delay} seconds',
            locked_by = NULL,
            locked_until = NULL
          WHERE job_id = $1
        `;

        await client.query(updateQuery, [jobId, newAttempts, error]);
        
        console.log(`🔄 Job will retry (${newAttempts}/${max_attempts}): ${jobId}`);

      } else {
        // Failed permanently
        const updateQuery = `
          UPDATE job_queue
          SET 
            status = 'failed',
            attempts = $2,
            error_message = $3,
            completed_at = NOW(),
            locked_by = NULL,
            locked_until = NULL
          WHERE job_id = $1
        `;

        await client.query(updateQuery, [jobId, newAttempts, error]);

        // Notify failure
        await client.query(`NOTIFY job_failed, '${jobId}'`);
        
        console.log(`❌ Job failed permanently: ${jobId}`);
      }

      await client.query('COMMIT');

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Update job progress
   */
  async updateProgress(jobId, progress) {
    await pool.query(`
      UPDATE job_queue
      SET progress = $2
      WHERE job_id = $1
    `, [jobId, progress]);
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId) {
    const query = `
      SELECT 
        id,
        job_id,
        queue_name,
        status,
        progress,
        attempts,
        max_attempts,
        error_message,
        result,
        created_at,
        started_at,
        completed_at
      FROM job_queue
      WHERE job_id = $1
    `;

    const result = await pool.query(query, [jobId]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  /**
   * Register a worker
   */
  async registerWorker(queueName, handler, options = {}) {
    const workerId = `worker_${queueName}_${Math.random().toString(36).substr(2, 9)}`;
    const pollingInterval = options.pollingInterval || 2000; // ms
    const concurrency = options.concurrency || 1;

    const worker = {
      id: workerId,
      queueName,
      handler,
      isRunning: false,
      activeJobs: 0,
      concurrency,
    };

    this.workers.set(workerId, worker);

    // Start polling
    this.startWorkerPolling(worker, pollingInterval);

    console.log(`👷 Worker registered: ${queueName} [${workerId}]`);
  }

  /**
   * Worker polling loop
   */
  async startWorkerPolling(worker, interval) {
    worker.isRunning = true;

    const poll = async () => {
      if (!this.isRunning || !worker.isRunning) {
        return;
      }

      try {
        // Check if we can process more jobs
        if (worker.activeJobs < worker.concurrency) {
          const job = await this.fetchNextJob(worker.queueName, worker.id);

          if (job) {
            worker.activeJobs++;

            // Process job (non-blocking)
            this.processJob(worker, job)
              .finally(() => {
                worker.activeJobs--;
              });
          }
        }
      } catch (error) {
        console.error(`Worker ${worker.id} polling error:`, error);
      }

      // Schedule next poll
      setTimeout(poll, interval);
    };

    // Start polling
    poll();
  }

  /**
   * Process a job
   */
  async processJob(worker, job) {
    console.log(`🔨 Processing: ${job.jobId}`);

    try {
      // Execute handler
      const result = await worker.handler(job.payload, job);

      // Mark as completed
      await this.completeJob(job.jobId, result);

    } catch (error) {
      console.error(`❌ Job processing error: ${job.jobId}`, error);

      // Mark as failed (will retry if attempts < max)
      await this.failJob(job.jobId, error.message);
    }
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId) {
    await pool.query(`
      UPDATE job_queue
      SET 
        status = 'cancelled',
        completed_at = NOW(),
        locked_by = NULL,
        locked_until = NULL
      WHERE job_id = $1
        AND status IN ('pending', 'processing')
    `, [jobId]);

    console.log(`❌ Job cancelled: ${jobId}`);
  }

  /**
   * Clean up old jobs
   */
  async cleanup(retentionDays = 7) {
    const result = await pool.query(`
      DELETE FROM job_queue
      WHERE completed_at < NOW() - INTERVAL '${retentionDays} days'
        AND status IN ('completed', 'failed', 'cancelled')
      RETURNING id
    `);

    console.log(`🧹 Cleaned up ${result.rowCount} old jobs`);
  }

  /**
   * Shutdown
   */
  async shutdown() {
    console.log('🛑 Shutting down custom queue...');

    this.isRunning = false;

    // Stop all workers
    this.workers.forEach(worker => {
      worker.isRunning = false;
    });

    // Close notify connection
    if (this.notifyClient) {
      await this.notifyClient.query('UNLISTEN *');
      this.notifyClient.release();
      this.notifyClient = null;
    }

    console.log('✅ Custom queue stopped');
  }
}

// Singleton instance
const customQueueManager = new CustomQueueManager();

module.exports = customQueueManager;

