/**
 * Generation Polling System
 * Tracks generation progress in real-time using polling
 * Allows users to navigate away and come back to see progress
 */

class GenerationPoller {
    constructor() {
        this.activePolls = new Map();
        this.pollInterval = 2000; // Poll every 2 seconds
        this.maxRetries = 180; // Max 6 minutes (180 * 2s)
    }
    
    /**
     * Start polling for a job
     */
    startPolling(jobId, onUpdate, onComplete, onError) {
        
        let retryCount = 0;
        
        const poll = async () => {
            try {
                const response = await fetch(`/api/generation-job/status/${jobId}`);
                const data = await response.json();
                
                if (!data.success) {
                    throw new Error(data.message || 'Failed to get job status');
                }
                
                const job = data.job;
                
                // Update callback
                if (onUpdate) {
                    onUpdate(job);
                }
                
                // Check if completed
                if (job.status === 'completed') {
                    this.stopPolling(jobId);
                    if (onComplete) {
                        onComplete(job);
                    }
                    return;
                }
                
                // Check if failed
                if (job.status === 'failed') {
                    this.stopPolling(jobId);
                    if (onError) {
                        onError(new Error(job.errorMessage || 'Generation failed'));
                    }
                    return;
                }
                
                // Continue polling if still processing
                if (job.status === 'pending' || job.status === 'processing') {
                    retryCount++;
                    
                    if (retryCount >= this.maxRetries) {
                        console.error('⏰ Polling timeout for job:', jobId);
                        this.stopPolling(jobId);
                        if (onError) {
                            onError(new Error('Generation timeout'));
                        }
                        return;
                    }
                    
                    // Schedule next poll
                    const timeoutId = setTimeout(poll, this.pollInterval);
                    this.activePolls.set(jobId, timeoutId);
                }
                
            } catch (error) {
                console.error('❌ Polling error:', error);
                retryCount++;
                
                if (retryCount >= this.maxRetries) {
                    this.stopPolling(jobId);
                    if (onError) {
                        onError(error);
                    }
                } else {
                    // Retry on error
                    const timeoutId = setTimeout(poll, this.pollInterval);
                    this.activePolls.set(jobId, timeoutId);
                }
            }
        };
        
        // Start first poll
        poll();
    }
    
    /**
     * Stop polling for a job
     */
    stopPolling(jobId) {
        if (this.activePolls.has(jobId)) {
            clearTimeout(this.activePolls.get(jobId));
            this.activePolls.delete(jobId);
        }
    }
    
    /**
     * Stop all active polls
     */
    stopAll() {
        this.activePolls.forEach((timeoutId, jobId) => {
            clearTimeout(timeoutId);
        });
        this.activePolls.clear();
    }
    
    /**
     * Check if polling for a job
     */
    isPolling(jobId) {
        return this.activePolls.has(jobId);
    }
    
    /**
     * Get active poll count
     */
    getActiveCount() {
        return this.activePolls.size;
    }
    
    /**
     * Resume all active jobs from server
     */
    async resumeActiveJobs(onUpdate, onComplete, onError) {
        try {
            const response = await fetch('/api/generation-job/active');
            const data = await response.json();
            
            if (data.success && data.jobs.length > 0) {
                
                data.jobs.forEach(job => {
                    // Don't restart if already polling
                    if (!this.isPolling(job.jobId)) {
                        this.startPolling(job.jobId, onUpdate, onComplete, onError);
                    }
                });
                
                return data.jobs;
            }
            
            return [];
        } catch (error) {
            console.error('❌ Error resuming active jobs:', error);
            return [];
        }
    }
    
    /**
     * Get new (unviewed) generations count
     */
    async getNewCount() {
        try {
            const response = await fetch('/api/generation-job/new-count');
            const data = await response.json();
            
            if (data.success) {
                return data.count;
            }
            
            return 0;
        } catch (error) {
            console.error('❌ Error getting new count:', error);
            return 0;
        }
    }
    
    /**
     * Mark all as viewed
     */
    async markAllViewed() {
        try {
            const response = await fetch('/api/generation-job/mark-viewed', {
                method: 'POST'
            });
            const data = await response.json();
            
            return data.success;
        } catch (error) {
            console.error('❌ Error marking as viewed:', error);
            return false;
        }
    }
}

// Create global instance
window.generationPoller = new GenerationPoller();

// Auto-resume on page load
document.addEventListener('DOMContentLoaded', () => {
    
    // Auto-resume active jobs if we have the necessary elements
    // This will be called from dashboard-generation.js
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    window.generationPoller.stopAll();
});

