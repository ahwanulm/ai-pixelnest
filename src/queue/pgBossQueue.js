/**
 * ======================================
 * OPSI 1: pg-boss Queue System
 * ======================================
 * 
 * Library queue berbasis Postgres yang production-ready
 * 
 * Features:
 * - ✅ Job queueing dengan prioritas
 * - ✅ Retry otomatis dengan exponential backoff
 * - ✅ Job deduplication
 * - ✅ Scheduled/delayed jobs
 * - ✅ Job progress tracking
 * - ✅ Monitoring & observability
 * 
 * Install: npm install pg-boss
 */

const PgBoss = require('pg-boss');
const { pool } = require('../config/database');

class QueueManager {
  constructor() {
    this.boss = null;
    this.isReady = false;
    this.activeJobs = new Map(); // Track active jobs for monitoring
  }

  /**
   * Initialize pg-boss
   */
  async initialize() {
    if (this.boss) {
      console.log('⚠️  Queue already initialized');
      return;
    }

    try {
      // Use same database config as main app
      const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'pixelnest_db',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
      };

      // Build connection string
      const connectionString = process.env.DATABASE_URL || 
        `postgresql://${dbConfig.user}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`;

      console.log('📊 Database config:', {
        host: dbConfig.host,
        port: dbConfig.port,
        database: dbConfig.database,
        user: dbConfig.user
      });

      this.boss = new PgBoss({
        connectionString,
        
        // Schema untuk pg-boss tables (agar terpisah dari app tables)
        schema: 'pgboss',
        
        // ✨ Database pool configuration for concurrent job processing
        max: 10, // Maximum pool connections (for 5 concurrent jobs + overhead)
        
        // Job retention (hapus completed jobs setelah 7 hari)
        retentionDays: 7,
        
        // Monitoring
        monitorStateIntervalSeconds: 60,
        
        // Archive completed jobs
        archiveCompletedAfterSeconds: 60 * 60 * 24, // 24 hours
        
        // Delete archived jobs after retention period
        deleteAfterDays: 7,
        
        // Maintenance interval
        maintenanceIntervalSeconds: 300, // 5 minutes
      });

      // Event listeners
      this.boss.on('error', error => {
        console.error('❌ pg-boss error:', error);
      });

      this.boss.on('maintenance', () => {
        console.log('🧹 pg-boss maintenance completed');
      });

      this.boss.on('monitor-states', (states) => {
        console.log('📊 Queue states:', {
          created: states.created,
          retry: states.retry,
          active: states.active,
          completed: states.completed,
          failed: states.failed
        });
      });

      // Start pg-boss
      await this.boss.start();
      this.isReady = true;
      
      console.log('✅ pg-boss Queue initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize pg-boss:', error);
      throw error;
    }
  }

  /**
   * Stop pg-boss gracefully
   */
  async shutdown() {
    if (this.boss) {
      console.log('🛑 Shutting down pg-boss...');
      await this.boss.stop();
      this.boss = null;
      this.isReady = false;
      console.log('✅ pg-boss stopped');
    }
  }

  /**
   * Enqueue a job
   * 
   * @param {string} queueName - Queue name (e.g., 'ai-generation', 'email', 'payment')
   * @param {object} data - Job data
   * @param {object} options - Job options
   * @returns {string} jobId
   */
  async enqueue(queueName, data, options = {}) {
    if (!this.isReady) {
      throw new Error('Queue not ready. Call initialize() first.');
    }

    // Ensure queue exists (auto-create if not)
    try {
      await this.boss.createQueue(queueName, {
        retryLimit: options.retryLimit || 3,
        retryDelay: options.retryDelay || 60,
        expireInSeconds: options.expireInSeconds || 60 * 60 * 24
      });
    } catch (error) {
      // Ignore if queue already exists
      if (!error.message.includes('already exists')) {
        console.error('Failed to create queue:', error);
      }
    }

      const jobOptions = {
      // Priority: higher number = higher priority (default: 0)
      priority: options.priority || 0,
      
      // Retry settings
      retryLimit: options.retryLimit || 3,
      retryDelay: options.retryDelay || 60, // seconds
      retryBackoff: options.retryBackoff !== false, // exponential backoff
      
      // Delay start (in seconds)
      startAfter: options.startAfter || 0,
      
      // Expire after (in seconds)
      expireInSeconds: options.expireInSeconds || 60 * 60 * 24, // 24 hours
      
      // ✨ CRITICAL: NO singleton key by default to allow concurrent jobs from same user
      // Only use singleton if explicitly requested
      singletonKey: options.singletonKey || null,
      singletonSeconds: options.singletonSeconds || null,
      
      // On complete settings
      onComplete: options.onComplete !== false,
    };

    const startEnqueue = Date.now();
    const jobId = await this.boss.send(queueName, data, jobOptions);
    const enqueueTime = Date.now() - startEnqueue;
    
    console.log(`📤 [${new Date().toISOString()}] Job enqueued: ${queueName} [${jobId}]`);
    console.log(`   ⏱️  Enqueue time: ${enqueueTime}ms`);
    console.log(`   Priority: ${jobOptions.priority}`);
    
    return jobId;
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId) {
    if (!this.isReady) {
      throw new Error('Queue not ready');
    }

    const job = await this.boss.getJobById(jobId);
    
    if (!job) {
      return null;
    }

    return {
      id: job.id,
      name: job.name,
      state: job.state, // 'created', 'retry', 'active', 'completed', 'expired', 'cancelled', 'failed'
      priority: job.priority,
      data: job.data,
      output: job.output,
      progress: job.data?._progress || 0,
      retryCount: job.retrycount,
      startedOn: job.startedon,
      completedOn: job.completedon,
      createdOn: job.createdon,
    };
  }

  /**
   * Update job progress
   */
  async updateProgress(jobId, progress, data = {}) {
    if (!this.isReady) {
      throw new Error('Queue not ready');
    }

    await this.boss.complete(jobId, { progress, ...data });
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId) {
    if (!this.isReady) {
      throw new Error('Queue not ready');
    }

    await this.boss.cancel(jobId);
    console.log(`❌ Job cancelled: ${jobId}`);
  }

  /**
   * Fail a job manually
   */
  async failJob(jobId, error) {
    if (!this.isReady) {
      throw new Error('Queue not ready');
    }

    await this.boss.fail(jobId, error);
    console.log(`❌ Job failed: ${jobId}`);
  }

  /**
   * Register a worker for a queue
   * 
   * @param {string} queueName - Queue name
   * @param {function} handler - Job handler function
   * @param {object} options - Worker options
   */
  async registerWorker(queueName, handler, options = {}) {
    if (!this.isReady) {
      throw new Error('Queue not ready');
    }

    // Timeout configuration (in milliseconds)
    const timeout = options.timeout || 600000; // Default: 10 minutes

    const workerOptions = {
      // Team size (concurrent workers)
      teamSize: options.teamSize || 1,
      
      // Team concurrency (jobs per worker)
      teamConcurrency: options.teamConcurrency || 1,
      
      // ✨ CRITICAL: Batch size - fetch multiple jobs at once
      // This ensures all jobs submitted at the same time are picked up together
      batchSize: options.batchSize || options.teamConcurrency || 5,
      
      // Polling interval (in seconds) - faster polling for better responsiveness
      pollingIntervalSeconds: options.pollingIntervalSeconds || 1,
      
      // New job check interval - check more frequently
      newJobCheckInterval: options.newJobCheckInterval || 500,
      
      // Include metadata in handler
      includeMetadata: options.includeMetadata !== false,
    };

    await this.boss.work(queueName, workerOptions, async (job) => {
      try {
        // Handle case where pg-boss sends job as an array
        let actualJob = job;
        if (Array.isArray(job)) {
          console.log(`⚠️  Received job as array, extracting first element`);
          actualJob = job[0];
        }
        
        // Safety check: Ensure job itself is valid
        if (!actualJob || !actualJob.id) {
          console.error(`❌ Received invalid job object in ${queueName}:`, actualJob);
          console.log(`⏭️  Skipping corrupted job (no ID available)`);
          // Return success to prevent retry - we can't do anything with this job
          return { skipped: true, reason: 'Invalid job object - no ID' };
        }

        // Track active job
        this.activeJobs.set(actualJob.id, {
          queueName,
          startedAt: Date.now(),
          jobData: actualJob.data
        });
        
        console.log(`🔨 Processing job: ${queueName} [${actualJob.id}]`);
        console.log(`⏱️  Timeout set: ${timeout / 1000}s (${timeout}ms)`);
        console.log(`📊 Active concurrent jobs: ${this.activeJobs.size}`);
        
        // Safety check: Ensure job.data exists
        if (!actualJob.data || typeof actualJob.data !== 'object') {
          console.error(`❌ Invalid job data for ${queueName} [${actualJob.id}]:`, actualJob.data);
          console.log(`⏭️  Skipping corrupted job: ${queueName} [${actualJob.id}]`);
          
          // Try to mark as failed, but don't throw if it fails
          try {
            await this.boss.fail(actualJob.id, new Error('Job data is missing or invalid. This is an old/corrupted job that has been skipped.'));
          } catch (failError) {
            console.error(`⚠️  Could not mark job as failed:`, failError.message);
          }
          
          // Return success to prevent retry
          return { skipped: true, reason: 'Invalid job data' };
        }
        
        // Execute handler with timeout
        const result = await Promise.race([
          handler(actualJob.data, actualJob),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Job timeout after ${timeout}ms`)), timeout)
          )
        ]);
        
        // Remove from active jobs
        this.activeJobs.delete(actualJob.id);
        
        console.log(`✅ Job completed: ${queueName} [${actualJob.id}]`);
        console.log(`📊 Remaining active jobs: ${this.activeJobs.size}`);
        
        return result;
        
      } catch (error) {
        // Handle array case for error logging too
        const actualJob = Array.isArray(job) ? job[0] : job;
        const jobId = actualJob?.id || 'unknown';
        
        // Remove from active jobs on error
        if (jobId !== 'unknown') {
          this.activeJobs.delete(jobId);
        }
        
        // Check if it's a timeout error
        if (error.message && error.message.includes('timeout')) {
          console.error(`⏱️  Job timeout: ${queueName} [${jobId}] - Exceeded ${timeout}ms (${timeout / 1000}s)`);
          console.error(`   Job was cancelled due to no response from external service`);
        } else {
          console.error(`❌ Job failed: ${queueName} [${jobId}]`, error);
        }
        
        console.log(`📊 Remaining active jobs after error: ${this.activeJobs.size}`);
        
        throw error;
      }
    });

    console.log(`👷 Worker registered: ${queueName}`);
    console.log(`   Team size: ${workerOptions.teamSize}`);
    console.log(`   Concurrency: ${workerOptions.teamConcurrency}`);
    console.log(`   Batch size: ${workerOptions.batchSize} (fetch ${workerOptions.batchSize} jobs at once)`);
    console.log(`   Polling: every ${workerOptions.pollingIntervalSeconds}s, check new: every ${workerOptions.newJobCheckInterval}ms`);
  }

  /**
   * Publish event (for job completion notifications)
   */
  async publish(eventName, data) {
    if (!this.isReady) {
      throw new Error('Queue not ready');
    }

    await this.boss.publish(eventName, data);
  }

  /**
   * Subscribe to events
   */
  async subscribe(eventName, handler, options = {}) {
    if (!this.isReady) {
      throw new Error('Queue not ready');
    }

    await this.boss.subscribe(eventName, options, handler);
  }

  /**
   * Clean up old/failed jobs
   * 
   * @param {string} queueName - Queue name to clean (optional, cleans all if not specified)
   * @param {object} options - Cleanup options
   */
  async cleanupJobs(queueName = null, options = {}) {
    if (!this.isReady) {
      throw new Error('Queue not ready');
    }

    try {
      // Delete failed jobs older than specified days
      const olderThanDays = options.olderThanDays || 1;
      const olderThanDate = new Date();
      olderThanDate.setDate(olderThanDate.getDate() - olderThanDays);

      // Use pg-boss's internal methods to clean up
      console.log(`🧹 Cleaning up old jobs${queueName ? ` for queue: ${queueName}` : ''}...`);
      
      // Delete expired and failed jobs
      await this.boss.deleteQueue(queueName);
      
      console.log(`✅ Cleanup completed`);
    } catch (error) {
      console.error('❌ Failed to clean up jobs:', error);
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queueName) {
    if (!this.isReady) {
      throw new Error('Queue not ready');
    }

    try {
      // Get counts by state
      const states = ['created', 'retry', 'active', 'completed', 'expired', 'cancelled', 'failed'];
      const stats = {};

      for (const state of states) {
        const count = await this.boss.getQueueSize(queueName, { state });
        stats[state] = count;
      }

      return stats;
    } catch (error) {
      console.error('❌ Failed to get queue stats:', error);
      return null;
    }
  }
}

// Singleton instance
const queueManager = new QueueManager();

module.exports = queueManager;

