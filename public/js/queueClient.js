/**
 * ======================================
 * Queue Client - Frontend Integration
 * ======================================
 * 
 * Client-side library untuk queue-based generation
 * Supports both polling and SSE
 */

class QueueClient {
  constructor(options = {}) {
    this.pollingInterval = options.pollingInterval || 2000; // 2 seconds
    this.useSSE = options.useSSE !== false; // Default: use SSE
    this.eventSource = null;
    this.activePollers = new Map();
  }

  /**
   * Create a generation job (enqueue)
   */
  async createJob(prompt, type, mode, settings) {
    try {
      const response = await fetch('/api/queue-generation/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          type,
          mode,
          settings
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to create job');
      }

      console.log('✅ Job created:', data.jobId);

      return data.jobId;

    } catch (error) {
      console.error('❌ Failed to create job:', error);
      throw error;
    }
  }

  /**
   * Start SSE connection for real-time updates
   */
  connectSSE(onUpdate, onComplete, onError) {
    if (this.eventSource) {
      console.warn('SSE already connected');
      return;
    }

    console.log('📡 Connecting to SSE...');

    this.eventSource = new EventSource('/api/sse/generation-updates');

    // Connection established
    this.eventSource.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'connected') {
        console.log('✅ SSE connected');
      }
    });

    // Job completed
    this.eventSource.addEventListener('job-completed', (event) => {
      const data = JSON.parse(event.data);
      console.log('✅ Job completed via SSE:', data.jobId);
      
      if (onComplete) {
        onComplete(data);
      }
    });

    // Job failed
    this.eventSource.addEventListener('job-failed', (event) => {
      const data = JSON.parse(event.data);
      console.error('❌ Job failed via SSE:', data.jobId, data.error);
      
      if (onError) {
        onError(data);
      }
    });

    // Connection error
    this.eventSource.onerror = (error) => {
      console.error('❌ SSE connection error:', error);
      
      // Auto-reconnect after 5 seconds
      setTimeout(() => {
        console.log('🔄 Reconnecting SSE...');
        this.disconnectSSE();
        this.connectSSE(onUpdate, onComplete, onError);
      }, 5000);
    };
  }

  /**
   * Disconnect SSE
   */
  disconnectSSE() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      console.log('📡 SSE disconnected');
    }
  }

  /**
   * Poll job status (fallback if SSE not available)
   */
  async pollJobStatus(jobId, onUpdate, onComplete, onError) {
    // ✨ Check if already polling this job
    if (this.activePollers.has(jobId)) {
      console.warn(`⚠️ Already polling job: ${jobId}`);
      return;
    }
    
    console.log(`🔄 Starting polling for job: ${jobId}`);
    console.log(`📊 Active pollers: ${this.activePollers.size}`);

    const poll = async () => {
      try {
        console.log(`🔍 Polling job: ${jobId}`);
        const response = await fetch(`/api/queue-generation/status/${jobId}`);
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || 'Failed to get job status');
        }

        const job = data.job;
        console.log(`📊 Job ${jobId}: ${job.status} - ${job.progress}%`);

        // Update callback
        if (onUpdate) {
          onUpdate(job);
        }

        // Check if completed
        if (job.status === 'completed') {
          console.log(`✅ Job completed: ${jobId}`);
          
          if (onComplete) {
            onComplete(job);
          }
          
          this.stopPolling(jobId);
          return;
        }

        // Check if failed
        if (job.status === 'failed') {
          console.error(`❌ Job failed: ${jobId}`, job.errorMessage);
          
          if (onError) {
            onError(job);
          }
          
          this.stopPolling(jobId);
          return;
        }

        // ✨ Continue polling (schedule next poll)
        const timerId = setTimeout(poll, this.pollingInterval);
        this.activePollers.set(jobId, timerId);
        console.log(`⏰ Next poll for ${jobId} in ${this.pollingInterval}ms`);

      } catch (error) {
        console.error(`❌ Polling error for ${jobId}:`, error);
        
        if (onError) {
          onError({ error: error.message });
        }
        
        this.stopPolling(jobId);
      }
    };

    // ✨ Mark as active immediately (prevent duplicate polling)
    this.activePollers.set(jobId, 'pending');
    
    // Start polling
    poll();
  }

  /**
   * Stop polling for a job
   */
  stopPolling(jobId) {
    const timerId = this.activePollers.get(jobId);
    if (timerId) {
      clearTimeout(timerId);
      this.activePollers.delete(jobId);
      console.log(`⏹️  Stopped polling: ${jobId}`);
    }
  }

  /**
   * Stop all active pollings
   */
  stopAllPolling() {
    this.activePollers.forEach((timerId, jobId) => {
      clearTimeout(timerId);
      console.log(`⏹️  Stopped polling: ${jobId}`);
    });
    this.activePollers.clear();
  }

  /**
   * Get all active jobs
   */
  async getActiveJobs() {
    try {
      const response = await fetch('/api/queue-generation/active');
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to get active jobs');
      }

      return data.jobs;

    } catch (error) {
      console.error('❌ Failed to get active jobs:', error);
      throw error;
    }
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId) {
    try {
      const response = await fetch(`/api/queue-generation/cancel/${jobId}`, {
        method: 'POST'
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to cancel job');
      }

      console.log('❌ Job cancelled:', jobId);

      return true;

    } catch (error) {
      console.error('❌ Failed to cancel job:', error);
      throw error;
    }
  }

  /**
   * High-level: Create job and track with SSE/polling
   */
  async generateWithQueue(prompt, type, mode, settings, callbacks = {}) {
    const {
      onStart,
      onUpdate,
      onComplete,
      onError
    } = callbacks;

    try {
      // 1. Create job
      const jobId = await this.createJob(prompt, type, mode, settings);

      if (onStart) {
        onStart(jobId);
      }

      // 2. Track progress
      if (this.useSSE) {
        // Use SSE for real-time updates
        this.connectSSE(onUpdate, onComplete, onError);
      } else {
        // Use polling as fallback
        this.pollJobStatus(jobId, onUpdate, onComplete, onError);
      }

      return jobId;

    } catch (error) {
      if (onError) {
        onError({ error: error.message });
      }
      throw error;
    }
  }

  /**
   * Resume tracking active jobs (on page load)
   */
  async resumeActiveJobs(callbacks = {}) {
    try {
      const activeJobs = await this.getActiveJobs();

      console.log(`📋 Found ${activeJobs.length} active jobs`);

      if (this.useSSE && activeJobs.length > 0) {
        // Connect SSE once for all jobs
        this.connectSSE(
          callbacks.onUpdate,
          callbacks.onComplete,
          callbacks.onError
        );
      } else {
        // Poll each job individually
        activeJobs.forEach(job => {
          this.pollJobStatus(
            job.jobId,
            callbacks.onUpdate,
            callbacks.onComplete,
            callbacks.onError
          );
        });
      }

      return activeJobs;

    } catch (error) {
      console.error('❌ Failed to resume active jobs:', error);
      throw error;
    }
  }

  /**
   * Cleanup (call on page unload)
   */
  cleanup() {
    this.disconnectSSE();
    this.stopAllPolling();
  }
}

// Export as global for easy usage
window.QueueClient = QueueClient;

